'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const plans = [
  {
    name: 'Starter',
    eyebrow: 'Pour explorer',
    price: '0',
    suffix: '€',
    period: 'Gratuit pour toujours',
    features: [
      '3 concurrents surveillés',
      'Publicités + SEO uniquement',
      'Historique 30 jours',
      '1 utilisateur',
    ],
    cta: 'Démarrer gratuitement',
    href: '/sign-up',
    featured: false,
    badge: null,
  },
  {
    name: 'Pro',
    eyebrow: 'Recommandé',
    price: '149',
    suffix: '€',
    period: 'par mois · sans engagement',
    features: [
      '20 concurrents simultanés',
      'Ads · Email · SMS · SEO · LLM',
      'Historique 12 mois',
      'Alertes email instantanées',
      'Export CSV + Webhook',
      "Jusqu'à 5 utilisateurs",
    ],
    cta: "Commencer l'essai gratuit",
    href: '/sign-up',
    featured: true,
    badge: 'Le plus choisi',
  },
  {
    name: 'Scale',
    eyebrow: 'Pour les équipes',
    price: 'Sur devis',
    suffix: '',
    period: 'Contactez-nous',
    features: [
      'Concurrents illimités',
      'API REST complète',
      'SSO / SAML',
      'Rapports automatisés',
      'SLA + support dédié 24/7',
    ],
    cta: 'Prendre contact',
    href: 'mailto:contact@spymark.io',
    featured: false,
    badge: null,
  },
]

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const cardAnim = (i: number): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(32px)',
    transition: 'opacity 0.65s ease, transform 0.65s ease',
    transitionDelay: `${i * 110}ms`,
  })

  return (
    <section id="tarifs" className="border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-[1100px] px-12" style={{ paddingTop: 100, paddingBottom: 100 }}>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3.5" style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          <div style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--accent)' }} />
          Tarifs
        </div>
        <h2 style={{ fontFamily: 'var(--font-inter)', fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 12, maxWidth: 440 }}>
          Simple, transparent,{' '}
          <span style={{ color: 'var(--accent)' }}>sans surprise.</span>
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 56, maxWidth: 400, lineHeight: 1.65 }}>
          Un prix honnête. Résiliez à tout moment.
        </p>

        {/* Cards */}
        <div
          ref={ref}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}
        >
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className="flex flex-col"
              style={{
                position: 'relative',
                background: 'var(--surface)',
                border: plan.featured
                  ? '2px solid var(--accent)'
                  : '1px solid var(--border)',
                borderRadius: 16,
                padding: '28px 28px 24px',
                boxShadow: plan.featured
                  ? '0 8px 40px rgba(79,110,247,0.14), 0 2px 12px rgba(79,110,247,0.08)'
                  : '0 1px 4px rgba(0,0,0,0.04)',
                ...cardAnim(i),
              }}
            >
              {/* Top accent bar on featured */}
              {plan.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: -1,
                    left: 24,
                    right: 24,
                    height: 3,
                    background: 'var(--accent)',
                    borderRadius: '0 0 3px 3px',
                  }}
                />
              )}

              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -13,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.09em',
                    color: '#fff',
                    background: 'var(--accent)',
                    padding: '4px 12px',
                    borderRadius: 99,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Eyebrow */}
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: plan.featured ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 16 }}>
                {plan.eyebrow}
              </div>

              {/* Plan name */}
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.01em' }}>
                {plan.name}
              </div>

              {/* Price */}
              <div className="flex items-end gap-1" style={{ marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: plan.suffix ? 48 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {plan.price}
                </span>
                {plan.suffix && (
                  <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {plan.suffix}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
                {plan.period}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5"
                    style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--text)' }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: plan.featured ? 'var(--accent-subtle)' : 'var(--surface-muted)',
                        border: `1px solid ${plan.featured ? 'var(--accent)' : 'var(--border)'}`,
                        flexShrink: 0,
                        marginTop: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.2 5.7L6.5 2" stroke={plan.featured ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className="block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                style={plan.featured
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface-muted)', color: 'var(--text)', border: '1px solid var(--border)' }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-muted)' }}>
          Toutes les offres incluent les mises à jour et les nouvelles fonctionnalités sans surcoût.
        </p>
      </div>
    </section>
  )
}
