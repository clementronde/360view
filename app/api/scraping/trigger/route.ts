import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryAPI } from '@/lib/scraping/ads'
import { ALL_POPULAR_BRANDS } from '@/lib/popularBrands'
import type { AdPlatform, AdFormat } from '@prisma/client'

// 60s timeout — configured in vercel.json
export const maxDuration = 60

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: userId, name: 'Mon espace', slug: `org-${userId.slice(-8)}` },
    })
  }
  return org
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (!process.env.META_ACCESS_TOKEN) {
    return NextResponse.json(
      { success: false, total: 0, error: 'META_ACCESS_TOKEN manquant' },
      { status: 200 }
    )
  }

  const org = await getOrCreateOrg(userId)
  const competitors = await prisma.competitor.findMany({
    where: { organizationId: org.id, isActive: true, trackAds: true },
  })

  // ── Mode A: scrape user's competitors ──────────────────────────────────────
  if (competitors.length > 0) {
    const results = await Promise.allSettled(
      competitors.map(async (competitor) => {
        const brandName = competitor.brandName ?? competitor.name
        const scrapedAds = await scrapeMetaAdLibraryAPI(brandName)
        let added = 0
        for (const ad of scrapedAds) {
          if (ad.landingUrl) {
            const exists = await prisma.ad.findFirst({
              where: { competitorId: competitor.id, landingUrl: ad.landingUrl },
            })
            if (exists) continue
          }
          await prisma.ad.create({
            data: {
              competitorId: competitor.id,
              platform: ad.platform as AdPlatform,
              format: 'DISPLAY' as AdFormat,
              source: 'COMPETITOR_TRACKING',
              advertiserName: competitor.brandName ?? competitor.name,
              title: ad.title ?? null,
              description: ad.description ?? null,
              imageUrl: null,
              ctaText: null,
              landingUrl: ad.landingUrl ?? null,
              rawData: (ad.rawData as object) ?? {},
              country: 'FR',
              activeDays: 1,
              engagementScore: 0,
            },
          })
          added++
        }
        return added
      })
    )
    const total = results.reduce(
      (sum, r) => sum + (r.status === 'fulfilled' ? r.value : 0),
      0
    )
    return NextResponse.json({ success: true, total, mode: 'competitors' })
  }

  // ── Mode B: no competitors → seed discovery feed ──────────────────────────
  let discoveryOrg = await prisma.organization.findFirst({ where: { clerkOrgId: 'mass_scrape_org' } })
  if (!discoveryOrg) {
    discoveryOrg = await prisma.organization.create({
      data: { clerkOrgId: 'mass_scrape_org', name: 'Discovery Library', slug: 'discovery-library' },
    })
  }

  const brands = [...ALL_POPULAR_BRANDS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 12)
    .map((b) => b.name)

  const scraped = await Promise.allSettled(
    brands.map(async (brandName) => ({
      brandName,
      ads: await scrapeMetaAdLibraryAPI(brandName),
    }))
  )

  let total = 0
  for (const result of scraped) {
    if (result.status === 'rejected') continue
    const { brandName, ads } = result.value
    if (ads.length === 0) continue

    let competitor = await prisma.competitor.findFirst({
      where: { organizationId: discoveryOrg.id, name: { equals: brandName, mode: 'insensitive' } },
    })
    if (!competitor) {
      competitor = await prisma.competitor.create({
        data: { organizationId: discoveryOrg.id, name: brandName, website: '', brandName, isActive: false, trackAds: false },
      })
    }

    for (const ad of ads) {
      if (ad.landingUrl) {
        const exists = await prisma.ad.findFirst({ where: { competitorId: competitor.id, landingUrl: ad.landingUrl } })
        if (exists) continue
      }
      await prisma.ad.create({
        data: {
          competitorId: competitor.id,
          platform: ad.platform as AdPlatform,
          format: 'DISPLAY' as AdFormat,
          source: 'DISCOVERY',
          advertiserName: brandName,
          title: ad.title ?? null,
          description: ad.description ?? null,
          imageUrl: null,
          ctaText: null,
          landingUrl: ad.landingUrl ?? null,
          rawData: (ad.rawData as object) ?? {},
          country: 'FR',
          activeDays: 1,
          engagementScore: 0,
        },
      })
      total++
    }
  }

  return NextResponse.json({ success: true, total, mode: 'discovery' })
}
