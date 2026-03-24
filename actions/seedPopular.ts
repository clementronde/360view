'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryByBrandSearch } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'
import { ALL_POPULAR_BRANDS, getPopularBrandsForCategory } from '@/lib/popularBrands'

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: userId, name: 'Mon espace', slug: `org-${userId.slice(-8)}` },
    })
  }
  return org
}

export async function seedPopularBrands(
  categoryKey?: string,
  target = 40
): Promise<{ added: number; brands: string[]; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { added: 0, brands: [], error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const pool = categoryKey ? getPopularBrandsForCategory(categoryKey) : ALL_POPULAR_BRANDS

  // Find popular brands already scraped (competitor exists with ads)
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

  // Shuffle unseen first, then seen as fallback
  const shuffleArray = <T>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const orderedPool = [...shuffleArray(unseen), ...shuffleArray(seen)]

  let totalAdded = 0
  const brandsWithAds: string[] = []
  let currentIndex = 0

  while (totalAdded < target && currentIndex < orderedPool.length) {
    const brand = orderedPool[currentIndex]
    const remaining = target - totalAdded
    console.log(`[seedPopular] ${brand.name} — need ${remaining} more ads (${totalAdded}/${target})`)

    try {
      // Single browser session: find official page + scrape ads in one pass
      const scrapedAds = await Promise.race([
        scrapeMetaAdLibraryByBrandSearch(brand.name, brand.searchQuery),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 150_000)
        ),
      ])

      currentIndex++

      if (scrapedAds.length === 0) {
        console.log(`[seedPopular] No ads for ${brand.name}, moving on`)
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

      console.log(`[seedPopular] ${brand.name}: ${newAds.length} new / ${uploaded.length} uploaded / ${existingUrls.size} already in DB`)

      if (newAds.length === 0) continue

      // Take only what we still need to reach BATCH_TARGET
      const toInsert = newAds.slice(0, remaining)

      // Find or create competitor (isActive: false, trackAds: false for discovery brands)
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
      console.error(`[seedPopular] Error for ${brand.name}:`, err)
      currentIndex++
    }
  }

  console.log(`[seedPopular] Done: ${totalAdded} ads added from ${brandsWithAds.length} brands`)
  return { added: totalAdded, brands: brandsWithAds }
}
