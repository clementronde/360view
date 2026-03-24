import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { ContentCalendarClient } from '@/components/calendar/ContentCalendarClient'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendrier' }

export type CalendarEvent = {
  competitorId: string
  date: string          // YYYY-MM-DD
  type: 'AD' | 'EMAIL' | 'SMS' | 'SEO' | 'LLM'
  count: number
}

export type CalendarCompetitor = {
  id: string
  name: string
  website: string
  logoUrl: string | null
}

async function getCalendarData() {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return null

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [competitors, ads, emails, smsMessages, seoSnapshots, llmScores] = await Promise.all([
    prisma.competitor.findMany({
      where: { organizationId: org.id, isActive: true },
      select: { id: true, name: true, website: true, logoUrl: true },
      orderBy: { name: 'asc' },
    }),
    prisma.ad.findMany({
      where: { competitor: { organizationId: org.id }, firstSeenAt: { gte: thirtyDaysAgo } },
      select: { competitorId: true, firstSeenAt: true },
    }),
    prisma.email.findMany({
      where: { competitor: { organizationId: org.id }, receivedAt: { gte: thirtyDaysAgo } },
      select: { competitorId: true, receivedAt: true },
    }),
    prisma.sMSMessage.findMany({
      where: { competitor: { organizationId: org.id }, receivedAt: { gte: thirtyDaysAgo } },
      select: { competitorId: true, receivedAt: true },
    }),
    prisma.sEOSnapshot.findMany({
      where: {
        competitor: { organizationId: org.id },
        checkedAt: { gte: thirtyDaysAgo },
        OR: [{ titleChanged: true }, { metaChanged: true }, { h1Changed: true }],
      },
      select: { competitorId: true, checkedAt: true },
    }),
    prisma.lLMScore.findMany({
      where: { competitor: { organizationId: org.id }, checkedAt: { gte: thirtyDaysAgo }, mentioned: true },
      select: { competitorId: true, checkedAt: true },
    }),
  ])

  function toDay(d: Date) { return d.toISOString().slice(0, 10) }

  const eventMap = new Map<string, CalendarEvent>()
  function add(competitorId: string | null, date: Date, type: CalendarEvent['type']) {
    if (!competitorId) return
    const key = `${competitorId}|${toDay(date)}|${type}`
    const existing = eventMap.get(key)
    if (existing) existing.count++
    else eventMap.set(key, { competitorId, date: toDay(date), type, count: 1 })
  }

  for (const a of ads) add(a.competitorId, a.firstSeenAt, 'AD')
  for (const e of emails) add(e.competitorId, e.receivedAt, 'EMAIL')
  for (const s of smsMessages) add(s.competitorId, s.receivedAt, 'SMS')
  for (const s of seoSnapshots) add(s.competitorId, s.checkedAt, 'SEO')
  for (const l of llmScores) add(l.competitorId, l.checkedAt, 'LLM')

  return {
    competitors: competitors as CalendarCompetitor[],
    events: Array.from(eventMap.values()),
  }
}

export default async function CalendarPage() {
  const data = await getCalendarData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Calendrier"
        description="Activité des 30 derniers jours par concurrent"
      />
      <div className="flex-1 overflow-auto">
        <Suspense fallback={
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg w-full" />)}
          </div>
        }>
          <ContentCalendarClient
            competitors={data?.competitors ?? []}
            events={data?.events ?? []}
          />
        </Suspense>
      </div>
    </div>
  )
}
