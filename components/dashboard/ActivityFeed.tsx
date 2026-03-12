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

const ACTIVITY_ICONS = {
  AD_DETECTED: { icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  EMAIL_RECEIVED: { icon: Mail, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  SMS_RECEIVED: { icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  SEO_CHANGED: { icon: Search, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  LLM_CHECKED: { icon: Brain, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  COMPETITOR_ADDED: { icon: Users2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
}

interface ActivityFeedProps {
  activities: ActivityType[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Aucune activité récente</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Ajoutez des concurrents pour démarrer la veille
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = ACTIVITY_ICONS[activity.type] ?? {
          icon: Activity,
          color: 'text-muted-foreground',
          bg: 'bg-muted',
        }
        const IconComponent = config.icon

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/30 transition-colors"
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
            >
              <IconComponent className={`h-3.5 w-3.5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {activity.description}
                </p>
              )}
            </div>
            <time className="shrink-0 text-xs text-muted-foreground/60">
              {formatRelative(activity.createdAt)}
            </time>
          </div>
        )
      })}
    </div>
  )
}
