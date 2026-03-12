'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
  })

  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId: userId,
        name: 'Mon espace',
        slug: `org-${userId.slice(-8)}`,
      },
    })
  }

  return org
}

export async function getDashboardStats() {
  const { userId } = await auth()
  if (!userId) return null

  const org = await getOrCreateOrg(userId)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalCompetitors,
    activeCompetitors,
    adsThisWeek,
    emailsThisMonth,
    latestActivities,
    llmScores,
  ] = await Promise.all([
    prisma.competitor.count({ where: { organizationId: org.id } }),
    prisma.competitor.count({ where: { organizationId: org.id, isActive: true } }),
    prisma.ad.count({
      where: {
        competitor: { organizationId: org.id },
        firstSeenAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.email.count({
      where: {
        competitor: { organizationId: org.id },
        receivedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.activity.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.lLMScore.findMany({
      where: {
        competitor: { organizationId: org.id },
        checkedAt: { gte: thirtyDaysAgo },
      },
      select: { score: true, mentioned: true },
    }),
  ])

  const avgLlmScore =
    llmScores.length > 0
      ? llmScores.reduce((acc: number, s: { score: number | null; mentioned: boolean }) => acc + (s.score ?? 0), 0) / llmScores.length
      : null

  const llmMentionRate =
    llmScores.length > 0
      ? (llmScores.filter((s: { mentioned: boolean }) => s.mentioned).length / llmScores.length) * 100
      : null

  return {
    totalCompetitors,
    activeCompetitors,
    adsThisWeek,
    emailsThisMonth,
    avgLlmScore,
    llmMentionRate,
    recentActivities: latestActivities,
  }
}
