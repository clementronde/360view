import { auth } from '@clerk/nextjs/server'
import { Search, ExternalLink, AlertTriangle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, truncate } from '@/lib/utils'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SEO' }

async function SEOTable() {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return <EmptySEO />

  // Get latest snapshot per competitor
  const snapshots = await prisma.sEOSnapshot.findMany({
    where: { competitor: { organizationId: org.id } },
    orderBy: { checkedAt: 'desc' },
    take: 100,
    include: { competitor: { select: { name: true } } },
    distinct: ['competitorId'],
  })

  if (snapshots.length === 0) return <EmptySEO />

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Concurrent</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>H1</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Changements</TableHead>
            <TableHead>Vérifié le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snapshots.map((snap) => (
            <TableRow key={snap.id}>
              <TableCell>
                <span className="text-sm font-medium">{snap.competitor.name}</span>
              </TableCell>
              <TableCell>
                <a
                  href={snap.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground max-w-[180px] truncate"
                >
                  {snap.url}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {snap.title ? truncate(snap.title, 50) : '—'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {snap.h1 ? truncate(snap.h1, 40) : '—'}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    snap.statusCode === 200
                      ? 'success'
                      : snap.statusCode && snap.statusCode >= 400
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {snap.statusCode ?? '—'}
                </Badge>
              </TableCell>
              <TableCell>
                {snap.titleChanged || snap.metaChanged || snap.h1Changed ? (
                  <div className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-xs">
                      {[
                        snap.titleChanged && 'Title',
                        snap.metaChanged && 'Meta',
                        snap.h1Changed && 'H1',
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Aucun</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(snap.checkedAt)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptySEO() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Aucune donnée SEO</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Le module SEO vérifie quotidiennement les balises Title, Meta Description et H1 de vos
        concurrents.
      </p>
    </div>
  )
}

export default function SEOPage() {
  return (
    <div className="flex flex-col overflow-auto">
      <Header title="SEO" description="Monitoring des balises SEO de vos concurrents" />
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          <SEOTable />
        </Suspense>
      </div>
    </div>
  )
}
