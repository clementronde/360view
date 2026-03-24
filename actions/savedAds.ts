'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

async function getOrgId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
    select: { id: true },
  })
  return org?.id ?? null
}

export async function getSavedAdIds(): Promise<string[]> {
  const orgId = await getOrgId()
  if (!orgId) return []
  const saved = await prisma.savedAd.findMany({
    where: { orgId },
    select: { adId: true },
  })
  return saved.map((s) => s.adId)
}

export async function toggleSaveAd(adId: string): Promise<{ saved: boolean; error?: string }> {
  const orgId = await getOrgId()
  if (!orgId) return { saved: false, error: 'Non authentifié' }

  const existing = await prisma.savedAd.findUnique({
    where: { orgId_adId: { orgId, adId } },
  })

  if (existing) {
    await prisma.savedAd.delete({ where: { id: existing.id } })
    return { saved: false }
  } else {
    await prisma.savedAd.create({ data: { orgId, adId } })
    return { saved: true }
  }
}

export async function getSavedAds(opts: { page?: number; limit?: number } = {}) {
  const orgId = await getOrgId()
  if (!orgId) return { ads: [], hasMore: false, total: 0 }

  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, opts.limit ?? 40)
  const skip = (page - 1) * limit

  const [saved, total] = await Promise.all([
    prisma.savedAd.findMany({
      where: { orgId },
      orderBy: { savedAt: 'desc' },
      skip,
      take: limit,
      select: {
        adId: true,
        savedAt: true,
        ad: {
          select: {
            id: true,
            imageUrl: true,
            title: true,
            description: true,
            ctaText: true,
            landingUrl: true,
            platform: true,
            firstSeenAt: true,
            source: true,
            advertiserName: true,
            country: true,
            engagementScore: true,
            activeDays: true,
            competitor: {
              select: { name: true, website: true, logoUrl: true },
            },
          },
        },
      },
    }),
    prisma.savedAd.count({ where: { orgId } }),
  ])

  const ads = saved
    .filter((s) => s.ad.imageUrl !== null)
    .map((s) => ({
      id: s.ad.id,
      imageUrl: s.ad.imageUrl as string,
      title: s.ad.title,
      description: s.ad.description,
      ctaText: s.ad.ctaText,
      landingUrl: s.ad.landingUrl,
      platform: s.ad.platform as string,
      firstSeenAt: s.ad.firstSeenAt.toISOString(),
      source: s.ad.source as string,
      advertiserName: s.ad.advertiserName,
      country: s.ad.country,
      engagementScore: s.ad.engagementScore,
      activeDays: s.ad.activeDays,
      competitor: s.ad.competitor,
      savedAt: s.savedAt.toISOString(),
    }))

  return { ads, hasMore: skip + ads.length < total, total }
}
