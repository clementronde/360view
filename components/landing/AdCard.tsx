'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export type MockAd = {
  brand: string
  headline: string
  sub: string
  cta: string
  platform: 'META' | 'GOOGLE' | 'TIKTOK' | 'LINKEDIN'
  accentColor: string
  imageId: number   // picsum.photos/id/{imageId}/400/280
}

const PLATFORM_LABELS: Record<MockAd['platform'], { label: string; bg: string }> = {
  META:     { label: 'Sponsorisé',  bg: 'bg-blue-600' },
  GOOGLE:   { label: 'Annonce',     bg: 'bg-green-600' },
  TIKTOK:   { label: 'TikTok Ads', bg: 'bg-neutral-900' },
  LINKEDIN: { label: 'Promu',       bg: 'bg-blue-700' },
}

export function MockAdCard({
  ad,
  className = '',
  delay = 0,
}: {
  ad: MockAd
  className?: string
  delay?: number
}) {
  const badge = PLATFORM_LABELS[ad.platform]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-2xl overflow-hidden border border-white/8 shadow-xl shadow-black/40 bg-[hsl(222_47%_8%)] ${className}`}
      style={{ minWidth: 210 }}
    >
      {/* Ad image */}
      <div className="relative h-36 overflow-hidden">
        <Image
          src={`https://picsum.photos/id/${ad.imageId}/420/280`}
          alt={ad.brand}
          fill
          className="object-cover"
          sizes="210px"
          unoptimized
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Platform badge */}
        <div className={`absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${badge.bg}`}>
          {badge.label}
        </div>
        {/* Brand name bottom left */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{ad.brand}</span>
        </div>
      </div>

      {/* Ad body */}
      <div className="px-3 py-2.5 space-y-2">
        <p className="text-xs font-semibold text-white/90 leading-snug line-clamp-2">{ad.headline}</p>
        <p className="text-[10px] text-white/40 line-clamp-1">{ad.sub}</p>
        <div
          className="text-[10px] font-semibold text-center py-1.5 rounded-lg border mt-1"
          style={{
            color: ad.accentColor,
            borderColor: ad.accentColor + '40',
            background: ad.accentColor + '15',
          }}
        >
          {ad.cta}
        </div>
      </div>
    </motion.div>
  )
}
