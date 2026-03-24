'use client'

import { RealAdCard, type LandingAd } from './RealAdCard'
import { MockAdCard, type MockAd } from './AdCard'

// Fallback picsum si la DB est vide
const MOCK_ADS: MockAd[] = [
  { brand: 'Nike', headline: 'Nouvelle Air Max — Collection Running 2025', sub: 'Livraison 24h offerte', cta: 'Découvrir', platform: 'META', accentColor: '#f97316', imageId: 863 },
  { brand: 'Sephora', headline: 'Ta routine skincare du printemps', sub: 'Drunk Elephant · Tatcha · Laneige', cta: 'Voir les nouveautés', platform: 'META', accentColor: '#e879f9', imageId: 1062 },
  { brand: 'Decathlon', headline: "Équipe-toi pour l'été dès 19€", sub: 'Vélos, raquettes, kayaks', cta: "J'équipe mon été", platform: 'GOOGLE', accentColor: '#3b82f6', imageId: 1023 },
  { brand: 'Spotify', headline: '3 mois Premium offerts', sub: 'Écoute hors ligne · Qualité CD', cta: "Commencer l'essai", platform: 'META', accentColor: '#22c55e', imageId: 1089 },
  { brand: 'Blablacar', headline: 'Paris → Lyon dès 9€', sub: '300 000 conducteurs disponibles', cta: 'Trouver un trajet', platform: 'GOOGLE', accentColor: '#06b6d4', imageId: 1012 },
  { brand: 'IKEA', headline: 'Printemps-Été. Nouveautés maison.', sub: 'Livraison J+1 en France', cta: 'Voir le catalogue', platform: 'META', accentColor: '#fbbf24', imageId: 1055 },
  { brand: 'Nespresso', headline: 'Le café de barista, chez vous', sub: 'Vertuo Next + 50 capsules offertes', cta: "Profiter de l'offre", platform: 'TIKTOK', accentColor: '#d97706', imageId: 766 },
  { brand: 'Zalando', headline: "Soldes jusqu'à -70%", sub: 'Livraison gratuite · Retour 100 jours', cta: 'Shopper les soldes', platform: 'GOOGLE', accentColor: '#f472b6', imageId: 1005 },
  { brand: 'Airbnb', headline: 'Escapade ce weekend ? 1000 villas.', sub: 'Châteaux, chalets — dès 45€/nuit', cta: 'Explorer les logements', platform: 'META', accentColor: '#fb7185', imageId: 1015 },
  { brand: 'Notion', headline: 'Votre équipe, enfin organisée', sub: 'Notes · Docs · Projets', cta: 'Essai gratuit', platform: 'LINKEDIN', accentColor: '#a3a3a3', imageId: 1040 },
]

type Props = { ads: LandingAd[] }

export function AdMarqueeClient({ ads }: Props) {
  const useReal = ads.length >= 6
  const half = Math.ceil((useReal ? ads : MOCK_ADS).length / 2)
  const items = useReal ? ads : MOCK_ADS
  const row1 = items.slice(0, half)
  const row2 = items.slice(half)

  const renderCard = (item: LandingAd | MockAd, i: number) =>
    useReal ? (
      <div key={i} className="w-[210px] shrink-0">
        <RealAdCard ad={item as LandingAd} />
      </div>
    ) : (
      <div key={i} className="w-[210px] shrink-0">
        <MockAdCard ad={item as MockAd} delay={0} />
      </div>
    )

  return (
    <div className="relative w-full overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      {/* Row 1 — gauche → droite */}
      <div className="flex gap-3 mb-3 animate-marquee-slow" style={{ width: 'max-content' }}>
        {[...row1, ...row1].map((ad, i) => renderCard(ad, i))}
      </div>
      {/* Row 2 — droite → gauche */}
      <div className="flex gap-3 animate-marquee-slow-reverse" style={{ width: 'max-content' }}>
        {[...row2, ...row2].map((ad, i) => renderCard(ad, i))}
      </div>
    </div>
  )
}
