'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

/* ─── Types ─── */
type DemoAdData = {
  id: string
  platform: string
  title: string | null
  advertiserName: string | null
  imageUrl: string | null
  ctaText: string | null
}

/* ─── LLM data ─── */
const LLM = [
  { label: 'Nike',    score: 84, color: '#4F6EF7', you: false },
  { label: 'Adidas',  score: 67, color: '#1A7A52', you: false },
  { label: 'Vous',    score: 52, color: '#4F6EF7', you: true  },
  { label: 'Puma',    score: 38, color: '#C2410C', you: false },
  { label: 'Sephora', score: 29, color: '#6F6C66', you: false },
]

/* ─── SEO diffs ─── */
const SEO = [
  {
    url: 'nike.com',
    field: 'Title tag',
    old: 'Chaussures de sport | Nike FR',
    next: 'Nike — Just Do It | Collection Officielle',
    time: '2h',
  },
  {
    url: 'adidas.fr',
    field: 'Meta description',
    old: 'Découvrez notre collection de vêtements de sport…',
    next: 'Nouvelles collections printemps-été 2025 maintenant disponibles.',
    time: '5h',
  },
  {
    url: 'puma.com',
    field: 'H1',
    old: 'Chaussures Running Femme',
    next: 'Running Femme — Légèreté & Performance',
    time: '1j',
  },
]

/* ─── Fake emails cycling in EmailSmsSection ─── */
const FAKE_EMAILS = [
  { from: 'Puma',    sub: 'Flash Sale 24h — -40%',    badge: 'NOUVEAU' },
  { from: 'Nike',    sub: 'Dernières heures : Air Max', badge: 'NOUVEAU' },
  { from: 'Lacoste', sub: 'Nouvelle collection été',   badge: 'NOUVEAU' },
  { from: 'Adidas',  sub: 'Offre exclusive membres',   badge: 'NOUVEAU' },
]

/* ─── Fake SMS cycling ─── */
const FAKE_SMS = [
  { brand: 'Puma',      text: 'Flash Sale 24h — -30% sur tout le site' },
  { brand: 'Nike',      text: 'Dernière chance : Air Jordan 1 dispo' },
  { brand: 'Decathlon', text: 'Votre commande a été expédiée !' },
  { brand: 'Adidas',    text: 'Soldes privés membres : code PRIV30' },
]

/* ─── Typewriter target ─── */
const TYPEWRITER_TEXT = 'Quelle marque de sneakers recommandez-vous ?'

/* ─── Hook: intersection observer ─── */
function useVisible(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null)
  // Start visible — avoids cards stuck at opacity:0 if IntersectionObserver misfires
  const [vis, setVis] = useState<boolean>(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reset to hidden then animate in when element enters viewport
    setVis(false)
    const fallback = setTimeout(() => setVis(true), 800)
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); clearTimeout(fallback); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => { obs.disconnect(); clearTimeout(fallback) }
  }, [threshold])
  return { ref, vis }
}

/* ─── Shared text components ─── */
function Eyebrow({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 mb-4"
      style={{
        fontFamily: 'var(--font-jetbrains-mono)',
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.09em',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--accent)' }} />
      {label}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: 30,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.025em',
        color: 'var(--text)',
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  )
}

function SectionBody({ children, maxWidth }: { children: React.ReactNode; maxWidth?: number }) {
  return (
    <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: 32, maxWidth: maxWidth ?? 420 }}>
      {children}
    </p>
  )
}

/* ─── Ad mockup type ─── */
type AdShape = 'circle' | 'rect' | 'triangle' | 'ring' | 'dots' | 'wave'

type AdMockup = {
  brand: string
  platform: string
  isNew: boolean
  headline: string
  sub: string
  cta: string
  accent: string
  bg: string
  shape: AdShape
}

const ADS: AdMockup[] = [
  {
    brand: 'Nike',      platform: 'META',      isNew: true,
    headline: 'Just Do It.',
    sub: 'Collection Printemps 2025',
    cta: 'Acheter',
    accent: '#C8FF00',
    bg: 'linear-gradient(135deg,#0a0a0a 0%,#111827 100%)',
    shape: 'ring',
  },
  {
    brand: 'Adidas',    platform: 'GOOGLE',    isNew: false,
    headline: 'Impossible is Nothing',
    sub: 'Livraison offerte dès 60€',
    cta: 'Découvrir',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg,#0c1a2e 0%,#0d2c4a 100%)',
    shape: 'circle',
  },
  {
    brand: 'Puma',      platform: 'TIKTOK',    isNew: false,
    headline: 'Forever Faster',
    sub: 'Running Collection',
    cta: 'Shop now',
    accent: '#f97316',
    bg: 'linear-gradient(135deg,#1a0a00 0%,#3d1800 100%)',
    shape: 'triangle',
  },
  {
    brand: 'Decathlon', platform: 'LINKEDIN',  isNew: false,
    headline: 'Sport pour tous',
    sub: 'B2B : équipez vos équipes',
    cta: 'Contacter',
    accent: '#22d3ee',
    bg: 'linear-gradient(135deg,#00254d 0%,#003a75 100%)',
    shape: 'dots',
  },
  {
    brand: 'H&M',       platform: 'PINTEREST', isNew: true,
    headline: 'Nouvelle saison',
    sub: 'Tendances printemps',
    cta: 'Explorer',
    accent: '#f9a8d4',
    bg: 'linear-gradient(135deg,#2d0a14 0%,#4a1020 100%)',
    shape: 'rect',
  },
  {
    brand: 'Zara',      platform: 'YOUTUBE',   isNew: false,
    headline: 'New Collection',
    sub: 'Minimal. Élégant. Zara.',
    cta: 'Voir',
    accent: '#d4d4d4',
    bg: 'linear-gradient(135deg,#111111 0%,#222222 100%)',
    shape: 'wave',
  },
]

function AdShapeEl({ shape, accent }: { shape: AdShape; accent: string }) {
  const s = { position: 'absolute' as const, opacity: 0.18, pointerEvents: 'none' as const }
  if (shape === 'ring') return (
    <div aria-hidden="true" style={{ ...s, top: -20, right: -20, width: 110, height: 110, borderRadius: 9999, border: `18px solid ${accent}` }} />
  )
  if (shape === 'circle') return (
    <div aria-hidden="true" style={{ ...s, top: -30, right: -30, width: 120, height: 120, borderRadius: 9999, background: accent }} />
  )
  if (shape === 'triangle') return (
    <div style={{ ...s, top: 8, right: 8, width: 0, height: 0, borderLeft: '45px solid transparent', borderRight: '45px solid transparent', borderBottom: `80px solid ${accent}`, opacity: 0.15 }} />
  )
  if (shape === 'rect') return (
    <div style={{ ...s, top: 6, right: -10, width: 70, height: 70, borderRadius: 8, background: accent, transform: 'rotate(20deg)' }} />
  )
  if (shape === 'dots') return (
    <div style={{ ...s, top: 8, right: 8, display: 'grid', gridTemplateColumns: 'repeat(3,8px)', gap: 5 }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: 9999, background: accent }} />
      ))}
    </div>
  )
  if (shape === 'wave') return (
    <svg aria-hidden="true" style={{ ...s, top: 0, right: 0, width: 90, height: 90 }} viewBox="0 0 90 90" fill="none">
      <path d="M10 60 Q30 20 50 50 Q70 80 90 40" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M10 75 Q30 35 50 65 Q70 95 90 55" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  )
  return null
}

/* ═══════════════════════════════════════════
   SECTION 1 — Publicités
═══════════════════════════════════════════ */
function AdsSection() {
  return (
    <section id="fonctionnalites">
      <div className="mx-auto max-w-[1100px] px-12" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 56, alignItems: 'center' }}>

          {/* Texte */}
          <div>
            <Eyebrow label="Publicités" />
            <SectionTitle>
              Jamais une pub de concurrent{' '}
              <span style={{ color: 'var(--accent)' }}>ne vous échappe.</span>
            </SectionTitle>
            <SectionBody>
              SpyMark capture chaque nouvelle annonce sur META, Google, TikTok, LinkedIn, Pinterest et YouTube — classée automatiquement dans votre galerie.
            </SectionBody>
            <ul className="flex flex-col gap-3">
              {[
                'Détection en moins de 15 minutes',
                'Galerie visuelle par concurrent',
                'Accès aux créas, titres et CTA',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5" style={{ fontSize: 14, color: 'var(--text)' }}>
                  <div aria-hidden="true" style={{ width: 3, height: 18, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Visuel */}
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 12, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#22c55e' }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 9999, background: '#22c55e', display: 'inline-block', animation: 'pulse-feature 2s ease-in-out infinite', flexShrink: 0 }} />
              28 nouvelles ads cette semaine
              <span style={{ fontWeight: 700 }}>+12%</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              {ADS.map((ad, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 10,
                    height: (i === 0 || i === 4) ? 160 : 120,
                    background: ad.bg,
                    flexShrink: 0,
                  }}
                >
                  <AdShapeEl shape={ad.shape} accent={ad.accent} />
                  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 65%)' }} />
                  <div style={{ position: 'absolute', top: 8, left: 8, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 7, color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.45)', padding: '2px 5px', borderRadius: 3, textTransform: 'uppercase' as const, letterSpacing: '0.05em', zIndex: 2 }}>
                    {ad.platform}
                  </div>
                  {ad.isNew && (
                    <div style={{ position: 'absolute', top: 8, right: 8, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 7, color: '#fff', background: 'var(--accent)', padding: '2px 5px', borderRadius: 3, textTransform: 'uppercase' as const, zIndex: 2 }}>
                      NEW
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 10px 10px', zIndex: 2 }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-jetbrains-mono)', marginBottom: 2 }}>{ad.brand}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{ad.headline}</div>
                    <div style={{ display: 'inline-flex', background: ad.accent, borderRadius: 3, padding: '2px 8px' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#000' }}>{ad.cta} →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <div aria-hidden="true" style={{ display: 'flex', animation: 'ticker-scroll 14s linear infinite', whiteSpace: 'nowrap' }}>
                {['META', 'GOOGLE', 'TIKTOK', 'LINKEDIN', 'PINTEREST', 'YOUTUBE',
                  'META', 'GOOGLE', 'TIKTOK', 'LINKEDIN', 'PINTEREST', 'YOUTUBE'].map((p, i) => (
                  <span key={i} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', flexShrink: 0, marginRight: 28 }}>
                    {p} <span style={{ opacity: 0.25, marginLeft: 28 }}>·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 2 — LLM Visibility (animated phases)
═══════════════════════════════════════════ */

type LlmPhase = 0 | 1 | 2 | 3 | 4

const LLM_SOURCES = [
  { name: 'ChatGPT',    color: '#10a37f' },
  { name: 'Claude',     color: '#d97706' },
  { name: 'Gemini',     color: '#4285f4' },
  { name: 'Perplexity', color: '#8b5cf6' },
]

function LlmSection() {
  const { ref, vis } = useVisible()
  const [phase, setPhase] = useState<LlmPhase>(0)
  const [typeLen, setTypeLen] = useState<number>(0)
  const [showBadge, setShowBadge] = useState<boolean>(false)
  const [barWidths, setBarWidths] = useState<number[]>(LLM.map(() => 0))
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const typeRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const runCycle = () => {
    setPhase(0)
    setTypeLen(0)
    setShowBadge(false)
    setBarWidths(LLM.map(() => 0))

    let len = 0
    if (typeRef.current) clearInterval(typeRef.current)
    typeRef.current = setInterval(() => {
      len++
      setTypeLen(len)
      if (len >= TYPEWRITER_TEXT.length) {
        if (typeRef.current) clearInterval(typeRef.current)
        setPhase(1)
        setTimeout(() => {
          setPhase(2)
          setTimeout(() => {
            setPhase(3)
            setBarWidths(LLM.map(item => item.score))
            setTimeout(() => {
              setPhase(4)
              setShowBadge(true)
            }, 2500)
          }, 900)
        }, 1200)
      }
    }, 55)
  }

  useEffect(() => {
    if (!vis) return
    runCycle()
    cycleRef.current = setInterval(runCycle, 9000)
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
      if (typeRef.current) clearInterval(typeRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vis])

  return (
    <section id="fonctionnalites" style={{ background: 'var(--surface-muted)' }}>
      <div className="mx-auto max-w-[1100px] px-12" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 56, alignItems: 'center' }}>

          {/* Visual */}
          <div
            ref={ref}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
              minHeight: 280,
            }}
          >
            {(phase === 0 || phase === 1) && (
              <div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Requête simulée
                </div>
                <div
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 13,
                    color: 'var(--text)',
                    minHeight: 44,
                  }}
                >
                  {TYPEWRITER_TEXT.slice(0, typeLen)}
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: 14,
                      background: 'var(--accent)',
                      marginLeft: 1,
                      verticalAlign: 'middle',
                      animation: 'blink-cursor 1s step-end infinite',
                    }}
                  />
                </div>

                {phase === 1 && (
                  <div className="flex items-center gap-3 mt-5">
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          style={{
                            width: 6, height: 6, borderRadius: 9999,
                            background: 'var(--accent)',
                            animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      Analyse en cours...
                    </span>
                  </div>
                )}
              </div>
            )}

            {phase >= 2 && (
              <div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Taux de citation — Semaine 12
                </div>

                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {LLM_SOURCES.map((src, i) => (
                    <div
                      key={src.name}
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontSize: 9,
                        fontWeight: 600,
                        color: src.color,
                        background: `${src.color}1a`,
                        border: `1px solid ${src.color}40`,
                        borderRadius: 4,
                        padding: '3px 8px',
                        opacity: 1,
                        transform: 'translateY(0)',
                        transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`,
                      }}
                    >
                      {src.name}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  {LLM.map((item, i) => (
                    <div key={item.label} className="flex items-center gap-3" style={{ position: 'relative' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono)',
                          fontSize: 12,
                          fontWeight: item.you ? 700 : 400,
                          color: item.you ? 'var(--text)' : 'var(--text-muted)',
                          width: 60,
                          flexShrink: 0,
                          borderLeft: item.you ? '2px solid var(--accent)' : '2px solid transparent',
                          paddingLeft: 6,
                        }}
                      >
                        {item.you ? '→ Vous' : item.label}
                      </div>
                      <div className="flex-1 overflow-hidden" style={{ height: 6, background: 'var(--surface-muted)', borderRadius: 3 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 3,
                            background: item.you ? 'var(--accent)' : item.color,
                            opacity: item.you ? 1 : 0.45,
                            width: `${barWidths[i]}%`,
                            transition: 'width 1.1s cubic-bezier(0.25, 1, 0.5, 1)',
                            transitionDelay: `${i * 100}ms`,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono)',
                          fontSize: 12,
                          color: item.you ? 'var(--accent)' : 'var(--text-muted)',
                          fontWeight: item.you ? 700 : 400,
                          width: 34,
                          textAlign: 'right',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        {barWidths[i] > 0 ? `${item.score}%` : '—'}
                        {i === 0 && showBadge && (
                          <div
                            key="badge"
                            style={{
                              position: 'absolute',
                              right: '110%',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: '#1A7A52',
                              color: '#fff',
                              fontFamily: 'var(--font-jetbrains-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 3,
                              whiteSpace: 'nowrap',
                              animation: 'badge-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            }}
                          >
                            +12 pts
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div style={{ width: 5, height: 5, borderRadius: 9999, background: 'var(--accent)' }} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Agrégé sur ChatGPT · Claude · Gemini · Perplexity
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Text */}
          <div>
            <Eyebrow label="Visibilité LLM" />
            <SectionTitle>
              Mesurez votre place dans les <span style={{ color: 'var(--accent)' }}>IA génératives.</span>
            </SectionTitle>
            <SectionBody maxWidth={460}>
              Quand un prospect demande &quot;quelle marque est la meilleure ?&quot;, est-ce que les IA vous citent ? Mesurez votre visibilité — et celle de vos concurrents — sur les 4 principaux LLM.
            </SectionBody>
            <ul className="flex flex-col gap-3">
              {[
                'Suivi hebdomadaire sur 4 LLM',
                'Score de citation en pourcentage',
                'Alerte sur toute variation ±5 pts',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5" style={{ fontSize: 14, color: 'var(--text)' }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 3 — SEO (animated scanning)
═══════════════════════════════════════════ */
function SeoSection() {
  const { ref, vis } = useVisible()
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanComplete, setScanComplete] = useState<boolean>(false)
  const [flash, setFlash] = useState<boolean>(false)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const runScan = () => {
    setScanProgress(0)
    setScanComplete(false)
    setFlash(false)
    if (progressRef.current) clearInterval(progressRef.current)
    let p = 0
    progressRef.current = setInterval(() => {
      p += 2
      setScanProgress(Math.min(p, 100))
      if (p >= 100) {
        if (progressRef.current) clearInterval(progressRef.current)
        setScanComplete(true)
        setTimeout(() => {
          setFlash(true)
          setTimeout(() => setFlash(false), 600)
        }, 400)
      }
    }, 30)
  }

  useEffect(() => {
    if (!vis) return
    runScan()
    cycleRef.current = setInterval(runScan, 7000)
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
      if (cycleRef.current) clearInterval(cycleRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vis])

  return (
    <section>
      <div className="mx-auto max-w-[1100px] px-12" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>

          {/* Text */}
          <div style={{ paddingTop: 8 }}>
            <Eyebrow label="SEO" />
            <SectionTitle>
              Chaque modification SEO<br />
              <span style={{ color: 'var(--accent)' }}>détectée en quelques heures.</span>
            </SectionTitle>
            <SectionBody>
              Title tags, meta descriptions, H1, données structurées — SpyMark surveille l&apos;intégralité du code source de vos concurrents et vous alerte dès qu&apos;une ligne change.
            </SectionBody>
            <ul className="flex flex-col gap-3">
              {[
                'Diff visuel avant/après',
                'Historique complet des modifications',
                'Alertes par email ou webhook',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5" style={{ fontSize: 14, color: 'var(--text)' }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: 'var(--changed)', flexShrink: 0, marginTop: 1 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div ref={ref}>
            <div style={{ marginBottom: 14 }}>
              <div className="flex items-center justify-between mb-2">
                <span
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                  }}
                >
                  {scanComplete ? 'Analyse terminée' : 'Analyse en cours...'}
                </span>
                {scanComplete && (
                  <div
                    key={String(scanComplete)}
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      background: 'var(--changed)',
                      padding: '2px 8px',
                      borderRadius: 3,
                      animation: 'badge-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                  >
                    3 changements détectés
                  </div>
                )}
              </div>
              <div style={{ height: 3, background: 'var(--surface-muted)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    background: 'var(--changed)',
                    width: `${scanProgress}%`,
                    transition: 'width 0.03s linear',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {SEO.map((d, i) => (
                <div
                  key={d.url}
                  style={{
                    background: 'var(--surface)',
                    border: flash ? '1px solid var(--changed)' : '1px solid var(--border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    opacity: vis ? 1 : 0,
                    transform: vis ? 'translateX(0)' : 'translateX(24px)',
                    transition: flash
                      ? 'opacity 0.55s ease, transform 0.55s ease, border-color 0.15s ease'
                      : 'opacity 0.55s ease, transform 0.55s ease, border-color 0.4s ease',
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--changed)' }} />
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--text)', fontWeight: 500 }}>
                        {d.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {d.field}
                      </span>
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                        {d.time}
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <div style={{ fontSize: 12, color: 'var(--destructive)', textDecoration: 'line-through', marginBottom: 4, opacity: 0.7, fontFamily: 'var(--font-jetbrains-mono)' }}>
                      − {d.old}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--success)', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 500 }}>
                      + {d.next}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════
   SECTION 4 — Email + SMS (live inbox)
═══════════════════════════════════════════ */
function EmailSmsSection() {
  const [emailIdx, setEmailIdx] = useState<number>(0)
  const [emailArriving, setEmailArriving] = useState<boolean>(false)
  const [emailCounter, setEmailCounter] = useState<number>(0)

  const [smsIdx, setSmsIdx] = useState<number>(0)
  const [smsArriving, setSmsArriving] = useState<boolean>(false)

  const staticEmails = [
    { from: 'Nike',      sub: 'Air Max disponible',  t: '1j',  isNew: false },
    { from: 'H&M',       sub: 'Nouvelle collection', t: '2j',  isNew: false },
    { from: 'Decathlon', sub: 'SOLDES — -60%',        t: '3j',  isNew: false },
  ]

  const staticSms = [
    { brand: 'Nike',   text: 'Nouvelle drop : Air Jordan 1' },
    { brand: 'Adidas', text: 'Livraison offerte avant minuit' },
  ]

  useEffect(() => {
    const id = setInterval(() => {
      setEmailArriving(true)
      setTimeout(() => {
        setEmailIdx(i => (i + 1) % FAKE_EMAILS.length)
        setEmailCounter(c => c + 1)
        setEmailArriving(false)
      }, 400)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setSmsArriving(true)
      setTimeout(() => {
        setSmsIdx(i => (i + 1) % FAKE_SMS.length)
        setSmsArriving(false)
      }, 350)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const currentEmail = FAKE_EMAILS[emailIdx]
  const currentSms = FAKE_SMS[smsIdx]

  return (
    <section style={{ background: 'var(--surface-muted)' }}>
      <div className="mx-auto max-w-[1100px] px-12" style={{ paddingTop: 96, paddingBottom: 96 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>

          {/* Visuals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Email panel */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                Emails capturés
                {emailCounter > 0 && (
                  <div
                    key={emailCounter}
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 8,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 9999,
                      animation: 'badge-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                  >
                    +{emailCounter}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface)',
                  opacity: emailArriving ? 0 : 1,
                  transform: emailArriving ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--accent)', flexShrink: 0, marginRight: 8 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                    {currentEmail.from}
                    <span
                      style={{
                        fontFamily: 'var(--font-jetbrains-mono)',
                        fontSize: 7,
                        fontWeight: 700,
                        color: '#fff',
                        background: 'var(--accent)',
                        padding: '1px 4px',
                        borderRadius: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      {currentEmail.badge}
                    </span>
                  </div>
                  <div className="truncate" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{currentEmail.sub}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8, color: 'var(--text-muted)', flexShrink: 0 }}>
                  maintenant
                </div>
              </div>

              <div className="flex flex-col gap-px" style={{ background: 'var(--border)' }}>
                {staticEmails.map(e => (
                  <div key={e.from} className="flex items-center gap-2 px-3 py-2.5" style={{ background: 'var(--surface)' }}>
                    <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{e.from}</div>
                      <div className="truncate" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.sub}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 8, color: 'var(--text-muted)', flexShrink: 0 }}>{e.t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* SMS panel */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                }}
              >
                SMS capturés
              </div>
              <div style={{ padding: 12 }}>
                <div
                  style={{
                    marginBottom: 10,
                    opacity: smsArriving ? 0 : 1,
                    transform: smsArriving ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <div className="flex gap-2">
                    <div style={{ width: 3, borderRadius: 2, background: 'var(--accent)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', marginBottom: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {currentSms.brand}
                        <span
                          style={{
                            fontFamily: 'var(--font-jetbrains-mono)',
                            fontSize: 7,
                            color: 'var(--accent)',
                            background: 'rgba(79,110,247,0.12)',
                            padding: '1px 4px',
                            borderRadius: 2,
                          }}
                        >
                          LIVE
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{currentSms.text}</div>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />

                <div className="flex flex-col gap-3">
                  {staticSms.map(s => (
                    <div key={s.brand} className="flex gap-2">
                      <div style={{ width: 3, borderRadius: 2, background: 'var(--border)', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>{s.brand}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Text */}
          <div>
            <Eyebrow label="Email & SMS" />
            <SectionTitle>
              Chaque message envoyé<br />
              à vos clients, <span style={{ color: 'var(--accent)' }}>dans votre dashboard.</span>
            </SectionTitle>
            <SectionBody>
              SpyMark intercepte les campagnes emails et SMS de vos concurrents — sujet, contenu, fréquence, promotions. Sachez ce qu&apos;ils disent à leurs clients, en temps réel.
            </SectionBody>
            <ul className="flex flex-col gap-3">
              {[
                'Objet, texte et images conservés',
                "Fréquence d'envoi analysée",
                'Détection des promotions en cours',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5" style={{ fontSize: 14, color: 'var(--text)' }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ─── Main export ─── */
export function Features(_props: { demoAds: unknown }) {
  return (
    <>
      <LlmSection />
      <SeoSection />
      <EmailSmsSection />

      <style>{`
        @keyframes pulse-feature {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: translateY(0);    opacity: 0.4; }
          50%       { transform: translateY(-4px); opacity: 1;   }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </>
  )
}
