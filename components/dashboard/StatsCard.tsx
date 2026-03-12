import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
  iconClassName?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatsCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.positive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.positive ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              iconClassName ?? 'bg-primary/15'
            )}
          >
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
    </Card>
  )
}
