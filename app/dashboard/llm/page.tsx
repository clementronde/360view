import { auth } from '@clerk/nextjs/server'
import { Brain } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, LLM_PROVIDER_LABELS, getScoreColor } from '@/lib/utils'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'LLM Visibility' }

async function LLMDashboard() {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return <EmptyLLM />

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const scores = await prisma.lLMScore.findMany({
    where: {
      competitor: { organizationId: org.id },
      checkedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { checkedAt: 'desc' },
    take: 50,
    include: {
      competitor: { select: { name: true, brandName: true } },
    },
  })

  if (scores.length === 0) return <EmptyLLM />

  // Aggregate stats per competitor
  const byCompetitor = scores.reduce(
    (acc, s) => {
      const key = s.competitorId
      if (!acc[key]) {
        acc[key] = {
          name: s.competitor.name,
          brandName: s.competitor.brandName,
          total: 0,
          mentioned: 0,
          totalScore: 0,
        }
      }
      acc[key].total++
      if (s.mentioned) acc[key].mentioned++
      acc[key].totalScore += s.score ?? 0
      return acc
    },
    {} as Record<
      string,
      { name: string; brandName: string | null; total: number; mentioned: number; totalScore: number }
    >
  )

  return (
    <div className="space-y-6">
      {/* Score cards per competitor */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(byCompetitor).map(([id, data]) => {
          const mentionRate = data.total > 0 ? (data.mentioned / data.total) * 100 : 0
          const avgScore = data.total > 0 ? (data.totalScore / data.total) * 100 : 0

          return (
            <Card key={id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{data.name}</CardTitle>
                {data.brandName && (
                  <p className="text-xs text-muted-foreground">{data.brandName}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Taux de mention</span>
                  <span className={`text-sm font-bold ${getScoreColor(mentionRate / 100)}`}>
                    {Math.round(mentionRate)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${mentionRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{data.mentioned}/{data.total} analyses</span>
                  <span>Score moy: <span className={getScoreColor(avgScore / 100)}>{Math.round(avgScore)}%</span></span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Historique des analyses</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {scores.slice(0, 20).map((score) => (
              <div
                key={score.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500/10">
                  <Brain className="h-3.5 w-3.5 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium">{score.competitor.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {LLM_PROVIDER_LABELS[score.provider] ?? score.provider}
                    </Badge>
                    {score.mentioned ? (
                      <Badge variant="success">Mentionné</Badge>
                    ) : (
                      <Badge variant="secondary">Non mentionné</Badge>
                    )}
                    {score.sentiment && (
                      <Badge
                        variant={
                          score.sentiment === 'positive'
                            ? 'success'
                            : score.sentiment === 'negative'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {score.sentiment}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{score.prompt}</p>
                </div>
                <div className="shrink-0 text-right">
                  {score.score !== null && (
                    <p className={`text-sm font-bold ${getScoreColor(score.score)}`}>
                      {Math.round(score.score * 100)}%
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDateTime(score.checkedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyLLM() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
        <Brain className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Aucune analyse LLM</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Le module LLM Visibility teste chaque semaine si vos concurrents sont mentionnés par
        ChatGPT, Perplexity et d'autres modèles de langage.
      </p>
    </div>
  )
}

export default function LLMPage() {
  return (
    <div className="flex flex-col overflow-auto">
      <Header title="LLM Visibility" description="Part de visibilité dans les modèles de langage" />
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>}>
          <LLMDashboard />
        </Suspense>
      </div>
    </div>
  )
}
