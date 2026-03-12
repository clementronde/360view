'use server'

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface FetchAdsOptions {
  page?: number
  limit?: number
  platform?: string
  search?: string
  shuffle?: boolean
}

export type FeedAd = {
  id: string
  imageUrl: string
  title: string | null
  description: string | null
  ctaText: string | null
  landingUrl: string | null
  platform: string
  firstSeenAt: string
  source: string
  advertiserName: string | null
  competitor: { name: string; website: string; logoUrl: string | null } | null
}

export interface FetchAdsResult {
  ads: FeedAd[]
  total: number
  hasMore: boolean
  page: number
}

// Public discovery feed — shows all scraped ads from the system
export async function fetchDiscoveryAds(opts: FetchAdsOptions = {}): Promise<FetchAdsResult> {
  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 40))
  const search = opts.search?.trim()
  const shuffle = opts.shuffle ?? false
  const skip = (page - 1) * limit

  const where: Prisma.AdWhereInput = {
    imageUrl: { not: null },
    format: { notIn: ['SHOPPING', 'SEARCH'] },
  }

  // Platform filter
  if (opts.platform) {
    where.platform = opts.platform as Prisma.AdWhereInput['platform']
  }

  // Search filter
  if (search && search.length > 0) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { advertiserName: { contains: search, mode: 'insensitive' } },
      { competitor: { name: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const randomOffset = shuffle ? Math.floor(Math.random() * 20) : 0
  const orderBy: Prisma.AdOrderByWithRelationInput = shuffle
    ? { id: 'asc' }
    : { firstSeenAt: 'desc' }

  const [rawAds, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy,
      skip: skip + randomOffset,
      take: limit,
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
        competitor: {
          select: { name: true, website: true, logoUrl: true },
        },
      },
    }),
    prisma.ad.count({ where }),
  ])

  const hasMore = skip + rawAds.length < total

  const ads: FeedAd[] = rawAds
    .filter((ad) => ad.imageUrl !== null)
    .map((ad) => ({
      id: ad.id,
      imageUrl: ad.imageUrl as string,
      title: ad.title,
      description: ad.description,
      ctaText: ad.ctaText,
      landingUrl: ad.landingUrl,
      platform: ad.platform as string,
      firstSeenAt: ad.firstSeenAt.toISOString(),
      source: ad.source as string,
      advertiserName: ad.advertiserName,
      competitor: ad.competitor,
    }))

  return { ads, total, hasMore, page }
}
