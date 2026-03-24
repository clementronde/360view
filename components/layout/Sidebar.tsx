'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users2,
  Image,
  Mail,
  MessageSquare,
  Search,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  Compass,
  CalendarDays,
  Zap,
  Bookmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import type { Plan } from '@prisma/client'
import { PLAN_LABELS } from '@/lib/planLimits'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/dashboard/feed',
    label: 'Découvrir',
    icon: Compass,
  },
  {
    href: '/dashboard/swipe-file',
    label: 'Swipe File',
    icon: Bookmark,
  },
  {
    href: '/dashboard/concurrents',
    label: 'Concurrents',
    icon: Users2,
  },
  {
    href: '/dashboard/ads',
    label: 'Ads',
    icon: Image,
  },
  {
    href: '/dashboard/emails',
    label: 'Emails',
    icon: Mail,
  },
  {
    href: '/dashboard/sms',
    label: 'SMS',
    icon: MessageSquare,
  },
  {
    href: '/dashboard/seo',
    label: 'SEO',
    icon: Search,
  },
  {
    href: '/dashboard/llm',
    label: 'LLM Visibility',
    icon: Brain,
  },
  {
    href: '/dashboard/calendar',
    label: 'Calendrier',
    icon: CalendarDays,
  },
]

const PLAN_BADGE_STYLE: Record<Plan, { bg: string; color: string }> = {
  FREE:       { bg: 'var(--surface-muted)', color: 'var(--text-muted)' },
  STARTER:    { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  PRO:        { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  ENTERPRISE: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
}

interface SidebarProps {
  plan: Plan
}

export function Sidebar({ plan }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const badgeStyle = PLAN_BADGE_STYLE[plan]
  const showUpgrade = plan === 'FREE' || plan === 'STARTER'

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-border bg-card transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-4',
          collapsed ? 'justify-center' : 'gap-2'
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--accent-subtle)' }}>
          <Eye className="h-4 w-4" style={{ color: 'var(--accent)' }} />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>SpyMark</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-item',
                active && 'sidebar-item-active',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2">

        {/* Plan badge + upgrade CTA */}
        {!collapsed && (
          <Link
            href="/dashboard/upgrade"
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 mb-2 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.06em] uppercase"
                style={{ fontFamily: 'var(--font-jetbrains-mono)', background: badgeStyle.bg, color: badgeStyle.color }}
              >
                {PLAN_LABELS[plan]}
              </span>
            </div>
            {showUpgrade && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold shrink-0"
                style={{ color: 'var(--accent)' }}
              >
                <Zap className="h-3 w-3" />
                Upgrader
              </span>
            )}
          </Link>
        )}

        {collapsed && showUpgrade && (
          <Link
            href="/dashboard/upgrade"
            className="sidebar-item justify-center px-0 mb-2"
            title="Upgrader votre plan"
          >
            <Zap className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </Link>
        )}

        <Link
          href="/dashboard/settings"
          className={cn(
            'sidebar-item mb-2',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Paramètres' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </Link>

        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1',
            collapsed && 'justify-center px-0'
          )}
        >
          <UserButton />
          {!collapsed && (
            <span className="text-xs text-muted-foreground truncate">Mon compte</span>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
