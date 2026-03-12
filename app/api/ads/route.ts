import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// GET /api/ads?page=1&platform=META&source=DISCOVERY&search=nike&shuffle=true
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
  })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '40', 10)))
  const platform = searchParams.get('platform') ?? undefined
  const source = searchParams.get('source') ?? undefined
  const search = searchParams.get('search') ?? undefined
  const shuffle = searchParams.get('shuffle') === 'true'

  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.AdWhereInput = {
    imageUrl: { not: null },
  }

  // Source filter
  if (source === 'DISCOVERY') {
    where.source = 'DISCOVERY'
  } else if (source === 'COMPETITOR_TRACKING') {
    if (org) {
      where.source = 'COMPETITOR_TRACKING'
      where.competitor = { organizationId: org.id }
    } else {
      // No org, return empty
      return NextResponse.json({ ads: [], total: 0, hasMore: false, page })
    }
  } else {
    // No source filter: combine org's competitor ads + discovery ads
    if (org) {
      where.OR = [
        { source: 'DISCOVERY' },
        { source: 'COMPETITOR_TRACKING', competitor: { organizationId: org.id } },
      ]
    } else {
      where.source = 'DISCOVERY'
    }
  }

  // Platform filter
  if (platform) {
    where.platform = platform as Prisma.AdWhereInput['platform']
  }

  // Search filter
  if (search && search.trim().length > 0) {
    const searchFilter: Prisma.AdWhereInput = {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { advertiserName: { contains: search, mode: 'insensitive' } },
      ],
    }
    // Merge with existing where
    if (where.OR) {
      // wrap existing OR into AND
      where.AND = [{ OR: where.OR as Prisma.AdWhereInput[] }, searchFilter]
      delete where.OR
    } else {
      Object.assign(where, searchFilter)
    }
  }

  // Shuffle: use random offset on top of normal ordering
  const randomOffset = shuffle ? Math.floor(Math.random() * 20) : 0
  const orderBy: Prisma.AdOrderByWithRelationInput = shuffle
    ? { id: 'asc' }
    : { firstSeenAt: 'desc' }

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy,
      skip: skip + randomOffset,
      take: limit,
      include: {
        competitor: {
          select: { name: true, website: true, logoUrl: true },
        },
      },
    }),
    prisma.ad.count({ where }),
  ])

  const hasMore = skip + ads.length < total

  return NextResponse.json({ ads, total, hasMore, page })
}
