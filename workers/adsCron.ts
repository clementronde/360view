// Ads scraping cron worker — uses Meta Ad Library HTTP API (no Playwright)
// Run this on Railway as a persistent service with a cron schedule.
// Railway cron: set "Cron Schedule" to "0 0/5 * * *" (every 5 hours)
//
// Usage:
//   node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/adsCron.ts
//
// Required env:
//   DATABASE_URL, DIRECT_URL, META_ACCESS_TOKEN

import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryAPI } from '@/lib/scraping/ads'
import type { AdPlatform, AdFormat } from '@prisma/client'

// ─── Config ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 5          // brands scraped in parallel (HTTP is cheap)
const MAX_BRANDS_PER_RUN = 50 // cap per run
const COUNTRIES = ['FR', 'US', 'GB', 'DE'] // rotate by run

// Popular brands to scrape when no competitors are configured
const POPULAR_BRANDS = [
  'Nike', 'Adidas', 'Apple', 'Samsung', 'Zara', 'H&M', 'IKEA',
  'Amazon', 'Netflix', 'Spotify', 'Decathlon', 'Sephora', 'L\'Oreal',
  'Puma', 'Levi\'s', 'Lacoste', 'New Balance', 'Asics', 'Under Armour',
  'Lululemon', 'Salomon', 'The North Face', 'Patagonia', 'Uniqlo',
  'Mango', 'Pull&Bear', 'Bershka', 'Reserved', 'Kiabi',
  'Fnac', 'Darty', 'Cdiscount', 'Boulanger', 'Leroy Merlin',
  'BNP Paribas', 'Société Générale', 'Crédit Agricole', 'AXA', 'Allianz',
  'Free', 'SFR', 'Orange', 'Bouygues Telecom', 'Canal+',
  'Air France', 'SNCF', 'Renault', 'Peugeot', 'Citroën',
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[adsCron] Starting run at ${new Date().toISOString()}`)

  if (!process.env.META_ACCESS_TOKEN) {
    console.error('[adsCron] META_ACCESS_TOKEN is missing. Exiting.')
    process.exit(1)
  }

  // Pick country for this run (rotate based on hour)
  const hourIndex = new Date().getUTCHours()
  const country = COUNTRIES[hourIndex % COUNTRIES.length]
  console.log(`[adsCron] Country for this run: ${country}`)

  // Acquire scraping lock — prevents concurrent runs from overlapping
  const lockKey = 'ads-scraping-lock'
  const firstOrg = await prisma.organization.findFirst()
  if (!firstOrg) {
    console.log('[adsCron] No organization found. Exiting.')
    process.exit(0)
  }

  const existingLock = await prisma.activity.findFirst({
    where: {
      type: 'AD_DETECTED',
      title: lockKey,
      createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // lock valid 4h
    },
  })

  if (existingLock) {
    console.log('[adsCron] Another run is in progress (lock found). Exiting.')
    process.exit(0)
  }

  await prisma.activity.create({
    data: {
      organizationId: firstOrg.id,
      type: 'AD_DETECTED',
      title: lockKey,
      description: `Cron run started at ${new Date().toISOString()}`,
    },
  })

  try {
    // Get competitor brands
    const competitors = await prisma.competitor.findMany({
      where: { isActive: true, trackAds: true },
      select: { name: true, brandName: true },
      take: MAX_BRANDS_PER_RUN,
    })

    const competitorBrands = [...new Set(
      competitors.map(c => c.brandName ?? c.name).filter(Boolean)
    )] as string[]

    // Fill up with popular brands if not enough competitors
    const brands = competitorBrands.length >= 10
      ? competitorBrands.slice(0, MAX_BRANDS_PER_RUN)
      : [...competitorBrands, ...POPULAR_BRANDS].slice(0, MAX_BRANDS_PER_RUN)

    console.log(`[adsCron] Scraping ${brands.length} brands (${competitorBrands.length} competitors + ${brands.length - competitorBrands.length} popular)`)

    let totalAdded = 0
    let totalSkipped = 0

    // Process in batches
    for (let i = 0; i < brands.length; i += BATCH_SIZE) {
      const batch = brands.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (brand) => {
          const ads = await scrapeMetaAdLibraryAPI(brand)
          return { brand, ads }
        })
      )

      for (const result of batchResults) {
        if (result.status === 'rejected') {
          console.warn('[adsCron] Batch item failed:', result.reason)
          continue
        }

        const { brand, ads } = result.value
        if (ads.length === 0) continue

        // Find matching competitor
        const competitor = await prisma.competitor.findFirst({
          where: {
            OR: [
              { name: { equals: brand, mode: 'insensitive' } },
              { brandName: { equals: brand, mode: 'insensitive' } },
            ],
          },
          select: { id: true, organizationId: true },
        })

        for (const ad of ads) {
          // Dedup by landingUrl + advertiserName to avoid re-inserting same ad
          const dedupeKey = `${brand}::${ad.landingUrl ?? ad.title ?? ''}`
          const exists = await prisma.ad.findFirst({
            where: {
              advertiserName: { equals: brand, mode: 'insensitive' },
              landingUrl: ad.landingUrl ?? null,
            },
            select: { id: true, lastSeenAt: true },
          })

          if (exists) {
            await prisma.ad.update({
              where: { id: exists.id },
              data: {
                lastSeenAt: new Date(),
                activeDays: Math.floor((Date.now() - exists.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)),
              },
            })
            totalSkipped++
            continue
          }

          await prisma.ad.create({
            data: {
              competitorId: competitor?.id ?? null,
              platform: ad.platform as AdPlatform,
              format: (ad.format ?? 'DISPLAY') as AdFormat,
              source: competitor ? 'COMPETITOR_TRACKING' : 'DISCOVERY',
              advertiserName: brand,
              title: ad.title,
              description: ad.description,
              imageUrl: null,
              ctaText: ad.ctaText,
              landingUrl: ad.landingUrl,
              rawData: ad.rawData ?? {},
              contentHash: dedupeKey,
              country,
              activeDays: 1,
              engagementScore: 0,
            },
          })

          if (competitor) {
            await prisma.activity.create({
              data: {
                organizationId: competitor.organizationId,
                type: 'AD_DETECTED',
                title: `Nouvelle pub ${ad.platform} — ${brand}`,
                description: ad.title ?? undefined,
                competitorName: brand,
              },
            })
          }

          totalAdded++
        }
      }

      console.log(`[adsCron] Batch ${Math.floor(i / BATCH_SIZE) + 1}: processed ${batch.length} brands`)
    }

    console.log(`[adsCron] Done. Added: ${totalAdded}, Skipped (duplicates): ${totalSkipped}`)
  } finally {
    // Release lock
    await prisma.activity.deleteMany({
      where: { title: lockKey, organizationId: firstOrg.id },
    })
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('[adsCron] Fatal error:', err)
  process.exit(1)
})
