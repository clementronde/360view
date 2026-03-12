'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeGoogleAds } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'

// ─── Get or create organization for the current user ─────────────────────────

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
  })

  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId: userId,
        name: 'Mon espace',
        slug: `org-${userId.slice(-8)}`,
      },
    })
  }

  return org
}

// ─── Discover ads for a given brand name ─────────────────────────────────────

export async function discoverAds(brandName: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  if (!brandName || brandName.trim().length === 0) {
    return { error: 'Le nom de la marque est requis' }
  }

  const name = brandName.trim()

  const org = await getOrCreateOrg(userId)

  // Scrape Google Ads Transparency for the brand
  let scrapedAds
  try {
    scrapedAds = await scrapeGoogleAds(name)
  } catch (err) {
    console.error('[discoverAds] Scraping failed:', err)
    return { error: 'Erreur lors du scraping. Réessayez.' }
  }

  if (scrapedAds.length === 0) {
    return { ads: [], brandName: name }
  }

  // Find or create a temporary competitor for this brand
  let competitor = await prisma.competitor.findFirst({
    where: {
      organizationId: org.id,
      name: { equals: name, mode: 'insensitive' },
    },
  })

  if (!competitor) {
    competitor = await prisma.competitor.create({
      data: {
        organizationId: org.id,
        name,
        website: `https://www.${name.toLowerCase().replace(/\s+/g, '')}.com`,
        brandName: name,
        isActive: false,
        trackAds: false,
      },
    })
  }

  const savedAds: Array<{
    id: string
    imageUrl: string | null
    title: string | null
    description: string | null
    ctaText: string | null
    landingUrl: string | null
    platform: string
    firstSeenAt: Date
    competitor: { name: string; website: string; logoUrl: string | null }
  }> = []

  for (const scraped of scrapedAds) {
    // Upload screenshot if available
    let imageUrl: string | null = null
    let imageKey: string | null = null

    if (scraped.imageBuffer && scraped.imageFilename) {
      const uploaded = await uploadScreenshot(scraped.imageBuffer, scraped.imageFilename)
      if (uploaded) {
        imageUrl = uploaded.url
        imageKey = uploaded.key
      }
    }

    // Save ad to DB
    const ad = await prisma.ad.create({
      data: {
        competitorId: competitor.id,
        platform: scraped.platform,
        format: scraped.format ?? 'DISPLAY',
        source: 'DISCOVERY',
        advertiserName: name,
        title: scraped.title ?? null,
        description: scraped.description ?? null,
        imageUrl,
        imageKey,
        ctaText: scraped.ctaText ?? null,
        landingUrl: scraped.landingUrl ?? null,
        rawData: scraped.rawData ? (scraped.rawData as Record<string, string | number | boolean | null>) : undefined,
      },
    })

    if (ad.imageUrl) {
      savedAds.push({
        id: ad.id,
        imageUrl: ad.imageUrl,
        title: ad.title,
        description: ad.description,
        ctaText: ad.ctaText,
        landingUrl: ad.landingUrl,
        platform: ad.platform,
        firstSeenAt: ad.firstSeenAt,
        competitor: {
          name: competitor.name,
          website: competitor.website,
          logoUrl: competitor.logoUrl,
        },
      })
    }
  }

  return { ads: savedAds, brandName: name }
}
