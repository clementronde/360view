import { auth } from '@clerk/nextjs/server'
import { Image as ImageIcon, Layers } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrapeButton } from '@/components/ads/ScrapeButton'
import { AdCard } from '@/components/ads/AdCard'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Veille concurrentielle' }

async function getOrgId(userId: string) {
  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  return org?.id
}

async function AdsFeed() {
  const { userId } = await auth()
  if (!userId) return null

  const orgId = await getOrgId(userId)
  if (!orgId) return <EmptyState />

  const [ads, totalAds] = await Promise.all([
    prisma.ad.findMany({
      where: {
        competitor: { organizationId: orgId },
        imageUrl: { not: null },
      },
      orderBy: { firstSeenAt: 'desc' },
      take: 100,
      include: {
        competitor: { select: { name: true, website: true, logoUrl: true } },
      },
    }),
    prisma.ad.count({ where: { competitor: { organizationId: orgId } } }),
  ])

  if (ads.length === 0) return <EmptyState hasAds={totalAds > 0} />

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2.5 [column-fill:_balance]">
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          ad={{
            id: ad.id,
            imageUrl: ad.imageUrl!,
            title: ad.title,
            description: ad.description,
            ctaText: ad.ctaText,
            landingUrl: ad.landingUrl,
            platform: ad.platform,
            firstSeenAt: ad.firstSeenAt,
            competitor: ad.competitor ?? { name: 'Inconnu', website: '#', logoUrl: null },
          }}
        />
      ))}
    </div>
  )
}

function EmptyState({ hasAds = false }: { hasAds?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5" style={{ background: 'var(--surface-muted)' }}>
        {hasAds ? (
          <Layers className="h-7 w-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        ) : (
          <ImageIcon className="h-7 w-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        )}
      </div>
      <h3 className="text-sm font-semibold">
        {hasAds ? 'Aucune créa avec image trouvée' : 'Aucune publicité détectée'}
      </h3>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
        {hasAds
          ? 'Les ads scrapées n\'ont pas d\'image. Relance le scraping pour obtenir les vraies créas.'
          : 'Ajoute des concurrents puis clique sur « Lancer le scraping » pour remplir ta galerie.'}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Galerie publicitaire"
        description="Créas de vos concurrents"
        actions={<ScrapeButton />}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <Suspense
            fallback={
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-2.5 [column-fill:_balance]">
                {Array.from({ length: 16 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="break-inside-avoid mb-2.5 rounded-xl w-full"
                    style={{ height: `${150 + ((i * 47) % 180)}px` }}
                  />
                ))}
              </div>
            }
          >
            <AdsFeed />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
