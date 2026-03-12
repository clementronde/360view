'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateTrackingEmail, slugify } from '@/lib/utils'

// ─── Schema ───────────────────────────────────────────────────────────────────

const competitorSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  website: z.string().url("L'URL du site est invalide"),
  description: z.string().max(500).optional(),
  brandName: z.string().max(100).optional(),
  trackAds: z.boolean().default(true),
  trackEmails: z.boolean().default(false),
  trackSms: z.boolean().default(false),
  trackSeo: z.boolean().default(true),
  trackLlm: z.boolean().default(false),
})

// ─── Get or create organization for the current user ─────────────────────────

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

// ─── Create competitor ────────────────────────────────────────────────────────

export async function createCompetitor(formData: z.infer<typeof competitorSchema>) {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  const parsed = competitorSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const org = await getOrCreateOrg(userId)
  const data = parsed.data

  // Generate tracking email if email tracking is enabled
  const trackingEmail = data.trackEmails
    ? generateTrackingEmail(data.name, org.slug)
    : undefined

  try {
    const competitor = await prisma.competitor.create({
      data: {
        organizationId: org.id,
        name: data.name,
        website: data.website,
        description: data.description,
        brandName: data.brandName || data.name,
        trackingEmail,
        trackAds: data.trackAds,
        trackEmails: data.trackEmails,
        trackSms: data.trackSms,
        trackSeo: data.trackSeo,
        trackLlm: data.trackLlm,
      },
    })

    await prisma.activity.create({
      data: {
        organizationId: org.id,
        type: 'COMPETITOR_ADDED',
        title: `Nouveau concurrent ajouté`,
        description: `${data.name} (${data.website})`,
        entityId: competitor.id,
        competitorName: data.name,
      },
    })

    revalidatePath('/dashboard/concurrents')
    revalidatePath('/dashboard')
    return { success: true, competitor }
  } catch (error) {
    console.error('[createCompetitor]', error)
    return { error: 'Erreur lors de la création du concurrent' }
  }
}

// ─── Update competitor ────────────────────────────────────────────────────────

export async function updateCompetitor(
  id: string,
  formData: Partial<z.infer<typeof competitorSchema>>
) {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const existing = await prisma.competitor.findFirst({
    where: { id, organizationId: org.id },
  })

  if (!existing) return { error: 'Concurrent introuvable' }

  // Generate tracking email if email tracking is being enabled
  let trackingEmail = existing.trackingEmail
  if (formData.trackEmails && !existing.trackingEmail) {
    trackingEmail = generateTrackingEmail(existing.name, org.slug)
  }

  try {
    const updated = await prisma.competitor.update({
      where: { id },
      data: {
        ...formData,
        trackingEmail,
        updatedAt: new Date(),
      },
    })

    revalidatePath('/dashboard/concurrents')
    revalidatePath(`/dashboard/concurrents/${id}`)
    return { success: true, competitor: updated }
  } catch (error) {
    console.error('[updateCompetitor]', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

// ─── Delete competitor ────────────────────────────────────────────────────────

export async function deleteCompetitor(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const existing = await prisma.competitor.findFirst({
    where: { id, organizationId: org.id },
  })

  if (!existing) return { error: 'Concurrent introuvable' }

  try {
    await prisma.competitor.delete({ where: { id } })
    revalidatePath('/dashboard/concurrents')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('[deleteCompetitor]', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

// ─── Toggle competitor active state ──────────────────────────────────────────

export async function toggleCompetitorActive(id: string, isActive: boolean) {
  const { userId } = await auth()
  if (!userId) return { error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const existing = await prisma.competitor.findFirst({
    where: { id, organizationId: org.id },
  })

  if (!existing) return { error: 'Concurrent introuvable' }

  try {
    await prisma.competitor.update({
      where: { id },
      data: { isActive },
    })

    revalidatePath('/dashboard/concurrents')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la mise à jour' }
  }
}

// ─── Get competitors for current org ─────────────────────────────────────────

export async function getCompetitors() {
  const { userId } = await auth()
  if (!userId) return []

  const org = await getOrCreateOrg(userId)

  return prisma.competitor.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { ads: true, emails: true, smsMessages: true, seoSnapshots: true, llmScores: true },
      },
    },
  })
}
