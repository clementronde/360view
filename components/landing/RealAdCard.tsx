'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { AdPlatform } from '@prisma/client'

export type LandingAd = {
  id: string
  imageUrl: string
  platform: AdPlatform
  title: string | null
  description: string | null
  ctaText: string | null
  advertiserName: string | null
  competitorName: string | null
}

const PLATFORM_BADGE: Record<string, { label: string; bg: string }> = {
  META:      { label: 'Sponsorisé',  bg: 'bg-blue-600' },
  GOOGLE:    { label: 'Annonce',     bg: 'bg-green-700' },
  TIKTOK:    { label: 'TikTok Ads', bg: 'bg-neutral-900' },
  LINKEDIN:  { label: 'Promu',       bg: 'bg-blue-700' },
  SNAPCHAT:  { label: 'Snap Ad',     bg: 'bg-yellow-500' },
  YOUTUBE:   { label: 'Annonce',     bg: 'bg-red-600' },
  PINTEREST: { label: 'Épinglé',     bg: 'bg-red-700' },
  TWITTER:   { label: 'Promu',       bg: 'bg-sky-500' },
  OTHER:     { label: 'Pub',         bg: 'bg-neutral-600' },
}

export function RealAdCard({ ad, className = '' }: { ad: LandingAd; className?: string }) {
  const badge = PLATFORM_BADGE[ad.platform] ?? PLATFORM_BADGE.OTHER
  const brandName = ad.advertiserName ?? ad.competitorName ?? ''

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-white/8 shadow-xl shadow-black/40 bg-[hsl(222_47%_8%)] ${className}`}
      style={{ minWidth: 210 }}
    >
      {/* Vraie image de la pub */}
      <div className="relative h-36 overflow-hidden bg-card">
        <Image
          src={ad.imageUrl}
          alt={ad.title ?? brandName}
          fill
          className="object-cover"
          sizes="210px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className={`absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${badge.bg}`}>
          {badge.label}
        </div>
        {brandName && (
          <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white/80 uppercase tracking-widest">
            {brandName.length > 14 ? brandName.slice(0, 14) + '…' : brandName}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="px-3 py-2.5 space-y-1.5">
        {ad.title && (
          <p className="text-xs font-semibold text-white/90 leading-snug line-clamp-2">
            {ad.title}
          </p>
        )}
        {ad.description && (
          <p className="text-[10px] text-white/40 line-clamp-1">{ad.description}</p>
        )}
        {ad.ctaText && (
          <div className="text-[10px] font-semibold text-center py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 mt-1">
            {ad.ctaText}
          </div>
        )}
      </div>
    </div>
  )
}
