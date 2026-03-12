import { auth } from '@clerk/nextjs/server'
import { MessageSquare } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SMS' }

async function SMSList() {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return <EmptySMS />

  const messages = await prisma.sMSMessage.findMany({
    where: { competitor: { organizationId: org.id } },
    orderBy: { receivedAt: 'desc' },
    take: 50,
    include: { competitor: { select: { name: true } } },
  })

  if (messages.length === 0) return <EmptySMS />

  return (
    <div className="space-y-2">
      {messages.map((sms) => (
        <div
          key={sms.id}
          className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <MessageSquare className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{sms.fromNumber}</span>
                <Badge variant="outline" className="text-xs">{sms.competitor.name}</Badge>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDateTime(sms.receivedAt)}
              </span>
            </div>
            <p className="text-sm">{sms.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptySMS() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <MessageSquare className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Aucun SMS reçu</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Activez le module SMS sur vos concurrents et configurez votre numéro Twilio pour capturer
        leurs campagnes SMS.
      </p>
    </div>
  )
}

export default function SMSPage() {
  return (
    <div className="flex flex-col overflow-auto">
      <Header title="SMS" description="Campagnes SMS de vos concurrents" />
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>}>
          <SMSList />
        </Suspense>
      </div>
    </div>
  )
}
