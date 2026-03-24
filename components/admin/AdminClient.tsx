'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Database,
  Image as ImageIcon,
  Users2,
  Building2,
  RefreshCw,
  Trash2,
  Zap,
  Terminal,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { adminSeedDiscovery, triggerRailwayMassScrape, resetDiscoveryAds } from '@/actions/admin'
import type { AdminStats } from '@/actions/admin'

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value.toLocaleString('fr-FR')}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok
        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
        : <XCircle className="h-4 w-4 text-red-400" />}
      <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  )
}

export function AdminClient({ stats }: { stats: AdminStats }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSeedDiscovery() {
    setLoading('seed')
    const tid = toast.loading('Scraping Meta API pour 20 marques…')
    const res = await adminSeedDiscovery()
    setLoading(null)
    if (res.success) {
      toast.success(`${res.added} ads ajoutées au fil Découvrir`, { id: tid })
    } else {
      toast.error(res.error ?? 'Erreur', { id: tid })
    }
  }

  async function handleRailway() {
    setLoading('railway')
    const tid = toast.loading('Déclenchement du worker Railway…')
    const res = await triggerRailwayMassScrape()
    setLoading(null)
    if (res.success) {
      toast.success('Worker Railway déclenché ! Scraping de 10k ads en cours…', { id: tid })
    } else {
      toast.error(res.error ?? 'Erreur', { id: tid })
    }
  }

  async function handleReset() {
    if (!confirm('Supprimer toutes les ads DISCOVERY ? (irréversible)')) return
    setLoading('reset')
    const tid = toast.loading('Suppression…')
    const res = await resetDiscoveryAds()
    setLoading(null)
    toast.success(`${res.deleted} ads supprimées`, { id: tid })
  }

  const isAnyLoading = loading !== null

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Ads total" value={stats.totalAds} icon={Database}
          sub={`dont ${stats.adsWithImages} avec image`} />
        <StatCard label="Ads discovery" value={stats.discoveryAds} icon={ImageIcon} />
        <StatCard label="Orgs" value={stats.totalOrgs} icon={Building2} />
        <StatCard label="Concurrents" value={stats.totalCompetitors} icon={Users2} />
      </div>

      {/* Env checks */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Variables d&apos;environnement</h2>
        <div className="space-y-2">
          <StatusBadge ok={stats.hasMetaToken} label="META_ACCESS_TOKEN — scraping HTTP (Vercel)" />
          <StatusBadge ok={stats.hasRailwayHook} label="RAILWAY_DEPLOY_HOOK — scraping Playwright (10k ads)" />
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Actions</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Seed via Meta API */}
          <button
            onClick={handleSeedDiscovery}
            disabled={isAnyLoading || !stats.hasMetaToken}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${loading === 'seed' ? 'animate-spin' : ''}`} />
            <div className="text-left">
              <p>Seed via Meta API</p>
              <p className="text-[11px] text-muted-foreground font-normal">20 marques, HTTP seulement</p>
            </div>
          </button>

          {/* Railway mass scrape */}
          <button
            onClick={handleRailway}
            disabled={isAnyLoading || !stats.hasRailwayHook}
            className="flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-sm font-medium hover:bg-violet-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className={`h-4 w-4 text-violet-400 ${loading === 'railway' ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <p className="text-violet-300">Railway massScrape</p>
              <p className="text-[11px] text-muted-foreground font-normal">10k ads avec images</p>
            </div>
          </button>

          {/* Reset discovery */}
          <button
            onClick={handleReset}
            disabled={isAnyLoading}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
            <div className="text-left">
              <p className="text-red-300">Reset discovery ads</p>
              <p className="text-[11px] text-muted-foreground font-normal">Supprimer toutes les DISCOVERY</p>
            </div>
          </button>
        </div>
      </div>

      {/* Railway setup instructions */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Scraper 10 000 ads avec Railway</h2>
        </div>

        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li>
            Dans Railway, ouvre le service worker → <strong className="text-foreground">Settings → Deploy</strong>
          </li>
          <li>
            Change <strong className="text-foreground">Start Command</strong> en :<br />
            <code className="mt-1 block text-xs bg-muted rounded px-3 py-2 font-mono text-foreground">
              node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/massScrape.ts
            </code>
          </li>
          <li>
            Redéploie → le worker tourne, scrape ~100 marques, s&apos;arrête seul à 10 000 ads
          </li>
          <li>
            Remet le Start Command normal :<br />
            <code className="mt-1 block text-xs bg-muted rounded px-3 py-2 font-mono text-foreground">
              node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/adsCron.ts
            </code>
          </li>
          <li>
            Ajoute <strong className="text-foreground">RAILWAY_DEPLOY_HOOK</strong> dans Vercel (onglet <em>Deploy Hooks</em> de Railway) pour déclencher depuis ce panel
          </li>
        </ol>
      </div>

      {/* Top advertisers */}
      {stats.topAdvertisers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Top annonceurs</h2>
          <div className="space-y-1.5">
            {stats.topAdvertisers.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{a.name}</span>
                <span className="font-mono text-xs tabular-nums">{a.count.toLocaleString('fr-FR')} ads</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
