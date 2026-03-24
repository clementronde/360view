'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Compass,
  Users2,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Search,
  Brain,
  Eye,
} from 'lucide-react'

/* ─── Types ─── */
export type DemoAdData = {
  id: string
  platform: string
  title: string | null
  advertiserName: string | null
  imageUrl: string | null
  ctaText: string | null
}

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { Icon: LayoutDashboard, label: 'Tableau de bord', active: false },
  { Icon: Compass,         label: 'Découvrir',       active: false },
  { Icon: Users2,          label: 'Concurrents',     active: false },
  { Icon: ImageIcon,       label: 'Ads',             active: true  },
  { Icon: Mail,            label: 'Emails',          active: false },
  { Icon: MessageSquare,   label: 'SMS',             active: false },
  { Icon: Search,          label: 'SEO',             active: false },
  { Icon: Brain,           label: 'LLM Visibility',  active: false },
]

/* ─── Filter tabs ─── */
const PLATFORMS = ['Tous', 'META', 'GOOGLE', 'TIKTOK', 'LINKEDIN']

/* ─── CSS fallback ad cards ─── */
type ShapeType = 'ring' | 'bars' | 'triangle' | 'circle' | 'rotated-square' | 'wave' | 'dots'

type AdCard = {
  brand: string
  platform: string
  isNew: boolean
  headline: string
  sub: string
  cta: string
  accent: string
  bg: string
  shape: ShapeType
}

const AD_CARDS: AdCard[] = [
  {
    brand: 'Nike', platform: 'META', isNew: true,
    headline: 'Just Do It.',
    sub: 'Collection Running 2025',
    cta: 'Shop Now',
    accent: '#C8FF00',
    bg: 'linear-gradient(135deg,#0a0a0a 0%,#1a1f35 100%)',
    shape: 'ring',
  },
  {
    brand: 'Adidas', platform: 'GOOGLE', isNew: false,
    headline: 'Impossible is Nothing',
    sub: 'Ultraboost 24',
    cta: 'Découvrir',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg,#0c1828 0%,#0d2c4a 100%)',
    shape: 'bars',
  },
  {
    brand: 'Puma', platform: 'TIKTOK', isNew: false,
    headline: 'Run the Streets',
    sub: 'Velocity Nitro 3',
    cta: 'Get it',
    accent: '#fb923c',
    bg: 'linear-gradient(135deg,#1a0a00 0%,#3d1800 100%)',
    shape: 'triangle',
  },
  {
    brand: 'Decathlon', platform: 'META', isNew: true,
    headline: 'Sport pour tous',
    sub: '-40% vélos',
    cta: "Voir l'offre",
    accent: '#22d3ee',
    bg: 'linear-gradient(135deg,#00254d 0%,#003a75 100%)',
    shape: 'circle',
  },
  {
    brand: 'H&M', platform: 'PINTEREST', isNew: false,
    headline: 'Nouvelle saison',
    sub: 'Printemps 2025',
    cta: 'Explorer',
    accent: '#f9a8d4',
    bg: 'linear-gradient(135deg,#2d0a14 0%,#4a1020 100%)',
    shape: 'rotated-square',
  },
  {
    brand: 'Zara', platform: 'YOUTUBE', isNew: false,
    headline: 'New In',
    sub: 'Minimal. Élégant.',
    cta: 'Voir',
    accent: '#d4d4d4',
    bg: 'linear-gradient(135deg,#111111 0%,#1e1e1e 100%)',
    shape: 'wave',
  },
  {
    brand: 'Nike', platform: 'GOOGLE', isNew: true,
    headline: 'Air Max 270',
    sub: 'Confort & Style',
    cta: 'Acheter',
    accent: '#f59e0b',
    bg: 'linear-gradient(135deg,#0d0d0d 0%,#1a1a2e 100%)',
    shape: 'dots',
  },
  {
    brand: 'Lacoste', platform: 'META', isNew: false,
    headline: "Un peu d'air",
    sub: 'Polo Classic',
    cta: 'Découvrir',
    accent: '#4ade80',
    bg: 'linear-gradient(135deg,#003820 0%,#004d2c 100%)',
    shape: 'ring',
  },
  {
    brand: 'Adidas', platform: 'TIKTOK', isNew: true,
    headline: '3 Stripes Forever',
    sub: 'Originals 2025',
    cta: 'Shop',
    accent: '#a78bfa',
    bg: 'linear-gradient(135deg,#0a0a14 0%,#12122a 100%)',
    shape: 'triangle',
  },
  {
    brand: 'Sephora', platform: 'LINKEDIN', isNew: false,
    headline: 'Le luxe accessible',
    sub: 'Marques exclusives',
    cta: 'Explorer',
    accent: '#e879f9',
    bg: 'linear-gradient(135deg,#1a0020 0%,#2d0036 100%)',
    shape: 'circle',
  },
]

/* ─── Ad shape decorations ─── */
function AdShape({ shape, accent }: { shape: ShapeType; accent: string }) {
  const base = { position: 'absolute' as const }

  if (shape === 'ring') return (
    <div style={{ ...base, top: -22, right: -22, width: 100, height: 100, borderRadius: 9999, border: `16px solid ${accent}`, opacity: 0.17 }} />
  )
  if (shape === 'bars') return (
    <div style={{ ...base, top: 10, right: 10, display: 'flex', flexDirection: 'column' as const, gap: 5, opacity: 0.18 }}>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: accent }} />
      <div style={{ width: 36, height: 4, borderRadius: 2, background: accent }} />
      <div style={{ width: 56, height: 4, borderRadius: 2, background: accent }} />
    </div>
  )
  if (shape === 'triangle') return (
    <div style={{ ...base, top: 8, right: 8, width: 0, height: 0, borderLeft: '36px solid transparent', borderRight: '36px solid transparent', borderBottom: `64px solid ${accent}`, opacity: 0.16 }} />
  )
  if (shape === 'circle') return (
    <div style={{ ...base, top: -28, right: -28, width: 100, height: 100, borderRadius: 9999, background: accent, opacity: 0.18 }} />
  )
  if (shape === 'rotated-square') return (
    <div style={{ ...base, top: 8, right: -12, width: 62, height: 62, borderRadius: 6, background: accent, transform: 'rotate(22deg)', opacity: 0.17 }} />
  )
  if (shape === 'wave') return (
    <svg style={{ ...base, top: 0, right: 0, width: 88, height: 70, opacity: 0.18 }} viewBox="0 0 88 70" fill="none">
      <path d="M4 50 Q22 20 40 40 Q58 60 76 30" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M4 65 Q22 35 40 55 Q58 75 76 45" stroke={accent} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  )
  if (shape === 'dots') return (
    <div style={{ ...base, top: 10, right: 10, display: 'grid', gridTemplateColumns: 'repeat(3,7px)', gap: 4, opacity: 0.18 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: 9999, background: accent }} />
      ))}
    </div>
  )
  return null
}

/* ─── Background card data (6×5 = 30 cards) ─── */
const BG_CARDS = [
  { bg: 'linear-gradient(135deg,#0a0a0a,#1a1f35)', accent: '#C8FF00', headline: 'Just Do It.', brand: 'Nike' },
  { bg: 'linear-gradient(135deg,#0c1828,#0d2c4a)', accent: '#38bdf8', headline: 'Impossible is Nothing', brand: 'Adidas' },
  { bg: 'linear-gradient(135deg,#1a0a00,#3d1800)', accent: '#fb923c', headline: 'Run the Streets', brand: 'Puma' },
  { bg: 'linear-gradient(135deg,#00254d,#003a75)', accent: '#22d3ee', headline: 'Sport pour tous', brand: 'Decathlon' },
  { bg: 'linear-gradient(135deg,#2d0a14,#4a1020)', accent: '#f9a8d4', headline: 'Nouvelle saison', brand: 'H&M' },
  { bg: 'linear-gradient(135deg,#111111,#1e1e1e)', accent: '#d4d4d4', headline: 'New Collection', brand: 'Zara' },
  { bg: 'linear-gradient(135deg,#003820,#004d2c)', accent: '#4ade80', headline: "Un peu d'air", brand: 'Lacoste' },
  { bg: 'linear-gradient(135deg,#0a0a14,#12122a)', accent: '#a78bfa', headline: '3 Stripes Forever', brand: 'Adidas' },
  { bg: 'linear-gradient(135deg,#1a0020,#2d0036)', accent: '#e879f9', headline: 'Le luxe accessible', brand: 'Sephora' },
  { bg: 'linear-gradient(135deg,#0d0d0d,#1a1a2e)', accent: '#f59e0b', headline: 'Air Max 270', brand: 'Nike' },
  { bg: 'linear-gradient(135deg,#1a1400,#2e2400)', accent: '#facc15', headline: 'Be Bold', brand: 'Under Armour' },
  { bg: 'linear-gradient(135deg,#0f0f0f,#1c1c1c)', accent: '#e5e5e5', headline: 'Move in Style', brand: 'Lululemon' },
  { bg: 'linear-gradient(135deg,#0a1a0a,#0f2b0f)', accent: '#86efac', headline: 'Sport. Nature.', brand: 'Salomon' },
  { bg: 'linear-gradient(135deg,#1a0505,#2e0a0a)', accent: '#fca5a5', headline: 'Racing Spirit', brand: 'New Balance' },
  { bg: 'linear-gradient(135deg,#05050a,#0a0a1e)', accent: '#93c5fd', headline: 'Fly Higher', brand: 'Asics' },
  { bg: 'linear-gradient(135deg,#0a0a0a,#1a1f35)', accent: '#C8FF00', headline: 'Just Win.', brand: 'Nike' },
  { bg: 'linear-gradient(135deg,#0c1828,#0d2c4a)', accent: '#38bdf8', headline: 'Born to Run', brand: 'Adidas' },
  { bg: 'linear-gradient(135deg,#1a0a00,#3d1800)', accent: '#fb923c', headline: 'Forever Faster', brand: 'Puma' },
  { bg: 'linear-gradient(135deg,#00254d,#003a75)', accent: '#22d3ee', headline: '-40% vélos', brand: 'Decathlon' },
  { bg: 'linear-gradient(135deg,#2d0a14,#4a1020)', accent: '#f9a8d4', headline: 'Printemps 2025', brand: 'H&M' },
  { bg: 'linear-gradient(135deg,#111111,#1e1e1e)', accent: '#d4d4d4', headline: 'Minimal.', brand: 'Zara' },
  { bg: 'linear-gradient(135deg,#003820,#004d2c)', accent: '#4ade80', headline: 'Polo Classic', brand: 'Lacoste' },
  { bg: 'linear-gradient(135deg,#0a0a14,#12122a)', accent: '#a78bfa', headline: 'Originals 2025', brand: 'Adidas' },
  { bg: 'linear-gradient(135deg,#1a0020,#2d0036)', accent: '#e879f9', headline: 'Marques exclusives', brand: 'Sephora' },
  { bg: 'linear-gradient(135deg,#0d0d0d,#1a1a2e)', accent: '#f59e0b', headline: 'Confort & Style', brand: 'Nike' },
  { bg: 'linear-gradient(135deg,#1a1400,#2e2400)', accent: '#facc15', headline: 'Train Harder', brand: 'Under Armour' },
  { bg: 'linear-gradient(135deg,#0f0f0f,#1c1c1c)', accent: '#e5e5e5', headline: 'Flow State', brand: 'Lululemon' },
  { bg: 'linear-gradient(135deg,#0a1a0a,#0f2b0f)', accent: '#86efac', headline: 'Trail Running', brand: 'Salomon' },
  { bg: 'linear-gradient(135deg,#1a0505,#2e0a0a)', accent: '#fca5a5', headline: '530 Classic', brand: 'New Balance' },
  { bg: 'linear-gradient(135deg,#05050a,#0a0a1e)', accent: '#93c5fd', headline: 'Gel-Kayano 31', brand: 'Asics' },
]

/* ─── Background scroll constants ─── */
const BG_COLS    = 6
const BG_PER_COL = 5   // cards per set per column
const BG_FALLBACK_H = 180  // height only for CSS-art fallback cards
const BG_GAP        = 2
// Generous estimate for seamless loop (natural image heights ~280px avg × 5 + gaps)
const BG_LOOP_H     = 1440

function BgCard({ card, realAd }: { card: typeof BG_CARDS[0]; realAd: DemoAdData | null }) {
  if (realAd?.imageUrl) {
    return (
      <div style={{ borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={realAd.imageUrl}
          alt={realAd.advertiserName ?? ''}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          loading="lazy"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
        {realAd.platform && (
          <div style={{ position: 'absolute', top: 6, left: 6, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 7, color: 'rgba(255,255,255,0.65)', background: 'rgba(0,0,0,0.5)', padding: '2px 5px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {realAd.platform}
          </div>
        )}
      </div>
    )
  }

  // CSS-art fallback
  return (
    <div style={{ background: card.bg, height: BG_FALLBACK_H, borderRadius: 6, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, zIndex: 2 }}>
        <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 7, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{card.brand}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{card.headline}</div>
      </div>
    </div>
  )
}

/* ─── Background grid: 6 scrolling columns ─── */
function BackgroundGrid({ ads }: { ads: DemoAdData[] }) {
  const DURATIONS = [55, 40, 48, 45, 42, 58]

  return (
    <div style={{ display: 'flex', gap: BG_GAP, padding: BG_GAP, userSelect: 'none', pointerEvents: 'none', height: '100%' }}>
      {Array.from({ length: BG_COLS }, (_, col) => {
        const dir = col % 2 === 0 ? 'bg-scroll-up' : 'bg-scroll-down'
        const colItems = Array.from({ length: BG_PER_COL }, (_, row) => {
          const idx = col + row * BG_COLS
          return { card: BG_CARDS[idx % BG_CARDS.length], realAd: ads.length > 0 ? ads[idx % ads.length] : null }
        })
        return (
          <div key={col} style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: BG_GAP, animation: `${dir} ${DURATIONS[col]}s linear infinite` }}>
              {/* Two sets for seamless loop */}
              {[...colItems, ...colItems].map(({ card, realAd }, i) => (
                <BgCard key={i} card={card} realAd={realAd} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── H1 word config ─── */
const H1_WORDS = [
  { text: 'Vos',          accent: false, break: false },
  { text: 'concurrents',  accent: false, break: false },
  { text: 'bougent.',     accent: false, break: true  },
  { text: 'Soyez',        accent: true,  break: false },
  { text: 'le',           accent: true,  break: false },
  { text: 'premier',      accent: true,  break: true  },
  { text: 'à',            accent: false, break: false },
  { text: 'le',           accent: false, break: false },
  { text: 'savoir.',      accent: false, break: false },
]

/* ─── Framer spring mockup ─── */
const springMockup = {
  hidden:  { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 80, damping: 20, delay: 0.5 },
  },
}

/* ═══════════════════════════════════════════
   HERO COMPONENT
═══════════════════════════════════════════ */
export function Hero({ demoAds }: { demoAds: DemoAdData[] }) {
  const [mounted, setMounted] = useState<boolean>(false)
  const [scanY, setScanY] = useState<number>(0)
  const [scanVisible, setScanVisible] = useState<boolean>(false)

  /* Mount delay for ad cards */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 900)
    return () => clearTimeout(t)
  }, [])

  /* Scan line animation */
  useEffect(() => {
    const id = setInterval(() => {
      setScanVisible(true)
      setScanY(0)
      const start = Date.now()
      const raf = () => {
        const p = Math.min((Date.now() - start) / 1500, 1)
        setScanY(p * 100)
        if (p < 1) {
          requestAnimationFrame(raf)
        } else {
          setTimeout(() => setScanVisible(false), 200)
        }
      }
      requestAnimationFrame(raf)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  /* Display ads: real if available, fallback to CSS-art */
  const displayAds = demoAds.length > 0 ? demoAds.slice(0, 10) : null

  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Scrolling ads background — suction/magnet effect */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          opacity: 0.07,
          /* Sharp mask: pop-in at top, sucked out at bottom */
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 80%, transparent 100%)',
          pointerEvents: 'none',
          /* 3D perspective — creates depth/suction tunnel illusion */
        }}
      >
        <BackgroundGrid ads={demoAds} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* Centered text block */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: 720,
            margin: '0 auto',
            padding: '100px 48px 64px',
          }}
        >

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="inline-flex items-center gap-2 mb-8"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.09em',
              color: 'var(--text-muted)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: 9999,
                background: 'var(--success)',
                animation: 'pulse-dot 2.4s ease-in-out infinite',
              }}
            />
            Surveillance active — 5 canaux
          </motion.div>

          {/* H1 word-by-word animation */}
          <h1
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: 'var(--text)',
              marginBottom: 24,
            }}
          >
            {H1_WORDS.map((word, i) => (
              <React.Fragment key={i}>
                <motion.span
                  initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 1.2, delay: 0.1 + i * 0.09 }}
                  style={{
                    display: 'inline-block',
                    color: word.accent ? 'var(--accent)' : 'inherit',
                    marginRight: '0.25em',
                  }}
                >
                  {word.text}
                </motion.span>
                {word.break && <br />}
              </React.Fragment>
            ))}
          </h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            style={{
              fontSize: 17,
              lineHeight: 1.65,
              color: 'var(--text-muted)',
              maxWidth: 440,
              margin: '0 auto 40px',
            }}
          >
            Veille automatique sur 5 canaux. Alertes instantanées. Aucune configuration manuelle.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.05 }}
            className="flex items-center justify-center gap-3"
          >
            <Link
              href="/sign-up"
              className="text-[15px] font-semibold px-6 py-3 rounded-lg text-white transition-all duration-150"
              style={{ background: 'var(--accent)' }}
            >
              Commencer gratuitement
            </Link>
            <Link
              href="#fonctionnalites"
              className="text-[15px] font-medium px-6 py-3 rounded-lg border transition-colors duration-150"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Voir les fonctionnalités
            </Link>
          </motion.div>
        </div>

        {/* App mockup */}
        <motion.div
          aria-hidden="true"
          className="mx-auto max-w-[1100px] px-12"
          initial="hidden"
          animate="visible"
          variants={springMockup}
          style={{ paddingBottom: 0 }}
        >
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 48px 96px rgba(0,0,0,0.14), 0 8px 28px rgba(0,0,0,0.07)',
            }}
          >
            {/* Browser chrome bar */}
            <div
              className="flex items-center px-4 py-2.5"
              style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex gap-1.5 mr-4">
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#EF4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#F59E0B' }} />
                <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#22C55E' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                spymark.io/dashboard/ads
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: 'var(--success)',
                    display: 'inline-block',
                    animation: 'pulse-dot 2.4s ease-in-out infinite',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--success)' }}>Live</span>
              </div>
            </div>

            {/* App body: 48px sidebar + main content */}
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr' }}>

              {/* Mini sidebar */}
              <div
                style={{
                  borderRight: '1px solid var(--border)',
                  background: 'var(--surface-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 12,
                  paddingBottom: 12,
                  gap: 2,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    flexShrink: 0,
                  }}
                >
                  <Eye size={14} color="#fff" />
                </div>

                {NAV_ITEMS.map(({ Icon, label, active }) => (
                  <div
                    key={label}
                    title={label}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-muted)',
                      cursor: 'default',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} />
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ padding: '16px 18px', minHeight: 520, position: 'relative' }}>

                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    Galerie publicitaire
                  </span>
                  <div
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      cursor: 'default',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Lancer le scraping
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 mb-4">
                  {PLATFORMS.map((p, i) => (
                    <div
                      key={p}
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '3px 8px',
                        borderRadius: 4,
                        cursor: 'default',
                        background: i === 0 ? 'var(--accent)' : 'transparent',
                        color: i === 0 ? '#fff' : 'var(--text-muted)',
                        border: i === 0 ? '1px solid transparent' : '1px solid var(--border)',
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>

                {/* Ad gallery */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 6,
                    alignItems: 'end',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Scan line */}
                  {scanVisible && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${scanY}%`,
                        height: 2,
                        background: 'var(--accent)',
                        opacity: 0.6,
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {displayAds
                    ? displayAds.map((ad, i) => {
                        const h = i % 2 === 0 ? 145 : 165
                        const fallback = AD_CARDS[i % AD_CARDS.length]
                        const bgStyle = ad.imageUrl
                          ? { background: `url(${ad.imageUrl}) center/cover no-repeat` }
                          : { background: fallback.bg }
                        return (
                          <motion.div
                            key={ad.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              ...bgStyle,
                              borderRadius: 8,
                              height: h,
                            }}
                          >
                            {/* Gradient overlay for image ads */}
                            {ad.imageUrl && (
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 50%)',
                                  zIndex: 1,
                                }}
                              />
                            )}
                            {/* Platform chip */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                fontFamily: 'var(--font-jetbrains-mono)',
                                fontSize: 7,
                                color: 'rgba(255,255,255,0.65)',
                                background: 'rgba(0,0,0,0.50)',
                                padding: '2px 5px',
                                borderRadius: 2,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                zIndex: 2,
                              }}
                            >
                              {ad.platform}
                            </div>
                            {/* NEW chip */}
                            {i < 2 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  fontFamily: 'var(--font-jetbrains-mono)',
                                  fontSize: 7,
                                  color: '#fff',
                                  background: '#4F6EF7',
                                  padding: '2px 5px',
                                  borderRadius: 2,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  zIndex: 2,
                                }}
                              >
                                NEW
                              </div>
                            )}
                            {/* Content */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: 8,
                                zIndex: 2,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'rgba(255,255,255,0.9)',
                                  lineHeight: 1.2,
                                  marginBottom: 3,
                                }}
                              >
                                {ad.title ?? fallback.headline}
                              </div>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: fallback.accent,
                                  borderRadius: 2,
                                  padding: '2px 7px',
                                }}
                              >
                                <span style={{ fontSize: 8, fontWeight: 700, color: '#000' }}>
                                  {ad.ctaText ?? 'Voir'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    : AD_CARDS.map((ad, i) => {
                        const h = i % 2 === 0 ? 145 : 165
                        return (
                          <motion.div
                            key={`${ad.brand}-${ad.platform}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              background: ad.bg,
                              borderRadius: 8,
                              height: h,
                            }}
                          >
                            <AdShape shape={ad.shape} accent={ad.accent} />

                            {/* Platform chip */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                fontFamily: 'var(--font-jetbrains-mono)',
                                fontSize: 7,
                                color: 'rgba(255,255,255,0.65)',
                                background: 'rgba(0,0,0,0.50)',
                                padding: '2px 5px',
                                borderRadius: 2,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                zIndex: 2,
                              }}
                            >
                              {ad.platform}
                            </div>

                            {/* NEW chip */}
                            {ad.isNew && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  fontFamily: 'var(--font-jetbrains-mono)',
                                  fontSize: 7,
                                  color: '#fff',
                                  background: '#4F6EF7',
                                  padding: '2px 5px',
                                  borderRadius: 2,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  zIndex: 2,
                                }}
                              >
                                NEW
                              </div>
                            )}

                            {/* Bottom gradient overlay */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 50%)',
                                zIndex: 1,
                              }}
                            />

                            {/* Content */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: 8,
                                zIndex: 2,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: '#fff',
                                  letterSpacing: '-0.01em',
                                  marginBottom: 1,
                                }}
                              >
                                {ad.brand}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'rgba(255,255,255,0.9)',
                                  lineHeight: 1.2,
                                  marginBottom: 3,
                                }}
                              >
                                {ad.headline}
                              </div>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: ad.accent,
                                  borderRadius: 2,
                                  padding: '2px 7px',
                                }}
                              >
                                <span style={{ fontSize: 8, fontWeight: 700, color: '#000' }}>
                                  {ad.cta}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                  }
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes bg-scroll-up {
          from { transform: translateY(0px); }
          to   { transform: translateY(-${BG_LOOP_H}px); }
        }
        @keyframes bg-scroll-down {
          from { transform: translateY(-${BG_LOOP_H}px); }
          to   { transform: translateY(0px); }
        }
      `}</style>
    </section>
  )
}
