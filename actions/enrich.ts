'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMultipleBrands } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'

const SEED_BRANDS = [
  'Sephora', 'Décathlon', 'IKEA', "McDonald's", 'Zara',
  'H&M', 'Amazon', 'Fnac', 'Booking.com', 'Renault',
  "L'Oréal", 'Lacoste', 'Adidas', 'Samsung', 'Carrefour',
  'Leclerc', 'BNP Paribas', 'Orange', 'Canal+', 'Puma',
]

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: userId, name: 'Mon espace', slug: `org-${userId.slice(-8)}` },
    })
  }
  return org
}

export async function enrichFeed(count = 2): Promise<{ added: number; brands: string[]; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { added: 0, brands: [], error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  // Pick brands not yet scraped for this org
  const existing = await prisma.competitor.findMany({
    where: { organizationId: org.id },
    select: { name: true },
  })
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))
  const unseen = SEED_BRANDS.filter((b) => !existingNames.has(b.toLowerCase()))
  const toScrape = unseen.length > 0
    ? unseen.slice(0, count)
    : [...SEED_BRANDS].sort(() => Math.random() - 0.5).slice(0, count)

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

    // Upload images in parallel
    const adsWithImages = await Promise.all(
      adsWithBuffers.map(async (scraped) => {
        const uploaded = await uploadScreenshot(scraped.imageBuffer!, scraped.imageFilename!)
        if (!uploaded) console.warn(`[enrichFeed] Upload failed for ${scraped.imageFilename}`)
        return uploaded ? { scraped, imageUrl: uploaded.url, imageKey: uploaded.key } : null
      })
    )

    const validAds = adsWithImages.filter(Boolean) as NonNullable<(typeof adsWithImages)[number]>[]
    console.log(`[enrichFeed] ${brand}: ${validAds.length}/${adsWithBuffers.length} uploads succeeded`)

    if (validAds.length === 0) continue

    await prisma.ad.createMany({
      data: validAds.map(({ scraped, imageUrl, imageKey }) => ({
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
      })),
      skipDuplicates: true,
    })

    const addedForBrand = validAds.length
    totalAdded += addedForBrand
    if (addedForBrand > 0) brandsWithAds.push(brand)
  }

  return { added: totalAdded, brands: brandsWithAds }
}
