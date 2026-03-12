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
