import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { LLMDashboardClient } from '@/components/llm/LLMDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'LLM Visibility' }

export type LLMScoreRow = {
  id: string
  competitorId: string
  competitorName: string
  provider: string
  prompt: string
  response: string
  mentioned: boolean
  position: number | null
  sentiment: string | null
  score: number | null
  checkedAt: string
}

export type CompetitorOption = { id: string; name: string; brandName: string | null }

async function getLLMData() {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return null

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [scores, competitors] = await Promise.all([
    prisma.lLMScore.findMany({
      where: { competitor: { organizationId: org.id }, checkedAt: { gte: thirtyDaysAgo } },
      orderBy: { checkedAt: 'desc' },
      take: 200,
      include: { competitor: { select: { name: true, brandName: true } } },
    }),
    prisma.competitor.findMany({
      where: { organizationId: org.id, isActive: true, trackLlm: true },
      select: { id: true, name: true, brandName: true },
    }),
  ])

  return {
    scores: scores.map((s) => ({
      id: s.id,
      competitorId: s.competitorId,
      competitorName: s.competitor.name,
      provider: s.provider,
      prompt: s.prompt,
      response: s.response,
      mentioned: s.mentioned,
      position: s.position,
      sentiment: s.sentiment,
      score: s.score,
      checkedAt: s.checkedAt.toISOString(),
    })) as LLMScoreRow[],
    competitors: competitors as CompetitorOption[],
    orgId: org.id,
  }
}

export default async function LLMPage() {
  const data = await getLLMData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="LLM Visibility"
        description="Part de voix dans ChatGPT, Perplexity et les autres IA"
      />
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <Suspense fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        }>
          <LLMDashboardClient
            scores={data?.scores ?? []}
            competitors={data?.competitors ?? []}
            orgId={data?.orgId ?? ''}
          />
        </Suspense>
      </div>
    </div>
  )
}
