export type FintechBrand = {
  name: string
  pageId: string
  category: 'fintech-ado' | 'neobanque' | 'education'
  website: string
}

export const FINTECH_BRANDS: FintechBrand[] = [
  // ── Fintechs Ados & Famille ──────────────────────────────────────────────
  {
    name: 'Revolut',
    pageId: '335642513253333',
    category: 'fintech-ado',
    website: 'https://www.revolut.com',
  },
  {
    name: 'GoHenry',
    pageId: '146655362195868',
    category: 'fintech-ado',
    website: 'https://www.gohenry.com',
  },
  {
    name: 'Greenlight',
    pageId: '95751941169',
    category: 'fintech-ado',
    website: 'https://www.greenlight.com',
  },
  {
    name: 'Step',
    pageId: '1898846493741137',
    category: 'fintech-ado',
    website: 'https://www.step.com',
  },
  {
    name: 'Copper Banking',
    pageId: '116786416365166',
    category: 'fintech-ado',
    website: 'https://www.getcopper.com',
  },
  {
    name: 'Xaalys',
    pageId: '356678421456479',
    category: 'fintech-ado',
    website: 'https://www.xaalys.fr',
  },
  {
    name: 'NatWest Rooster Money',
    pageId: '357244034327147',
    category: 'fintech-ado',
    website: 'https://www.roostermoney.com',
  },
  {
    name: 'Freedom24',
    pageId: '251124682428683',
    category: 'fintech-ado',
    website: 'https://www.freedom24.eu',
  },

  // ── Néobanques & Apps Lifestyle ──────────────────────────────────────────
  {
    name: 'N26',
    pageId: '443405509193065',
    category: 'neobanque',
    website: 'https://www.n26.com',
  },
  {
    name: 'BoursoBank',
    pageId: '132746953466063',
    category: 'neobanque',
    website: 'https://www.boursobank.com',
  },
  {
    name: 'Fortuneo',
    pageId: '397017786390',
    category: 'neobanque',
    website: 'https://www.fortuneo.fr',
  },
  {
    name: 'Trade Republic',
    pageId: '172578050274135',
    category: 'neobanque',
    website: 'https://www.traderepublic.com',
  },
  {
    name: 'Monzo',
    pageId: '113612035651775',
    category: 'neobanque',
    website: 'https://www.monzo.com',
  },
  {
    name: 'Starling Bank',
    pageId: '737665069642332',
    category: 'neobanque',
    website: 'https://www.starlingbank.com',
  },
  {
    name: 'Nickel',
    pageId: '471014112983009',
    category: 'neobanque',
    website: 'https://nickel.eu',
  },
  {
    name: 'Klarna',
    pageId: '390926061079580',
    category: 'neobanque',
    website: 'https://www.klarna.com',
  },
  {
    name: 'Swile',
    pageId: '441462056243396',
    category: 'neobanque',
    website: 'https://www.swile.co',
  },

  // ── Éducation & Parentalité ───────────────────────────────────────────────
  {
    name: 'Duolingo',
    pageId: '141935472517297',
    category: 'education',
    website: 'https://www.duolingo.com',
  },
]

export const FINTECH_CATEGORY_LABELS: Record<FintechBrand['category'], string> = {
  'fintech-ado': 'Fintechs Ados & Famille',
  'neobanque': 'Néobanques & Lifestyle',
  'education': 'Éducation & Parentalité',
}
