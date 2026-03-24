// Ads scraping cron worker
// Run this on Railway as a persistent service with a cron schedule.
// Railway cron: set "Cron Schedule" to "0 0/5 * * *" (every 5 hours)
//
// Usage:
//   node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/adsCron.ts
//
// Required env:
//   DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
//   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { prisma } from '@/lib/prisma'
import { scrapeMultipleBrands } from '@/lib/scraping/ads'
import { uploadAdImage } from '@/lib/supabase'
import { hashImageBuffer, computeEngagementScore } from '@/lib/adDedup'
import type { AdPlatform, AdFormat } from '@prisma/client'

// ─── Config ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 3          // brands scraped in parallel
const MAX_BRANDS_PER_RUN = 30 // cap to avoid Railway memory limits
const COUNTRIES = ['FR', 'US', 'GB', 'DE'] // rotate by run

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[adsCron] Starting run at ${new Date().toISOString()}`)

  // Pick country for this run (rotate based on hour)
  const hourIndex = new Date().getUTCHours()
  const country = COUNTRIES[hourIndex % COUNTRIES.length]
  console.log(`[adsCron] Country for this run: ${country}`)

  // Acquire scraping lock — prevents concurrent runs from overlapping
  const lockKey = 'ads-scraping-lock'
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

  // Write lock
  // Note: we use a dummy organization for system activities — adjust as needed
  const firstOrg = await prisma.organization.findFirst()
  if (!firstOrg) {
    console.log('[adsCron] No organization found. Exiting.')
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
    // Get brands to scrape — all competitors + discovery advertiser names
    const competitors = await prisma.competitor.findMany({
      where: { isActive: true, trackAds: true },
      select: { name: true, brandName: true },
      take: MAX_BRANDS_PER_RUN,
    })

    const brands = [...new Set(
      competitors.map(c => c.brandName ?? c.name).filter(Boolean)
    )] as string[]

    if (brands.length === 0) {
      console.log('[adsCron] No brands to scrape. Exiting.')
      return
    }

    console.log(`[adsCron] Scraping ${brands.length} brands in batches of ${BATCH_SIZE}`)

    let totalAdded = 0
    let totalSkipped = 0

    const results = await scrapeMultipleBrands(brands, BATCH_SIZE)

    for (const [brand, scrapedAds] of results) {
      for (const ad of scrapedAds) {
        if (!ad.imageBuffer) continue

        // ── Deduplication by content hash ────────────────────────────────────
        const contentHash = hashImageBuffer(ad.imageBuffer)
        const exists = await prisma.ad.findFirst({
          where: { contentHash },
          select: { id: true, lastSeenAt: true },
        })

        if (exists) {
          // Ad already in DB — just update lastSeenAt and activeDays
          const activeDays = Math.floor(
            (Date.now() - exists.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
          )
          await prisma.ad.update({
            where: { id: exists.id },
            data: {
              lastSeenAt: new Date(),
              activeDays,
              engagementScore: computeEngagementScore({ activeDays }),
            },
          })
          totalSkipped++
          continue
        }

        // ── Upload image ──────────────────────────────────────────────────────
        let imageUrl: string | undefined
        try {
          const filename = ad.imageFilename ?? `${Date.now()}.jpg`
          imageUrl = await uploadAdImage(ad.imageBuffer, filename)
        } catch (err) {
          console.warn(`[adsCron] Upload failed for ${brand}:`, err)
          continue
        }

        // ── Find competitor ───────────────────────────────────────────────────
        const competitor = await prisma.competitor.findFirst({
          where: {
            OR: [
              { name: { equals: brand, mode: 'insensitive' } },
              { brandName: { equals: brand, mode: 'insensitive' } },
            ],
          },
          select: { id: true, organizationId: true },
        })

        // ── Insert ad ─────────────────────────────────────────────────────────
        await prisma.ad.create({
          data: {
            competitorId: competitor?.id ?? null,
            platform: ad.platform as AdPlatform,
            format: (ad.format ?? 'DISPLAY') as AdFormat,
            source: competitor ? 'COMPETITOR_TRACKING' : 'DISCOVERY',
            advertiserName: brand,
            title: ad.title,
            description: ad.description,
            imageUrl,
            ctaText: ad.ctaText,
            landingUrl: ad.landingUrl,
            rawData: ad.rawData ?? {},
            contentHash,
            country,
            activeDays: 1,
            engagementScore: 0,
          },
        })

        // Activity log
        if (competitor) {
          await prisma.activity.create({
            data: {
              organizationId: competitor.organizationId,
              type: 'AD_DETECTED',
              title: `Nouvelle pub ${ad.platform} — ${brand}`,
              description: ad.title ?? undefined,
              entityId: undefined,
              competitorName: brand,
            },
          })
        }

        totalAdded++
      }
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
