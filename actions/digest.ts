'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.spymark.io'

// ─── Toggle weekly digest ─────────────────────────────────────────────────────

export async function toggleWeeklyDigest(): Promise<{ enabled: boolean; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { enabled: false, error: 'Non authentifié' }

  const org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
  if (!org) return { enabled: false, error: 'Organisation introuvable' }

  await prisma.organization.update({
    where: { id: org.id },
    data: { weeklyDigest: !org.weeklyDigest },
  })
  return { enabled: !org.weeklyDigest }
}

// ─── Update alert email ───────────────────────────────────────────────────────

export async function updateAlertEmailSettings(email: string): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  await prisma.organization.updateMany({
    where: { clerkOrgId: userId },
    data: { alertEmail: email.trim() || null },
  })
  return {}
}

// ─── Get settings ─────────────────────────────────────────────────────────────

export async function getNotificationSettings(): Promise<{
  alertEmail: string | null
  weeklyDigest: boolean
} | null> {
  const { userId } = await auth()
  if (!userId) return null

  const org = await prisma.organization.findFirst({
    where: { clerkOrgId: userId },
    select: { alertEmail: true, weeklyDigest: true },
  })
  return org
}

// ─── Build + send digest ──────────────────────────────────────────────────────

export async function sendWeeklyDigestForOrg(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { alertEmail: true, clerkOrgId: true, weeklyDigest: true, name: true },
  })
  if (!org?.weeklyDigest) return

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [newAds, newEmails, seoChanges, competitors] = await Promise.all([
    prisma.ad.findMany({
      where: { competitor: { organizationId: orgId }, firstSeenAt: { gte: sevenDaysAgo } },
      orderBy: { firstSeenAt: 'desc' },
      take: 10,
      select: { platform: true, advertiserName: true, imageUrl: true, title: true, firstSeenAt: true },
    }),
    prisma.email.count({
      where: { competitor: { organizationId: orgId }, receivedAt: { gte: sevenDaysAgo } },
    }),
    prisma.sEOSnapshot.count({
      where: {
        competitor: { organizationId: orgId },
        checkedAt: { gte: sevenDaysAgo },
        OR: [{ titleChanged: true }, { metaChanged: true }, { h1Changed: true }],
      },
    }),
    prisma.competitor.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { name: true },
      take: 10,
    }),
  ])

  let toEmail = org.alertEmail
  if (!toEmail) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(org.clerkOrgId)
      toEmail = user.emailAddresses[0]?.emailAddress ?? null
    } catch { return }
  }
  if (!toEmail) return

  const html = buildDigestHtml({
    orgName: org.name,
    newAdsCount: newAds.length,
    newEmailsCount: newEmails,
    seoChangesCount: seoChanges,
    competitorCount: competitors.length,
    topAds: newAds.slice(0, 5),
    dashboardUrl: APP_URL + '/dashboard',
  })

  await sendEmail({
    to: toEmail,
    subject: `📊 Digest hebdo — ${newAds.length} nouvelles pubs, ${seoChanges} changements SEO`,
    html,
  })
}

// ─── Digest email template ────────────────────────────────────────────────────

function buildDigestHtml(opts: {
  orgName: string
  newAdsCount: number
  newEmailsCount: number
  seoChangesCount: number
  competitorCount: number
  topAds: Array<{ platform: string; advertiserName: string | null; imageUrl: string | null; title: string | null; firstSeenAt: Date }>
  dashboardUrl: string
}) {
  const week = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  const statBlock = (icon: string, value: number, label: string, color: string) => `
    <td style="text-align:center;padding:12px 16px">
      <div style="font-size:22px;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:11px;color:#71717a;margin-top:2px">${icon} ${label}</div>
    </td>`

  const adRows = opts.topAds.map(ad => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #1f1f23">
        <div style="display:flex;align-items:center;gap:10px">
          ${ad.imageUrl ? `<img src="${ad.imageUrl}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #27272a" alt="">` : `<div style="width:44px;height:44px;background:#18181b;border-radius:6px;border:1px solid #27272a"></div>`}
          <div>
            <div style="font-size:12px;font-weight:600;color:#fafafa">${ad.advertiserName ?? '—'}</div>
            <div style="font-size:11px;color:#71717a">${ad.platform} · ${ad.title ?? ''}</div>
          </div>
        </div>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e4e4e7">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px">
  <tr><td>
    <div style="margin-bottom:24px">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#7c3aed;font-family:monospace">SPYMARK</span>
    </div>

    <h1 style="font-size:20px;font-weight:700;margin:0 0 4px;color:#fafafa">Digest hebdomadaire</h1>
    <p style="font-size:13px;color:#71717a;margin:0 0 24px">Semaine du ${week} · ${opts.competitorCount} concurrent${opts.competitorCount > 1 ? 's' : ''} suivis</p>

    <!-- Stats -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;margin-bottom:24px">
      <tr>
        ${statBlock('📢', opts.newAdsCount, 'nouvelles pubs', '#a78bfa')}
        ${statBlock('📧', opts.newEmailsCount, 'emails reçus', '#60a5fa')}
        ${statBlock('📈', opts.seoChangesCount, 'changements SEO', '#34d399')}
      </tr>
    </table>

    ${opts.topAds.length > 0 ? `
    <!-- Top ads -->
    <div style="margin-bottom:24px">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#52525b;margin-bottom:8px;font-family:monospace">DERNIÈRES PUBS</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:4px 16px">
        <tbody>${adRows}</tbody>
      </table>
    </div>` : ''}

    <a href="${opts.dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600">
      Voir le tableau de bord →
    </a>

    <p style="font-size:11px;color:#3f3f46;margin-top:28px">
      Vous recevez ce digest car il est activé dans vos paramètres SpyMark.<br>
      <a href="${opts.dashboardUrl}/settings" style="color:#52525b">Désactiver le digest</a>
    </p>
  </td></tr>
</table>
</body></html>`
}
