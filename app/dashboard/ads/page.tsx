import { auth } from '@clerk/nextjs/server'
import Image from 'next/image'
import { Image as ImageIcon } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PLATFORM_LABELS, PLATFORM_COLORS, formatDateTime, getFaviconUrl } from '@/lib/utils'
import { Suspense } from 'react'
import { ScrapeButton } from '@/components/ads/ScrapeButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ads' }

async function getOrgId(userId: string) {
  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  return org?.id
}

async function AdsGrid() {
  const { userId } = await auth()
  if (!userId) return null

  const orgId = await getOrgId(userId)
  if (!orgId) return <EmptyAds />

  const ads = await prisma.ad.findMany({
    where: { competitor: { organizationId: orgId } },
    orderBy: { firstSeenAt: 'desc' },
    take: 60,
    include: {
      competitor: { select: { name: true, website: true, logoUrl: true } },
    },
  })

  if (ads.length === 0) return <EmptyAds />

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ads.map((ad) => (
        <div
          key={ad.id}
          className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20"
        >
          {/* Ad screenshot */}
          <div className="relative aspect-video bg-muted overflow-hidden">
            {ad.imageUrl ? (
              <Image
                src={ad.imageUrl}
                alt={ad.title ?? 'Publicité'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Ad info */}
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge className={PLATFORM_COLORS[ad.platform]}>
                {PLATFORM_LABELS[ad.platform]}
              </Badge>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDateTime(ad.firstSeenAt)}
              </span>
            </div>

            {/* Competitor */}
            {ad.competitor && (
              <div className="flex items-center gap-1.5">
                <div className="relative h-4 w-4 overflow-hidden rounded">
                  <Image
                    src={ad.competitor.logoUrl ?? getFaviconUrl(ad.competitor.website)}
                    alt={ad.competitor.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-xs text-muted-foreground">{ad.competitor.name}</span>
              </div>
            )}

            {ad.title && (
              <p className="text-xs font-medium line-clamp-2">{ad.title}</p>
            )}
            {ad.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
            )}

            {ad.ctaText && (
              <div className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5">
                <span className="text-xs font-medium text-primary">{ad.ctaText}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyAds() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Aucune publicité détectée</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
        Le module Ads scraping analyse automatiquement les publicités de vos concurrents.
      </p>
    </div>
  )
}

export default function AdsPage() {
  return (
    <div className="flex flex-col overflow-auto">
      <Header
        title="Ads"
        description="Publicités détectées de vos concurrents"
        actions={<ScrapeButton />}
      />
      <div className="flex-1 overflow-auto p-6">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          }
        >
          <AdsGrid />
        </Suspense>
      </div>
    </div>
  )
}
