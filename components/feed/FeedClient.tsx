'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Shuffle, Compass, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { DiscoveryCard } from '@/components/feed/DiscoveryCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchDiscoveryAds, type FeedAd } from '@/actions/ads'
import { discoverAds } from '@/actions/discover'
import { enrichFeed } from '@/actions/enrich'
import { PLATFORM_LABELS, cn } from '@/lib/utils'

const PLATFORMS = ['Tous', 'GOOGLE', 'META', 'LINKEDIN', 'TIKTOK', 'SNAPCHAT', 'PINTEREST', 'YOUTUBE']


function normalizeAd(ad: FeedAd) {
  return {
    ...ad,
    competitor: ad.competitor ?? {
      name: ad.advertiserName ?? 'Marque inconnue',
      website: '#',
      logoUrl: null,
    },
  }
}

export function FeedClient() {
  const [search, setSearch] = useState('')
  const [activePlatform, setActivePlatform] = useState('Tous')
  const [shuffle, setShuffle] = useState(false)

  const [ads, setAds] = useState<FeedAd[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true) // true on mount → shows skeleton immediately
  const [loadingMore, setLoadingMore] = useState(false)

  const [scraping, setScraping] = useState(false)
  const [showScrapeButton, setShowScrapeButton] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const isFiltered = search.trim().length > 0 || activePlatform !== 'Tous'

  const loadAds = useCallback(async (opts: {
    page: number
    reset?: boolean
    searchVal?: string
    platform?: string
    shuffleVal?: boolean
  }) => {
    const { page: p, reset, searchVal, platform, shuffleVal } = opts
    const isFirst = p === 1

    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    try {
      const result = await fetchDiscoveryAds({
        page: p,
        limit: 40,
        platform: platform && platform !== 'Tous' ? platform : undefined,
        search: searchVal?.trim() || undefined,
        shuffle: shuffleVal,
      })

      if (reset || isFirst) {
        setAds(result.ads)
        setShowScrapeButton(result.ads.length === 0 && !!(searchVal && searchVal.trim()))
      } else {
        setAds((prev) => [...prev, ...result.ads])
      }

      setHasMore(result.hasMore)
      setPage(p)
    } catch (err) {
      console.error('[FeedClient] loadAds error:', err)
      toast.error('Impossible de charger les publicités')
    } finally {
      if (isFirst) setLoading(false)
      else setLoadingMore(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadAds({ page: 1 })
  }, [loadAds])

  // Refetch when filters change
  const prevFilters = useRef({ search: '', activePlatform: 'Tous', shuffle: false })
  useEffect(() => {
    const prev = prevFilters.current
    if (prev.search === search && prev.activePlatform === activePlatform && prev.shuffle === shuffle) return
    prevFilters.current = { search, activePlatform, shuffle }
    loadAds({ page: 1, reset: true, searchVal: search, platform: activePlatform, shuffleVal: shuffle })
  }, [search, activePlatform, shuffle, loadAds])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadAds({ page: page + 1, searchVal: search, platform: activePlatform, shuffleVal: shuffle })
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, search, shuffle, loadAds])

  async function handleScrape() {
    if (!search.trim()) return
    setScraping(true)
    const toastId = toast.loading(`Scraping "${search.trim()}"… (30–60 s)`)
    try {
      const result = await discoverAds(search.trim())
      if ('error' in result) {
        toast.error(result.error, { id: toastId })
      } else if (result.ads.length === 0) {
        toast.info(`Aucune pub trouvée pour "${search.trim()}"`, { id: toastId })
      } else {
        toast.success(`${result.ads.length} pub${result.ads.length > 1 ? 's' : ''} ajoutée${result.ads.length > 1 ? 's' : ''}`, { id: toastId })
        loadAds({ page: 1, reset: true, searchVal: search, platform: activePlatform, shuffleVal: shuffle })
        setShowScrapeButton(false)
      }
    } catch {
      toast.error('Erreur inattendue', { id: toastId })
    } finally {
      setScraping(false)
    }
  }

  async function handleSeed() {
    setSeeding(true)
    const toastId = toast.loading('Enrichissement en cours… (scraping parallèle de 5 marques)')
    try {
      const result = await enrichFeed(5)
      if (result.error) {
        toast.error(result.error, { id: toastId })
      } else if (result.added === 0) {
        toast.info('Aucune nouvelle publicité trouvée', { id: toastId })
      } else {
        toast.success(
          `${result.added} pub${result.added > 1 ? 's' : ''} ajoutée${result.added > 1 ? 's' : ''} (${result.brands.join(', ')})`,
          { id: toastId }
        )
        loadAds({ page: 1, reset: true })
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'enrichissement", { id: toastId })
    } finally {
      setSeeding(false)
    }
  }

  const normalized = ads.map(normalizeAd)

  return (
    <div className="flex flex-col">
      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/40 px-4 py-2.5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher une marque…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm bg-transparent"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                activePlatform === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              {p === 'Tous' ? 'Tous' : (PLATFORM_LABELS[p] ?? p)}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant={shuffle ? 'default' : 'outline'}
          className="h-8 gap-1.5 text-xs"
          onClick={() => setShuffle((s) => !s)}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Mélanger
        </Button>

        {!isFiltered && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs ml-auto"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding
              ? <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            {seeding ? 'Enrichissement…' : 'Enrichir le feed'}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Skeleton — shown while first load */}
        {loading && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance]">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton
                key={i}
                className="break-inside-avoid mb-2 rounded-xl w-full"
                style={{ height: `${160 + ((i * 53) % 220)}px` }}
              />
            ))}
          </div>
        )}

        {/* Masonry grid */}
        {!loading && normalized.length > 0 && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance]">
            {normalized.map((ad, i) => (
              <DiscoveryCard key={ad.id} ad={ad} priority={i < 10} />
            ))}
          </div>
        )}

        {/* Load more skeleton */}
        {loadingMore && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance] mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="break-inside-avoid mb-2 rounded-xl w-full"
                style={{ height: `${160 + ((i * 47) % 180)}px` }}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />

        {/* Empty — search with no result */}
        {!loading && showScrapeButton && (
          <div className="flex flex-col items-center justify-center py-24 text-center select-none">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
              <Compass className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold">Aucune pub pour &ldquo;{search}&rdquo;</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-xs leading-relaxed">
              Cette marque n&apos;a pas encore été scrapée.
            </p>
            <Button onClick={handleScrape} disabled={scraping} size="sm" className="gap-2">
              {scraping
                ? <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                : null
              }
              {scraping ? 'Scraping…' : `Scraper "${search}"`}
            </Button>
          </div>
        )}

        {/* Empty — no ads at all */}
        {!loading && ads.length === 0 && !showScrapeButton && (
          <div className="flex flex-col items-center justify-center py-32 text-center select-none">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
              <Sparkles className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold">Votre feed est vide</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-xs leading-relaxed">
              Enrichissez votre feed avec des publicités de marques populaires.
            </p>
            <Button onClick={handleSeed} disabled={seeding} size="sm" className="gap-2">
              {seeding
                ? <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />
              }
              {seeding ? 'Enrichissement…' : 'Enrichir le feed'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
