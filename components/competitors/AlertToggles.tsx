'use client'

import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { toggleCompetitorAlert } from '@/actions/alerts'

interface AlertTogglesProps {
  competitorId: string
  initial: {
    alertNewAds: boolean
    alertSeoChange: boolean
    alertLlmChange: boolean
  }
}

const ALERTS = [
  { key: 'alertNewAds' as const, label: 'Nouvelles pubs' },
  { key: 'alertSeoChange' as const, label: 'Changement SEO' },
  { key: 'alertLlmChange' as const, label: 'Changement LLM' },
]

export function AlertToggles({ competitorId, initial }: AlertTogglesProps) {
  const [state, setState] = useState(initial)

  async function toggle(field: keyof typeof initial) {
    const prev = state[field]
    setState((s) => ({ ...s, [field]: !prev }))
    const res = await toggleCompetitorAlert(competitorId, field)
    if (res.error) {
      setState((s) => ({ ...s, [field]: prev }))
      toast.error(res.error)
    } else {
      toast.success(res.enabled ? 'Alerte activée' : 'Alerte désactivée')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {ALERTS.map(({ key, label }) => {
        const enabled = state[key]
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors"
            style={{
              border: enabled ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: enabled ? 'var(--accent-subtle)' : 'transparent',
            }}
          >
            <span style={{ color: enabled ? 'var(--accent)' : 'var(--text-muted)' }}>{label}</span>
            {enabled
              ? <Bell className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
              : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </button>
        )
      })}
    </div>
  )
}
