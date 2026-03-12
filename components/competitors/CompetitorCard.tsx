'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Image as ImageIcon, Mail, MessageSquare, Search, Brain, MoreHorizontal, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getFaviconUrl, getDomain, formatRelative } from '@/lib/utils'
import { deleteCompetitor, toggleCompetitorActive } from '@/actions/competitors'

interface CompetitorCardProps {
  competitor: {
    id: string
    name: string
    website: string
    logoUrl: string | null
    description: string | null
    isActive: boolean
    trackAds: boolean
    trackEmails: boolean
    trackSms: boolean
    trackSeo: boolean
    trackLlm: boolean
    createdAt: Date
    _count: {
      ads: number
      emails: number
      smsMessages: number
      seoSnapshots: number
      llmScores: number
    }
  }
}

export function CompetitorCard({ competitor }: CompetitorCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Supprimer ${competitor.name} ? Cette action est irréversible.`)) return
    startTransition(async () => {
      const result = await deleteCompetitor(competitor.id)
      if (result.error) toast.error(result.error)
      else toast.success(`${competitor.name} supprimé`)
    })
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleCompetitorActive(competitor.id, !competitor.isActive)
      if (result.error) toast.error(result.error)
      else toast.success(competitor.isActive ? 'Concurrent mis en pause' : 'Concurrent réactivé')
    })
  }

  const modules = [
    { enabled: competitor.trackAds, icon: ImageIcon, label: 'Ads', count: competitor._count.ads },
    { enabled: competitor.trackEmails, icon: Mail, label: 'Emails', count: competitor._count.emails },
    { enabled: competitor.trackSms, icon: MessageSquare, label: 'SMS', count: competitor._count.smsMessages },
    { enabled: competitor.trackSeo, icon: Search, label: 'SEO', count: competitor._count.seoSnapshots },
    { enabled: competitor.trackLlm, icon: Brain, label: 'LLM', count: competitor._count.llmScores },
  ]

  return (
    <div className={`group relative rounded-xl border border-border bg-card p-5 transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20 ${!competitor.isActive ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={competitor.logoUrl ?? getFaviconUrl(competitor.website)}
              alt={competitor.name}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <Link
              href={`/dashboard/concurrents/${competitor.id}`}
              className="text-sm font-semibold hover:text-primary transition-colors truncate block"
            >
              {competitor.name}
            </Link>
            <a
              href={competitor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {getDomain(competitor.website)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={competitor.isActive ? 'success' : 'secondary'} className="text-xs">
            {competitor.isActive ? 'Actif' : 'Pausé'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/concurrents/${competitor.id}`}>
                  Voir le détail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
                <Power className="h-4 w-4" />
                {competitor.isActive ? 'Mettre en pause' : 'Réactiver'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {competitor.description && (
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{competitor.description}</p>
      )}

      {/* Module stats */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {modules.filter((m) => m.enabled).map((mod) => (
          <div
            key={mod.label}
            className="flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1"
          >
            <mod.icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">{mod.count}</span>
            <span className="text-xs text-muted-foreground">{mod.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground/60">
        Ajouté {formatRelative(competitor.createdAt)}
      </p>
    </div>
  )
}
