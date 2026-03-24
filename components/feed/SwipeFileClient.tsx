'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { DiscoveryCard } from '@/components/feed/DiscoveryCard'
import { Skeleton } from '@/components/ui/skeleton'
import { getSavedAds } from '@/actions/savedAds'

type NormalizedAd = {
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
  country: string | null
  engagementScore: number | null
  activeDays: number | null
  competitor: { name: string; website: string; logoUrl: string | null }
}

export function SwipeFileClient() {
  const [ads, setAds] = useState<NormalizedAd[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getSavedAds({ limit: 100 })
    const normalized: NormalizedAd[] = result.ads.map((ad) => ({
      ...ad,
      competitor: ad.competitor ?? {
        name: ad.advertiserName ?? 'Marque inconnue',
        website: '#',
        logoUrl: null,
      },
    }))
    setAds(normalized)
    setSavedIds(new Set(result.ads.map((a) => a.id)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaveToggle(adId: string, saved: boolean) {
    if (!saved) {
      setAds((prev) => prev.filter((a) => a.id !== adId))
      setSavedIds((prev) => { const n = new Set(prev); n.delete(adId); return n })
    }
  }

  if (loading) {
    return (
      <div className="p-3 columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance]">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="break-inside-avoid mb-2 rounded-xl w-full" style={{ height: `${160 + ((i * 53) % 220)}px` }} />
        ))}
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center select-none">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5" style={{ background: 'var(--surface-muted)' }}>
          <Bookmark className="h-7 w-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        </div>
        <h3 className="text-sm font-semibold">Aucune pub sauvegardée</h3>
        <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Dans le feed Découvrir, cliquez sur l&apos;icône signet pour sauvegarder vos pubs préférées.
        </p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance]">
        {ads.map((ad, i) => (
          <DiscoveryCard
            key={ad.id}
            ad={ad}
            priority={i < 12}
            isSaved={savedIds.has(ad.id)}
            onSaveToggle={handleSaveToggle}
          />
        ))}
      </div>
    </div>
  )
}
