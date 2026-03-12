import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkSEO, detectSEOChanges } from '@/lib/scraping/seo'

/**
 * POST /api/scraping/seo
 * Trigger SEO check for all active competitors with trackSeo: true.
 * Should be called daily by a cron job.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.APP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const competitors = await prisma.competitor.findMany({
    where: { isActive: true, trackSeo: true },
    include: { organization: true },
  })

  const results: Array<{ competitorId: string; changed: boolean; error?: string }> = []

  for (const competitor of competitors) {
    try {
      const seoData = await checkSEO(competitor.website)

      // Get latest snapshot to detect changes
      const latestSnapshot = await prisma.sEOSnapshot.findFirst({
        where: { competitorId: competitor.id },
        orderBy: { checkedAt: 'desc' },
      })

      const changes = latestSnapshot
        ? detectSEOChanges(latestSnapshot, seoData)
        : { titleChanged: false, metaChanged: false, h1Changed: false, hasChanges: false }

      await prisma.sEOSnapshot.create({
        data: {
          competitorId: competitor.id,
          url: seoData.url,
          title: seoData.title,
          metaDesc: seoData.metaDesc,
          h1: seoData.h1,
          keywords: seoData.keywords,
          ogTitle: seoData.ogTitle,
          ogDesc: seoData.ogDesc,
          statusCode: seoData.statusCode,
          loadTime: seoData.loadTime,
          titleChanged: changes.titleChanged,
          metaChanged: changes.metaChanged,
          h1Changed: changes.h1Changed,
        },
      })

      if (changes.hasChanges) {
        const changedFields = [
          changes.titleChanged && 'Title',
          changes.metaChanged && 'Meta description',
          changes.h1Changed && 'H1',
        ]
          .filter(Boolean)
          .join(', ')

        await prisma.activity.create({
          data: {
            organizationId: competitor.organizationId,
            type: 'SEO_CHANGED',
            title: `Changement SEO détecté — ${competitor.name}`,
            description: changedFields,
            entityId: competitor.id,
            competitorName: competitor.name,
          },
        })
      }

      results.push({ competitorId: competitor.id, changed: changes.hasChanges })
    } catch (error) {
      console.error(`[SEO Check] Error for ${competitor.name}:`, error)
      results.push({
        competitorId: competitor.id,
        changed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ success: true, results })
}
