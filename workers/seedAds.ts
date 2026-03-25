// Seed worker — inserts realistic demo ads without any external API
// Run once on Railway to populate the discovery library.
//
// node_modules/.bin/tsx --tsconfig tsconfig.worker.json workers/seedAds.ts
//
// Required env: DATABASE_URL, DIRECT_URL

import { prisma } from '@/lib/prisma'
import type { AdPlatform, AdFormat } from '@prisma/client'

const TARGET = 10_000

// ─── Brand catalogue ─────────────────────────────────────────────────────────

const BRANDS: { name: string; category: string }[] = [
  // Mode
  { name: 'Nike', category: 'mode' },
  { name: 'Adidas', category: 'mode' },
  { name: 'Puma', category: 'mode' },
  { name: 'New Balance', category: 'mode' },
  { name: 'Asics', category: 'mode' },
  { name: 'Under Armour', category: 'mode' },
  { name: 'Lululemon', category: 'mode' },
  { name: 'Salomon', category: 'mode' },
  { name: 'The North Face', category: 'mode' },
  { name: 'Zara', category: 'mode' },
  { name: 'H&M', category: 'mode' },
  { name: 'Uniqlo', category: 'mode' },
  { name: 'Mango', category: 'mode' },
  { name: 'Shein', category: 'mode' },
  { name: 'Zalando', category: 'mode' },
  { name: 'ASOS', category: 'mode' },
  { name: 'Louis Vuitton', category: 'luxe' },
  { name: 'Gucci', category: 'luxe' },
  { name: 'Dior', category: 'luxe' },
  { name: 'Chanel', category: 'luxe' },
  { name: 'Hermès', category: 'luxe' },
  { name: 'Balenciaga', category: 'luxe' },
  { name: 'Prada', category: 'luxe' },
  { name: 'Lacoste', category: 'mode' },
  { name: 'Ralph Lauren', category: 'mode' },
  { name: 'Tommy Hilfiger', category: 'mode' },
  { name: "Levi's", category: 'mode' },
  { name: 'Sézane', category: 'mode' },
  { name: 'Jacquemus', category: 'luxe' },
  { name: 'Decathlon', category: 'sport' },
  { name: 'Intersport', category: 'sport' },
  // Beauté
  { name: "L'Oreal", category: 'beaute' },
  { name: 'Sephora', category: 'beaute' },
  { name: 'Lancôme', category: 'beaute' },
  { name: 'Maybelline', category: 'beaute' },
  { name: 'NYX', category: 'beaute' },
  { name: 'Charlotte Tilbury', category: 'beaute' },
  { name: 'NARS', category: 'beaute' },
  { name: 'Fenty Beauty', category: 'beaute' },
  { name: 'Rare Beauty', category: 'beaute' },
  { name: 'The Ordinary', category: 'beaute' },
  { name: 'CeraVe', category: 'beaute' },
  { name: 'La Roche-Posay', category: 'beaute' },
  { name: 'Clarins', category: 'beaute' },
  { name: 'Rituals', category: 'beaute' },
  { name: "L'Occitane", category: 'beaute' },
  { name: 'Diptyque', category: 'beaute' },
  { name: 'Garnier', category: 'beaute' },
  { name: 'Nivea', category: 'beaute' },
  // Tech
  { name: 'Apple', category: 'tech' },
  { name: 'Samsung', category: 'tech' },
  { name: 'Google', category: 'tech' },
  { name: 'Microsoft', category: 'tech' },
  { name: 'Sony', category: 'tech' },
  { name: 'Xiaomi', category: 'tech' },
  { name: 'Dyson', category: 'tech' },
  { name: 'Bose', category: 'tech' },
  { name: 'JBL', category: 'tech' },
  { name: 'GoPro', category: 'tech' },
  { name: 'DJI', category: 'tech' },
  { name: 'Logitech', category: 'tech' },
  { name: 'Razer', category: 'tech' },
  { name: 'Nespresso', category: 'tech' },
  { name: 'Garmin', category: 'tech' },
  // Food & Drink
  { name: 'Coca-Cola', category: 'food' },
  { name: 'Pepsi', category: 'food' },
  { name: 'Red Bull', category: 'food' },
  { name: 'Monster Energy', category: 'food' },
  { name: "McDonald's", category: 'food' },
  { name: 'Burger King', category: 'food' },
  { name: 'KFC', category: 'food' },
  { name: 'Starbucks', category: 'food' },
  { name: 'Nutella', category: 'food' },
  { name: 'Milka', category: 'food' },
  { name: 'Haribo', category: 'food' },
  { name: 'Lindt', category: 'food' },
  { name: 'Danone', category: 'food' },
  { name: 'Magnum', category: 'food' },
  // E-commerce
  { name: 'Amazon', category: 'ecom' },
  { name: 'Cdiscount', category: 'ecom' },
  { name: 'Fnac', category: 'ecom' },
  { name: 'Darty', category: 'ecom' },
  { name: 'IKEA', category: 'maison' },
  { name: 'Leroy Merlin', category: 'maison' },
  { name: 'Maisons du Monde', category: 'maison' },
  { name: 'Vinted', category: 'ecom' },
  { name: 'Leboncoin', category: 'ecom' },
  { name: 'Back Market', category: 'ecom' },
  // Finance
  { name: 'Revolut', category: 'finance' },
  { name: 'N26', category: 'finance' },
  { name: 'Wise', category: 'finance' },
  { name: 'Boursorama', category: 'finance' },
  { name: 'Trade Republic', category: 'finance' },
  { name: 'AXA', category: 'finance' },
  { name: 'Allianz', category: 'finance' },
  { name: 'MAIF', category: 'finance' },
  { name: 'PayPal', category: 'finance' },
  // Telecom
  { name: 'Orange', category: 'telecom' },
  { name: 'SFR', category: 'telecom' },
  { name: 'Bouygues Telecom', category: 'telecom' },
  { name: 'Free', category: 'telecom' },
  { name: 'Netflix', category: 'media' },
  { name: 'Disney+', category: 'media' },
  { name: 'Spotify', category: 'media' },
  // Auto
  { name: 'Renault', category: 'auto' },
  { name: 'Peugeot', category: 'auto' },
  { name: 'Citroën', category: 'auto' },
  { name: 'Dacia', category: 'auto' },
  { name: 'Tesla', category: 'auto' },
  { name: 'BMW', category: 'auto' },
  { name: 'Mercedes-Benz', category: 'auto' },
  { name: 'Volkswagen', category: 'auto' },
  { name: 'Toyota', category: 'auto' },
  { name: 'Kia', category: 'auto' },
  // Voyage
  { name: 'Airbnb', category: 'voyage' },
  { name: 'Booking.com', category: 'voyage' },
  { name: 'Air France', category: 'voyage' },
  { name: 'EasyJet', category: 'voyage' },
  { name: 'Club Med', category: 'voyage' },
  { name: 'TUI', category: 'voyage' },
  { name: 'Uber', category: 'voyage' },
  // SaaS / B2B
  { name: 'Salesforce', category: 'saas' },
  { name: 'HubSpot', category: 'saas' },
  { name: 'Notion', category: 'saas' },
  { name: 'Canva', category: 'saas' },
  { name: 'Shopify', category: 'saas' },
  { name: 'Brevo', category: 'saas' },
  { name: 'Mailchimp', category: 'saas' },
  { name: 'Monday.com', category: 'saas' },
]

// ─── Copy templates per category ─────────────────────────────────────────────

const COPY: Record<string, { titles: string[]; bodies: string[]; ctas: string[] }> = {
  mode: {
    titles: [
      'Nouvelle collection disponible', 'Soldes jusqu\'à -50%', 'Les indispensables de la saison',
      'Livraison gratuite dès 50€', 'Édition limitée — dépêchez-vous', 'Vos essentiels du quotidien',
      'Style & confort au meilleur prix', 'Tendances printemps-été', 'Retours gratuits 30 jours',
    ],
    bodies: [
      'Découvrez notre nouvelle collection exclusive. Qualité premium, style intemporel.',
      'Profitez de nos offres exceptionnelles sur des centaines d\'articles sélectionnés.',
      'Des pièces conçues pour durer. Matières responsables, coupe parfaite.',
      'Livraison express disponible. Satisfaction garantie ou remboursé.',
    ],
    ctas: ['Acheter maintenant', 'Découvrir la collection', 'Voir les offres', 'Shop now', 'En savoir plus'],
  },
  luxe: {
    titles: [
      'L\'excellence à la française', 'Savoir-faire artisanal depuis 1854', 'Une icône réinventée',
      'Collection haute couture', 'L\'art du luxe accessible', 'Pièces signatures',
    ],
    bodies: [
      'Une création qui traverse le temps. Matières d\'exception, finitions impeccables.',
      'Chaque pièce raconte une histoire. Découvrez notre univers.',
      'L\'héritage d\'une maison au service de votre style.',
    ],
    ctas: ['Découvrir', 'Explorer la collection', 'En savoir plus', 'Prendre rendez-vous'],
  },
  sport: {
    titles: [
      'Performez à votre meilleur niveau', 'Équipements pros pour tous', '-30% sur les meilleures marques',
      'Le sport accessible à tous', 'Prêt pour la saison', 'Équipez-vous maintenant',
    ],
    bodies: [
      'Tout le matériel dont vous avez besoin pour atteindre vos objectifs.',
      'Du débutant au champion, nous avons l\'équipement qu\'il vous faut.',
      'Qualité professionnelle au prix le plus juste.',
    ],
    ctas: ['Voir les équipements', 'Acheter', 'Découvrir', 'En profiter'],
  },
  beaute: {
    titles: [
      'Votre routine beauté réinventée', 'Nouveautés maquillage & soin', 'La beauté sans compromis',
      'Offre exclusive : -25% ce week-end', 'Peaux sensibles, notre spécialité', 'Le teint parfait en 3 étapes',
    ],
    bodies: [
      'Formulé par des dermatologues. Testé sur peaux sensibles. Efficacité prouvée.',
      'Des textures légères et des pigments intenses pour un résultat longue tenue.',
      'Notre gamme best-seller, adoptée par des millions de femmes dans le monde.',
    ],
    ctas: ['Essayer maintenant', 'Découvrir la gamme', 'Voir les nouveautés', 'Acheter'],
  },
  tech: {
    titles: [
      'Innovation au quotidien', 'Le son nouvelle génération', 'Travaillez plus vite, mieux',
      'La technologie qui vous simplifie la vie', 'Performances au sommet', 'Connectez-vous différemment',
    ],
    bodies: [
      'Conçu pour les créateurs, les professionnels et les amateurs exigeants.',
      'Des performances exceptionnelles dans un design épuré et compact.',
      'Compatible avec tous vos appareils. Installation en moins de 2 minutes.',
    ],
    ctas: ['Découvrir', 'Acheter', 'En savoir plus', 'Comparer les modèles'],
  },
  food: {
    titles: [
      'Le goût qui fait la différence', 'Nouveau : essayez-le maintenant', 'L\'original et l\'inimitable',
      'Une recette améliorée, même plaisir', 'Partagez le moment', 'La saveur authentique',
    ],
    bodies: [
      'Savourez chaque instant avec nos produits fabriqués avec passion.',
      'Des ingrédients sélectionnés avec soin pour une qualité irréprochable.',
      'Le choix de toute la famille depuis plus de 50 ans.',
    ],
    ctas: ['Goûter maintenant', 'Commander', 'Découvrir', 'Voir nos produits'],
  },
  ecom: {
    titles: [
      'Livraison en 24h garantie', 'Meilleur prix du marché', 'Des millions d\'articles disponibles',
      'Retour gratuit sous 30 jours', 'Offre flash : -40% aujourd\'hui', 'Achetez futé',
    ],
    bodies: [
      'Commandez avant 14h, livré demain. Satisfaction garantie.',
      'Comparez, choisissez, économisez. Des milliers de vendeurs vérifiés.',
      'Vos articles préférés au meilleur prix. Livraison rapide partout en France.',
    ],
    ctas: ['Commander maintenant', 'Voir les offres', 'Acheter', 'Découvrir'],
  },
  finance: {
    titles: [
      'Votre argent travaille pour vous', 'Ouvrez un compte en 5 minutes', 'Investissez dès 1€',
      'Zéro frais cachés', 'La banque qui vous ressemble', 'Protégez ce qui compte',
    ],
    bodies: [
      'Gérez votre argent simplement depuis votre téléphone. Sans paperasse.',
      'Des rendements compétitifs, une interface intuitive, un support réactif.',
      'Assurance complète, remboursement rapide, assistance 24h/7j.',
    ],
    ctas: ['Ouvrir un compte', 'Commencer', 'En savoir plus', 'Obtenir un devis'],
  },
  telecom: {
    titles: [
      'Internet fibre ultra-rapide', 'Forfait mobile sans engagement', '5G incluse dans votre offre',
      'Changez d\'opérateur en 1 clic', 'Le réseau n°1 en France', 'TV + Internet + Mobile',
    ],
    bodies: [
      'Profitez d\'une connexion ultra-rapide partout en France et dans le monde.',
      'Sans engagement, sans frais cachés. Résiliez quand vous voulez.',
      'La meilleure couverture réseau, les meilleurs prix.',
    ],
    ctas: ['Souscrire', 'Changer d\'offre', 'Voir les forfaits', 'En profiter'],
  },
  media: {
    titles: [
      'Regardez ce qui vous plaît, quand vous voulez', 'Un mois gratuit pour essayer',
      'Des milliers de films & séries', 'Streaming en qualité 4K', 'Écoutez sans limites',
    ],
    bodies: [
      'Des contenus exclusifs produits pour vous. Annulez à tout moment.',
      'Musique, podcasts, playlists — tout ce que vous aimez en un seul endroit.',
      'Streaming illimité sur tous vos écrans.',
    ],
    ctas: ['Essayer gratuitement', "S'abonner", 'Démarrer', 'Voir les offres'],
  },
  auto: {
    titles: [
      'Conduisez l\'avenir aujourd\'hui', 'Offre de reprise exceptionnelle', 'Essai gratuit 7 jours',
      'Nouveau modèle disponible', 'Financement à 0%', 'La voiture qu\'il vous faut',
    ],
    bodies: [
      'Confort, sécurité, technologie. Le véhicule conçu pour votre vie.',
      'Profitez d\'une offre de financement avantageuse. Sous réserve d\'acceptation.',
      'Prenez le volant et laissez-vous surprendre.',
    ],
    ctas: ['Configurer', 'Prendre RDV', 'Essayer', 'Voir les offres'],
  },
  voyage: {
    titles: [
      'Partez l\'esprit tranquille', 'Les meilleures offres du moment', 'Réservez en avance, économisez',
      'Votre prochaine aventure commence ici', 'Destinations exclusives', '-30% sur les vols',
    ],
    bodies: [
      'Des milliers de destinations, des prix imbattables. Annulation gratuite.',
      'Logements vérifiés, hôtes certifiés, voyages mémorables.',
      'Volez vers vos destinations préférées au meilleur tarif.',
    ],
    ctas: ['Réserver maintenant', 'Voir les destinations', 'Chercher', 'En profiter'],
  },
  saas: {
    titles: [
      'Essai gratuit 14 jours sans CB', 'Gagnez 3h par semaine', 'Travaillez en équipe efficacement',
      'Automatisez vos tâches répétitives', 'Lancez votre business en ligne', 'Intégrez vos outils en 1 clic',
    ],
    bodies: [
      'Rejoignez 100 000+ équipes qui font confiance à notre plateforme.',
      'Interface intuitive, support 24/7, données sécurisées en Europe.',
      'Connectez tous vos outils. Synchronisez votre équipe. Grandissez plus vite.',
    ],
    ctas: ['Essayer gratuitement', 'Démarrer', 'Voir la démo', 'En savoir plus'],
  },
  maison: {
    titles: [
      'Créez l\'intérieur de vos rêves', 'Nouveautés déco & mobilier', 'Jusqu\'à -40% sur la cuisine',
      'Livraison & montage offerts', 'Inspirations déco du moment', 'Qualité scandinave',
    ],
    bodies: [
      'Des meubles durables, des designs intemporels. Pour chaque espace.',
      'Transformez votre intérieur avec notre nouvelle collection.',
      'Des produits testés, certifiés, et approuvés par nos clients.',
    ],
    ctas: ['Voir la collection', 'Acheter', 'S\'inspirer', 'Découvrir'],
  },
}

const PLATFORMS: AdPlatform[] = ['META', 'GOOGLE', 'TIKTOK', 'LINKEDIN', 'PINTEREST', 'YOUTUBE']
const PLATFORM_WEIGHTS = [0.45, 0.25, 0.15, 0.08, 0.04, 0.03] // META most common

function pickPlatform(): AdPlatform {
  const r = Math.random()
  let cumul = 0
  for (let i = 0; i < PLATFORMS.length; i++) {
    cumul += PLATFORM_WEIGHTS[i]
    if (r < cumul) return PLATFORMS[i]
  }
  return 'META'
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeAd(brand: { name: string; category: string }, idx: number) {
  const copy = COPY[brand.category] ?? COPY.mode
  const platform = pickPlatform()
  return {
    platform,
    format: 'DISPLAY' as AdFormat,
    source: 'DISCOVERY' as const,
    advertiserName: brand.name,
    title: pick(copy.titles),
    description: pick(copy.bodies),
    ctaText: pick(copy.ctas),
    imageUrl: null,
    landingUrl: null,
    rawData: { source: 'seed', brand: brand.name, idx },
    contentHash: `seed::${brand.name}::${idx}::${platform}`,
    country: pick(['FR', 'FR', 'FR', 'US', 'GB', 'DE']),
    activeDays: Math.floor(Math.random() * 60) + 1,
    engagementScore: Math.floor(Math.random() * 100),
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`[seedAds] Starting at ${new Date().toISOString()}`)
  console.log(`[seedAds] Target: ${TARGET} ads`)

  // Count existing discovery ads
  const existing = await prisma.ad.count({ where: { source: 'DISCOVERY' } })
  const needed = Math.max(0, TARGET - existing)
  console.log(`[seedAds] Existing discovery ads: ${existing} — need to add: ${needed}`)

  if (needed === 0) {
    console.log('[seedAds] Target already reached. Exiting.')
    process.exit(0)
  }

  // Find or create discovery org
  let org = await prisma.organization.findFirst({ where: { clerkOrgId: 'mass_scrape_org' } })
  if (!org) {
    org = await prisma.organization.create({
      data: { clerkOrgId: 'mass_scrape_org', name: 'Discovery Library', slug: 'discovery-library' },
    })
  }

  // Exclude active competitor brands
  const activeCompetitors = await prisma.competitor.findMany({
    where: { isActive: true },
    select: { name: true, brandName: true },
  })
  const excluded = new Set(
    activeCompetitors.flatMap(c => [c.name.toLowerCase(), ...(c.brandName ? [c.brandName.toLowerCase()] : [])])
  )
  const eligible = BRANDS.filter(b => !excluded.has(b.name.toLowerCase()))
  console.log(`[seedAds] ${eligible.length} eligible brands (${excluded.size} active competitors excluded)`)

  // Create competitor entries for eligible brands
  const competitorMap = new Map<string, string>()
  for (const brand of eligible) {
    let c = await prisma.competitor.findFirst({
      where: { organizationId: org.id, name: { equals: brand.name, mode: 'insensitive' } },
    })
    if (!c) {
      c = await prisma.competitor.create({
        data: { organizationId: org.id, name: brand.name, website: '', brandName: brand.name, isActive: false, trackAds: false },
      })
    }
    competitorMap.set(brand.name, c.id)
  }

  // Generate and insert ads in batches of 100
  let added = 0
  const BATCH = 100
  let idx = 0

  while (added < needed) {
    const toInsert = Math.min(BATCH, needed - added)
    const data = []

    for (let i = 0; i < toInsert; i++) {
      const brand = eligible[idx % eligible.length]
      const ad = makeAd(brand, idx)
      const competitorId = competitorMap.get(brand.name)!
      data.push({ ...ad, competitorId })
      idx++
    }

    await prisma.ad.createMany({ data, skipDuplicates: true })
    added += toInsert

    if (added % 1000 === 0 || added === needed) {
      console.log(`[seedAds] ${existing + added}/${TARGET} (${added} added this run)`)
    }
  }

  console.log(`\n[seedAds] ✓ Done — ${existing + added} discovery ads in DB`)
  console.log('[seedAds] Switch Railway Start Command back to adsCron.ts')
}

main()
  .catch(err => { console.error('[seedAds] Fatal error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
