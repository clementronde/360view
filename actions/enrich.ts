'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMultipleBrands } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'
import { ALL_SEED_BRANDS, BRAND_CATEGORIES } from '@/lib/brandCategories'
import { hashImageBuffer, computeEngagementScore } from '@/lib/adDedup'

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: userId, name: 'Mon espace', slug: `org-${userId.slice(-8)}` },
    })
  }
  return org
}

export async function enrichFeed(count = 2, category?: string): Promise<{ added: number; brands: string[]; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { added: 0, brands: [], error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  // Use category-specific brands if a filter is active, otherwise all seed brands
  const pool = category && BRAND_CATEGORIES[category]
    ? BRAND_CATEGORIES[category].brands
    : ALL_SEED_BRANDS

  // Pick brands not yet scraped for this org
  const existing = await prisma.competitor.findMany({
    where: { organizationId: org.id },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))
  const unseen = pool.filter((b) => !existingNames.has(b.toLowerCase()))
  const toScrape = unseen.length > 0
    ? unseen.slice(0, count)
    : [...pool].sort(() => Math.random() - 0.5).slice(0, count)

  console.log(`[enrichFeed] Scraping: ${toScrape.join(', ')}`)

  // 1 brand at a time (3 platforms in parallel per brand) — 3 min hard timeout
  const scrapeWithTimeout = Promise.race([
    scrapeMultipleBrands(toScrape, 1),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Scraping timeout (180s)')), 180_000)
    ),
  ])

  let scrapedMap: Awaited<ReturnType<typeof scrapeMultipleBrands>>
  try {
    scrapedMap = await scrapeWithTimeout
  } catch (err) {
    console.error('[enrichFeed] Scraping failed or timed out:', err)
    return { added: 0, brands: [], error: 'Le scraping a pris trop de temps. Réessayez.' }
  }

  let totalAdded = 0
  const brandsWithAds: string[] = []

  for (const [brand, scrapedAds] of Array.from(scrapedMap.entries())) {
    if (scrapedAds.length === 0) continue

    // Find or create competitor
    let competitor = await prisma.competitor.findFirst({
      where: { organizationId: org.id, name: { equals: brand, mode: 'insensitive' } },
    })
    if (!competitor) {
      competitor = await prisma.competitor.create({
        data: {
          organizationId: org.id,
          name: brand,
          website: `https://www.${brand.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          brandName: brand,
          isActive: false,
          trackAds: false,
        },
      })
    }

    const adsWithBuffers = scrapedAds.filter((s) => s.imageBuffer && s.imageFilename)
    console.log(`[enrichFeed] ${brand}: ${scrapedAds.length} scraped, ${adsWithBuffers.length} with image buffer`)

    // ── Deduplicate by content hash BEFORE uploading (saves Storage quota) ───
    const withHashes = adsWithBuffers.map((scraped) => ({
      scraped,
      contentHash: hashImageBuffer(scraped.imageBuffer!),
    }))

    const candidateHashes = withHashes.map((a) => a.contentHash)
    const existingHashes = await prisma.ad.findMany({
      where: { contentHash: { in: candidateHashes } },
      select: { contentHash: true, id: true },
    })
    const existingHashSet = new Set(existingHashes.map((a) => a.contentHash).filter(Boolean) as string[])
    const deduped = withHashes.filter((a) => !existingHashSet.has(a.contentHash))

    console.log(`[enrichFeed] ${brand}: ${deduped.length}/${adsWithBuffers.length} after dedup`)
    if (deduped.length === 0) continue

    // Upload images in parallel (only non-duplicates)
    const adsWithImages = await Promise.all(
      deduped.map(async ({ scraped, contentHash }) => {
        const uploaded = await uploadScreenshot(scraped.imageBuffer!, scraped.imageFilename!)
        if (!uploaded) console.warn(`[enrichFeed] Upload failed for ${scraped.imageFilename}`)
        return uploaded ? { scraped, imageUrl: uploaded.url, imageKey: uploaded.key, contentHash } : null
      })
    )

    const validAds = adsWithImages.filter(Boolean) as NonNullable<(typeof adsWithImages)[number]>[]
    console.log(`[enrichFeed] ${brand}: ${validAds.length}/${deduped.length} uploads succeeded`)

    if (validAds.length === 0) continue

    await prisma.ad.createMany({
      data: validAds.map(({ scraped, imageUrl, imageKey, contentHash }) => ({
        competitorId: competitor.id,
        platform: scraped.platform,
        format: scraped.format ?? 'DISPLAY',
        source: 'DISCOVERY',
        advertiserName: brand,
        title: scraped.title ?? null,
        description: scraped.description ?? null,
        imageUrl,
        imageKey,
        ctaText: scraped.ctaText ?? null,
        landingUrl: scraped.landingUrl ?? null,
        rawData: scraped.rawData as Record<string, string | number | boolean | null> | undefined,
        contentHash,
        country: 'FR',
        activeDays: 1,
        engagementScore: computeEngagementScore({ activeDays: 1 }),
      })),
    })

    totalAdded += validAds.length
    if (validAds.length > 0) brandsWithAds.push(brand)
  }

  return { added: totalAdded, brands: brandsWithAds }
}
