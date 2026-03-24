'use server'

export type MetaPageResult = {
  name: string
  pageId: string
  pictureUrl: string | null
  subtitle: string | null // category or follower count hint
}

/**
 * Search Facebook Ad Library for pages matching a query.
 * Returns up to 10 page suggestions with name, page ID, and profile picture.
 */
export async function searchMetaPages(
  query: string
): Promise<{ pages: MetaPageResult[]; error?: string }> {
  if (!query.trim()) return { pages: [] }

  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
  })
  const page = await context.newPage()

  try {
    // This URL shows a list of matching pages before selecting one
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(query)}&search_type=page_like_and_ads_published`
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 40000 })

    // Handle cookie consent
    const cookieSelectors = [
      'button[data-testid="cookie-policy-manage-dialog-accept-button"]',
      'button:has-text("Allow all cookies")',
      'button:has-text("Autoriser tous les cookies")',
      'button:has-text("Accept all")',
      'button:has-text("Accepter tout")',
      '[aria-label="Allow all cookies"]',
      'div[role="dialog"] button:last-child',
    ]
    for (const sel of cookieSelectors) {
      try { await page.click(sel, { timeout: 2500 }); await page.waitForTimeout(800); break } catch { /* next */ }
    }

    await page.waitForTimeout(5000)

    // Extract all links that contain view_all_page_id — these are page-specific Ad Library links
    const results: MetaPageResult[] = await page.evaluate(() => {
      const seen = new Set<string>()
      const out: Array<{ name: string; pageId: string; pictureUrl: string | null; subtitle: string | null }> = []

      // Strategy 1: find all anchor tags with view_all_page_id in href
      const links = Array.from(document.querySelectorAll('a[href*="view_all_page_id"]'))
      for (const link of links) {
        const href = link.getAttribute('href') ?? ''
        const m = href.match(/view_all_page_id=(\d+)/)
        if (!m) continue
        const pageId = m[1]
        if (seen.has(pageId)) continue
        seen.add(pageId)

        // Walk up to find the card container
        let container: Element | null = link
        for (let i = 0; i < 8; i++) {
          container = container?.parentElement ?? null
          if (!container) break
          const imgs = container.querySelectorAll('img')
          const texts = Array.from(container.querySelectorAll('span, div'))
            .map(el => el.textContent?.trim() ?? '')
            .filter(t => t.length > 1 && t.length < 120)

          if (imgs.length > 0 || texts.length > 1) {
            const pic = imgs[0]?.src ?? null
            const name = texts.find(t => t.length > 2 && !t.includes('http')) ?? link.textContent?.trim() ?? ''
            const subtitle = texts.find(t => t !== name && t.length > 2) ?? null
            if (name) {
              out.push({ name, pageId, pictureUrl: pic, subtitle })
            }
            break
          }
        }

        // Fallback if no container found
        if (!out.find(r => r.pageId === pageId)) {
          const name = link.textContent?.trim() ?? `Page ${pageId}`
          out.push({ name, pageId, pictureUrl: null, subtitle: null })
        }

        if (out.length >= 10) break
      }

      return out
    })

    console.log(`[searchMetaPages] "${query}": ${results.length} pages found`)
    return { pages: results }
  } catch (err) {
    console.error('[searchMetaPages] Error:', err)
    return { pages: [], error: 'Impossible de récupérer les suggestions' }
  } finally {
    await context.close()
    await browser.close()
  }
}
