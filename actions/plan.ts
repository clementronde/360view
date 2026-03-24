'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getLimits, type PlanLimits } from '@/lib/planLimits'
import type { Plan } from '@prisma/client'

export type PlanGate = {
  allowed: boolean
  plan: Plan
  limits: PlanLimits
  /** Set when the user has hit a hard limit */
  reason?: string
}

/**
 * Get the current org's plan + limits.
 * Returns null if not authenticated or org not found.
 */
export async function getOrgPlan(): Promise<{ plan: Plan; limits: PlanLimits; orgId: string } | null> {
  const { userId } = await auth()
  if (!userId) return null
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
    select: { id: true, plan: true },
  })
  if (!org) return null
  return { plan: org.plan, limits: getLimits(org.plan), orgId: org.id }
}

/**
 * Check if adding a competitor is allowed (quota guard).
 */
export async function checkCanAddCompetitor(): Promise<PlanGate> {
  const ctx = await getOrgPlan()
  if (!ctx) return { allowed: false, plan: 'FREE', limits: getLimits('FREE'), reason: 'Non authentifié' }

  const { plan, limits, orgId } = ctx
  if (limits.maxCompetitors === 0) return { allowed: true, plan, limits }

  const count = await prisma.competitor.count({ where: { organizationId: orgId } })
  if (count >= limits.maxCompetitors) {
    return {
      allowed: false,
      plan,
      limits,
      reason: `Votre plan ${plan} est limité à ${limits.maxCompetitors} concurrent${limits.maxCompetitors > 1 ? 's' : ''}. Passez à un plan supérieur pour en ajouter davantage.`,
    }
  }
  return { allowed: true, plan, limits }
}

/**
 * Check if a feature is available on the current plan.
 */
export async function checkFeature(feature: keyof PlanLimits): Promise<PlanGate> {
  const ctx = await getOrgPlan()
  if (!ctx) return { allowed: false, plan: 'FREE', limits: getLimits('FREE'), reason: 'Non authentifié' }

  const { plan, limits } = ctx
  const val = limits[feature]
  const allowed = typeof val === 'boolean' ? val : (val as number) !== 0

  if (!allowed) {
    return {
      allowed: false,
      plan,
      limits,
      reason: `Cette fonctionnalité n'est pas disponible sur le plan ${plan}.`,
    }
  }
  return { allowed: true, plan, limits }
}
