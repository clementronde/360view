'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadScreenshot } from '@/lib/supabase'
import { checkFeature } from '@/actions/plan'

export async function captureAdLandingPage(adId: string): Promise<{
  imageUrl: string | null
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) return { imageUrl: null, error: 'Non authentifié' }

  const gate = await checkFeature('landingCapture')
  if (!gate.allowed) return { imageUrl: null, error: gate.reason ?? 'Fonctionnalité non disponible sur votre plan' }

  const ad = await prisma.ad.findFirst({
    where: { id: adId },
    select: {
      id: true,
      landingUrl: true,
      landingPageImageUrl: true,
      landingPageCapturedAt: true,
      competitor: { select: { organizationId: true } },
    },
  })

  if (!ad) return { imageUrl: null, error: 'Publicité introuvable' }
  if (!ad.landingUrl || ad.landingUrl === '#') return { imageUrl: null, error: 'Aucune URL de destination' }

  // Return cached capture if recent
  if (ad.landingPageImageUrl && ad.landingPageCapturedAt) {
    return { imageUrl: ad.landingPageImageUrl }
  }

  try {
    const { takeWebsiteScreenshot } = await import('@/lib/scraping/ads')
    const buffer = await takeWebsiteScreenshot(ad.landingUrl)
    if (!buffer) return { imageUrl: null, error: 'Screenshot échoué' }

    const filename = `landing-${adId}-${Date.now()}.png`
    const uploaded = await uploadScreenshot(buffer, filename)
    if (!uploaded) return { imageUrl: null, error: 'Upload échoué' }

    await prisma.ad.update({
      where: { id: adId },
      data: {
        landingPageImageUrl: uploaded.url,
        landingPageCapturedAt: new Date(),
      },
    })

    return { imageUrl: uploaded.url }
  } catch (err) {
    console.error('[captureAdLandingPage]', err)
    return { imageUrl: null, error: 'Erreur lors de la capture' }
  }
}
