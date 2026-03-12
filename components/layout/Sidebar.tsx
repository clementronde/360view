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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'

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
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20">
          <Eye className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold gradient-text">360View</span>
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
                active ? 'sidebar-item-active' : 'sidebar-item-inactive',
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
        <Link
          href="/dashboard/settings"
          className={cn(
            'sidebar-item sidebar-item-inactive mb-2',
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
          <UserButton afterSignOutUrl="/sign-in" />
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
