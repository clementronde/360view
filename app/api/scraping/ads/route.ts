import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeMetaAds } from '@/lib/scraping/ads'
import { uploadScreenshot } from '@/lib/supabase'

/**
 * POST /api/scraping/ads
 * Trigger ad scraping for all active competitors with trackAds: true.
 * Should be called by a cron job (e.g., daily via Vercel Cron or external scheduler).
 *
 * Secured with an internal secret.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.APP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const competitors = await prisma.competitor.findMany({
    where: { isActive: true, trackAds: true },
    include: { organization: true },
  })

  const results: Array<{ competitorId: string; adsFound: number; error?: string }> = []

  for (const competitor of competitors) {
    try {
      const brandName = competitor.brandName ?? competitor.name
      const scrapedAds = await scrapeMetaAds(brandName)

      let adsCreated = 0

      for (const ad of scrapedAds) {
        let imageUrl: string | undefined
        let imageKey: string | undefined

        // Upload screenshot to Supabase Storage
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
            title: ad.title,
            description: ad.description,
            imageUrl,
            imageKey,
            ctaText: ad.ctaText,
            landingUrl: ad.landingUrl,
            rawData: ad.rawData ? (ad.rawData as object) : undefined,
          },
        })

        adsCreated++
      }

      if (adsCreated > 0) {
        await prisma.activity.create({
          data: {
            organizationId: competitor.organizationId,
            type: 'AD_DETECTED',
            title: `${adsCreated} nouvelle${adsCreated > 1 ? 's' : ''} pub${adsCreated > 1 ? 's' : ''} détectée${adsCreated > 1 ? 's' : ''}`,
            description: `${competitor.name} — Meta Ads Library`,
            entityId: competitor.id,
            competitorName: competitor.name,
          },
        })
      }

      results.push({ competitorId: competitor.id, adsFound: adsCreated })
    } catch (error) {
      console.error(`[Scraping Ads] Error for ${competitor.name}:`, error)
      results.push({
        competitorId: competitor.id,
        adsFound: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ success: true, results })
}
