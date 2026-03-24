/**
 * Mass scrape worker — run once on Railway to populate 10k+ ads
 *
 * Scrapes Meta Ad Library for every brand in popularBrands.ts + fintechBrands.ts
 * Runs without timeout (unlike Vercel server actions).
 *
 * Usage on Railway:
 *   Temporarily set startCommand = "node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/massScrape.ts"
 *   Deploy → it runs once, exits when TARGET_ADS reached or all brands done.
 *
 * Required env: DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
 *               NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */

import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryByBrandSearch } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'
import { ALL_POPULAR_BRANDS } from '@/lib/popularBrands'
import { FINTECH_BRANDS } from '@/lib/fintechBrands'
import type { AdPlatform, AdFormat } from '@prisma/client'

// ─── Config ───────────────────────────────────────────────────────────────────

const TARGET_ADS   = parseInt(process.env.MASS_SCRAPE_TARGET ?? '10000')
const DELAY_MS     = parseInt(process.env.MASS_SCRAPE_DELAY  ?? '3000')  // pause entre marques

// ─── All brands to scrape ─────────────────────────────────────────────────────

const ALL_BRANDS = [
  ...ALL_POPULAR_BRANDS.map(b => ({ name: b.name, searchQuery: b.searchQuery })),
  ...FINTECH_BRANDS.map(b => ({ name: b.name, searchQuery: b.name })),
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[massScrape] Starting — target: ${TARGET_ADS} ads from ${ALL_BRANDS.length} brands`)

  // Get or create a shared demo org for discovery ads
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: 'mass_scrape_org' } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: 'mass_scrape_org', name: 'Discovery Library', slug: 'discovery-library' },
    })
  }

  const brands = shuffle(ALL_BRANDS)
  let totalAdded = 0
  let totalSkipped = 0
  let brandsDone = 0

  for (const brand of brands) {
    if (totalAdded >= TARGET_ADS) break

    brandsDone++
    console.log(`\n[massScrape] [${brandsDone}/${brands.length}] ${brand.name} | added so far: ${totalAdded}/${TARGET_ADS}`)

    try {
      const scrapedAds = await Promise.race([
        scrapeMetaAdLibraryByBrandSearch(brand.name, brand.searchQuery),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 120_000)
        ),
      ])

      if (scrapedAds.length === 0) {
        console.log(`[massScrape] No ads for ${brand.name}`)
        continue
      }

      console.log(`[massScrape] ${brand.name}: ${scrapedAds.length} ads scraped`)

      // Find or create competitor entry
      let competitor = await prisma.competitor.findFirst({
        where: { organizationId: org.id, name: { equals: brand.name, mode: 'insensitive' } },
      })
      if (!competitor) {
        competitor = await prisma.competitor.create({
          data: {
            organizationId: org.id,
            name: brand.name,
            website: '',
            brandName: brand.name,
            isActive: false,
            trackAds: false,
          },
        })
      }

      // Upload images + insert ads
      let brandAdded = 0
      for (const scraped of scrapedAds) {
        if (!scraped.imageBuffer || !scraped.imageFilename) continue
        if (totalAdded >= TARGET_ADS) break

        try {
          const uploaded = await uploadScreenshot(scraped.imageBuffer, scraped.imageFilename)
          if (!uploaded) continue

          // Dedup by imageUrl
          const exists = await prisma.ad.findFirst({ where: { imageUrl: uploaded.url } })
          if (exists) { totalSkipped++; continue }

          await prisma.ad.create({
            data: {
              competitorId: competitor.id,
              platform: scraped.platform as AdPlatform,
              format: 'DISPLAY' as AdFormat,
              source: 'DISCOVERY',
              advertiserName: brand.name,
              title: scraped.title ?? null,
              description: scraped.description ?? null,
              imageUrl: uploaded.url,
              imageKey: uploaded.key,
              ctaText: scraped.ctaText ?? null,
              landingUrl: scraped.landingUrl ?? null,
              rawData: (scraped.rawData as Record<string, string | number | boolean | null>) ?? {},
              country: 'FR',
              activeDays: 1,
              engagementScore: 0,
            },
          })

          totalAdded++
          brandAdded++
        } catch (err) {
          console.warn(`[massScrape] Failed to insert ad for ${brand.name}:`, err)
        }
      }

      console.log(`[massScrape] ${brand.name}: +${brandAdded} new ads (${totalSkipped} duplicates)`)

    } catch (err) {
      console.error(`[massScrape] Error for ${brand.name}:`, err)
    }

    // Polite delay between brands to avoid rate limiting
    await sleep(DELAY_MS)
  }

  console.log(`\n[massScrape] ✓ Done — ${totalAdded} ads added, ${totalSkipped} duplicates skipped`)
  await prisma.$disconnect()
  process.exit(0)
}

main().catch(err => {
  console.error('[massScrape] Fatal:', err)
  process.exit(1)
})
