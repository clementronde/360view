'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { scrapeMetaAds } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

async function getOrCreateOrg(userId: string) {
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: userId } })
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

export async function triggerAdsScraping(): Promise<{ success: boolean; total: number; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { success: false, total: 0, error: 'Non authentifié' }

  const org = await getOrCreateOrg(userId)

  const competitors = await prisma.competitor.findMany({
    where: { organizationId: org.id, isActive: true, trackAds: true },
  })

  if (competitors.length === 0) {
    return { success: true, total: 0 }
  }

  let totalCreated = 0

  for (const competitor of competitors) {
    try {
      const brandName = competitor.brandName ?? competitor.name
      const scrapedAds = await scrapeMetaAds(brandName)

      for (const ad of scrapedAds) {
        let imageUrl: string | undefined
        let imageKey: string | undefined

        if (ad.imageBuffer && ad.imageFilename) {
          const uploaded = await uploadScreenshot(ad.imageBuffer, ad.imageFilename)
          if (uploaded) {
            imageUrl = uploaded.url
            imageKey = uploaded.key
          }
        }

        await prisma.ad.create({
          data: {
            competitorId: competitor.id,
            platform: ad.platform,
            format: ad.format ?? 'DISPLAY',
            source: 'COMPETITOR_TRACKING',
            title: ad.title,
            description: ad.description,
            imageUrl,
            imageKey,
            ctaText: ad.ctaText,
            landingUrl: ad.landingUrl,
            rawData: ad.rawData ? (ad.rawData as object) : undefined,
          },
        })

        totalCreated++
      }

      if (totalCreated > 0) {
        await prisma.activity.create({
          data: {
            organizationId: org.id,
            type: 'AD_DETECTED',
            title: `${totalCreated} nouvelle${totalCreated > 1 ? 's' : ''} pub${totalCreated > 1 ? 's' : ''} détectée${totalCreated > 1 ? 's' : ''}`,
            description: `${competitor.name} — Meta Ads Library`,
            entityId: competitor.id,
            competitorName: competitor.name,
          },
        })
      }
    } catch (error) {
      console.error(`[triggerAdsScraping] Error for ${competitor.name}:`, error)
    }
  }

  revalidatePath('/dashboard/ads')
  return { success: true, total: totalCreated }
}
