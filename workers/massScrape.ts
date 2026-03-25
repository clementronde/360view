// Mass scraping worker — runs ONCE to seed the database with a large ad library
// Set as Railway Start Command temporarily:
//   node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/massScrape.ts
//
// Required env: DATABASE_URL, DIRECT_URL, META_ACCESS_TOKEN
//
// After this run completes, switch Railway Start Command back to adsCron.ts

import { prisma } from '@/lib/prisma'
import { scrapeMetaAdLibraryAPI } from '@/lib/scraping/ads'
import type { AdPlatform, AdFormat } from '@prisma/client'

// ─── 500+ brands across categories ──────────────────────────────────────────

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
  'Sephora', 'L\'Oreal', 'Lancôme', 'Maybelline', 'NYX', 'Urban Decay',
  'MAC Cosmetics', 'Charlotte Tilbury', 'NARS', 'Benefit', 'Too Faced',
  'Fenty Beauty', 'Huda Beauty', 'Rare Beauty',
  'The Ordinary', 'CeraVe', 'La Roche-Posay', 'Vichy', 'Avène',
  "Kiehl's", 'Clinique', 'Estée Lauder', 'Shiseido',
  'Clarins', 'Biotherm', 'Neutrogena', 'Garnier', 'Nivea', 'Dove',
  'Rituals', 'Aesop', 'Diptyque', 'Jo Malone', 'Byredo',

  // Tech & Électronique
  'Apple', 'Samsung', 'Google', 'Microsoft', 'Sony', 'LG', 'Huawei',
  'Xiaomi', 'OnePlus', 'Motorola', 'Asus', 'Dell', 'HP', 'Lenovo', 'Acer',
  'MSI', 'Razer', 'Corsair', 'Logitech', 'Canon', 'Nikon', 'Fujifilm', 'GoPro', 'DJI',
  'Beats', 'Bose', 'Sennheiser', 'JBL', 'Bang & Olufsen', 'Sonos',
  'Dyson', 'Philips', 'De\'Longhi', 'Nespresso',
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
  'IKEA', 'Leroy Merlin', 'Castorama', 'Bricomarché',
  'Maisons du Monde', 'Cultura', 'Nature & Découvertes',
  'Decathlon', 'Go Sport', 'Intersport',
  'Vinted', 'Leboncoin', 'Back Market', 'Rakuten',

  // Finance & Assurance
  'BNP Paribas', 'Société Générale', 'Crédit Agricole', 'LCL',
  'Caisse d\'Épargne', 'La Banque Postale', 'Crédit Mutuel',
  'Boursorama', 'Hello Bank', 'Revolut', 'N26', 'Wise', 'Lydia', 'Sumeria',
  'AXA', 'Allianz', 'Groupama', 'MAIF', 'MAAF', 'GMF', 'MMA', 'Generali',
  'PayPal', 'Stripe', 'Trade Republic', 'eToro',

  // Telecom & Médias
  'Orange', 'SFR', 'Bouygues Telecom', 'Free',
  'Netflix', 'Disney+', 'Canal+', 'Molotov',
  'Spotify', 'Apple Music', 'Deezer',

  // Automobile
  'Renault', 'Peugeot', 'Citroën', 'Dacia', 'DS Automobiles',
  'Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Porsche',
  'Toyota', 'Honda', 'Nissan', 'Kia', 'Hyundai', 'Mazda',
  'Tesla', 'Volvo', 'Seat', 'Škoda', 'Fiat', 'Ford', 'Opel', 'Jeep',

  // Voyage & Hôtellerie
  'Airbnb', 'Booking.com', 'Expedia', 'Tripadvisor',
  'Air France', 'EasyJet', 'Ryanair', 'Transavia',
  'Accor Hotels', 'Marriott', 'Hilton', 'Ibis', 'Novotel',
  'Club Med', 'TUI', 'Uber', 'BlaBlaCar', 'Flixbus', 'SNCF',

  // Santé & Bien-être
  'Nuxe', 'Weleda', 'Bioderma', 'SVR', 'Ducray', 'Kérastase',
  "L'Occitane", 'Caudalie', 'Embryolisse',
  'Myprotein', 'Foodspring', 'Optimum Nutrition',
  'Doctolib', 'Alan', 'Luko',

  // Immobilier & Services
  'SeLoger', 'PAP', 'Orpi', 'Century 21',
  'Meetic', 'Tinder', 'Bumble',
  'Qonto', 'Papernest', 'EDF', 'Engie', 'TotalEnergies',

  // Jeux & Divertissement
  'PlayStation', 'Xbox', 'Nintendo', 'Steam', 'Epic Games',
  'Ubisoft', 'EA Sports', 'Activision', 'Riot Games',

  // Maison & Déco
  'Zara Home', 'H&M Home', 'Maisons du Monde', 'Conforama', 'Fly',
  'iRobot', 'Netatmo', 'Somfy', 'Weber', 'Tefal', 'SEB', 'Moulinex',

  // Santé / Pharma
  'Advil', 'Doliprane', 'Smecta', 'Gaviscon', 'Rennie',
  'Sensodyne', 'Oral-B', 'Colgate', 'Elmex',

  // B2B & SaaS
  'Salesforce', 'HubSpot', 'Zendesk', 'Notion', 'Slack', 'Monday.com',
  'Asana', 'Trello', 'Canva', 'Figma', 'Adobe', 'Dropbox',
  'Mailchimp', 'Brevo', 'Klaviyo', 'ActiveCampaign',
  'Shopify', 'WooCommerce', 'PrestaShop',
  'OVHcloud', 'Scaleway', 'Infomaniak',
]

// ─── Config ──────────────────────────────────────────────────────────────────

const BATCH_SIZE = 8    // parallel HTTP requests
const DELAY_MS   = 600  // ms between batches (rate limit safety)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[massScrape] Starting at ${new Date().toISOString()}`)
  console.log(`[massScrape] ${BRANDS.length} brands to scrape`)

  if (!process.env.META_ACCESS_TOKEN) {
    console.error('[massScrape] META_ACCESS_TOKEN is missing. Exiting.')
    process.exit(1)
  }

  // Find or create discovery org
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: 'mass_scrape_org' } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: 'mass_scrape_org', name: 'Discovery Library', slug: 'discovery-library' },
    })
    console.log('[massScrape] Created discovery org')
  }

  let totalAdded = 0
  let totalSkipped = 0
  let totalBrands = 0

  for (let i = 0; i < BRANDS.length; i += BATCH_SIZE) {
    const batch = BRANDS.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(BRANDS.length / BATCH_SIZE)
    console.log(`[massScrape] Batch ${batchNum}/${totalBatches} — ${batch.join(', ')}`)

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

      totalBrands++

      // Find or create competitor entry for this brand
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

    console.log(`[massScrape] Progress — added: ${totalAdded}, skipped: ${totalSkipped}`)

    if (i + BATCH_SIZE < BRANDS.length) {
      await sleep(DELAY_MS)
    }
  }

  console.log(`\n[massScrape] ✓ DONE`)
  console.log(`[massScrape] Brands with ads: ${totalBrands}/${BRANDS.length}`)
  console.log(`[massScrape] Total ads added: ${totalAdded}`)
  console.log(`[massScrape] Skipped (duplicates): ${totalSkipped}`)
  console.log(`\n[massScrape] Switch Railway Start Command back to adsCron.ts`)
}

main()
  .catch((err) => {
    console.error('[massScrape] Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
