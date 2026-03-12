/**
 * LLM Visibility checker.
 * Tests brand mention share across OpenAI (ChatGPT) and Perplexity.
 */

export interface LLMVisibilityResult {
  provider: 'OPENAI' | 'PERPLEXITY' | 'ANTHROPIC' | 'GEMINI'
  prompt: string
  response: string
  mentioned: boolean
  position?: number
  sentiment?: 'positive' | 'negative' | 'neutral'
  score: number
}

// ─── Standard prompts ─────────────────────────────────────────────────────────

export function buildVisibilityPrompts(
  brandName: string,
  industry: string = 'logiciels'
): string[] {
  return [
    `Quels sont les meilleurs outils de ${industry} pour les entreprises françaises ?`,
    `Quelles solutions recommandes-tu pour ${industry} en France ?`,
    `Compare les principaux acteurs de ${industry} sur le marché français.`,
    `Quels outils utiliser pour ${industry} en tant que PME française ?`,
  ]
}

// ─── Mention detection ────────────────────────────────────────────────────────

function detectMention(
  response: string,
  brandName: string
): { mentioned: boolean; position?: number; sentiment?: 'positive' | 'negative' | 'neutral' } {
  const lowerResponse = response.toLowerCase()
  const lowerBrand = brandName.toLowerCase()

  if (!lowerResponse.includes(lowerBrand)) {
    return { mentioned: false }
  }

  // Find approximate position (1st paragraph = 1, 2nd = 2, etc.)
  const paragraphs = response.split('\n').filter((p) => p.trim())
  const position =
    paragraphs.findIndex((p) => p.toLowerCase().includes(lowerBrand)) + 1 || undefined

  // Simple sentiment heuristic based on surrounding words
  const brandIndex = lowerResponse.indexOf(lowerBrand)
  const context = lowerResponse.slice(Math.max(0, brandIndex - 100), brandIndex + 200)

  const positiveWords = ['excellent', 'recommandé', 'meilleur', 'idéal', 'puissant', 'fiable']
  const negativeWords = ['problème', 'limité', 'cher', 'difficile', 'complexe']

  const hasPositive = positiveWords.some((w) => context.includes(w))
  const hasNegative = negativeWords.some((w) => context.includes(w))

  const sentiment = hasPositive && !hasNegative ? 'positive' : hasNegative ? 'negative' : 'neutral'

  return { mentioned: true, position, sentiment }
}

function calculateScore(mentioned: boolean, position?: number): number {
  if (!mentioned) return 0
  if (!position) return 0.5
  // Higher score for earlier mentions
  return Math.max(0.1, 1 - (position - 1) * 0.15)
}

// ─── OpenAI (ChatGPT) ─────────────────────────────────────────────────────────

export async function checkOpenAI(
  prompt: string,
  brandName: string
): Promise<LLMVisibilityResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices[0]?.message?.content ?? ''

  const { mentioned, position, sentiment } = detectMention(text, brandName)
  const score = calculateScore(mentioned, position)

  return {
    provider: 'OPENAI',
    prompt,
    response: text,
    mentioned,
    position,
    sentiment,
    score,
  }
}

// ─── Perplexity ───────────────────────────────────────────────────────────────

export async function checkPerplexity(
  prompt: string,
  brandName: string
): Promise<LLMVisibilityResult> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices[0]?.message?.content ?? ''

  const { mentioned, position, sentiment } = detectMention(text, brandName)
  const score = calculateScore(mentioned, position)

  return {
    provider: 'PERPLEXITY',
    prompt,
    response: text,
    mentioned,
    position,
    sentiment,
    score,
  }
}

// ─── Run full LLM visibility check for a brand ───────────────────────────────

export async function runLLMVisibilityCheck(
  brandName: string,
  industry?: string
): Promise<LLMVisibilityResult[]> {
  const prompts = buildVisibilityPrompts(brandName, industry)
  const results: LLMVisibilityResult[] = []

  for (const prompt of prompts.slice(0, 2)) {
    // Limit to 2 prompts per run for cost control
    try {
      if (process.env.OPENAI_API_KEY) {
        const result = await checkOpenAI(prompt, brandName)
        results.push(result)
      }
    } catch (error) {
      console.error('[LLM] OpenAI check failed:', error)
    }

    try {
      if (process.env.PERPLEXITY_API_KEY) {
        const result = await checkPerplexity(prompt, brandName)
        results.push(result)
      }
    } catch (error) {
      console.error('[LLM] Perplexity check failed:', error)
    }
  }

  return results
}
