import { formatRelative } from '@/lib/utils'
import {
  Image,
  Mail,
  MessageSquare,
  Search,
  Brain,
  Users2,
  Activity,
} from 'lucide-react'
import type { Activity as ActivityType } from '@prisma/client'

const ACTIVITY_CONFIG = {
  AD_DETECTED:      { icon: Image,         borderColor: 'var(--accent)',      label: 'Pub' },
  EMAIL_RECEIVED:   { icon: Mail,           borderColor: 'var(--accent)',      label: 'Email' },
  SMS_RECEIVED:     { icon: MessageSquare,  borderColor: 'var(--accent)',      label: 'SMS' },
  SEO_CHANGED:      { icon: Search,         borderColor: 'var(--changed)',     label: 'SEO' },
  LLM_CHECKED:      { icon: Brain,          borderColor: 'var(--success)',     label: 'LLM' },
  COMPETITOR_ADDED: { icon: Users2,         borderColor: 'var(--success)',     label: 'Concurrent' },
} as const

interface ActivityFeedProps {
  activities: ActivityType[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-8 w-8 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune activité récente</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          Ajoutez des concurrents pour démarrer la veille
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-px">
      {activities.map((activity) => {
        const config = ACTIVITY_CONFIG[activity.type as keyof typeof ACTIVITY_CONFIG] ?? {
          icon: Activity,
          borderColor: 'var(--border)',
          label: '',
        }
        const IconComponent = config.icon

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-3 py-2.5 transition-colors duration-100 hover:bg-[--surface-muted]"
            style={{ borderLeft: `2px solid ${config.borderColor}` }}
          >
            <IconComponent className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: config.borderColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text)' }}>{activity.title}</p>
              {activity.description && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                  {activity.description}
                </p>
              )}
            </div>
            <time
              className="shrink-0 text-[10px]"
              style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-muted)' }}
            >
              {formatRelative(activity.createdAt)}
            </time>
          </div>
        )
      })}
    </div>
  )
}
