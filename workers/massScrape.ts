// Mass scraping worker — seeds the DB until TARGET_ADS are reached
// Only scrapes brands NOT already tracked as active competitors.
// Loops through the brand list as many times as needed to hit the target.
//
// Set as Railway Start Command:
//   node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/massScrape.ts
//
// Required env: DATABASE_URL, DIRECT_URL, META_ACCESS_TOKEN
// After run completes, switch Start Command back to adsCron.ts

import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryAPI } from '@/lib/scraping/ads'
import type { AdPlatform, AdFormat } from '@prisma/client'

// ─── Target ──────────────────────────────────────────────────────────────────

const TARGET_ADS = 10_000
const BATCH_SIZE = 8      // parallel HTTP calls per batch
const DELAY_MS   = 500    // ms pause between batches

// ─── Brand pool ──────────────────────────────────────────────────────────────

const BRANDS = [
  // Mode & Sport
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Asics', 'Reebok', 'Under Armour',
  'Lululemon', 'Salomon', 'The North Face', 'Patagonia', 'Columbia',
  'Zara', 'H&M', 'Uniqlo', 'Mango', 'Pull&Bear', 'Bershka', 'Reserved',
  'Kiabi', 'La Redoute', 'Zalando', 'ASOS', 'Shein', 'Primark',
  'Louis Vuitton', 'Gucci', 'Hermès', 'Chanel', 'Dior', 'Prada', 'Balenciaga',
  'Valentino', 'Burberry', 'Versace', 'Fendi', 'Bottega Veneta',
  'Lacoste', 'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', "Levi's",
  'Diesel', 'G-Star', 'Jack & Jones', 'Sézane', 'Jacquemus', 'Isabel Marant',

  // Beauté & Cosmétiques
  "L'Oreal", 'Lancôme', 'Maybelline', 'NYX', 'Urban Decay',
  'MAC Cosmetics', 'Charlotte Tilbury', 'NARS', 'Benefit', 'Too Faced',
  'Fenty Beauty', 'Huda Beauty', 'Rare Beauty',
  'The Ordinary', 'CeraVe', 'La Roche-Posay', 'Vichy', 'Avène',
  "Kiehl's", 'Clinique', 'Estée Lauder', 'Shiseido',
  'Clarins', 'Biotherm', 'Neutrogena', 'Garnier', 'Nivea', 'Dove',
  'Rituals', 'Aesop', 'Diptyque', 'Jo Malone', 'Byredo', 'Sephora',

  // Tech & Électronique
  'Apple', 'Samsung', 'Google', 'Microsoft', 'Sony', 'LG', 'Huawei',
  'Xiaomi', 'OnePlus', 'Motorola', 'Asus', 'Dell', 'HP', 'Lenovo', 'Acer',
  'MSI', 'Razer', 'Corsair', 'Logitech', 'Canon', 'Nikon', 'Fujifilm', 'GoPro', 'DJI',
  'Beats', 'Bose', 'Sennheiser', 'JBL', 'Bang & Olufsen', 'Sonos',
  'Dyson', 'Philips', "De'Longhi", 'Nespresso',
  'Fitbit', 'Garmin', 'Polar',

  // Alimentation & Boissons
  'Coca-Cola', 'Pepsi', 'Red Bull', 'Monster Energy', 'Innocent',
  "McDonald's", 'Burger King', 'KFC', 'Subway', "Domino's", 'Pizza Hut',
  'Starbucks', 'Costa Coffee', 'Lavazza',
  'Danone', 'Yoplait', 'Activia', 'Alpro',
  'Ferrero', 'Nutella', 'Kinder', 'Milka', 'Kit Kat', 'Twix', 'Snickers',
  "Lay's", 'Pringles', 'Haribo', 'Lindt', 'Godiva',
  'Magnum', "Ben & Jerry's", 'Häagen-Dazs',
  'Heinz', 'Knorr', 'Maggi',

  // Grande Distribution & E-commerce
  'Amazon', 'Cdiscount', 'Fnac', 'Darty', 'Boulanger', 'But',
  'Leclerc', 'Carrefour', 'Auchan', 'Intermarché', 'Lidl', 'Aldi',
  'Monoprix', 'Casino',
  'IKEA', 'Leroy Merlin', 'Castorama',
  'Maisons du Monde', 'Cultura',
  'Decathlon', 'Go Sport', 'Intersport',
  'Vinted', 'Leboncoin', 'Back Market', 'Rakuten',

  // Finance & Assurance
  'BNP Paribas', 'Société Générale', 'Crédit Agricole', 'LCL',
  "Caisse d'Épargne", 'Crédit Mutuel',
  'Boursorama', 'Hello Bank', 'Revolut', 'N26', 'Wise', 'Lydia', 'Sumeria',
  'AXA', 'Allianz', 'Groupama', 'MAIF', 'MAAF', 'GMF', 'Generali',
  'PayPal', 'Trade Republic', 'eToro',

  // Telecom & Médias
  'Orange', 'SFR', 'Bouygues Telecom', 'Free',
  'Netflix', 'Disney+', 'Canal+',
  'Spotify', 'Apple Music', 'Deezer',

  // Automobile
  'Renault', 'Peugeot', 'Citroën', 'Dacia', 'DS Automobiles',
  'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche',
  'Toyota', 'Honda', 'Nissan', 'Kia', 'Hyundai', 'Mazda',
  'Tesla', 'Volvo', 'Seat', 'Fiat', 'Ford', 'Opel', 'Jeep',

  // Voyage & Hôtellerie
  'Airbnb', 'Booking.com', 'Expedia', 'Tripadvisor',
  'Air France', 'EasyJet', 'Ryanair', 'Transavia',
  'Accor Hotels', 'Marriott', 'Hilton', 'Ibis',
  'Club Med', 'TUI', 'Uber', 'BlaBlaCar', 'Flixbus', 'SNCF',

  // Santé & Bien-être
  'Nuxe', 'Weleda', 'Bioderma', 'SVR', 'Ducray', 'Kérastase',
  "L'Occitane", 'Caudalie',
  'Myprotein', 'Foodspring',
  'Doctolib', 'Alan',

  // Services
  'Meetic', 'Tinder', 'Bumble',
  'Qonto', 'Papernest', 'EDF', 'Engie',
  'SeLoger', 'Orpi', 'Century 21',

  // Jeux & Divertissement
  'PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Epic Games',
  'Ubisoft', 'EA Sports',

  // Maison & Déco
  'Zara Home', 'H&M Home', 'Maisons du Monde', 'Conforama',
  'iRobot', 'Tefal', 'SEB', 'Moulinex',

  // Santé / Pharma
  'Sensodyne', 'Oral-B', 'Colgate', 'Elmex',

  // B2B & SaaS
  'Salesforce', 'HubSpot', 'Zendesk', 'Notion', 'Slack', 'Monday.com',
  'Canva', 'Figma', 'Adobe', 'Dropbox',
  'Mailchimp', 'Brevo', 'Klaviyo',
  'Shopify', 'PrestaShop',
  'OVHcloud', 'Scaleway',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[massScrape] Starting at ${new Date().toISOString()}`)
  console.log(`[massScrape] Target: ${TARGET_ADS} ads`)

  if (!process.env.META_ACCESS_TOKEN) {
    console.error('[massScrape] META_ACCESS_TOKEN is missing. Exiting.')
    process.exit(1)
  }

  // ── 1. Load active competitor brand names to exclude ─────────────────────
  const existingCompetitors = await prisma.competitor.findMany({
    where: { isActive: true },
    select: { name: true, brandName: true },
  })
  const competitorNames = new Set(
    existingCompetitors.flatMap(c => [
      c.name.toLowerCase(),
      ...(c.brandName ? [c.brandName.toLowerCase()] : []),
    ])
  )
  console.log(`[massScrape] Excluding ${competitorNames.size} active competitor brands`)

  // ── 2. Filter brand pool ──────────────────────────────────────────────────
  const eligibleBrands = BRANDS.filter(b => !competitorNames.has(b.toLowerCase()))
  console.log(`[massScrape] ${eligibleBrands.length} eligible brands after exclusion`)

  if (eligibleBrands.length === 0) {
    console.log('[massScrape] No eligible brands to scrape. Exiting.')
    process.exit(0)
  }

  // ── 3. Find or create discovery org ──────────────────────────────────────
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: 'mass_scrape_org' } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: 'mass_scrape_org', name: 'Discovery Library', slug: 'discovery-library' },
    })
    console.log('[massScrape] Created discovery org')
  }

  // ── 4. Count ads already in DB ────────────────────────────────────────────
  const existingCount = await prisma.ad.count({ where: { source: 'DISCOVERY' } })
  let totalAdded = 0
  let totalSkipped = 0
  console.log(`[massScrape] Discovery ads already in DB: ${existingCount}`)
  console.log(`[massScrape] Need to add: ${Math.max(0, TARGET_ADS - existingCount)}`)

  if (existingCount >= TARGET_ADS) {
    console.log(`[massScrape] Target already reached (${existingCount} >= ${TARGET_ADS}). Exiting.`)
    process.exit(0)
  }

  // ── 5. Loop through brands, cycling if needed, until target reached ───────
  let pass = 0
  while (existingCount + totalAdded < TARGET_ADS) {
    pass++
    // Shuffle each pass so we don't always hit the same brands first
    const shuffled = [...eligibleBrands].sort(() => Math.random() - 0.5)
    console.log(`\n[massScrape] Pass ${pass} — ${shuffled.length} brands`)

    for (let i = 0; i < shuffled.length; i += BATCH_SIZE) {
      // Check target
      if (existingCount + totalAdded >= TARGET_ADS) break

      const batch = shuffled.slice(i, i + BATCH_SIZE)
      const remaining = TARGET_ADS - existingCount - totalAdded
      console.log(`[massScrape] Pass ${pass} batch ${Math.floor(i / BATCH_SIZE) + 1} | need ${remaining} more — ${batch.join(', ')}`)

      const results = await Promise.allSettled(
        batch.map(async (brandName) => {
          const ads = await scrapeMetaAdLibraryAPI(brandName)
          return { brandName, ads }
        })
      )

      for (const result of results) {
        if (result.status === 'rejected') continue
        const { brandName, ads } = result.value
        if (ads.length === 0) continue

        // Find or create discovery competitor entry
        let competitor = await prisma.competitor.findFirst({
          where: { organizationId: org.id, name: { equals: brandName, mode: 'insensitive' } },
        })
        if (!competitor) {
          competitor = await prisma.competitor.create({
            data: {
              organizationId: org.id,
              name: brandName,
              website: '',
              brandName,
              isActive: false,
              trackAds: false,
            },
          })
        }

        for (const ad of ads) {
          if (existingCount + totalAdded >= TARGET_ADS) break

          // Dedup by landingUrl
          if (ad.landingUrl) {
            const exists = await prisma.ad.findFirst({
              where: { competitorId: competitor.id, landingUrl: ad.landingUrl },
              select: { id: true },
            })
            if (exists) { totalSkipped++; continue }
          }

          await prisma.ad.create({
            data: {
              competitorId: competitor.id,
              platform: ad.platform as AdPlatform,
              format: (ad.format ?? 'DISPLAY') as AdFormat,
              source: 'DISCOVERY',
              advertiserName: brandName,
              title: ad.title ?? null,
              description: ad.description ?? null,
              imageUrl: null,
              ctaText: ad.ctaText ?? null,
              landingUrl: ad.landingUrl ?? null,
              rawData: (ad.rawData as object) ?? {},
              contentHash: `${brandName}::${ad.landingUrl ?? ad.title ?? Date.now()}`,
              country: 'FR',
              activeDays: 1,
              engagementScore: 0,
            },
          })
          totalAdded++
        }
      }

      const total = existingCount + totalAdded
      console.log(`[massScrape] ${total}/${TARGET_ADS} ads (added this run: ${totalAdded}, skipped: ${totalSkipped})`)

      if (i + BATCH_SIZE < shuffled.length) {
        await sleep(DELAY_MS)
      }
    }

    // Safety: if a full pass added 0 ads, Meta is rate-limiting — stop
    if (pass > 1 && totalAdded === 0) {
      console.warn('[massScrape] Full pass with 0 new ads — likely rate-limited. Stopping.')
      break
    }
  }

  const finalTotal = existingCount + totalAdded
  console.log(`\n[massScrape] ✓ DONE`)
  console.log(`[massScrape] Total discovery ads in DB: ${finalTotal}`)
  console.log(`[massScrape] Added this run: ${totalAdded}`)
  console.log(`[massScrape] Skipped (duplicates): ${totalSkipped}`)
  if (finalTotal >= TARGET_ADS) {
    console.log(`[massScrape] Target of ${TARGET_ADS} reached! Switch Start Command back to adsCron.ts`)
  } else {
    console.log(`[massScrape] Stopped at ${finalTotal}. Re-run to continue.`)
  }
}

main()
  .catch((err) => {
    console.error('[massScrape] Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
