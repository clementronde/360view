'use server'

import { prisma } from '@/lib/prisma'
import { AdFormat, AdPlatform, AdSource } from '@prisma/client'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export async function seedDemoAds(): Promise<{
  success: boolean
  message: string
  adsCreated: number
}> {
  try {
    /* ── 1. Find or create demo organization ── */
    const org = await prisma.organization.upsert({
      where: { clerkOrgId: 'demo_org_seed' },
      update: {},
      create: {
        clerkOrgId: 'demo_org_seed',
        name: 'Demo Organization',
        slug: 'demo-org',
      },
    })

    /* ── 2. Helper: find or create a competitor ── */
    const upsertCompetitor = async (name: string, website: string) => {
      const existing = await prisma.competitor.findFirst({
        where: { organizationId: org.id, name },
      })
      if (existing) return existing
      return prisma.competitor.create({
        data: {
          organizationId: org.id,
          name,
          website,
          isActive: true,
        },
      })
    }

    const nike      = await upsertCompetitor('Nike',      'nike.com')
    const adidas    = await upsertCompetitor('Adidas',    'adidas.fr')
    const puma      = await upsertCompetitor('Puma',      'puma.com')
    const decathlon = await upsertCompetitor('Decathlon', 'decathlon.fr')

    /* ── 3. Seed ads ── */
    type AdSeed = {
      competitorId: string
      platform: AdPlatform
      format: AdFormat
      source: AdSource
      advertiserName: string
      title: string
      description: string
      ctaText: string
      landingUrl: string
      imageUrl: string
      isActive: boolean
      firstSeenAt: Date
    }

    const ads: AdSeed[] = [
      /* ── Nike — 4 ads ── */
      {
        competitorId: nike.id,
        platform: AdPlatform.META,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Nike',
        title: 'Just Do It. Collection Running 2025',
        description: 'Découvrez la nouvelle collection Running Nike printemps 2025. Chaussures, vêtements et accessoires pour courir plus vite et plus loin.',
        ctaText: 'Shop Now',
        landingUrl: 'https://www.nike.com/fr/running',
        imageUrl: 'https://picsum.photos/seed/nike-0/400/500',
        isActive: true,
        firstSeenAt: daysAgo(2),
      },
      {
        competitorId: nike.id,
        platform: AdPlatform.GOOGLE,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Nike',
        title: 'Air Max 270 — Confort & Style',
        description: 'La Nike Air Max 270 offre une amorti exceptionnel toute la journée. Commandez maintenant avec livraison gratuite.',
        ctaText: 'Acheter',
        landingUrl: 'https://www.nike.com/fr/air-max-270',
        imageUrl: 'https://picsum.photos/seed/nike-1/400/500',
        isActive: true,
        firstSeenAt: daysAgo(5),
      },
      {
        competitorId: nike.id,
        platform: AdPlatform.GOOGLE,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Nike',
        title: 'Nike React Infinity — Courez sans douleur',
        description: 'Réduisez les blessures de course avec la Nike React Infinity Run. Technologie React amortissante brevetée.',
        ctaText: 'Découvrir',
        landingUrl: 'https://www.nike.com/fr/react-infinity',
        imageUrl: 'https://picsum.photos/seed/nike-2/400/500',
        isActive: true,
        firstSeenAt: daysAgo(8),
      },
      {
        competitorId: nike.id,
        platform: AdPlatform.TIKTOK,
        format: AdFormat.VIDEO,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Nike',
        title: 'Never Done Evolving — Nike TikTok',
        description: 'Le sport évolue. Vous aussi. Rejoignez des millions d\'athlètes avec les dernières innovations Nike.',
        ctaText: 'Explorer',
        landingUrl: 'https://www.nike.com/fr',
        imageUrl: 'https://picsum.photos/seed/nike-3/400/500',
        isActive: true,
        firstSeenAt: daysAgo(1),
      },

      /* ── Adidas — 3 ads ── */
      {
        competitorId: adidas.id,
        platform: AdPlatform.META,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Adidas',
        title: 'Impossible is Nothing — Ultraboost 24',
        description: 'L\'Ultraboost 24 redéfinit le confort de course avec une technologie Boost améliorée. Livraison offerte dès 60€.',
        ctaText: 'Découvrir',
        landingUrl: 'https://www.adidas.fr/ultraboost-24',
        imageUrl: 'https://picsum.photos/seed/adidas-0/400/500',
        isActive: true,
        firstSeenAt: daysAgo(3),
      },
      {
        competitorId: adidas.id,
        platform: AdPlatform.GOOGLE,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Adidas',
        title: '3 Stripes Forever — Adidas Originals 2025',
        description: 'La collection Originals 2025 mêle héritage et modernité. Retrouvez vos classiques revisités pour cette saison.',
        ctaText: 'Shop',
        landingUrl: 'https://www.adidas.fr/originals',
        imageUrl: 'https://picsum.photos/seed/adidas-1/400/500',
        isActive: true,
        firstSeenAt: daysAgo(6),
      },
      {
        competitorId: adidas.id,
        platform: AdPlatform.TIKTOK,
        format: AdFormat.VIDEO,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Adidas',
        title: 'Adidas Running — Défie tes limites',
        description: 'Chaque kilomètre compte. Avec Adidas Running, repousse tes limites avec les meilleures chaussures de la saison.',
        ctaText: 'Courir maintenant',
        landingUrl: 'https://www.adidas.fr/running',
        imageUrl: 'https://picsum.photos/seed/adidas-2/400/500',
        isActive: true,
        firstSeenAt: daysAgo(4),
      },

      /* ── Puma — 3 ads ── */
      {
        competitorId: puma.id,
        platform: AdPlatform.META,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Puma',
        title: 'Run the Streets — Velocity Nitro 3',
        description: 'La Velocity Nitro 3 est conçue pour les runners qui veulent aller plus vite. Amorti NITRO, légèreté extrême.',
        ctaText: 'Get it',
        landingUrl: 'https://www.puma.com/fr/velocity-nitro-3',
        imageUrl: 'https://picsum.photos/seed/puma-0/400/500',
        isActive: true,
        firstSeenAt: daysAgo(7),
      },
      {
        competitorId: puma.id,
        platform: AdPlatform.TIKTOK,
        format: AdFormat.VIDEO,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Puma',
        title: 'Puma x TikTok — Forever Faster',
        description: 'Le style de rue rencontre la performance. Découvrez la collection Puma streetwear printemps-été 2025.',
        ctaText: 'Voir la collab',
        landingUrl: 'https://www.puma.com/fr/streetwear',
        imageUrl: 'https://picsum.photos/seed/puma-1/400/500',
        isActive: true,
        firstSeenAt: daysAgo(9),
      },
      {
        competitorId: puma.id,
        platform: AdPlatform.PINTEREST,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Puma',
        title: 'Puma Femme — Tendances Printemps 2025',
        description: 'Retrouvez toutes les tendances mode sport pour femme. Leggings, hauts et chaussures Puma pour un look parfait.',
        ctaText: 'Inspiration style',
        landingUrl: 'https://www.puma.com/fr/femme',
        imageUrl: 'https://picsum.photos/seed/puma-2/400/500',
        isActive: true,
        firstSeenAt: daysAgo(12),
      },

      /* ── Decathlon — 2 ads ── */
      {
        competitorId: decathlon.id,
        platform: AdPlatform.META,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Decathlon',
        title: 'Sport pour tous — -40% sur les vélos',
        description: 'Profitez de -40% sur une sélection de vélos et accessoires. Offre valable jusqu\'au 31 mars. Livraison gratuite en magasin.',
        ctaText: "Voir l'offre",
        landingUrl: 'https://www.decathlon.fr/velos',
        imageUrl: 'https://picsum.photos/seed/decathlon-0/400/500',
        isActive: true,
        firstSeenAt: daysAgo(1),
      },
      {
        competitorId: decathlon.id,
        platform: AdPlatform.LINKEDIN,
        format: AdFormat.DISPLAY,
        source: AdSource.COMPETITOR_TRACKING,
        advertiserName: 'Decathlon',
        title: 'Decathlon Business — Équipez vos équipes',
        description: 'Solutions sport entreprise : tenues, matériel et équipements pour vos collaborateurs. Tarifs B2B négociés et livraison sur site.',
        ctaText: 'Contactez-nous',
        landingUrl: 'https://www.decathlon.fr/business',
        imageUrl: 'https://picsum.photos/seed/decathlon-1/400/500',
        isActive: true,
        firstSeenAt: daysAgo(14),
      },
    ]

    /* ── 4. Insert ads (skip duplicates by title+competitorId) ── */
    let adsCreated = 0
    for (const ad of ads) {
      const exists = await prisma.ad.findFirst({
        where: { competitorId: ad.competitorId, title: ad.title },
      })
      if (!exists) {
        await prisma.ad.create({ data: ad })
        adsCreated++
      }
    }

    return {
      success: true,
      message: `Demo data seeded. ${adsCreated} new ads created across 4 competitors.`,
      adsCreated,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      message: `Seed failed: ${message}`,
      adsCreated: 0,
    }
  }
}
