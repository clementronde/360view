import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runLLMVisibilityCheck } from '@/lib/llm'

/**
 * POST /api/llm
 * Trigger LLM visibility check for all active competitors with trackLlm: true.
 * Should be called weekly by a cron job.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.APP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const competitors = await prisma.competitor.findMany({
    where: { isActive: true, trackLlm: true },
    include: { organization: true },
  })

  const results: Array<{ competitorId: string; checksRun: number; error?: string }> = []

  for (const competitor of competitors) {
    try {
      const brandName = competitor.brandName ?? competitor.name
      const llmResults = await runLLMVisibilityCheck(brandName)

      for (const result of llmResults) {
        await prisma.lLMScore.create({
          data: {
            competitorId: competitor.id,
            provider: result.provider,
            prompt: result.prompt,
            response: result.response,
            mentioned: result.mentioned,
            position: result.position,
            sentiment: result.sentiment,
            score: result.score,
          },
        })
      }

      if (llmResults.length > 0) {
        await prisma.activity.create({
          data: {
            organizationId: competitor.organizationId,
            type: 'LLM_CHECKED',
            title: `Analyse LLM terminée — ${competitor.name}`,
            description: `${llmResults.filter((r) => r.mentioned).length}/${llmResults.length} modèles mentionnent la marque`,
            entityId: competitor.id,
            competitorName: competitor.name,
          },
        })
      }

      results.push({ competitorId: competitor.id, checksRun: llmResults.length })
    } catch (error) {
      console.error(`[LLM Check] Error for ${competitor.name}:`, error)
      results.push({
        competitorId: competitor.id,
        checksRun: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ success: true, results })
}
