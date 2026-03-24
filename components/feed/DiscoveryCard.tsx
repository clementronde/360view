'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink, Calendar, Flame, Monitor, Loader2, Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'
import { PLATFORM_LABELS, formatRelative, getFaviconUrl, getOptimizedImageUrl } from '@/lib/utils'
import { captureAdLandingPage } from '@/actions/landingCapture'
import { toggleSaveAd } from '@/actions/savedAds'
import type { FeedAd } from '@/actions/ads'

interface DiscoveryCardProps {
  ad: FeedAd & { competitor: { name: string; website: string; logoUrl: string | null } }
  priority?: boolean
  isSaved?: boolean
  onSaveToggle?: (adId: string, saved: boolean) => void
}

export function DiscoveryCard({ ad, priority = false, isSaved, onSaveToggle }: DiscoveryCardProps) {
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [landingUrl, setLandingUrl] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [saved, setSaved] = useState(isSaved ?? false)

  useEffect(() => {
    setSaved(isSaved ?? false)
  }, [isSaved])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close])

  async function handleCaptureLanding() {
    if (capturing || !ad.landingUrl || ad.landingUrl === '#') return
    setCapturing(true)
    const toastId = toast.loading('Capture de la landing page…')
    const res = await captureAdLandingPage(ad.id)
    setCapturing(false)
    if (res.error) { toast.error(res.error, { id: toastId }); return }
    if (res.imageUrl) {
      setLandingUrl(res.imageUrl)
      toast.success('Landing page capturée', { id: toastId })
    }
  }

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    const result = await toggleSaveAd(ad.id)
    if (result.error) { toast.error(result.error); return }
    setSaved(result.saved)
    onSaveToggle?.(ad.id, result.saved)
    toast.success(result.saved ? 'Pub sauvegardée' : 'Pub retirée des favoris')
  }

  const faviconSrc = ad.competitor.logoUrl ?? getFaviconUrl(ad.competitor.website)
  const thumbSrc = getOptimizedImageUrl(ad.imageUrl, 400, 75)
  const isNew = Date.now() - new Date(ad.firstSeenAt).getTime() < 15 * 60 * 1000
  const isTrending = (ad.activeDays ?? 0) >= 14 // ad running for 14+ days = proven performer

  if (imgError) return null

  return (
    <>
      {/* Pinterest card */}
      <div
        className="group break-inside-avoid mb-2 cursor-zoom-in overflow-hidden rounded-2xl relative bg-muted/20"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={ad.title ?? ad.competitor.name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.04] rounded-2xl"
        />

        {/* Badge top-left: NEW or 🔥 trending */}
        {(isNew || isTrending) && (
          <div className="absolute top-2.5 left-2.5 z-10">
            {isNew ? (
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] uppercase"
                style={{ fontFamily: 'var(--font-jetbrains-mono)', background: 'var(--accent)', color: '#fff', borderRadius: 3 }}
              >
                NEW
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em]"
                style={{ fontFamily: 'var(--font-jetbrains-mono)', background: 'rgba(239,68,68,0.85)', color: '#fff', borderRadius: 3, backdropFilter: 'blur(4px)' }}
                title={`Pub active depuis ${ad.activeDays} jours`}
              >
                <Flame className="h-2.5 w-2.5" />
                {ad.activeDays}j
              </span>
            )}
          </div>
        )}

        {/* Bookmark button — top right, always visible */}
        <button
          onClick={handleSave}
          className="absolute top-2.5 right-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150"
          style={{
            background: saved ? 'var(--accent)' : 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            border: saved ? 'none' : '1px solid rgba(255,255,255,0.15)',
          }}
          title={saved ? 'Retirer des favoris' : 'Sauvegarder'}
        >
          {saved
            ? <BookmarkCheck className="h-3.5 w-3.5 text-white" />
            : <Bookmark className="h-3.5 w-3.5 text-white" />
          }
        </button>

        {/* Brand info — bottom, appears on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconSrc}
              alt={ad.competitor.name}
              className="h-5 w-5 rounded object-contain shrink-0"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            />
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate drop-shadow leading-tight">
                {ad.competitor.name}
              </p>
              {ad.title && (
                <p className="text-[10px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {ad.title}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
          onClick={close}
        >
          <div
            className="relative flex max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden bg-card border border-border/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white border border-white/10 hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image panel */}
            <div className="flex-1 min-w-0 bg-black/90 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOptimizedImageUrl(ad.imageUrl, 1200, 85)}
                alt={ad.title ?? ad.competitor.name}
                className="max-h-[90vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Details panel */}
            <div className="w-72 shrink-0 flex flex-col gap-5 p-6 overflow-y-auto border-l border-border/40">
              {/* Brand */}
              <div className="flex items-center gap-3 pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faviconSrc}
                  alt={ad.competitor.name}
                  className="h-8 w-8 rounded-lg object-contain border border-border/40 bg-muted/30 p-0.5"
                />
                <div>
                  <p className="text-sm font-semibold leading-tight">{ad.competitor.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{formatRelative(ad.firstSeenAt)}</p>
                  </div>
                </div>
              </div>

              {/* Platform + active days */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center px-2 py-1 text-[10px] font-medium tracking-[0.06em] uppercase"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)', background: 'var(--accent-subtle)', color: 'var(--accent)', borderRadius: 3 }}
                >
                  {PLATFORM_LABELS[ad.platform] ?? ad.platform}
                </span>
                {(ad.activeDays ?? 0) > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium"
                    style={{
                      background: (ad.activeDays ?? 0) >= 14 ? 'rgba(239,68,68,0.12)' : 'var(--surface-muted)',
                      color: (ad.activeDays ?? 0) >= 14 ? '#ef4444' : 'var(--text-muted)',
                      borderRadius: 3,
                    }}
                  >
                    {(ad.activeDays ?? 0) >= 14 && <Flame className="h-3 w-3" />}
                    {ad.activeDays}j actif
                  </span>
                )}
              </div>

              {/* Save button */}
              <button
                onClick={() => {
                  setSaved(!saved)
                  toggleSaveAd(ad.id).then((r) => {
                    if (!r.error) {
                      setSaved(r.saved)
                      onSaveToggle?.(ad.id, r.saved)
                      toast.success(r.saved ? 'Pub sauvegardée' : 'Pub retirée des favoris')
                    } else {
                      setSaved(saved)
                      toast.error(r.error)
                    }
                  })
                }}
                className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-colors border"
                style={{
                  borderColor: saved ? 'var(--accent)' : 'var(--border)',
                  background: saved ? 'var(--accent-subtle)' : 'var(--surface-muted)',
                  color: saved ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                {saved ? 'Sauvegardé' : 'Sauvegarder'}
              </button>

              {/* Title */}
              {ad.title && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
                    Titre
                  </p>
                  <p className="text-sm font-semibold leading-snug">{ad.title}</p>
                </div>
              )}

              {/* Description */}
              {ad.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>Description</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ad.description}</p>
                </div>
              )}

              {/* CTA */}
              {ad.ctaText && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>Call to action</p>
                  <span
                    className="inline-flex items-center px-3 py-1 text-xs font-medium"
                    style={{
                      borderLeft: '2px solid var(--accent)',
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                      borderRadius: '0 3px 3px 0',
                    }}
                  >
                    {ad.ctaText}
                  </span>
                </div>
              )}

              {/* Landing page capture */}
              {ad.landingUrl && ad.landingUrl !== '#' && (
                <div className="space-y-2 mt-auto">
                  {landingUrl ? (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
                        Landing page
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={landingUrl}
                        alt="Landing page"
                        className="w-full rounded-lg border object-cover"
                        style={{ borderColor: 'var(--border)', maxHeight: 140 }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCaptureLanding() }}
                      disabled={capturing}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition-colors disabled:opacity-50"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)', color: 'var(--text-muted)' }}
                    >
                      {capturing
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Monitor className="h-3.5 w-3.5 shrink-0" />
                      }
                      {capturing ? 'Capture en cours…' : 'Capturer la landing page'}
                    </button>
                  )}

                  <a
                    href={ad.landingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    Voir l&apos;annonce originale
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
