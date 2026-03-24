'use client'

import { useState, useMemo } from 'react'
import { getFaviconUrl } from '@/lib/utils'
import type { CalendarEvent, CalendarCompetitor } from '@/app/dashboard/calendar/page'

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  AD:    { label: 'Pub',     color: '#7c3aed', bg: '#7c3aed20' },
  EMAIL: { label: 'Email',   color: '#3b82f6', bg: '#3b82f620' },
  SMS:   { label: 'SMS',     color: '#f59e0b', bg: '#f59e0b20' },
  SEO:   { label: 'SEO',     color: '#10b981', bg: '#10b98120' },
  LLM:   { label: 'LLM',     color: '#ec4899', bg: '#ec489920' },
} as const

type EventType = keyof typeof EVENT_CONFIG

// ─── Generate last 30 days ────────────────────────────────────────────────────

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function fmtDay(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtDayShort(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  const day = d.getDate()
  // Show label on 1st, 8th, 15th, 22nd of each period
  if (day === 1 || day % 7 === 1) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return ''
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipData {
  competitorName: string
  date: string
  events: Array<{ type: EventType; count: number }>
  x: number
  y: number
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  competitors: CalendarCompetitor[]
  events: CalendarEvent[]
}

export function ContentCalendarClient({ competitors, events }: Props) {
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(
    new Set<EventType>(['AD', 'EMAIL', 'SMS', 'SEO', 'LLM'])
  )
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const days = useMemo(() => getLast30Days(), [])

  // Build lookup: competitorId → date → type → count
  const lookup = useMemo(() => {
    const map = new Map<string, Map<string, Map<EventType, number>>>()
    for (const e of events) {
      if (!map.has(e.competitorId)) map.set(e.competitorId, new Map())
      const byDate = map.get(e.competitorId)!
      if (!byDate.has(e.date)) byDate.set(e.date, new Map())
      byDate.get(e.date)!.set(e.type as EventType, e.count)
    }
    return map
  }, [events])

  function toggleType(t: EventType) {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) { if (next.size > 1) next.delete(t) }
      else next.add(t)
      return next
    })
  }

  function getCellEvents(competitorId: string, date: string): Array<{ type: EventType; count: number }> {
    const byDate = lookup.get(competitorId)
    if (!byDate) return []
    const byType = byDate.get(date)
    if (!byType) return []
    return Array.from(byType.entries())
      .filter(([t]) => activeTypes.has(t))
      .map(([type, count]) => ({ type, count }))
  }

  function handleCellHover(
    e: React.MouseEvent,
    competitor: CalendarCompetitor,
    date: string,
    cellEvents: Array<{ type: EventType; count: number }>
  ) {
    if (cellEvents.length === 0) { setTooltip(null); return }
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltip({
      competitorName: competitor.name,
      date,
      events: cellEvents,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    })
  }

  if (competitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center select-none">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-sm font-semibold">Aucun concurrent actif</h3>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
          Ajoutez des concurrents et activez le suivi pour voir leur activité ici.
        </p>
      </div>
    )
  }

  const CELL_W = 24
  const ROW_H = 36
  const LEFT_W = 160

  return (
    <div className="p-4 lg:p-6">
      {/* Legend / filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(Object.entries(EVENT_CONFIG) as [EventType, typeof EVENT_CONFIG[EventType]][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity"
            style={{
              background: activeTypes.has(type) ? cfg.bg : 'var(--surface-muted)',
              color: activeTypes.has(type) ? cfg.color : 'var(--text-muted)',
              border: `1px solid ${activeTypes.has(type) ? cfg.color + '40' : 'var(--border)'}`,
              opacity: activeTypes.has(type) ? 1 : 0.5,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
            {cfg.label}
          </button>
        ))}
        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>30 derniers jours</span>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_W + days.length * CELL_W + 32 }}>
          {/* Day headers */}
          <div className="flex items-end" style={{ paddingLeft: LEFT_W, marginBottom: 4 }}>
            {days.map((d) => {
              const label = fmtDayShort(d)
              return (
                <div
                  key={d}
                  style={{ width: CELL_W, flexShrink: 0, textAlign: 'center' }}
                >
                  {label && (
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Rows */}
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className="flex items-center mb-1"
              style={{ height: ROW_H }}
            >
              {/* Competitor label */}
              <div
                className="flex items-center gap-2 shrink-0 pr-3"
                style={{ width: LEFT_W }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comp.logoUrl ?? getFaviconUrl(comp.website)}
                  alt={comp.name}
                  className="h-5 w-5 rounded object-contain shrink-0"
                  style={{ background: 'var(--surface-muted)' }}
                />
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                  {comp.name}
                </span>
              </div>

              {/* Day cells */}
              {days.map((day) => {
                const cellEvents = getCellEvents(comp.id, day)
                const hasEvents = cellEvents.length > 0
                const today = day === new Date().toISOString().slice(0, 10)

                return (
                  <div
                    key={day}
                    className="relative flex items-center justify-center transition-colors"
                    style={{
                      width: CELL_W,
                      height: ROW_H,
                      flexShrink: 0,
                      cursor: hasEvents ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => handleCellHover(e, comp, day, cellEvents)}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {/* Today marker */}
                    {today && (
                      <div
                        className="absolute inset-x-1 inset-y-1 rounded"
                        style={{ border: '1px solid var(--accent)', opacity: 0.3 }}
                      />
                    )}

                    {hasEvents ? (
                      <div className="flex flex-col items-center gap-0.5">
                        {cellEvents.slice(0, 3).map(({ type, count }) => (
                          <div
                            key={type}
                            className="rounded-sm"
                            style={{
                              width: Math.min(18, 8 + count * 2),
                              height: 5,
                              background: EVENT_CONFIG[type].color,
                              opacity: 0.85,
                            }}
                            title={`${EVENT_CONFIG[type].label} ×${count}`}
                          />
                        ))}
                        {cellEvents.length > 3 && (
                          <span className="text-[7px]" style={{ color: 'var(--text-muted)' }}>+{cellEvents.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <div className="w-1 h-1 rounded-full" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-xl border shadow-xl pointer-events-none px-3 py-2.5"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            minWidth: 140,
          }}
        >
          <p className="text-xs font-semibold mb-1">{tooltip.competitorName}</p>
          <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}>
            {fmtDay(tooltip.date)}
          </p>
          <div className="space-y-1">
            {tooltip.events.map(({ type, count }) => (
              <div key={type} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: EVENT_CONFIG[type].color }} />
                  <span className="text-[11px]">{EVENT_CONFIG[type].label}</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: EVENT_CONFIG[type].color }}>
                  ×{count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
