'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ALL_POPULAR_BRANDS } from '@/lib/popularBrands'
import { FINTECH_BRANDS } from '@/lib/fintechBrands'
import { scrapeMetaAdLibraryAPI } from '@/lib/scraping/ads'
import type { AdPlatform, AdFormat } from '@prisma/client'

export interface AdminStats {
  totalAds: number
  adsWithImages: number
  totalOrgs: number
  totalCompetitors: number
  discoveryAds: number
  topAdvertisers: { name: string; count: number }[]
  hasMetaToken: boolean
  hasRailwayHook: boolean
}

export async function getAdminStats(): Promise<AdminStats> {
  const [totalAds, adsWithImages, totalOrgs, totalCompetitors, discoveryAds, topAdvertisers] =
    await Promise.all([
      prisma.ad.count(),
      prisma.ad.count({ where: { imageUrl: { not: null } } }),
      prisma.organization.count(),
      prisma.competitor.count(),
      prisma.ad.count({ where: { source: 'DISCOVERY' } }),
      prisma.ad.groupBy({
        by: ['advertiserName'],
        where: { advertiserName: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

  return {
    totalAds,
    adsWithImages,
    totalOrgs,
    totalCompetitors,
    discoveryAds,
    topAdvertisers: topAdvertisers.map((a) => ({
      name: a.advertiserName!,
      count: a._count.id,
    })),
    hasMetaToken: !!process.env.META_ACCESS_TOKEN,
    hasRailwayHook: !!process.env.RAILWAY_DEPLOY_HOOK,
  }
}

/** Scrape 20 popular brands via Meta HTTP API → add to discovery feed */
export async function adminSeedDiscovery(): Promise<{
  success: boolean
  added: number
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) return { success: false, added: 0, error: 'Non authentifié' }

  if (!process.env.META_ACCESS_TOKEN) {
    return { success: false, added: 0, error: 'META_ACCESS_TOKEN manquant' }
  }

  let discoveryOrg = await prisma.organization.findFirst({
    where: { clerkOrgId: 'mass_scrape_org' },
  })
  if (!discoveryOrg) {
    discoveryOrg = await prisma.organization.create({
      data: {
        clerkOrgId: 'mass_scrape_org',
        name: 'Discovery Library',
        slug: 'discovery-library',
      },
    })
  }

  const allBrands = [
    ...ALL_POPULAR_BRANDS.map((b) => b.name),
    ...FINTECH_BRANDS.map((b) => b.name),
  ]
  const brands = allBrands.sort(() => Math.random() - 0.5).slice(0, 20)

  let totalAdded = 0

  for (const brandName of brands) {
    try {
      const scrapedAds = await scrapeMetaAdLibraryAPI(brandName)
      if (scrapedAds.length === 0) continue

      let competitor = await prisma.competitor.findFirst({
        where: {
          organizationId: discoveryOrg.id,
          name: { equals: brandName, mode: 'insensitive' },
        },
      })
      if (!competitor) {
        competitor = await prisma.competitor.create({
          data: {
            organizationId: discoveryOrg.id,
            name: brandName,
            website: '',
            brandName: brandName,
            isActive: false,
            trackAds: false,
          },
        })
      }

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
        totalAdded++
      }
    } catch (err) {
      console.error(`[adminSeedDiscovery] Error for ${brandName}:`, err)
    }
  }

  revalidatePath('/dashboard/feed')
  return { success: true, added: totalAdded }
}

/** Trigger Railway deploy hook to run massScrape worker */
export async function triggerRailwayMassScrape(): Promise<{
  success: boolean
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'Non authentifié' }

  const hookUrl = process.env.RAILWAY_DEPLOY_HOOK
  if (!hookUrl) return { success: false, error: 'RAILWAY_DEPLOY_HOOK non configuré' }

  try {
    const res = await fetch(hookUrl, { method: 'POST' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erreur' }
  }
}

/** Reset all discovery ads (clean slate before a new mass scrape) */
export async function resetDiscoveryAds(): Promise<{ success: boolean; deleted: number }> {
  const { userId } = await auth()
  if (!userId) return { success: false, deleted: 0 }

  const result = await prisma.ad.deleteMany({ where: { source: 'DISCOVERY' } })
  revalidatePath('/dashboard/feed')
  return { success: true, deleted: result.count }
}
