'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryByPageId } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'
import { FINTECH_BRANDS, type FintechBrand } from '@/lib/fintechBrands'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const BATCH_TARGET = 40 // new ads to collect per batch call

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: userId, name: 'Mon espace', slug: `org-${userId.slice(-8)}` },
    })
  }
  return org
}

export type SeedFintechResult = {
  added: number
  brands: string[]
  nextOffset: number  // -1 when all brands exhausted
  total: number
  error?: string
}

/**
 * Scrape fintech brands starting at `offset`, consuming as many brands as needed
 * to collect BATCH_TARGET (40) new ads. Skips ads already in DB.
 */
export async function seedFintechBrands(
  offset = 0,
  category?: FintechBrand['category']
): Promise<SeedFintechResult> {
  const { userId } = await auth()
  if (!userId) return { added: 0, brands: [], nextOffset: -1, total: 0, error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const pool = category
    ? FINTECH_BRANDS.filter((b) => b.category === category)
    : FINTECH_BRANDS

  const total = pool.length
  if (offset >= total) return { added: 0, brands: [], nextOffset: -1, total }

  let totalAdded = 0
  const brandsWithAds: string[] = []
  let currentIndex = offset

  // Keep scraping brands until we hit BATCH_TARGET or exhaust the pool
  while (totalAdded < BATCH_TARGET && currentIndex < total) {
    const brand = pool[currentIndex]
    const remaining = BATCH_TARGET - totalAdded
    console.log(`[seedFintech] ${brand.name} — need ${remaining} more ads (${totalAdded}/${BATCH_TARGET})`)

    try {
      const scrapedAds = await Promise.race([
        scrapeMetaAdLibraryByPageId(brand.name, brand.pageId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 120_000)
        ),
      ])

      currentIndex++

      if (scrapedAds.length === 0) {
        console.log(`[seedFintech] No ads for ${brand.name}, moving on`)
        continue
      }

      // Upload images
      const adsWithBuffers = scrapedAds.filter((s) => s.imageBuffer && s.imageFilename)
      const adsWithImages = await Promise.all(
        adsWithBuffers.map(async (scraped) => {
          const uploaded = await uploadScreenshot(scraped.imageBuffer!, scraped.imageFilename!)
          return uploaded ? { scraped, imageUrl: uploaded.url, imageKey: uploaded.key } : null
        })
      )
      const uploaded = adsWithImages.filter(Boolean) as NonNullable<(typeof adsWithImages)[number]>[]

      if (uploaded.length === 0) continue

      // Deduplicate: remove imageUrls already in DB
      const candidateUrls = uploaded.map((a) => a.imageUrl)
      const existing = await prisma.ad.findMany({
        where: { imageUrl: { in: candidateUrls } },
        select: { imageUrl: true },
      })
      const existingUrls = new Set(existing.map((a) => a.imageUrl))
      const newAds = uploaded.filter((a) => !existingUrls.has(a.imageUrl))

      console.log(`[seedFintech] ${brand.name}: ${newAds.length} new / ${uploaded.length} uploaded / ${existingUrls.size} already in DB`)

      if (newAds.length === 0) continue

      // Take only what we still need to reach BATCH_TARGET
      const toInsert = newAds.slice(0, remaining)

      // Find or create competitor
      let competitor = await prisma.competitor.findFirst({
        where: { organizationId: org.id, name: { equals: brand.name, mode: 'insensitive' } },
      })
      if (!competitor) {
        competitor = await prisma.competitor.create({
          data: {
            organizationId: org.id,
            name: brand.name,
            website: brand.website,
            brandName: brand.name,
            isActive: false,
            trackAds: false,
          },
        })
      }

      await prisma.ad.createMany({
        data: toInsert.map(({ scraped, imageUrl, imageKey }) => ({
          competitorId: competitor!.id,
          platform: scraped.platform,
          format: 'DISPLAY' as const,
          source: 'DISCOVERY' as const,
          advertiserName: brand.name,
          title: scraped.title ?? null,
          description: scraped.description ?? null,
          imageUrl,
          imageKey,
          ctaText: scraped.ctaText ?? null,
          landingUrl: scraped.landingUrl ?? null,
          rawData: scraped.rawData as Record<string, string | number | boolean | null> | undefined,
        })),
      })

      totalAdded += toInsert.length
      brandsWithAds.push(`${brand.name} (${toInsert.length})`)
    } catch (err) {
      console.error(`[seedFintech] Error for ${brand.name}:`, err)
      currentIndex++ // still advance so we don't loop forever on a broken brand
    }
  }

  const nextOffset = currentIndex >= total ? -1 : currentIndex
  console.log(`[seedFintech] Done: ${totalAdded} ads added from ${brandsWithAds.length} brands, nextOffset=${nextOffset}`)

  return { added: totalAdded, brands: brandsWithAds, nextOffset, total }
}

export type SeedFintechRandomResult = {
  added: number
  brands: string[]
  error?: string
}

/**
 * Scrape fintech brands in random order: prioritise unseen brands (no ads in DB yet),
 * then fall back to already-seen brands. Collects BATCH_TARGET (40) new ads.
 */
export async function seedFintechRandom(
  category?: FintechBrand['category']
): Promise<SeedFintechRandomResult> {
  const { userId } = await auth()
  if (!userId) return { added: 0, brands: [], error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const pool = category
    ? FINTECH_BRANDS.filter((b) => b.category === category)
    : FINTECH_BRANDS

  // Find brands with no ads in DB yet
  const competitorsWithAds = await prisma.competitor.findMany({
    where: {
      organizationId: org.id,
      ads: { some: {} },
    },
    select: { name: true },
  })
  const seenNames = new Set(competitorsWithAds.map((c) => c.name.toLowerCase()))

  const unseen = pool.filter((b) => !seenNames.has(b.name.toLowerCase()))
  const seen = pool.filter((b) => seenNames.has(b.name.toLowerCase()))

  // Unseen first (shuffled), then seen (shuffled) as fallback
  const orderedPool = [...shuffleArray(unseen), ...shuffleArray(seen)]

  let totalAdded = 0
  const brandsWithAds: string[] = []
  let currentIndex = 0

  while (totalAdded < BATCH_TARGET && currentIndex < orderedPool.length) {
    const brand = orderedPool[currentIndex]
    const remaining = BATCH_TARGET - totalAdded
    console.log(`[seedFintechRandom] ${brand.name} — need ${remaining} more ads (${totalAdded}/${BATCH_TARGET})`)

    try {
      const scrapedAds = await Promise.race([
        scrapeMetaAdLibraryByPageId(brand.name, brand.pageId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 120_000)
        ),
      ])

      currentIndex++

      if (scrapedAds.length === 0) {
        console.log(`[seedFintechRandom] No ads for ${brand.name}, moving on`)
        continue
      }

      // Upload images
      const adsWithBuffers = scrapedAds.filter((s) => s.imageBuffer && s.imageFilename)
      const adsWithImages = await Promise.all(
        adsWithBuffers.map(async (scraped) => {
          const uploaded = await uploadScreenshot(scraped.imageBuffer!, scraped.imageFilename!)
          return uploaded ? { scraped, imageUrl: uploaded.url, imageKey: uploaded.key } : null
        })
      )
      const uploaded = adsWithImages.filter(Boolean) as NonNullable<(typeof adsWithImages)[number]>[]

      if (uploaded.length === 0) continue

      // Deduplicate: remove imageUrls already in DB
      const candidateUrls = uploaded.map((a) => a.imageUrl)
      const existing = await prisma.ad.findMany({
        where: { imageUrl: { in: candidateUrls } },
        select: { imageUrl: true },
      })
      const existingUrls = new Set(existing.map((a) => a.imageUrl))
      const newAds = uploaded.filter((a) => !existingUrls.has(a.imageUrl))

      console.log(`[seedFintechRandom] ${brand.name}: ${newAds.length} new / ${uploaded.length} uploaded / ${existingUrls.size} already in DB`)

      if (newAds.length === 0) continue

      // Take only what we still need to reach BATCH_TARGET
      const toInsert = newAds.slice(0, remaining)

      // Find or create competitor
      let competitor = await prisma.competitor.findFirst({
        where: { organizationId: org.id, name: { equals: brand.name, mode: 'insensitive' } },
      })
      if (!competitor) {
        competitor = await prisma.competitor.create({
          data: {
            organizationId: org.id,
            name: brand.name,
            website: brand.website,
            brandName: brand.name,
            isActive: false,
            trackAds: false,
          },
        })
      }

      await prisma.ad.createMany({
        data: toInsert.map(({ scraped, imageUrl, imageKey }) => ({
          competitorId: competitor!.id,
          platform: scraped.platform,
          format: 'DISPLAY' as const,
          source: 'DISCOVERY' as const,
          advertiserName: brand.name,
          title: scraped.title ?? null,
          description: scraped.description ?? null,
          imageUrl,
          imageKey,
          ctaText: scraped.ctaText ?? null,
          landingUrl: scraped.landingUrl ?? null,
          rawData: scraped.rawData as Record<string, string | number | boolean | null> | undefined,
        })),
      })

      totalAdded += toInsert.length
      brandsWithAds.push(`${brand.name} (${toInsert.length})`)
    } catch (err) {
      console.error(`[seedFintechRandom] Error for ${brand.name}:`, err)
      currentIndex++
    }
  }

  console.log(`[seedFintechRandom] Done: ${totalAdded} ads added from ${brandsWithAds.length} brands`)
  return { added: totalAdded, brands: brandsWithAds }
}
