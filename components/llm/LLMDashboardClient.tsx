'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Brain, Play, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import type { LLMScoreRow, CompetitorOption } from '@/app/dashboard/llm/page'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  scores: LLMScoreRow[]
  competitors: CompetitorOption[]
  orgId: string
}

const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: 'ChatGPT',
  PERPLEXITY: 'Perplexity',
  ANTHROPIC: 'Claude',
  GEMINI: 'Gemini',
}

const PROVIDER_COLORS: Record<string, string> = {
  OPENAI: '#10a37f',
  PERPLEXITY: '#20b2aa',
  ANTHROPIC: '#cc785c',
  GEMINI: '#4285f4',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#71717a',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 70) return '#22c55e'
  if (s >= 40) return '#f59e0b'
  return '#ef4444'
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={scoreColor(value)} strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={scoreColor(value)}>
        {Math.round(value)}%
      </text>
    </svg>
  )
}

function PromptRow({ score }: { score: LLMScoreRow }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((score.score ?? 0) * 100)

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Provider pill */}
        <span
          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider"
          style={{
            background: `${PROVIDER_COLORS[score.provider] ?? '#7c3aed'}20`,
            color: PROVIDER_COLORS[score.provider] ?? '#7c3aed',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}
        >
          {PROVIDER_LABELS[score.provider] ?? score.provider}
        </span>

        {/* Prompt */}
        <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {score.prompt}
        </span>

        {/* Mentioned badge */}
        <span
          className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
          style={{
            background: score.mentioned ? '#22c55e20' : '#71717a15',
            color: score.mentioned ? '#22c55e' : '#71717a',
          }}
        >
          {score.mentioned ? `✓ #${score.position ?? '?'}` : '—'}
        </span>

        {/* Score */}
        <span className="shrink-0 text-xs font-bold w-10 text-right" style={{ color: scoreColor(pct) }}>
          {pct}%
        </span>

        {/* Date */}
        <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
          {fmt(score.checkedAt)}
        </span>

        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
          <p className="text-[11px] leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
            {score.response}
          </p>
          {score.sentiment && (
            <span
              className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-[10px] font-semibold"
              style={{ background: `${SENTIMENT_COLORS[score.sentiment]}20`, color: SENTIMENT_COLORS[score.sentiment] }}
            >
              {score.sentiment}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LLMDashboardClient({ scores, competitors, orgId }: Props) {
  const [activeCompetitor, setActiveCompetitor] = useState<string>('all')
  const [activeProvider, setActiveProvider] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // ── Filtered scores ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return scores.filter((s) => {
      if (activeCompetitor !== 'all' && s.competitorId !== activeCompetitor) return false
      if (activeProvider !== 'all' && s.provider !== activeProvider) return false
      return true
    })
  }, [scores, activeCompetitor, activeProvider])

  // ── Aggregate per competitor ───────────────────────────────────────────────
  const ranking = useMemo(() => {
    const map: Record<string, { name: string; total: number; mentioned: number; scoreSum: number }> = {}
    for (const s of scores) {
      if (!map[s.competitorId]) map[s.competitorId] = { name: s.competitorName, total: 0, mentioned: 0, scoreSum: 0 }
      map[s.competitorId].total++
      if (s.mentioned) map[s.competitorId].mentioned++
      map[s.competitorId].scoreSum += s.score ?? 0
    }
    return Object.entries(map)
      .map(([id, d]) => ({
        id,
        name: d.name,
        mentionRate: d.total > 0 ? (d.mentioned / d.total) * 100 : 0,
        avgScore: d.total > 0 ? (d.scoreSum / d.total) * 100 : 0,
        checks: d.total,
      }))
      .sort((a, b) => b.mentionRate - a.mentionRate)
  }, [scores])

  // ── Chart data (weekly buckets, last 30 days) ─────────────────────────────
  const chartData = useMemo(() => {
    const byWeek: Record<string, { week: string; [key: string]: number | string }> = {}
    for (const s of filtered) {
      const d = new Date(s.checkedAt)
      const monday = new Date(d)
      monday.setDate(d.getDate() - d.getDay() + 1)
      const wk = monday.toISOString().slice(0, 10)
      if (!byWeek[wk]) byWeek[wk] = { week: wk }
      const key = s.competitorName
      if (s.mentioned) byWeek[wk][key] = ((byWeek[wk][key] as number) || 0) + 1
    }
    return Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week))
  }, [filtered])

  const competitorNames = Array.from(new Set(scores.map((s) => s.competitorName)))
  const providers = Array.from(new Set(scores.map((s) => s.provider)))

  // ── Run LLM check ─────────────────────────────────────────────────────────
  async function runCheck() {
    startTransition(async () => {
      const toastId = toast.loading('Lancement des analyses LLM…')
      try {
        const res = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-app-secret': '' },
          body: JSON.stringify({ orgId }),
        })
        if (!res.ok) throw new Error(await res.text())
        toast.success('Analyses LLM lancées avec succès', { id: toastId })
        setTimeout(() => window.location.reload(), 2000)
      } catch (err) {
        toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnue'}`, { id: toastId })
      }
    })
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5" style={{ background: 'var(--surface-muted)' }}>
          <Brain className="h-7 w-7 text-muted-foreground opacity-40" />
        </div>
        <h3 className="text-sm font-semibold">Aucune analyse LLM</h3>
        <p className="text-xs text-muted-foreground mt-1.5 mb-5 max-w-sm leading-relaxed">
          Le module LLM Visibility teste si vos concurrents sont mentionnés par ChatGPT, Perplexity et autres modèles IA.
          Activez le suivi LLM sur vos concurrents pour démarrer.
        </p>
        {competitors.length > 0 && (
          <button
            onClick={runCheck}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {isPending
              ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Play className="h-3.5 w-3.5" />
            }
            Lancer une analyse
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Header actions ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Competitor filter */}
          <button
            onClick={() => setActiveCompetitor('all')}
            className="px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              border: activeCompetitor === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeCompetitor === 'all' ? 'var(--accent-subtle)' : 'transparent',
              color: activeCompetitor === 'all' ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            Tous
          </button>
          {ranking.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCompetitor(c.id)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                border: activeCompetitor === c.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeCompetitor === c.id ? 'var(--accent-subtle)' : 'transparent',
                color: activeCompetitor === c.id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {c.name}
            </button>
          ))}

          <div className="h-4 w-px mx-1" style={{ background: 'var(--border)' }} />

          {/* Provider filter */}
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setActiveProvider(activeProvider === p ? 'all' : p)}
              className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-colors"
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                border: activeProvider === p ? `1px solid ${PROVIDER_COLORS[p] ?? 'var(--accent)'}` : '1px solid var(--border)',
                background: activeProvider === p ? `${PROVIDER_COLORS[p] ?? 'var(--accent)'}20` : 'transparent',
                color: activeProvider === p ? (PROVIDER_COLORS[p] ?? 'var(--accent)') : 'var(--text-muted)',
              }}
            >
              {PROVIDER_LABELS[p] ?? p}
            </button>
          ))}
        </div>

        <button
          onClick={runCheck}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          {isPending
            ? <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <Zap className="h-3.5 w-3.5" />
          }
          {isPending ? 'Analyse en cours…' : 'Lancer une analyse'}
        </button>
      </div>

      {/* ── Ranking cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ranking.map((c, i) => (
          <div
            key={c.id}
            className="rounded-xl border p-4 cursor-pointer transition-colors"
            style={{
              borderColor: activeCompetitor === c.id ? 'var(--accent)' : 'var(--border)',
              background: activeCompetitor === c.id ? 'var(--accent-subtle)' : 'var(--surface)',
            }}
            onClick={() => setActiveCompetitor(activeCompetitor === c.id ? 'all' : c.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">#{i + 1}</p>
                <p className="text-sm font-semibold truncate">{c.name}</p>
              </div>
              <ScoreRing value={c.mentionRate} size={48} />
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.mentionRate}%`, background: scoreColor(c.mentionRate) }}
              />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              {Math.round(c.mentionRate)}% mention · {c.checks} analyses
            </p>
          </div>
        ))}
      </div>

      {/* ── Trend chart ────────────────────────────────────────────────────── */}
      {chartData.length > 1 && (
        <div className="rounded-xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs font-semibold mb-4">Évolution des mentions (30 jours)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {competitorNames.map((name, i) => {
                  const color = ['#7c3aed', '#10a37f', '#f59e0b', '#ef4444', '#3b82f6'][i % 5]
                  return (
                    <linearGradient key={name} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  )
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: 'var(--text-muted)' }}
              />
              {competitorNames.map((name, i) => {
                const color = ['#7c3aed', '#10a37f', '#f59e0b', '#ef4444', '#3b82f6'][i % 5]
                return (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#grad-${i})`}
                    dot={false}
                    activeDot={{ r: 4, fill: color }}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {competitorNames.map((name, i) => {
              const color = ['#7c3aed', '#10a37f', '#f59e0b', '#ef4444', '#3b82f6'][i % 5]
              return (
                <div key={name} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Prompt log ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs font-semibold">Journal des analyses</p>
          <span className="text-xs text-muted-foreground">{filtered.length} résultats</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Aucun résultat pour ces filtres</p>
          ) : (
            <div className="p-3 space-y-2">
              {filtered.slice(0, 30).map((s) => (
                <PromptRow key={s.id} score={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
