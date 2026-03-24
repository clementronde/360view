'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Shuffle, Compass, Sparkles, X, Trash2, CreditCard,
  Zap, Globe, Flame, Clock, SlidersHorizontal, MoreHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { DiscoveryCard } from '@/components/feed/DiscoveryCard'
import { PagePicker } from '@/components/feed/PagePicker'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchDiscoveryAds, type FeedAd } from '@/actions/ads'
import { getSavedAdIds } from '@/actions/savedAds'
import { discoverAds } from '@/actions/discover'
import { enrichFeed } from '@/actions/enrich'
import { seedFintechBrands, seedFintechRandom } from '@/actions/seedFintech'
import { seedPopularBrands } from '@/actions/seedPopular'
import { resetDiscoveryAds } from '@/actions/resetAds'
import { BRAND_CATEGORIES } from '@/lib/brandCategories'
import { FINTECH_BRANDS } from '@/lib/fintechBrands'
import { PLATFORM_LABELS, cn } from '@/lib/utils'

const PLATFORMS = ['Tous', 'META', 'GOOGLE', 'LINKEDIN', 'TIKTOK', 'SNAPCHAT', 'PINTEREST', 'YOUTUBE']
const PLATFORM_SHORT: Record<string, string> = {
  META: 'Meta',
  GOOGLE: 'Google',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  SNAPCHAT: 'Snap',
  PINTEREST: 'Pinterest',
  YOUTUBE: 'YouTube',
}
const COUNTRIES = ['ALL', 'FR', 'US', 'GB', 'DE'] as const
const COUNTRY_FLAG: Record<string, string> = { ALL: '🌍 Tous', FR: '🇫🇷 FR', US: '🇺🇸 US', GB: '🇬🇧 GB', DE: '🇩🇪 DE' }

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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors duration-100"
      style={{
        fontFamily: 'var(--font-jetbrains-mono)',
        borderRadius: 4,
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-subtle)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
    >
      {children}
    </button>
  )
}

export function FeedClient() {
  const [search, setSearch] = useState('')
  const [activePlatform, setActivePlatform] = useState('Tous')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [shuffle, setShuffle] = useState(false)
  const [activeCountry, setActiveCountry] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const [ads, setAds] = useState<FeedAd[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [savedAdIds, setSavedAdIds] = useState<Set<string>>(new Set())

  const [scraping, setScraping] = useState(false)
  const [showScrapeButton, setShowScrapeButton] = useState(false)
  const [showPagePicker, setShowPagePicker] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedingFintech, setSeedingFintech] = useState(false)
  const [seedingPopular, setSeedingPopular] = useState(false)
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null)
  const [grandBatchRunning, setGrandBatchRunning] = useState(false)
  const [grandBatchProgress, setGrandBatchProgress] = useState<{ done: number; total: number; current: string } | null>(null)
  const [resetting, setResetting] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const adminRef = useRef<HTMLDivElement>(null)

  const activeFilterCount =
    (activePlatform !== 'Tous' ? 1 : 0) +
    (activeCountry !== 'ALL' ? 1 : 0)

  const isFiltered =
    search.trim().length > 0 ||
    activePlatform !== 'Tous' ||
    activeCategory !== null ||
    activeCountry !== 'ALL' ||
    sortBy !== 'recent'

  // Close admin dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false)
      }
    }
    if (adminOpen) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [adminOpen])

  const getBrandsForCategory = (cat: string | null) => {
    if (!cat) return undefined
    return BRAND_CATEGORIES[cat]?.brands
  }

  const loadAds = useCallback(async (opts: {
    page: number
    reset?: boolean
    searchVal?: string
    platform?: string
    shuffleVal?: boolean
    category?: string | null
    country?: string
    sortByVal?: 'recent' | 'trending'
  }) => {
    const { page: p, reset, searchVal, platform, shuffleVal, category, country, sortByVal } = opts
    const isFirst = p === 1
    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    try {
      const brands = getBrandsForCategory(category ?? null)
      const result = await fetchDiscoveryAds({
        page: p,
        limit: 40,
        platform: platform && platform !== 'Tous' ? platform : undefined,
        search: brands ? undefined : (searchVal?.trim() || undefined),
        brands,
        shuffle: shuffleVal,
        country: country && country !== 'ALL' ? country : undefined,
        sortBy: sortByVal,
      })

      if (reset || isFirst) {
        setAds(result.ads)
        setShowScrapeButton(result.ads.length === 0 && !!(searchVal && searchVal.trim()) && !brands)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadAds({ page: 1 }) }, [loadAds])

  useEffect(() => {
    getSavedAdIds().then((ids) => setSavedAdIds(new Set(ids)))
  }, [])

  const prevFilters = useRef({ search: '', activePlatform: 'Tous', shuffle: false, activeCategory: null as string | null, activeCountry: 'ALL', sortBy: 'recent' as 'recent' | 'trending' })
  useEffect(() => {
    const prev = prevFilters.current
    if (
      prev.search === search &&
      prev.activePlatform === activePlatform &&
      prev.shuffle === shuffle &&
      prev.activeCategory === activeCategory &&
      prev.activeCountry === activeCountry &&
      prev.sortBy === sortBy
    ) return
    prevFilters.current = { search, activePlatform, shuffle, activeCategory, activeCountry, sortBy }
    loadAds({ page: 1, reset: true, searchVal: search, platform: activePlatform, shuffleVal: shuffle, category: activeCategory, country: activeCountry, sortByVal: sortBy })
  }, [search, activePlatform, shuffle, activeCategory, activeCountry, sortBy, loadAds])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadAds({ page: page + 1, searchVal: search, platform: activePlatform, shuffleVal: shuffle, category: activeCategory, country: activeCountry, sortByVal: sortBy })
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, search, shuffle, activeCategory, loadAds])

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
    const catLabel = activeCategory ? BRAND_CATEGORIES[activeCategory]?.label : null
    const toastId = toast.loading(catLabel ? `Enrichissement ${catLabel}…` : 'Enrichissement en cours…')
    try {
      const result = await enrichFeed(5, activeCategory ?? undefined)
      if (result.error) {
        toast.error(result.error, { id: toastId })
      } else if (result.added === 0) {
        toast.info('Aucune nouvelle publicité trouvée', { id: toastId })
      } else {
        toast.success(`${result.added} pub${result.added > 1 ? 's' : ''} ajoutée${result.added > 1 ? 's' : ''} (${result.brands.join(', ')})`, { id: toastId })
        loadAds({ page: 1, reset: true, category: activeCategory })
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'enrichissement", { id: toastId })
    } finally {
      setSeeding(false)
    }
  }

  async function handleSeedFintech() {
    setSeedingFintech(true)
    const toastId = toast.loading('Fintech ×2 — scraping 40 ads…')
    try {
      const result = await seedFintechRandom()
      if (result.error) { toast.error(result.error, { id: toastId }); return }
      if (result.added === 0) { toast.info('Aucune nouvelle pub fintech trouvée', { id: toastId }); return }
      toast.success(`${result.added} pub${result.added > 1 ? 's' : ''} · ${result.brands.join(', ')}`, { id: toastId })
      loadAds({ page: 1, reset: true, category: activeCategory })
    } catch (err) {
      console.error(err)
      toast.error('Erreur scraping fintech', { id: toastId })
    } finally {
      setSeedingFintech(false)
    }
  }

  async function handleSeedPopular() {
    setSeedingPopular(true)
    const toastId = toast.loading('Scraping marques populaires… (40 ads)')
    try {
      const result = await seedPopularBrands()
      if (result.error) { toast.error(result.error, { id: toastId }); return }
      if (result.added === 0) { toast.info('Aucune nouvelle pub trouvée', { id: toastId }); return }
      toast.success(`${result.added} pub${result.added > 1 ? 's' : ''} · ${result.brands.join(', ')}`, { id: toastId })
      loadAds({ page: 1, reset: true, category: activeCategory })
    } catch (err) {
      console.error(err)
      toast.error('Erreur scraping populaires', { id: toastId })
    } finally {
      setSeedingPopular(false)
    }
  }

  async function handleBatchAll() {
    setBatchRunning(true)
    const total = FINTECH_BRANDS.length
    setBatchProgress({ done: 0, total })
    const toastId = toast.loading(`Batch fintech — 0 / ${total} marques…`, { duration: Infinity })
    let offset = 0
    let totalAdded = 0
    let done = 0
    try {
      while (offset !== -1) {
        const result = await seedFintechBrands(offset)
        if (result.error) { toast.error(result.error, { id: toastId }); break }
        totalAdded += result.added
        done = Math.min(offset + 2, total)
        setBatchProgress({ done, total })
        toast.loading(`Batch fintech — ${done} / ${total} marques…`, { id: toastId })
        offset = result.nextOffset
      }
      toast.success(`Batch terminé — ${totalAdded} pub${totalAdded > 1 ? 's' : ''} (${total} marques)`, { id: toastId, duration: 6000 })
      loadAds({ page: 1, reset: true, category: activeCategory })
    } catch (err) {
      console.error(err)
      toast.error('Erreur pendant le batch', { id: toastId })
    } finally {
      setBatchRunning(false)
      setBatchProgress(null)
    }
  }

  async function handleGrandBatch() {
    const categoryKeys = Object.keys(BRAND_CATEGORIES)
    const totalSteps = categoryKeys.length + 1
    setGrandBatchRunning(true)
    setGrandBatchProgress({ done: 0, total: totalSteps, current: '' })
    const toastId = toast.loading('Grand Batch — initialisation…', { duration: Infinity })
    let totalAdded = 0
    try {
      for (let i = 0; i < categoryKeys.length; i++) {
        const key = categoryKeys[i]
        const label = BRAND_CATEGORIES[key].label
        setGrandBatchProgress({ done: i, total: totalSteps, current: label })
        toast.loading(`Grand Batch — ${label} (${i + 1}/${totalSteps})…`, { id: toastId })
        const result = await seedPopularBrands(key, 100)
        totalAdded += result.added ?? 0
        setGrandBatchProgress({ done: i + 1, total: totalSteps, current: label })
      }
      setGrandBatchProgress({ done: categoryKeys.length, total: totalSteps, current: 'Fintech' })
      toast.loading(`Grand Batch — Fintech (${totalSteps}/${totalSteps})…`, { id: toastId })
      let fintechAdded = 0
      let offset = 0
      while (fintechAdded < 200 && offset !== -1) {
        const result = await seedFintechBrands(offset)
        fintechAdded += result.added ?? 0
        offset = result.nextOffset
        if (result.error) break
      }
      totalAdded += fintechAdded
      toast.success(`Grand Batch terminé — ${totalAdded} pub${totalAdded > 1 ? 's' : ''}`, { id: toastId, duration: 8000 })
      loadAds({ page: 1, reset: true })
    } catch (err) {
      console.error(err)
      toast.error('Erreur pendant le Grand Batch', { id: toastId })
    } finally {
      setGrandBatchRunning(false)
      setGrandBatchProgress(null)
    }
  }

  async function handleReset() {
    if (!confirm('Supprimer toutes les pubs du feed Découvrir ? Cette action est irréversible.')) return
    setResetting(true)
    const toastId = toast.loading('Suppression en cours…')
    try {
      const result = await resetDiscoveryAds()
      if (result.error) { toast.error(result.error, { id: toastId }); return }
      toast.success(`${result.deleted} pub${result.deleted > 1 ? 's' : ''} supprimée${result.deleted > 1 ? 's' : ''}`, { id: toastId })
      loadAds({ page: 1, reset: true })
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la suppression', { id: toastId })
    } finally {
      setResetting(false)
    }
  }

  function handleSaveToggle(adId: string, saved: boolean) {
    setSavedAdIds((prev) => {
      const next = new Set(prev)
      if (saved) next.add(adId)
      else next.delete(adId)
      return next
    })
  }

  function clearFilters() {
    setSearch('')
    setActivePlatform('Tous')
    setActiveCategory(null)
    setShuffle(false)
    setActiveCountry('ALL')
    setSortBy('recent')
    setFiltersOpen(false)
  }

  const anyBusy = grandBatchRunning || batchRunning || seedingFintech || seedingPopular || seeding || resetting
  const normalized = ads.map(normalizeAd)

  return (
    <div className="flex flex-col">

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >

        {/* Row 1 — primary controls */}
        <div className="flex items-center gap-2 px-4 py-2.5">

          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Marque ou mot-clé…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (e.target.value) setActiveCategory(null)
              }}
              className="pl-8 h-8 text-sm bg-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortBy((s) => s === 'trending' ? 'recent' : 'trending')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              border: '1px solid var(--border)',
              background: sortBy === 'trending' ? 'var(--accent-subtle)' : 'transparent',
              color: sortBy === 'trending' ? 'var(--accent)' : 'var(--text-muted)',
            }}
            title={sortBy === 'trending' ? 'Afficher les plus récents' : 'Afficher les plus performants'}
          >
            {sortBy === 'trending'
              ? <Flame className="h-3.5 w-3.5" />
              : <Clock className="h-3.5 w-3.5" />
            }
            <span className="hidden sm:inline">{sortBy === 'trending' ? 'Trending' : 'Récent'}</span>
          </button>

          {/* Shuffle */}
          <button
            onClick={() => setShuffle((s) => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              border: '1px solid var(--border)',
              background: shuffle ? 'var(--accent-subtle)' : 'transparent',
              color: shuffle ? 'var(--accent)' : 'var(--text-muted)',
            }}
            title="Ordre aléatoire"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>

          {/* Filters toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              border: filtersOpen || activeFilterCount > 0 ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: filtersOpen || activeFilterCount > 0 ? 'var(--accent-subtle)' : 'transparent',
              color: filtersOpen || activeFilterCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filtres</span>
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear all */}
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Réinitialiser tous les filtres"
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Admin ⋯ */}
          <div className="relative ml-auto" ref={adminRef}>
            <button
              onClick={() => setAdminOpen((o) => !o)}
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              style={{ border: '1px solid var(--border)', background: 'transparent' }}
              title="Actions admin"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {adminOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 rounded-xl border shadow-xl py-1.5 min-w-[200px]"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <p className="px-3 py-1 text-[10px] uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
                  Admin — Dev
                </p>
                {[
                  { label: grandBatchRunning && grandBatchProgress ? `${grandBatchProgress.current} ${grandBatchProgress.done}/${grandBatchProgress.total}` : '🚀 Grand Batch', action: handleGrandBatch, disabled: anyBusy },
                  { label: batchRunning && batchProgress ? `Fintech ${batchProgress.done}/${batchProgress.total}` : `⚡ Tout scraper (${FINTECH_BRANDS.length})`, action: handleBatchAll, disabled: anyBusy },
                  { label: seedingFintech ? 'Scraping…' : '💳 Fintech ×2', action: handleSeedFintech, disabled: anyBusy },
                  { label: seedingPopular ? 'Scraping…' : '🌍 Populaires', action: handleSeedPopular, disabled: anyBusy },
                  { label: seeding ? 'Enrichissement…' : '✨ Enrichir', action: handleSeed, disabled: anyBusy },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setAdminOpen(false) }}
                    disabled={item.disabled}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted/40 transition-colors disabled:opacity-40"
                    style={{ color: 'var(--text)' }}
                  >
                    {(grandBatchRunning || batchRunning || seedingFintech || seedingPopular || seeding) && (
                      <div className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
                    )}
                    {item.label}
                  </button>
                ))}

                <div className="my-1 border-t" style={{ borderColor: 'var(--border)' }} />

                <button
                  onClick={() => { handleReset(); setAdminOpen(false) }}
                  disabled={anyBusy}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-destructive/10 transition-colors disabled:opacity-40"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 className="h-3 w-3 shrink-0" />
                  Vider le feed
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 — expanded filters (platform + country) */}
        {filtersOpen && (
          <div className="px-4 pb-3 pt-0 space-y-2.5 border-t" style={{ borderColor: 'var(--border)/50' }}>
            {/* Platforms */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest mr-1 shrink-0" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
                Plateforme
              </span>
              {PLATFORMS.map((p) => (
                <FilterChip
                  key={p}
                  active={activePlatform === p}
                  onClick={() => setActivePlatform(p)}
                >
                  {p === 'Tous' ? 'Toutes' : (PLATFORM_SHORT[p] ?? PLATFORM_LABELS[p] ?? p)}
                </FilterChip>
              ))}
            </div>

            {/* Countries */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest mr-1 shrink-0" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
                Pays
              </span>
              {COUNTRIES.map((c) => (
                <FilterChip
                  key={c}
                  active={activeCountry === c}
                  onClick={() => setActiveCountry(c)}
                >
                  {COUNTRY_FLAG[c]}
                </FilterChip>
              ))}
            </div>
          </div>
        )}

        {/* Row 3 — categories */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-4 pb-2.5"
          style={{ paddingTop: filtersOpen ? 0 : undefined }}
        >
          <FilterChip active={activeCategory === null} onClick={() => setActiveCategory(null)}>
            Toutes
          </FilterChip>
          {Object.entries(BRAND_CATEGORIES).map(([key, cat]) => (
            <FilterChip
              key={key}
              active={activeCategory === key}
              onClick={() => { setActiveCategory(activeCategory === key ? null : key); setSearch('') }}
            >
              {cat.icon} {cat.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="p-3">

        {/* Category header */}
        {activeCategory && BRAND_CATEGORIES[activeCategory] && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">{BRAND_CATEGORIES[activeCategory].icon}</span>
            <h2 className="text-sm font-semibold">{BRAND_CATEGORIES[activeCategory].label}</h2>
            <span className="text-xs text-muted-foreground">
              — {BRAND_CATEGORIES[activeCategory].brands.length} marques
            </span>
          </div>
        )}

        {loading && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance]">
            {Array.from({ length: 24 }).map((_, i) => (
              <Skeleton key={i} className="break-inside-avoid mb-2 rounded-xl w-full" style={{ height: `${160 + ((i * 53) % 220)}px` }} />
            ))}
          </div>
        )}

        {!loading && normalized.length > 0 && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance]">
            {normalized.map((ad, i) => (
              <DiscoveryCard
                key={ad.id}
                ad={ad}
                priority={i < 12}
                isSaved={savedAdIds.has(ad.id)}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>
        )}

        {loadingMore && (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2 [column-fill:_balance] mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="break-inside-avoid mb-2 rounded-xl w-full" style={{ height: `${160 + ((i * 47) % 180)}px` }} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />

        {!loading && showScrapeButton && (
          <div className="flex flex-col items-center justify-center py-24 text-center select-none">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5" style={{ background: 'var(--surface-muted)' }}>
              <Compass className="h-7 w-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            </div>
            <h3 className="text-sm font-semibold">Aucune pub pour &ldquo;{search}&rdquo;</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-xs leading-relaxed">
              Recherchez la page Meta correspondante et choisissez celle à scraper.
            </p>
            <Button onClick={() => setShowPagePicker(true)} size="sm" className="gap-2">
              <Search className="h-3.5 w-3.5" />
              Trouver sur Meta
            </Button>
          </div>
        )}

        {showPagePicker && (
          <PagePicker
            query={search}
            onScraped={() => loadAds({ page: 1, reset: true, searchVal: search, platform: activePlatform })}
            onClose={() => setShowPagePicker(false)}
          />
        )}

        {!loading && ads.length === 0 && !showScrapeButton && activeCategory && (
          <div className="flex flex-col items-center justify-center py-24 text-center select-none">
            <div className="text-4xl mb-4">{BRAND_CATEGORIES[activeCategory]?.icon}</div>
            <h3 className="text-sm font-semibold">Aucune pub {BRAND_CATEGORIES[activeCategory]?.label} pour l&apos;instant</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-xs leading-relaxed">
              Enrichissez le feed pour ajouter des publicités de ce secteur.
            </p>
            <Button onClick={handleSeed} disabled={seeding} size="sm" className="gap-2">
              {seeding ? <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {seeding ? 'Enrichissement…' : 'Enrichir le feed'}
            </Button>
          </div>
        )}

        {!loading && ads.length === 0 && !showScrapeButton && !activeCategory && (
          <div className="flex flex-col items-center justify-center py-32 text-center select-none">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5" style={{ background: 'var(--surface-muted)' }}>
              <Sparkles className="h-7 w-7" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            </div>
            <h3 className="text-sm font-semibold">Votre benchmark visuel est vide</h3>
            <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-xs leading-relaxed">
              Enrichissez le feed avec des publicités de marques populaires pour commencer votre veille créative.
            </p>
            <Button onClick={handleSeed} disabled={seeding} size="sm" className="gap-2">
              {seeding ? <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {seeding ? 'Enrichissement…' : 'Enrichir le feed'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
