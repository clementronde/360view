'use client'

import { Check, X, Zap } from 'lucide-react'
import Link from 'next/link'
import type { Plan } from '@prisma/client'
import { PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES } from '@/lib/planLimits'

interface PricingCardsProps {
  currentPlan: Plan
}

const PLANS: Plan[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE']

interface FeatureRow {
  label: string
  free: string | boolean
  starter: string | boolean
  pro: string | boolean
  enterprise: string | boolean
}

const FEATURE_ROWS: FeatureRow[] = [
  {
    label: 'Concurrents suivis',
    free: '3',
    starter: '10',
    pro: '30',
    enterprise: 'Illimité',
  },
  {
    label: 'Historique publicités',
    free: '7 jours',
    starter: '30 jours',
    pro: '90 jours',
    enterprise: 'Illimité',
  },
  {
    label: 'Fréquence de scan',
    free: 'Toutes les 24h',
    starter: 'Toutes les 12h',
    pro: 'Toutes les 5h',
    enterprise: 'Toutes les heures',
  },
  {
    label: 'Filtre par pays',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Tri Trending 🔥',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'LLM Visibility scan',
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Capture landing pages',
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Alertes email',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Digest hebdomadaire',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Export CSV / JSON',
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
]

const PLAN_KEYS: (keyof FeatureRow)[] = ['free', 'starter', 'pro', 'enterprise']

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="h-4 w-4 mx-auto" style={{ color: 'var(--accent)' }} />
      : <X className="h-4 w-4 mx-auto text-muted-foreground opacity-40" />
  }
  return <span className="text-xs font-medium">{value}</span>
}

export function PricingCards({ currentPlan }: PricingCardsProps) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const price = PLAN_PRICES[plan]
          const isCurrent = plan === currentPlan
          const isPro = plan === 'PRO'

          return (
            <div
              key={plan}
              className="relative flex flex-col rounded-2xl border p-5"
              style={{
                borderColor: isPro ? 'var(--accent)' : 'var(--border)',
                background: isPro ? 'var(--accent-subtle)' : 'var(--card)',
                boxShadow: isPro ? '0 0 0 1px var(--accent)' : undefined,
              }}
            >
              {isPro && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                  style={{ background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  <Zap className="h-2.5 w-2.5" /> Populaire
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}>
                  {PLAN_LABELS[plan]}
                </p>
                {price.monthly === null ? (
                  <p className="text-2xl font-bold">Sur devis</p>
                ) : price.monthly === 0 ? (
                  <p className="text-2xl font-bold">Gratuit</p>
                ) : (
                  <div>
                    <span className="text-2xl font-bold">${price.annual}</span>
                    <span className="text-xs text-muted-foreground">/mois</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ou ${price.monthly}/mois sans engagement
                    </p>
                  </div>
                )}
              </div>

              <ul className="space-y-1.5 flex-1 mb-5">
                {FEATURE_ROWS.slice(0, 5).map((row) => {
                  const val = row[PLAN_KEYS[PLANS.indexOf(plan)]]
                  const active = val !== false
                  return (
                    <li key={row.label} className="flex items-center gap-2 text-xs" style={{ color: active ? 'var(--text)' : 'var(--text-muted)', opacity: active ? 1 : 0.45 }}>
                      {active
                        ? <Check className="h-3 w-3 shrink-0" style={{ color: 'var(--accent)' }} />
                        : <X className="h-3 w-3 shrink-0" />
                      }
                      {typeof val === 'string' ? `${row.label} — ${val}` : row.label}
                    </li>
                  )
                })}
              </ul>

              {isCurrent ? (
                <div
                  className="w-full rounded-xl py-2 text-center text-xs font-semibold"
                  style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)' }}
                >
                  Plan actuel
                </div>
              ) : plan === 'ENTERPRISE' ? (
                <a
                  href="mailto:hello@spymark.io?subject=Plan Enterprise"
                  className="w-full rounded-xl py-2 text-center text-xs font-semibold transition-colors block"
                  style={{ background: 'var(--surface-muted)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Nous contacter
                </a>
              ) : (
                <button
                  className="w-full rounded-xl py-2 text-center text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: isPro ? 'var(--accent)' : 'var(--surface-muted)',
                    color: isPro ? '#fff' : 'var(--text)',
                    border: isPro ? 'none' : '1px solid var(--border)',
                  }}
                  onClick={() => {
                    // TODO: wire Stripe checkout
                    alert('Paiement Stripe à configurer')
                  }}
                >
                  {currentPlan === 'FREE' ? 'Commencer' : 'Changer de plan'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature comparison table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-5 text-xs font-semibold border-b px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
          <div>Fonctionnalité</div>
          {PLANS.map((p) => (
            <div key={p} className="text-center" style={{ color: p === currentPlan ? 'var(--accent)' : 'var(--text)' }}>
              {PLAN_LABELS[p]}
              {p === currentPlan && <span className="ml-1 text-[9px] opacity-60">(actuel)</span>}
            </div>
          ))}
        </div>
        {FEATURE_ROWS.map((row, i) => (
          <div
            key={row.label}
            className="grid grid-cols-5 items-center px-4 py-2.5 text-xs border-b last:border-0"
            style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface-muted)/30' }}
          >
            <div style={{ color: 'var(--text)' }}>{row.label}</div>
            {PLAN_KEYS.map((key) => (
              <div key={key} className="text-center">
                <Cell value={row[key]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
