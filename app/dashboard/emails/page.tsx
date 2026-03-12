import { auth } from '@clerk/nextjs/server'
import { Mail } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Emails' }

async function getOrgId(userId: string) {
  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  return org?.id
}

async function EmailsList() {
  const { userId } = await auth()
  if (!userId) return null

  const orgId = await getOrgId(userId)
  if (!orgId) return <EmptyEmails />

  const emails = await prisma.email.findMany({
    where: { competitor: { organizationId: orgId } },
    orderBy: { receivedAt: 'desc' },
    take: 50,
    include: {
      competitor: { select: { name: true } },
    },
  })

  if (emails.length === 0) return <EmptyEmails />

  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div
          key={email.id}
          className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 cursor-pointer"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <Mail className="h-4 w-4 text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium truncate ${!email.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {email.subject}
                  </p>
                  {!email.isRead && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                {email.fromName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {email.fromName}
                    {email.fromEmail && ` <${email.fromEmail}>`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {email.competitor.name}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(email.receivedAt)}
                </span>
              </div>
            </div>

            {email.textContent && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {email.textContent}
              </p>
            )}

            {email.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {email.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyEmails() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Mail className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Aucun email reçu</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Activez le module Email sur vos concurrents. Chaque concurrent reçoit une adresse email
        unique pour capturer leurs campagnes.
      </p>
    </div>
  )
}

export default function EmailsPage() {
  return (
    <div className="flex flex-col overflow-auto">
      <Header title="Emails" description="Campagnes emails de vos concurrents" />
      <div className="flex-1 overflow-auto p-6">
        <Suspense
          fallback={
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          }
        >
          <EmailsList />
        </Suspense>
      </div>
    </div>
  )
}
