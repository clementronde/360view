'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { deleteScreenshot } from '@/lib/supabase'

export type ResetAdsResult = {
  deleted: number
  error?: string
}

/**
 * Delete all discovery ads (source=DISCOVERY) — images from Supabase Storage + DB rows.
 * Keeps ads from competitor tracking (source=COMPETITOR_TRACKING).
 */
export async function resetDiscoveryAds(): Promise<ResetAdsResult> {
  const { userId } = await auth()
  if (!userId) return { deleted: 0, error: 'Non authentifié' }

  // Fetch all discovery ads that have a Supabase image key
  const ads = await prisma.ad.findMany({
    where: { source: 'DISCOVERY' },
    select: { id: true, imageKey: true },
  })

  if (ads.length === 0) return { deleted: 0 }

  // Delete images from Supabase Storage in parallel (best effort)
  const imageKeys = ads.map((a) => a.imageKey).filter(Boolean) as string[]
  await Promise.allSettled(imageKeys.map((key) => deleteScreenshot(key)))

  // Delete all DISCOVERY ads from DB
  const { count } = await prisma.ad.deleteMany({ where: { source: 'DISCOVERY' } })

  return { deleted: count }
}
