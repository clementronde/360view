/**
 * Ads scraper — Google Ads Transparency Center via Playwright
 */

import type { AdPlatform, AdFormat } from '@prisma/client'

export interface ScrapedAd {
  platform: AdPlatform
  format?: AdFormat
  title?: string
  description?: string
  imageBuffer?: Buffer
  imageFilename?: string
  ctaText?: string
  landingUrl?: string
  rawData?: Record<string, unknown>
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ─── Single-browser parallel scraper ─────────────────────────────────────────

export async function scrapeMultipleBrands(
  brands: string[],
  concurrency = 2
): Promise<Map<string, ScrapedAd[]>> {
  const { chromium } = await import('playwright')

  let browser: import('playwright').Browser | null = null
  const results = new Map<string, ScrapedAd[]>()

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    })

    for (let i = 0; i < brands.length; i += concurrency) {
      const batch = brands.slice(i, i + concurrency)
      const batchResults = await Promise.allSettled(
        batch.map(async (brand) => {
          const [googleAds, metaAds, tiktokAds] = await Promise.allSettled([
            scrapeGoogleAdsWithBrowser(browser!, brand),
            scrapeMetaAdLibraryWithBrowser(browser!, brand),
            scrapeTikTokWithBrowser(browser!, brand),
          ])
          const ads = [
            ...(googleAds.status === 'fulfilled' ? googleAds.value : []),
            ...(metaAds.status === 'fulfilled' ? metaAds.value : []),
            ...(tiktokAds.status === 'fulfilled' ? tiktokAds.value : []),
          ]
          return { brand, ads }
        })
      )
      for (const r of batchResults) {
        if (r.status === 'fulfilled') {
          results.set(r.value.brand, r.value.ads)
          console.log(`[scrapeMultipleBrands] ${r.value.brand}: ${r.value.ads.length} total ads`)
        } else {
          console.warn('[scrapeMultipleBrands] Brand failed:', r.reason)
        }
      }
    }
  } finally {
    await browser?.close()
  }

  return results
}

// ─── Google Ads Transparency — single brand, shared browser ──────────────────

async function scrapeGoogleAdsWithBrowser(
  browser: import('playwright').Browser,
  brandName: string
): Promise<ScrapedAd[]> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  })

  const page = await context.newPage()
  const ads: ScrapedAd[] = []

  try {
    console.log(`[Scraper] Navigating to Google Ads Transparency for "${brandName}"`)

    await page.goto(`https://adstransparency.google.com/?region=FR`, {
      waitUntil: 'networkidle',
      timeout: 45000,
    })

    // Dismiss cookie banner if present
    try {
      await page.click('button:has-text("Tout accepter")', { timeout: 3000 })
      await page.waitForTimeout(1000)
    } catch { /* no banner */ }

    // Find the search input — try multiple selectors
    const searchSelectors = [
      'search-input input',
      'material-input input',
      'input[placeholder*="earch"]',
      'input[aria-label*="earch"]',
      'input[type="search"]',
      'input[type="text"]',
    ]

    let searchInput: import('playwright').ElementHandle | null = null
    for (const sel of searchSelectors) {
      searchInput = await page.$(sel)
      if (searchInput) {
        console.log(`[Scraper] Found search input with selector: ${sel}`)
        break
      }
    }

    if (!searchInput) {
      console.warn(`[Scraper] No search input found for "${brandName}", page title: ${await page.title()}`)
      return []
    }

    await searchInput.click()
    await page.waitForTimeout(500)
    await searchInput.fill(brandName)
    await page.waitForTimeout(2000)

    // Pick the suggestion whose text best matches the brand name (avoid clicking unrelated advertisers)
    const clicked = await page.evaluate((brand) => {
      const options = Array.from(document.querySelectorAll('[role=option]')) as HTMLElement[]
      if (options.length === 0) return false
      const brandLower = brand.toLowerCase().replace(/[^a-z0-9]/g, '')
      // Prefer an option whose text starts with or closely matches the brand
      const best = options.find(opt => {
        const t = opt.textContent?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''
        return t.startsWith(brandLower) || brandLower.startsWith(t.slice(0, brandLower.length))
      }) ?? options[0]
      best.click()
      return true
    }, brandName)
    if (!clicked) await page.keyboard.press('Enter')

    // Wait for navigation to advertiser page
    try {
      await page.waitForURL(/\/advertiser\//, { timeout: 10000 })
    } catch { /* may not navigate */ }

    await page.waitForTimeout(3000)

    // Dismiss any overlay
    try {
      await page.click('button:has-text("Ignorer")', { timeout: 2000 })
      await page.waitForTimeout(500)
    } catch { /* no overlay */ }
    try {
      await page.click('button:has-text("Skip")', { timeout: 1000 })
    } catch { /* no overlay */ }

    const advertiserUrl = page.url()
    console.log(`[Scraper] On page: ${advertiserUrl}`)

    // Wait for creative cards to appear
    try {
      await page.waitForSelector('creative-preview', { timeout: 10000 })
    } catch {
      console.warn(`[Scraper] No creative-preview found for "${brandName}"`)
      return ads
    }

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(1500)

    const cardHandles = await page.$$('creative-preview')
    console.log(`[Scraper] Found ${cardHandles.length} creative-preview cards for "${brandName}"`)

    // Extract data from cards
    const creativeData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('creative-preview'))
      return cards.slice(0, 20).map((card) => {
        // Try to get image from shadow DOM too
        const shadowRoot = (card as Element & { shadowRoot: ShadowRoot | null }).shadowRoot
        const img = card.querySelector('img') ?? shadowRoot?.querySelector('img')
        const imageUrl = img?.src || img?.getAttribute('src') || undefined

        const adType = card.getAttribute('ad-type') ?? card.getAttribute('type') ?? ''
        const isSearch = /search|text/i.test(adType)
        const isShopping = /shopping|product/i.test(adType)

        const allText = (shadowRoot ?? card).textContent ?? ''
        const texts = allText
          .split('\n')
          .map((t) => t.trim())
          .filter((t) => t.length > 5 && t.length < 300)
          .filter((t) => !/(validé|google ads|annonceur|advertiser verified)/i.test(t))
        const unique = Array.from(new Set(texts))

        return { imageUrl, title: unique[0], description: unique.slice(1, 2).join(' ') || undefined, isSearch, isShopping }
      })
    })

    // Screenshot each card
    await Promise.allSettled(
      cardHandles.slice(0, 20).map(async (card, i) => {
        const data = creativeData[i] ?? {}

        // Skip search/shopping ads
        if (data.isSearch || data.isShopping) return

        let imageBuffer: Buffer | undefined

        // Try fetching the image URL directly
        if (data.imageUrl?.startsWith('http')) {
          try {
            const res = await context.request.get(data.imageUrl, { timeout: 5000 })
            if (res.ok()) imageBuffer = Buffer.from(await res.body())
          } catch { /* fall through */ }
        }

        // Fallback: screenshot the card element
        if (!imageBuffer) {
          try {
            imageBuffer = Buffer.from(await card.screenshot({ type: 'jpeg', quality: 80 }))
          } catch { /* skip */ }
        }

        if (!imageBuffer || imageBuffer.length < 8000) return // skip text-only/blank cards (real creatives > 8kb)

        ads.push({
          platform: 'GOOGLE',
          format: 'DISPLAY',
          title: data.title,
          description: data.description,
          imageBuffer,
          imageFilename: `google-${slugify(brandName)}-${Date.now()}-${i}.jpg`,
          landingUrl: advertiserUrl,
          rawData: { source: 'google-ads-transparency', brandName, advertiserUrl },
        })
      })
    )

    console.log(`[Scraper] "${brandName}": ${ads.length} ads with images`)
  } catch (err) {
    console.error(`[Scraper] Google Ads failed for "${brandName}":`, err)
  } finally {
    await context.close()
  }

  return ads
}

// ─── Standalone scrapers (own browser) ───────────────────────────────────────

export async function scrapeGoogleAds(brandName: string): Promise<ScrapedAd[]> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    return await scrapeGoogleAdsWithBrowser(browser, brandName)
  } finally {
    await browser.close()
  }
}

export { scrapeGoogleAds as scrapeMetaAds }

// ─── Meta Ad Library — Playwright ────────────────────────────────────────────

async function scrapeMetaAdLibraryWithBrowser(
  browser: import('playwright').Browser,
  brandName: string
): Promise<ScrapedAd[]> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  const ads: ScrapedAd[] = []

  try {
    // page_like_and_ads_published = only ads from pages whose name matches the brand (not keyword in ad text)
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&q=${encodeURIComponent(brandName)}&search_type=page_like_and_ads_published&sort_data[direction]=desc&sort_data[mode]=total_impressions`
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(4000)

    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 800))
    await page.waitForTimeout(1500)

    // Collect all ad creative images (600x600+ from fbcdn/scontent CDN)
    const imageUrls: string[] = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs
        .filter(img => (img.naturalWidth >= 200 || img.width >= 200) && (img.src.includes('fbcdn') || img.src.includes('scontent')))
        .map(img => img.src)
        .filter((src, i, arr) => arr.indexOf(src) === i) // deduplicate
        .slice(0, 20)
    })

    console.log(`[Scraper Meta] "${brandName}": ${imageUrls.length} images found`)

    await Promise.allSettled(
      imageUrls.map(async (imgUrl, i) => {
        try {
          const res = await context.request.get(imgUrl, { timeout: 8000 })
          if (!res.ok()) return
          const imageBuffer = Buffer.from(await res.body())
          if (imageBuffer.length < 8000) return // skip logos/icons (real creatives > 8kb)
          ads.push({
            platform: 'META',
            format: 'DISPLAY',
            title: brandName,
            imageBuffer,
            imageFilename: `meta-${slugify(brandName)}-${Date.now()}-${i}.jpg`,
            landingUrl: searchUrl,
            rawData: { source: 'meta-ad-library', brandName },
          })
        } catch { /* skip */ }
      })
    )

    console.log(`[Scraper Meta] "${brandName}": ${ads.length} ads saved`)
  } catch (err) {
    console.error(`[Scraper Meta] Failed for "${brandName}":`, err)
  } finally {
    await context.close()
  }

  return ads
}

// ─── TikTok Creative Center — Playwright ─────────────────────────────────────

async function scrapeTikTokWithBrowser(
  browser: import('playwright').Browser,
  brandName: string
): Promise<ScrapedAd[]> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  const ads: ScrapedAd[] = []

  try {
    // TikTok Creative Center — top ads filtered by brand keyword in FR over last 180 days
    const searchUrl = `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?period=180&region=FR&objective=&keyword=${encodeURIComponent(brandName)}&industry=0`
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3500)
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(1500)

    // TikTok uses cover images for video ads — require 300x300+ to avoid logos/icons
    const imageUrls: string[] = await page.evaluate((brand) => {
      const brandLower = brand.toLowerCase()
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs
        .filter(img => (img.naturalWidth >= 300 || img.width >= 300) && img.src.startsWith('http'))
        .filter(img => {
          // Check if the card containing this image mentions the brand
          let el: Element | null = img.parentElement
          for (let i = 0; i < 10; i++) {
            if (!el) break
            if (el.textContent?.toLowerCase().includes(brandLower)) return true
            el = el.parentElement
          }
          return false
        })
        .map(img => img.src)
        .filter((src, i, arr) => arr.indexOf(src) === i)
        .filter(src => !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && !src.includes('profile'))
        .slice(0, 15)
    }, brandName)

    console.log(`[Scraper TikTok] "${brandName}": ${imageUrls.length} images found`)

    await Promise.allSettled(
      imageUrls.map(async (imgUrl, i) => {
        try {
          const res = await context.request.get(imgUrl, { timeout: 8000 })
          if (!res.ok()) return
          const imageBuffer = Buffer.from(await res.body())
          if (imageBuffer.length < 8000) return // skip logos/icons (real creatives > 8kb)
          ads.push({
            platform: 'TIKTOK',
            format: 'VIDEO',
            title: brandName,
            imageBuffer,
            imageFilename: `tiktok-${slugify(brandName)}-${Date.now()}-${i}.jpg`,
            landingUrl: searchUrl,
            rawData: { source: 'tiktok-creative-center', brandName },
          })
        } catch { /* skip */ }
      })
    )

    console.log(`[Scraper TikTok] "${brandName}": ${ads.length} ads saved`)
  } catch (err) {
    console.error(`[Scraper TikTok] Failed for "${brandName}":`, err)
  } finally {
    await context.close()
  }

  return ads
}

// ─── Meta Ad Library — by Facebook Page ID ───────────────────────────────────
// Uses the exact page-specific URL from the Ad Library (more accurate than keyword search)

export async function scrapeMetaAdLibraryByPageId(
  brandName: string,
  pageId: string
): Promise<ScrapedAd[]> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    return await scrapeMetaAdLibraryByPageIdWithBrowser(browser, brandName, pageId)
  } finally {
    await browser.close()
  }
}

async function scrapeMetaAdLibraryByPageIdWithBrowser(
  browser: import('playwright').Browser,
  brandName: string,
  pageId: string
): Promise<ScrapedAd[]> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
  })
  const page = await context.newPage()

  // Intercept all fbcdn/scontent images — real ad creatives are filtered by file size later.
  // We don't filter by path prefix because Facebook uses different paths across regions/versions.
  // Exclude only explicit small-size URL markers (profile pics, icons, sprites).
  const interceptedImageUrls = new Set<string>()
  page.on('response', (response) => {
    const url = response.url()
    const ct = response.headers()['content-type'] ?? ''
    if (
      response.status() === 200 &&
      ct.startsWith('image/') &&
      (url.includes('fbcdn') || url.includes('scontent')) &&
      !url.includes('p40x40') && !url.includes('p50x50') &&
      !url.includes('p80x80') && !url.includes('s32x32') &&
      !url.includes('s60x60') && !url.includes('s80x80') &&
      !url.includes('p20x20') && !url.includes('p24x24') &&
      !url.includes('p36x36') && !url.includes('emoji') &&
      !url.includes('/rsrc.php')  // UI sprites/icons
    ) {
      interceptedImageUrls.add(url)
    }
  })

  const ads: ScrapedAd[] = []

  // Helper: navigate to a media_type URL, scroll to load lazy images, collect DOM srcs
  async function scrapeMediaType(mediaType: 'image' | 'meme') {
    const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&media_type=${mediaType}&search_type=page&sort_data[mode]=total_impressions&sort_data[direction]=desc&view_all_page_id=${pageId}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })

    // Cookie consent only needed on first navigation
    if (mediaType === 'image') {
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
        try { await page.click(sel, { timeout: 3000 }); await page.waitForTimeout(1000); break } catch { /* next */ }
      }
    }

    await page.waitForTimeout(4000)
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000))
      await page.waitForTimeout(900)
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, 1200))
      await page.waitForTimeout(700)
    }

    // Collect DOM images (catches any missed by the response listener)
    const domUrls: string[] = await page.evaluate(() => {
      const isSmall = (src: string) =>
        src.includes('p40x40') || src.includes('p50x50') || src.includes('p80x80') ||
        src.includes('s32x32') || src.includes('s60x60') || src.includes('s80x80') ||
        src.includes('p20x20') || src.includes('p24x24') || src.includes('p36x36') ||
        src.includes('emoji') || src.includes('/rsrc.php')
      return Array.from(document.querySelectorAll('img'))
        .map(img => img.src || img.getAttribute('src') || '')
        .filter(src => src.length > 0 && (src.includes('fbcdn') || src.includes('scontent')) && !isSmall(src))
        .filter((src, i, arr) => arr.indexOf(src) === i)
    })
    return { url, domUrls }
  }

  try {
    console.log(`[Scraper Meta/PageId] "${brandName}" (${pageId})`)

    // ── Pass 1: image ads ─────────────────────────────────────────────────────
    const { url: imageUrl, domUrls: imageDomUrls } = await scrapeMediaType('image')

    // ── Pass 2: meme/GIF ads (same session, cookie already accepted) ──────────
    const { url: memeUrl, domUrls: memeDomUrls } = await scrapeMediaType('meme')

    // Merge all sources, deduplicate
    const domAll = imageDomUrls.concat(memeDomUrls)
    const merged = Array.from(interceptedImageUrls).concat(domAll)
    const allImageUrls = merged.filter((src, i) => merged.indexOf(src) === i).slice(0, 60)
    console.log(`[Scraper Meta/PageId] "${brandName}": ${allImageUrls.length} images (${interceptedImageUrls.size} intercepted + ${domAll.length} DOM)`)

    if (allImageUrls.length === 0) {
      // Last resort: screenshot visible ad cards
      const cardHandles = await page.$$('[data-testid="ad-card"], [role="article"], ._7jyr')
      console.log(`[Scraper Meta/PageId] "${brandName}": fallback — ${cardHandles.length} cards to screenshot`)
      await Promise.allSettled(
        cardHandles.slice(0, 15).map(async (card, i) => {
          try {
            const imageBuffer = Buffer.from(await card.screenshot({ type: 'jpeg', quality: 80 }))
            if (imageBuffer.length < 5000) return
            ads.push({
              platform: 'META',
              format: 'DISPLAY',
              title: brandName,
              imageBuffer,
              imageFilename: `meta-${slugify(brandName)}-${Date.now()}-card${i}.jpg`,
              landingUrl: imageUrl,
              rawData: { source: 'meta-ad-library-page-screenshot', brandName, pageId },
            })
          } catch { /* skip */ }
        })
      )
    } else {
      await Promise.allSettled(
        allImageUrls.map(async (imgUrl, i) => {
          try {
            const res = await context.request.get(imgUrl, { timeout: 10000 })
            if (!res.ok()) return
            const imageBuffer = Buffer.from(await res.body())
            if (imageBuffer.length < 15_000) return // skip icons/logos
            ads.push({
              platform: 'META',
              format: 'DISPLAY',
              title: brandName,
              imageBuffer,
              imageFilename: `meta-${slugify(brandName)}-${Date.now()}-${i}.jpg`,
              landingUrl: imageUrl,
              rawData: { source: 'meta-ad-library-page', brandName, pageId },
            })
          } catch { /* skip */ }
        })
      )
    }

    console.log(`[Scraper Meta/PageId] "${brandName}": ${ads.length} ads saved`)
  } catch (err) {
    console.error(`[Scraper Meta/PageId] Failed for "${brandName}" (${pageId}):`, err)
  } finally {
    await context.close()
  }

  return ads
}

// ─── Meta Ad Library — search by name then scrape official page (single browser session) ──────

/**
 * Searches the Meta Ad Library for a brand by name, picks the first matching page,
 * then scrapes ads from that official page — all in a single browser session.
 * More reliable than calling searchMetaPages + scrapeMetaAdLibraryByPageId separately.
 */
export async function scrapeMetaAdLibraryByBrandSearch(
  brandName: string,
  searchQuery: string
): Promise<ScrapedAd[]> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
  })
  const page = await context.newPage()
  const ads: ScrapedAd[] = []

  // Intercept ad images early
  const interceptedImageUrls = new Set<string>()
  page.on('response', (response) => {
    const url = response.url()
    const ct = response.headers()['content-type'] ?? ''
    if (
      response.status() === 200 &&
      ct.startsWith('image/') &&
      (url.includes('fbcdn') || url.includes('scontent')) &&
      !url.includes('p40x40') && !url.includes('p50x50') &&
      !url.includes('p80x80') && !url.includes('s32x32') &&
      !url.includes('s60x60') && !url.includes('s80x80') &&
      !url.includes('p20x20') && !url.includes('p24x24') &&
      !url.includes('p36x36') && !url.includes('emoji') &&
      !url.includes('/rsrc.php')
    ) {
      interceptedImageUrls.add(url)
    }
  })

  try {
    // Step 1: search for the official brand page
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(searchQuery)}&search_type=page_like_and_ads_published`
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

    await page.waitForTimeout(4000)

    // Step 2: extract page_id from raw HTML — Facebook embeds it as JSON in the page source
    // Facebook always redirects to keyword_unordered in headless mode, so we parse the JSON data
    const pageId = await page.evaluate(() => {
      const html = document.documentElement.innerHTML

      // Extract all page_id values and pick the most common one (= the official brand page)
      const re = /"page_id":"(\d{8,17})"/g
      const matches: string[] = []
      let m: RegExpExecArray | null
      // eslint-disable-next-line no-cond-assign
      while ((m = re.exec(html)) !== null) matches.push(m[1])
      if (matches.length === 0) return null

      // Count occurrences — the official page will appear on every ad card
      const freq: Record<string, number> = {}
      for (const id of matches) freq[id] = (freq[id] ?? 0) + 1
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
      return sorted[0][0]
    })

    if (!pageId) {
      console.log(`[Scraper Meta/BrandSearch] No page_id found in HTML for "${brandName}"`)
      return []
    }
    console.log(`[Scraper Meta/BrandSearch] "${brandName}" → pageId ${pageId}, navigating to page ads`)

    // Helper: navigate to a media_type, scroll, collect DOM image srcs
    const collectForMediaType = async (mediaType: 'image' | 'meme') => {
      const url = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&media_type=${mediaType}&search_type=page&view_all_page_id=${pageId}`
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 })
      await page.waitForTimeout(4000)
      for (let i = 0; i < 8; i++) { await page.evaluate(() => window.scrollBy(0, 1000)); await page.waitForTimeout(900) }
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(600)
      for (let i = 0; i < 4; i++) { await page.evaluate(() => window.scrollBy(0, 1200)); await page.waitForTimeout(700) }
      const domUrls: string[] = await page.evaluate(() => {
        const isSmall = (src: string) =>
          src.includes('p40x40') || src.includes('p50x50') || src.includes('p80x80') ||
          src.includes('s32x32') || src.includes('s60x60') || src.includes('s80x80') ||
          src.includes('p20x20') || src.includes('p24x24') || src.includes('p36x36') ||
          src.includes('emoji') || src.includes('/rsrc.php')
        return Array.from(document.querySelectorAll('img'))
          .map(img => img.src || img.getAttribute('src') || '')
          .filter(src => src.length > 0 && (src.includes('fbcdn') || src.includes('scontent')) && !isSmall(src))
          .filter((src, i, arr) => arr.indexOf(src) === i)
      })
      return { url, domUrls }
    }

    // Step 3: image pass
    const { url: imageLibUrl, domUrls: imageDomUrls } = await collectForMediaType('image')
    // Step 4: meme/GIF pass (same browser session, cookie already accepted)
    const { domUrls: memeDomUrls } = await collectForMediaType('meme')

    const domAll = imageDomUrls.concat(memeDomUrls)
    const merged = Array.from(interceptedImageUrls).concat(domAll)
    const allImageUrls = merged.filter((src, i) => merged.indexOf(src) === i).slice(0, 60)
    console.log(`[Scraper Meta/BrandSearch] "${brandName}": ${allImageUrls.length} images (${interceptedImageUrls.size} intercepted + ${domAll.length} DOM)`)

    // Step 5: fallback — screenshot ad cards if no images captured
    if (allImageUrls.length === 0) {
      const cardHandles = await page.$$('[data-testid="ad-card"], [role="article"], ._7jyr')
      console.log(`[Scraper Meta/BrandSearch] "${brandName}": fallback — ${cardHandles.length} cards to screenshot`)
      await Promise.allSettled(
        cardHandles.slice(0, 15).map(async (card, i) => {
          try {
            const imageBuffer = Buffer.from(await card.screenshot({ type: 'jpeg', quality: 80 }))
            if (imageBuffer.length < 5000) return
            ads.push({
              platform: 'META',
              format: 'DISPLAY',
              title: brandName,
              imageBuffer,
              imageFilename: `meta-${slugify(brandName)}-${Date.now()}-card${i}.jpg`,
              landingUrl: imageLibUrl,
              rawData: { source: 'meta-ad-library-brand-search-screenshot', brandName, pageId },
            })
          } catch { /* skip */ }
        })
      )
    } else {
      await Promise.allSettled(
        allImageUrls.map(async (imgUrl, i) => {
          try {
            const res = await context.request.get(imgUrl, { timeout: 10000 })
            if (!res.ok()) return
            const imageBuffer = Buffer.from(await res.body())
            if (imageBuffer.length < 15_000) return
            ads.push({
              platform: 'META',
              format: 'DISPLAY',
              title: brandName,
              imageBuffer,
              imageFilename: `meta-${slugify(brandName)}-${Date.now()}-${i}.jpg`,
              landingUrl: imageLibUrl,
              rawData: { source: 'meta-ad-library-brand-search', brandName, pageId },
            })
          } catch { /* skip */ }
        })
      )
    }

    console.log(`[Scraper Meta/BrandSearch] "${brandName}": ${ads.length} ads saved`)
  } catch (err) {
    console.error(`[Scraper Meta/BrandSearch] Failed for "${brandName}":`, err)
  } finally {
    await context.close()
    await browser.close()
  }

  return ads
}

// ─── Meta Ad Library — by brand name (keyword search) ────────────────────────

export async function scrapeMetaAdsByName(brandName: string): Promise<ScrapedAd[]> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8' },
  })
  const page = await context.newPage()

  const interceptedImageUrls = new Set<string>()
  page.on('response', (response) => {
    const url = response.url()
    const ct = response.headers()['content-type'] ?? ''
    if (
      response.status() === 200 &&
      ct.startsWith('image/') &&
      (url.includes('fbcdn') || url.includes('scontent')) &&
      !url.includes('p40x40') && !url.includes('p50x50') &&
      !url.includes('p80x80') && !url.includes('s32x32') &&
      !url.includes('s60x60') && !url.includes('s80x80') &&
      !url.includes('p20x20') && !url.includes('p24x24') &&
      !url.includes('p36x36') && !url.includes('emoji') &&
      !url.includes('/rsrc.php')
    ) {
      interceptedImageUrls.add(url)
    }
  })

  const ads: ScrapedAd[] = []
  try {
    const searchUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&media_type=image&q=${encodeURIComponent(brandName)}&search_type=page_like_and_ads_published&sort_data[direction]=desc&sort_data[mode]=total_impressions`
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
      try { await page.click(sel, { timeout: 2500 }); await page.waitForTimeout(1000); break } catch { /* next */ }
    }

    await page.waitForTimeout(4000)
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, 900))
      await page.waitForTimeout(1000)
    }

    const domUrls: string[] = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(img => img.src || '')
        .filter(src =>
          src.length > 0 &&
          (src.includes('fbcdn') || src.includes('scontent')) &&
          !src.includes('p40x40') && !src.includes('p50x50') &&
          !src.includes('s32x32') && !src.includes('s60x60') &&
          !src.includes('emoji') && !src.includes('/rsrc.php')
        )
        .filter((src, i, arr) => arr.indexOf(src) === i)
    })

    const merged = Array.from(interceptedImageUrls).concat(domUrls)
    const allUrls = merged.filter((src, i) => merged.indexOf(src) === i).slice(0, 40)
    console.log(`[Scraper Meta/Name] "${brandName}": ${allUrls.length} images`)

    await Promise.allSettled(
      allUrls.map(async (imgUrl, i) => {
        try {
          const res = await context.request.get(imgUrl, { timeout: 10000 })
          if (!res.ok()) return
          const imageBuffer = Buffer.from(await res.body())
          if (imageBuffer.length < 15_000) return
          ads.push({
            platform: 'META',
            format: 'DISPLAY',
            title: brandName,
            imageBuffer,
            imageFilename: `meta-${slugify(brandName)}-${Date.now()}-${i}.jpg`,
            landingUrl: searchUrl,
            rawData: { source: 'meta-ad-library-name', brandName },
          })
        } catch { /* skip */ }
      })
    )
    console.log(`[Scraper Meta/Name] "${brandName}": ${ads.length} ads saved`)
  } catch (err) {
    console.error(`[Scraper Meta/Name] Failed for "${brandName}":`, err)
  } finally {
    await context.close()
    await browser.close()
  }
  return ads
}

// ─── Meta Ad Library API ───────────────────────────────────────────────────────

export async function scrapeMetaAdLibraryAPI(brandName: string): Promise<ScrapedAd[]> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return []

  try {
    const url = new URL('https://graph.facebook.com/v21.0/ads_archive')
    url.searchParams.set('access_token', token)
    url.searchParams.set('ad_type', 'ALL')
    url.searchParams.set('ad_reached_countries', '["FR"]')
    url.searchParams.set('search_terms', brandName)
    url.searchParams.set('fields', 'id,ad_creative_link_title,ad_creative_bodies,snapshot_url')
    url.searchParams.set('limit', '20')

    const res = await fetch(url.toString())
    const data = await res.json()
    if (!data.data || data.error) return []

    return (data.data as Array<{
      id: string
      ad_creative_link_title?: string[]
      ad_creative_bodies?: string[]
      snapshot_url?: string
    }>).map((ad) => ({
      platform: 'META' as AdPlatform,
      format: 'DISPLAY' as AdFormat,
      title: ad.ad_creative_link_title?.[0],
      description: ad.ad_creative_bodies?.[0],
      landingUrl: ad.snapshot_url,
      rawData: { source: 'meta-ad-library-api', brandName, adId: ad.id },
    }))
  } catch {
    return []
  }
}

// ─── Website screenshot helper ────────────────────────────────────────────────

export async function takeWebsiteScreenshot(url: string): Promise<Buffer | null> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await (await browser.newContext()).newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    return Buffer.from(await page.screenshot({ type: 'png', fullPage: false }))
  } finally {
    await browser.close()
  }
}
