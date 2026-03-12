/**
 * SEO checker — fetches a URL and extracts meta tags, H1, title, OG tags.
 * Implements exponential backoff for retries.
 */

export interface SEOData {
  url: string
  title?: string
  metaDesc?: string
  h1?: string
  keywords: string[]
  ogTitle?: string
  ogDesc?: string
  statusCode: number
  loadTime: number
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        console.warn(`[SEO] Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  throw lastError
}

// ─── Extract meta tag content ────────────────────────────────────────────────

function extractMeta(html: string, name: string): string | undefined {
  const patterns = [
    new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+name=["']${name}["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

function extractOGMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta\\s+property=["']og:${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']og:${property}["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].trim()
  }
  return undefined
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : undefined
}

function extractH1(html: string): string | undefined {
  const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  return match ? match[1].replace(/<[^>]+>/g, '').trim() : undefined
}

function extractKeywords(html: string): string[] {
  const content = extractMeta(html, 'keywords')
  if (!content) return []
  return content
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 10)
}

// ─── Main SEO check function ──────────────────────────────────────────────────

export async function checkSEO(url: string): Promise<SEOData> {
  return withRetry(async () => {
    const startTime = Date.now()

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; 360ViewBot/1.0; +https://360view.io/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })

    const loadTime = Date.now() - startTime
    const html = await response.text()

    return {
      url,
      title: extractTitle(html),
      metaDesc: extractMeta(html, 'description'),
      h1: extractH1(html),
      keywords: extractKeywords(html),
      ogTitle: extractOGMeta(html, 'title'),
      ogDesc: extractOGMeta(html, 'description'),
      statusCode: response.status,
      loadTime,
    }
  })
}

// ─── Detect changes between two snapshots ────────────────────────────────────

export interface SEOChanges {
  titleChanged: boolean
  metaChanged: boolean
  h1Changed: boolean
  hasChanges: boolean
}

export function detectSEOChanges(
  previous: { title?: string | null; metaDesc?: string | null; h1?: string | null },
  current: SEOData
): SEOChanges {
  const titleChanged = !!previous.title && previous.title !== current.title
  const metaChanged = !!previous.metaDesc && previous.metaDesc !== current.metaDesc
  const h1Changed = !!previous.h1 && previous.h1 !== current.h1

  return {
    titleChanged,
    metaChanged,
    h1Changed,
    hasChanges: titleChanged || metaChanged || h1Changed,
  }
}
