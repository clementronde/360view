'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, newAdAlertHtml, seoChangeAlertHtml } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.spymark.io'

// ─── Toggle alert on a competitor ─────────────────────────────────────────────

export async function toggleCompetitorAlert(
  competitorId: string,
  field: 'alertNewAds' | 'alertSeoChange' | 'alertLlmChange'
): Promise<{ enabled: boolean; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { enabled: false, error: 'Non authentifié' }

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return { enabled: false, error: 'Organisation introuvable' }

  const competitor = await prisma.competitor.findFirst({
    where: { id: competitorId, organizationId: org.id },
    select: { id: true, alertNewAds: true, alertSeoChange: true, alertLlmChange: true },
  })
  if (!competitor) return { enabled: false, error: 'Concurrent introuvable' }

  const current = competitor[field]
  await prisma.competitor.update({
    where: { id: competitorId },
    data: { [field]: !current },
  })

  return { enabled: !current }
}

// ─── Update alert email for the org ──────────────────────────────────────────

export async function updateAlertEmail(email: string): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  await prisma.organization.updateMany({
    where: { clerkOrgId: userId },
    data: { alertEmail: email || null },
  })
  return {}
}

// ─── Send new ad alert (called from cron / action) ───────────────────────────

export async function sendNewAdAlert(opts: {
  organizationId: string
  competitorName: string
  platform: string
  adTitle?: string | null
  adImageUrl?: string | null
  adId: string
}): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: opts.organizationId },
    select: { alertEmail: true, clerkOrgId: true },
  })
  if (!org) return

  // Resolve destination email — use alertEmail if set, otherwise get from Clerk
  let toEmail = org.alertEmail
  if (!toEmail) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(org.clerkOrgId)
      toEmail = user.emailAddresses[0]?.emailAddress ?? null
    } catch {
      console.warn('[alerts] Could not fetch Clerk email')
      return
    }
  }

  if (!toEmail) return

  const dashboardUrl = `${APP_URL}/dashboard`

  await sendEmail({
    to: toEmail,
    subject: `🎯 Nouvelle pub ${opts.platform} — ${opts.competitorName}`,
    html: newAdAlertHtml({
      competitorName: opts.competitorName,
      platform: opts.platform,
      adTitle: opts.adTitle,
      adImageUrl: opts.adImageUrl,
      dashboardUrl,
    }),
  })
}

// ─── Send SEO change alert ────────────────────────────────────────────────────

export async function sendSeoChangeAlert(opts: {
  organizationId: string
  competitorName: string
  changedFields: string[]
}): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: opts.organizationId },
    select: { alertEmail: true, clerkOrgId: true },
  })
  if (!org) return

  let toEmail = org.alertEmail
  if (!toEmail) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(org.clerkOrgId)
      toEmail = user.emailAddresses[0]?.emailAddress ?? null
    } catch {
      return
    }
  }
  if (!toEmail) return

  await sendEmail({
    to: toEmail,
    subject: `📈 Changement SEO — ${opts.competitorName}`,
    html: seoChangeAlertHtml({
      competitorName: opts.competitorName,
      changedFields: opts.changedFields,
      dashboardUrl: `${APP_URL}/dashboard`,
    }),
  })
}

// ─── Get alert preferences for a competitor ──────────────────────────────────

export async function getCompetitorAlerts(competitorId: string): Promise<{
  alertNewAds: boolean
  alertSeoChange: boolean
  alertLlmChange: boolean
  orgAlertEmail: string | null
} | null> {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
    select: { alertEmail: true },
  })

  const competitor = await prisma.competitor.findFirst({
    where: { id: competitorId },
    select: { alertNewAds: true, alertSeoChange: true, alertLlmChange: true },
  })

  if (!competitor) return null

  return {
    alertNewAds: competitor.alertNewAds,
    alertSeoChange: competitor.alertSeoChange,
    alertLlmChange: competitor.alertLlmChange,
    orgAlertEmail: org?.alertEmail ?? null,
  }
}
