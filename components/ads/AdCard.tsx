'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ExternalLink, X, ZoomIn } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_LABELS, PLATFORM_COLORS, formatRelative, getFaviconUrl } from '@/lib/utils'

export interface AdCardProps {
  ad: {
    id: string
    imageUrl: string
    title?: string | null
    description?: string | null
    ctaText?: string | null
    landingUrl?: string | null
    platform: string
    firstSeenAt: Date | string
    competitor: { name: string; website: string; logoUrl?: string | null }
  }
}

export function AdCard({ ad }: AdCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const openLightbox = () => setLightboxOpen(true)
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  useEffect(() => {
    if (!lightboxOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox])

  return (
    <>
      {/* Card */}
      <div
        className="group break-inside-avoid mb-2.5 overflow-hidden rounded-xl border border-border/60 bg-card hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 cursor-zoom-in"
        onClick={openLightbox}
      >
        {/* Creative image */}
        <div className="relative w-full overflow-hidden bg-muted">
          <Image
            src={ad.imageUrl}
            alt={ad.title ?? `Pub ${ad.competitor.name}`}
            width={400}
            height={400}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            unoptimized
          />

          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Platform badge */}
          <div className="absolute top-2 left-2">
            <Badge className={`${PLATFORM_COLORS[ad.platform] ?? PLATFORM_COLORS.OTHER} text-[10px] px-1.5 py-0 backdrop-blur-sm`}>
              {PLATFORM_LABELS[ad.platform] ?? ad.platform}
            </Badge>
          </div>

          {/* Zoom hint — visible on hover */}
          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ZoomIn className="h-3 w-3" />
          </div>

          {/* CTA pill — visible on hover at bottom */}
          {ad.ctaText && (
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="inline-flex items-center rounded-full bg-primary/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {ad.ctaText}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 space-y-1">
          {/* Competitor + date */}
          <div className="flex items-center gap-1.5">
            <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded">
              <Image
                src={ad.competitor.logoUrl ?? getFaviconUrl(ad.competitor.website)}
                alt={ad.competitor.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-[11px] font-medium truncate">{ad.competitor.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground/50 shrink-0 tabular-nums">
              {formatRelative(ad.firstSeenAt)}
            </span>
          </div>

          {ad.title && (
            <p className="text-[11px] font-medium leading-snug line-clamp-2 text-foreground/80">
              {ad.title}
            </p>
          )}

          {ad.description && (
            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
              {ad.description}
            </p>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={closeLightbox}
        >
          {/* Inner panel — click inside does NOT close */}
          <div
            className="relative flex max-w-5xl w-full max-h-[95vh] flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden bg-card border border-border/60 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10 hover:bg-black/60 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Image area */}
            <div className="relative flex-1 min-h-[220px] max-h-[90vw] lg:max-h-[95vh] bg-muted flex items-center justify-center overflow-hidden">
              <Image
                src={ad.imageUrl}
                alt={ad.title ?? `Pub ${ad.competitor.name}`}
                width={900}
                height={900}
                className="max-w-[90vw] max-h-[60vh] lg:max-h-[95vh] object-contain"
                unoptimized
              />
            </div>

            {/* Details sidebar */}
            <div className="flex flex-col gap-4 w-full lg:w-80 shrink-0 p-5 overflow-y-auto">
              {/* Competitor */}
              <div className="flex items-center gap-2">
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded">
                  <Image
                    src={ad.competitor.logoUrl ?? getFaviconUrl(ad.competitor.website)}
                    alt={ad.competitor.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">{ad.competitor.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRelative(ad.firstSeenAt)}</p>
                </div>
              </div>

              {/* Platform badge */}
              <Badge className={`${PLATFORM_COLORS[ad.platform] ?? PLATFORM_COLORS.OTHER} self-start`}>
                {PLATFORM_LABELS[ad.platform] ?? ad.platform}
              </Badge>

              {/* Title */}
              {ad.title && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Titre</p>
                  <p className="text-sm font-medium leading-snug">{ad.title}</p>
                </div>
              )}

              {/* Description */}
              {ad.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ad.description}</p>
                </div>
              )}

              {/* CTA */}
              {ad.ctaText && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">CTA</p>
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
                    {ad.ctaText}
                  </span>
                </div>
              )}

              {/* External link */}
              {ad.landingUrl && (
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
