'use client'

import { useState } from 'react'
import { Bell, Mail, Calendar, Check } from 'lucide-react'
import { toast } from 'sonner'
import { toggleWeeklyDigest, updateAlertEmailSettings } from '@/actions/digest'

interface Props {
  initial: { alertEmail: string | null; weeklyDigest: boolean }
}

export function NotificationSettings({ initial }: Props) {
  const [email, setEmail] = useState(initial.alertEmail ?? '')
  const [digest, setDigest] = useState(initial.weeklyDigest)
  const [saving, setSaving] = useState(false)

  async function saveEmail() {
    setSaving(true)
    const res = await updateAlertEmailSettings(email)
    setSaving(false)
    if (res.error) toast.error(res.error)
    else toast.success('Email de notification mis à jour')
  }

  async function handleToggleDigest() {
    const prev = digest
    setDigest(!prev)
    const res = await toggleWeeklyDigest()
    if (res.error) { setDigest(prev); toast.error(res.error) }
    else toast.success(res.enabled ? 'Digest hebdomadaire activé' : 'Digest désactivé')
  }

  return (
    <div className="space-y-4">
      {/* Email field */}
      <div>
        <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Mail className="h-3.5 w-3.5" />
          Email de destination
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com (défaut: email du compte)"
            className="flex-1 rounded-lg border px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            onKeyDown={(e) => e.key === 'Enter' && saveEmail()}
          />
          <button
            onClick={saveEmail}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {saving
              ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Check className="h-3.5 w-3.5" />
            }
            Sauvegarder
          </button>
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Laissez vide pour utiliser l'email de votre compte Clerk.
        </p>
      </div>

      {/* Digest toggle */}
      <button
        onClick={handleToggleDigest}
        className="w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors"
        style={{
          border: digest ? '1px solid var(--accent)' : '1px solid var(--border)',
          background: digest ? 'var(--accent-subtle)' : 'transparent',
        }}
      >
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4" style={{ color: digest ? 'var(--accent)' : 'var(--text-muted)' }} />
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: digest ? 'var(--accent)' : 'var(--text)' }}>
              Digest hebdomadaire
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Résumé envoyé chaque lundi matin — nouvelles pubs, emails, changements SEO
            </p>
          </div>
        </div>
        <div
          className="h-5 w-9 rounded-full transition-colors relative shrink-0"
          style={{ background: digest ? 'var(--accent)' : 'var(--border)' }}
        >
          <div
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
            style={{ transform: digest ? 'translateX(16px)' : 'translateX(2px)' }}
          />
        </div>
      </button>

      {/* Per-competitor reminder */}
      <div className="rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
        <div className="flex items-start gap-3">
          <Bell className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-sm font-medium">Alertes par concurrent</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Configurez les alertes (nouvelles pubs, SEO, LLM) directement sur chaque fiche concurrent.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
