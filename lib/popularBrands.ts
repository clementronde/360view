/**
 * Brands curated for their strong static image ad presence on Meta.
 * categoryKey matches BRAND_CATEGORIES keys.
 */
export type PopularBrand = {
  name: string
  categoryKey: string
  searchQuery: string
}

export const ALL_POPULAR_BRANDS: PopularBrand[] = [
  // ── MODE ──────────────────────────────────────────────────────────────────
  { name: 'Zara', categoryKey: 'MODE', searchQuery: 'Zara' },
  { name: 'H&M', categoryKey: 'MODE', searchQuery: 'H&M' },
  { name: 'Lacoste', categoryKey: 'MODE', searchQuery: 'Lacoste' },
  { name: 'Uniqlo', categoryKey: 'MODE', searchQuery: 'Uniqlo France' },
  { name: 'Sézane', categoryKey: 'MODE', searchQuery: 'Sézane' },
  { name: 'Maje', categoryKey: 'MODE', searchQuery: 'Maje' },
  { name: 'Sandro', categoryKey: 'MODE', searchQuery: 'Sandro Paris' },
  { name: 'Jacquemus', categoryKey: 'MODE', searchQuery: 'Jacquemus' },
  { name: 'The Kooples', categoryKey: 'MODE', searchQuery: 'The Kooples' },
  { name: 'Veja', categoryKey: 'MODE', searchQuery: 'Veja' },

  // ── BEAUTÉ ────────────────────────────────────────────────────────────────
  { name: 'Sephora', categoryKey: 'BEAUTE', searchQuery: 'Sephora France' },
  { name: "L'Oréal Paris", categoryKey: 'BEAUTE', searchQuery: "L'Oréal Paris" },
  { name: 'Lancôme', categoryKey: 'BEAUTE', searchQuery: 'Lancôme' },
  { name: 'Charlotte Tilbury', categoryKey: 'BEAUTE', searchQuery: 'Charlotte Tilbury' },
  { name: 'La Roche-Posay', categoryKey: 'BEAUTE', searchQuery: 'La Roche-Posay' },
  { name: 'Nuxe', categoryKey: 'BEAUTE', searchQuery: 'Nuxe' },
  { name: 'Caudalie', categoryKey: 'BEAUTE', searchQuery: 'Caudalie' },
  { name: 'Clarins', categoryKey: 'BEAUTE', searchQuery: 'Clarins' },
  { name: 'Vichy', categoryKey: 'BEAUTE', searchQuery: 'Vichy' },

  // ── TECH ──────────────────────────────────────────────────────────────────
  { name: 'Apple', categoryKey: 'TECH', searchQuery: 'Apple' },
  { name: 'Samsung France', categoryKey: 'TECH', searchQuery: 'Samsung France' },
  { name: 'Fnac', categoryKey: 'TECH', searchQuery: 'Fnac' },
  { name: 'Darty', categoryKey: 'TECH', searchQuery: 'Darty' },
  { name: 'Boulanger', categoryKey: 'TECH', searchQuery: 'Boulanger' },
  { name: 'Cdiscount', categoryKey: 'TECH', searchQuery: 'Cdiscount' },

  // ── FOOD ──────────────────────────────────────────────────────────────────
  { name: "McDonald's France", categoryKey: 'FOOD', searchQuery: "McDonald's France" },
  { name: 'Uber Eats France', categoryKey: 'FOOD', searchQuery: 'Uber Eats France' },
  { name: 'Deliveroo France', categoryKey: 'FOOD', searchQuery: 'Deliveroo France' },
  { name: 'Starbucks France', categoryKey: 'FOOD', searchQuery: 'Starbucks France' },
  { name: 'Picard', categoryKey: 'FOOD', searchQuery: 'Picard Surgelés' },
  { name: 'Monoprix', categoryKey: 'FOOD', searchQuery: 'Monoprix' },
  { name: 'Dominos Pizza France', categoryKey: 'FOOD', searchQuery: "Domino's Pizza France" },

  // ── VOYAGE ────────────────────────────────────────────────────────────────
  { name: 'Airbnb', categoryKey: 'VOYAGE', searchQuery: 'Airbnb' },
  { name: 'Booking.com', categoryKey: 'VOYAGE', searchQuery: 'Booking.com' },
  { name: 'Club Med', categoryKey: 'VOYAGE', searchQuery: 'Club Med' },
  { name: 'Corsair', categoryKey: 'VOYAGE', searchQuery: 'Corsair' },
  { name: 'Accor', categoryKey: 'VOYAGE', searchQuery: 'Accor' },
  { name: 'Expedia', categoryKey: 'VOYAGE', searchQuery: 'Expedia France' },

  // ── AUTO ──────────────────────────────────────────────────────────────────
  { name: 'Renault', categoryKey: 'AUTO', searchQuery: 'Renault' },
  { name: 'Peugeot', categoryKey: 'AUTO', searchQuery: 'Peugeot' },
  { name: 'Citroën', categoryKey: 'AUTO', searchQuery: 'Citroën' },
  { name: 'Volkswagen France', categoryKey: 'AUTO', searchQuery: 'Volkswagen France' },
  { name: 'BMW France', categoryKey: 'AUTO', searchQuery: 'BMW France' },
  { name: 'Mercedes-Benz France', categoryKey: 'AUTO', searchQuery: 'Mercedes-Benz France' },
  { name: 'Tesla', categoryKey: 'AUTO', searchQuery: 'Tesla' },

  // ── RETAIL ────────────────────────────────────────────────────────────────
  { name: 'IKEA France', categoryKey: 'RETAIL', searchQuery: 'IKEA France' },
  { name: 'Décathlon', categoryKey: 'RETAIL', searchQuery: 'Décathlon' },
  { name: 'Galeries Lafayette', categoryKey: 'RETAIL', searchQuery: 'Galeries Lafayette' },
  { name: 'Leroy Merlin', categoryKey: 'RETAIL', searchQuery: 'Leroy Merlin' },
  { name: 'Carrefour', categoryKey: 'RETAIL', searchQuery: 'Carrefour France' },
  { name: 'Amazon France', categoryKey: 'RETAIL', searchQuery: 'Amazon France' },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  { name: 'BNP Paribas', categoryKey: 'FINANCE', searchQuery: 'BNP Paribas' },
  { name: 'Société Générale', categoryKey: 'FINANCE', searchQuery: 'Société Générale' },
  { name: 'Crédit Agricole', categoryKey: 'FINANCE', searchQuery: 'Crédit Agricole' },
  { name: 'LCL', categoryKey: 'FINANCE', searchQuery: 'LCL' },
  { name: 'Caisse d\'Épargne', categoryKey: 'FINANCE', searchQuery: "Caisse d'Épargne" },
  { name: 'PayPal', categoryKey: 'FINANCE', searchQuery: 'PayPal France' },
  { name: 'Wise', categoryKey: 'FINANCE', searchQuery: 'Wise' },

  // ── MEDIA ─────────────────────────────────────────────────────────────────
  { name: 'Netflix France', categoryKey: 'MEDIA', searchQuery: 'Netflix France' },
  { name: 'Spotify France', categoryKey: 'MEDIA', searchQuery: 'Spotify France' },
  { name: 'Canal+', categoryKey: 'MEDIA', searchQuery: 'Canal+' },
  { name: 'Disney+', categoryKey: 'MEDIA', searchQuery: 'Disney Plus France' },
  { name: 'Amazon Prime Video', categoryKey: 'MEDIA', searchQuery: 'Amazon Prime Video France' },
  { name: 'Deezer', categoryKey: 'MEDIA', searchQuery: 'Deezer' },

  // ── SANTÉ ─────────────────────────────────────────────────────────────────
  { name: 'Doctolib', categoryKey: 'SANTE', searchQuery: 'Doctolib' },
  { name: 'Biocoop', categoryKey: 'SANTE', searchQuery: 'Biocoop' },
  { name: 'Withings', categoryKey: 'SANTE', searchQuery: 'Withings' },
  { name: 'Krys', categoryKey: 'SANTE', searchQuery: 'Krys' },
  { name: 'Optic 2000', categoryKey: 'SANTE', searchQuery: 'Optic 2000' },
  { name: 'Bayer France', categoryKey: 'SANTE', searchQuery: 'Bayer France' },

  // ── SPORT ─────────────────────────────────────────────────────────────────
  { name: 'Nike', categoryKey: 'SPORT', searchQuery: 'Nike' },
  { name: 'Adidas', categoryKey: 'SPORT', searchQuery: 'Adidas' },
  { name: 'Puma', categoryKey: 'SPORT', searchQuery: 'Puma' },
  { name: 'New Balance', categoryKey: 'SPORT', searchQuery: 'New Balance' },
  { name: 'Under Armour', categoryKey: 'SPORT', searchQuery: 'Under Armour' },
  { name: 'Asics', categoryKey: 'SPORT', searchQuery: 'Asics France' },
  { name: 'Intersport', categoryKey: 'SPORT', searchQuery: 'Intersport France' },

  // ── IMMO ──────────────────────────────────────────────────────────────────
  { name: 'SeLoger', categoryKey: 'IMMO', searchQuery: 'SeLoger' },
  { name: 'Leboncoin Immobilier', categoryKey: 'IMMO', searchQuery: 'leboncoin' },
  { name: 'Foncia', categoryKey: 'IMMO', searchQuery: 'Foncia' },
  { name: 'Nexity', categoryKey: 'IMMO', searchQuery: 'Nexity' },
  { name: 'Orpi', categoryKey: 'IMMO', searchQuery: 'Orpi' },
  { name: 'Century 21 France', categoryKey: 'IMMO', searchQuery: 'Century 21 France' },
]

export function getPopularBrandsForCategory(categoryKey: string): PopularBrand[] {
  return ALL_POPULAR_BRANDS.filter((b) => b.categoryKey === categoryKey)
}

export function getRandomPopularBrands(count: number): PopularBrand[] {
  const shuffled = [...ALL_POPULAR_BRANDS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}
