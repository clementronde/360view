'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_LABELS, PLATFORM_COLORS, formatRelative, getFaviconUrl, getOptimizedImageUrl } from '@/lib/utils'
import type { FeedAd } from '@/actions/ads'

interface DiscoveryCardProps {
  ad: FeedAd & { competitor: { name: string; website: string; logoUrl: string | null } }
  priority?: boolean
}

export function DiscoveryCard({ ad, priority = false }: DiscoveryCardProps) {
  const [open, setOpen] = useState(false)

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

  const faviconSrc = ad.competitor.logoUrl ?? getFaviconUrl(ad.competitor.website)
  const thumbSrc = getOptimizedImageUrl(ad.imageUrl, 400, 75)

  return (
    <>
      {/* Pinterest card — image only */}
      <div
        className="group break-inside-avoid mb-2 cursor-zoom-in overflow-hidden rounded-xl relative"
        onClick={() => setOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={ad.title ?? ad.competitor.name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

        {/* Platform badge — top left, hidden until hover */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Badge className={`${PLATFORM_COLORS[ad.platform] ?? PLATFORM_COLORS.OTHER} text-[10px] px-1.5 py-0 backdrop-blur-sm border-0`}>
            {PLATFORM_LABELS[ad.platform] ?? ad.platform}
          </Badge>
        </div>

        {/* Brand — bottom, hidden until hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconSrc}
              alt={ad.competitor.name}
              className="h-4 w-4 rounded object-contain bg-white/10"
            />
            <span className="text-white text-[11px] font-semibold truncate drop-shadow">
              {ad.competitor.name}
            </span>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
          onClick={close}
        >
          <div
            className="relative flex max-w-4xl w-full max-h-[92vh] rounded-2xl overflow-hidden bg-card border border-border/50 shadow-2xl"
            style={{ flexDirection: 'row' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10 hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image */}
            <div className="flex-1 min-w-0 bg-black flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOptimizedImageUrl(ad.imageUrl, 1200, 85)}
                alt={ad.title ?? ad.competitor.name}
                className="max-h-[92vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Details */}
            <div className="w-64 shrink-0 flex flex-col gap-4 p-5 overflow-y-auto border-l border-border/40">
              {/* Brand */}
              <div className="flex items-center gap-2 pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconSrc} alt={ad.competitor.name} className="h-6 w-6 rounded object-contain" />
                <div>
                  <p className="text-sm font-semibold leading-tight">{ad.competitor.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRelative(ad.firstSeenAt)}</p>
                </div>
              </div>

              <Badge className={`${PLATFORM_COLORS[ad.platform] ?? PLATFORM_COLORS.OTHER} self-start`}>
                {PLATFORM_LABELS[ad.platform] ?? ad.platform}
              </Badge>

              {ad.title && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Titre</p>
                  <p className="text-sm font-medium leading-snug">{ad.title}</p>
                </div>
              )}

              {ad.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ad.description}</p>
                </div>
              )}

              {ad.ctaText && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">CTA</p>
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
                    {ad.ctaText}
                  </span>
                </div>
              )}

              {ad.landingUrl && ad.landingUrl !== '#' && (
                <a
                  href={ad.landingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir l&apos;annonce originale
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
