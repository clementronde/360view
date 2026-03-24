export type BrandCategory = {
  label: string
  icon: string
  brands: string[]
}

export const BRAND_CATEGORIES: Record<string, BrandCategory> = {
  MODE: {
    label: 'Mode',
    icon: '👗',
    brands: [
      'Zara', 'H&M', 'Lacoste', 'Nike', 'Adidas', 'Puma', 'New Balance',
      'Louis Vuitton', 'Gucci', 'Hermès', 'Chanel', 'Dior', 'Balenciaga',
      'Jacquemus', 'Sézane', 'Rouje', 'The Kooples', 'Maje', 'Sandro',
      'Comptoir des Cotonniers', 'Uniqlo', 'COS', 'ASOS', 'Zalando',
      'Veja', 'Isabel Marant', 'Ami Paris',
    ],
  },
  BEAUTE: {
    label: 'Beauté',
    icon: '💄',
    brands: [
      'Sephora', "L'Oréal", 'Lancôme', 'Yves Saint Laurent', 'Charlotte Tilbury',
      'Fenty Beauty', 'NARS', 'Urban Decay', 'The Ordinary', 'Clarins',
      'Clinique', "Kiehl's", 'Estée Lauder', 'Dior Beauty', 'MAC Cosmetics',
      'Biotherm', 'La Roche-Posay', 'Caudalie', 'Nuxe', 'Vichy',
    ],
  },
  TECH: {
    label: 'Tech',
    icon: '💻',
    brands: [
      'Apple', 'Samsung', 'Fnac', 'Darty', 'Boulanger', 'Amazon',
      'Huawei', 'Sony', 'LG', 'Google', 'Microsoft', 'Dell', 'HP',
      'Lenovo', 'Asus', 'Acer', 'OnePlus', 'Xiaomi', 'Oppo',
    ],
  },
  FOOD: {
    label: 'Food',
    icon: '🍔',
    brands: [
      "McDonald's", 'Burger King', 'KFC', 'Pizza Hut', 'Domino\'s',
      'Deliveroo', 'Uber Eats', 'Just Eat', 'Coca-Cola', 'Pepsi',
      'Evian', 'Danone', 'Nestlé', 'Ferrero', 'Kellogg\'s', 'Häagen-Dazs',
      'Ben & Jerry\'s', 'Innocent', 'Lipton', 'Red Bull',
    ],
  },
  VOYAGE: {
    label: 'Voyage',
    icon: '✈️',
    brands: [
      'Booking.com', 'Airbnb', 'Expedia', 'TripAdvisor', 'Air France',
      'EasyJet', 'SNCF', 'Club Med', 'Accor', 'Kayak', 'Trivago',
      'Ryanair', 'Corsair', 'Transavia', 'Marriott', 'Hilton',
      'Hyatt', 'InterContinental', 'Novotel',
    ],
  },
  AUTO: {
    label: 'Auto',
    icon: '🚗',
    brands: [
      'Renault', 'Peugeot', 'Citroën', 'Volkswagen', 'BMW', 'Mercedes-Benz',
      'Tesla', 'Toyota', 'Audi', 'Ford', 'Opel', 'Nissan', 'Hyundai',
      'Kia', 'Stellantis', 'DS Automobiles', 'Volvo', 'Porsche',
    ],
  },
  RETAIL: {
    label: 'Retail',
    icon: '🛍️',
    brands: [
      'Carrefour', 'Leclerc', 'Lidl', 'Aldi', 'Intermarché', 'Monoprix',
      'Galeries Lafayette', 'IKEA', 'Décathlon', 'Leroy Merlin',
      'Brico Dépôt', 'Castorama', 'BUT', 'Conforama', 'Fnac',
      'Cultura', 'Maisons du Monde', 'La Redoute',
    ],
  },
  FINANCE: {
    label: 'Finance',
    icon: '💳',
    brands: [
      'BNP Paribas', 'Société Générale', 'Crédit Agricole', 'LCL',
      'La Banque Postale', 'Revolut', 'N26', 'Lydia', 'PayPal',
      'American Express', 'Visa', 'Mastercard', 'Cetelem', 'Cofidis',
      'Boursorama', 'Fortuneo', 'Hello bank', 'Shine',
    ],
  },
  MEDIA: {
    label: 'Media',
    icon: '📺',
    brands: [
      'Canal+', 'Netflix', 'Spotify', 'Disney+', 'Prime Video',
      'Deezer', 'Molotov', 'OCS', 'Paramount+', 'Apple TV+',
      'TF1', 'M6', 'France Télévisions', 'Arte', 'BFM TV',
    ],
  },
  SANTE: {
    label: 'Santé',
    icon: '🏥',
    brands: [
      'Doctolib', 'Alan', 'Mutuelle Générale', 'MAIF', 'AXA',
      'Allianz', 'Groupama', 'Generali', 'Malakoff Humanis',
      'Ameli', 'Sanofi', 'Novartis', 'Pfizer',
    ],
  },
  SPORT: {
    label: 'Sport',
    icon: '⚽',
    brands: [
      'Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok', 'Décathlon',
      'Columbia', 'The North Face', 'Salomon', 'Asics', 'New Balance',
      'Odlo', 'Hoka', 'On Running',
    ],
  },
  IMMO: {
    label: 'Immo',
    icon: '🏠',
    brands: [
      'SeLoger', 'Leboncoin', 'PAP', 'Logic-Immo', 'Meilleurs Agents',
      'Orpi', 'Century 21', 'Guy Hoquet', 'Foncia', 'Nexity',
      'Bouygues Immobilier', 'Kaufman & Broad', 'Airbnb',
    ],
  },
}

// All brands flattened (deduplicated)
const _allBrands = Object.values(BRAND_CATEGORIES).flatMap((c) => c.brands)
export const ALL_SEED_BRANDS: string[] = _allBrands.filter((b, i) => _allBrands.indexOf(b) === i)

// Quick lookup: brand name → category key
export const BRAND_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(BRAND_CATEGORIES).flatMap(([key, cat]) =>
    cat.brands.map((brand) => [brand.toLowerCase(), key])
  )
)
