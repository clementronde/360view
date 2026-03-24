'use client'

import { MockAdCard, type MockAd } from './AdCard'

// picsum.photos/id/{imageId} — IDs stables et thématiques
export const MOCK_ADS: MockAd[] = [
  {
    brand: 'Nike',
    headline: 'Prêt à dépasser tes limites ? Nouvelle Air Max.',
    sub: 'Collection Running 2025 — Livraison 24h',
    cta: 'Découvrir la collection',
    platform: 'META',
    accentColor: '#f97316',
    imageId: 863, // sport/running
  },
  {
    brand: 'Sephora',
    headline: 'Ta routine skincare du printemps.',
    sub: 'Nouveautés Drunk Elephant · Tatcha · Laneige',
    cta: 'Voir les nouveautés',
    platform: 'META',
    accentColor: '#e879f9',
    imageId: 1062, // beauty/lifestyle
  },
  {
    brand: 'Decathlon',
    headline: 'Équipe-toi pour l\'été dès 19€.',
    sub: 'Vélos, raquettes, kayaks — prix direct usine',
    cta: 'J\'équipe mon été',
    platform: 'GOOGLE',
    accentColor: '#3b82f6',
    imageId: 1023, // outdoor/nature
  },
  {
    brand: 'Spotify',
    headline: '3 mois Premium offerts. Musique sans limite.',
    sub: 'Écoute hors ligne · Qualité CD',
    cta: 'Commencer l\'essai',
    platform: 'META',
    accentColor: '#22c55e',
    imageId: 1089, // concert/music
  },
  {
    brand: 'Blablacar',
    headline: 'Paris → Lyon dès 9€. Partez maintenant.',
    sub: '300 000 conducteurs disponibles',
    cta: 'Trouver un trajet',
    platform: 'GOOGLE',
    accentColor: '#06b6d4',
    imageId: 1012, // road/travel
  },
  {
    brand: 'IKEA',
    headline: 'Printemps-Été. Nouveautés maison.',
    sub: 'Livraison J+1 dans toute la France',
    cta: 'Voir le catalogue',
    platform: 'META',
    accentColor: '#fbbf24',
    imageId: 1055, // interior/home
  },
  {
    brand: 'Nespresso',
    headline: 'Le café de barista, chez vous.',
    sub: 'Vertuo Next + 50 capsules offertes',
    cta: 'Profiter de l\'offre',
    platform: 'TIKTOK',
    accentColor: '#d97706',
    imageId: 766, // coffee
  },
  {
    brand: 'Doctolib',
    headline: 'RDV chez votre médecin en 2 clics.',
    sub: '70 000 praticiens · Rappels SMS',
    cta: 'Prendre rendez-vous',
    platform: 'META',
    accentColor: '#60a5fa',
    imageId: 1074, // clean/medical
  },
  {
    brand: 'Zalando',
    headline: 'Soldes jusqu\'à -70%. Ce soir seulement.',
    sub: 'Livraison gratuite · Retour 100 jours',
    cta: 'Shopper les soldes',
    platform: 'GOOGLE',
    accentColor: '#f472b6',
    imageId: 1005, // fashion
  },
  {
    brand: 'Notion',
    headline: 'Votre équipe, enfin organisée.',
    sub: 'Notes · Docs · Projets · Base de données',
    cta: 'Essai gratuit',
    platform: 'LINKEDIN',
    accentColor: '#a3a3a3',
    imageId: 1040, // workspace
  },
  {
    brand: 'Airbnb',
    headline: 'Escapade ce weekend ? 1000 villas.',
    sub: 'Châteaux, chalets, lofts — dès 45€/nuit',
    cta: 'Explorer les logements',
    platform: 'META',
    accentColor: '#fb7185',
    imageId: 1015, // travel/landscape
  },
  {
    brand: 'Cdiscount',
    headline: '-40% sur la High-Tech. Flash 48h.',
    sub: 'iPhone · MacBook · PS5 · Samsung',
    cta: 'Voir les offres',
    platform: 'GOOGLE',
    accentColor: '#f59e0b',
    imageId: 0, // tech
  },
]

export function AdMarquee() {
  const half = Math.ceil(MOCK_ADS.length / 2)
  const row1 = MOCK_ADS.slice(0, half)
  const row2 = MOCK_ADS.slice(half)

  return (
    <div className="relative w-full overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      {/* Row 1 — gauche → droite */}
      <div className="flex gap-3 mb-3 animate-marquee-slow" style={{ width: 'max-content' }}>
        {[...row1, ...row1].map((ad, i) => (
          <div key={i} className="w-[210px] shrink-0">
            <MockAdCard ad={ad} delay={0} />
          </div>
        ))}
      </div>
      {/* Row 2 — droite → gauche */}
      <div className="flex gap-3 animate-marquee-slow-reverse" style={{ width: 'max-content' }}>
        {[...row2, ...row2].map((ad, i) => (
          <div key={i} className="w-[210px] shrink-0">
            <MockAdCard ad={ad} delay={0} />
          </div>
        ))}
      </div>
    </div>
  )
}
