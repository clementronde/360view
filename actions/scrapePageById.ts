'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryByPageId } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: userId, name: 'Mon espace', slug: `org-${userId.slice(-8)}` },
    })
  }
  return org
}

export type ScrapePageResult = {
  added: number
  error?: string
}

/**
 * Scrape ads from a specific Facebook page ID and add them to the discovery feed.
 */
export async function scrapePageById(
  brandName: string,
  pageId: string
): Promise<ScrapePageResult> {
  const { userId } = await auth()
  if (!userId) return { added: 0, error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const scrapedAds = await Promise.race([
    scrapeMetaAdLibraryByPageId(brandName, pageId),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 120_000)
    ),
  ])

  if (scrapedAds.length === 0) return { added: 0 }

  // Upload images
  const adsWithBuffers = scrapedAds.filter((s) => s.imageBuffer && s.imageFilename)
  const adsWithImages = await Promise.all(
    adsWithBuffers.map(async (scraped) => {
      const uploaded = await uploadScreenshot(scraped.imageBuffer!, scraped.imageFilename!)
      return uploaded ? { scraped, imageUrl: uploaded.url, imageKey: uploaded.key } : null
    })
  )
  const uploaded = adsWithImages.filter(Boolean) as NonNullable<(typeof adsWithImages)[number]>[]

  if (uploaded.length === 0) return { added: 0 }

  // Deduplicate
  const candidateUrls = uploaded.map((a) => a.imageUrl)
  const existing = await prisma.ad.findMany({
    where: { imageUrl: { in: candidateUrls } },
    select: { imageUrl: true },
  })
  const existingUrls = new Set(existing.map((a) => a.imageUrl))
  const newAds = uploaded.filter((a) => !existingUrls.has(a.imageUrl))

  if (newAds.length === 0) return { added: 0 }

  // Find or create competitor
  let competitor = await prisma.competitor.findFirst({
    where: { organizationId: org.id, name: { equals: brandName, mode: 'insensitive' } },
  })
  if (!competitor) {
    competitor = await prisma.competitor.create({
      data: {
        organizationId: org.id,
        name: brandName,
        website: `https://www.facebook.com/${pageId}`,
        brandName,
        isActive: false,
        trackAds: false,
      },
    })
  }

  await prisma.ad.createMany({
    data: newAds.map(({ scraped, imageUrl, imageKey }) => ({
      competitorId: competitor!.id,
      platform: scraped.platform,
      format: 'DISPLAY' as const,
      source: 'DISCOVERY' as const,
      advertiserName: brandName,
      title: scraped.title ?? null,
      description: scraped.description ?? null,
      imageUrl,
      imageKey,
      ctaText: scraped.ctaText ?? null,
      landingUrl: scraped.landingUrl ?? null,
      rawData: scraped.rawData as Record<string, string | number | boolean | null> | undefined,
    })),
  })

  return { added: newAds.length }
}
