/**
 * Boat Equipment Manufacturers
 *
 * Reference lists of manufacturers for boat equipment.
 * Sources:
 * - International Dragon Association (IDA)
 * - British Dragon Association
 * - World Sailing licensed builders database
 *
 * Last updated: October 2025
 */

// ============================================================================
// DRAGON CLASS HULL MAKERS
// ============================================================================

export interface HullMaker {
  name: string;
  country: string;
  website?: string;
  active: boolean; // Whether currently building new boats
  notes?: string;
}

/**
 * Official and historical Dragon Class hull builders
 *
 * Sources:
 * - World Sailing: https://www.sailing.org/classesandequipment/DRA.php
 * - British Dragon Association: https://www.britishdragons.org/contacts/dragon-builders/
 * - International Dragon Association: https://internationaldragonsailing.net
 * - Dragon Class Archive: https://dragonarchive.org/builders/
 */
export const DRAGON_HULL_MAKERS: HullMaker[] = [
  // ========== ACTIVE BUILDERS ==========
  {
    name: 'Petticrows',
    country: 'UK / Portugal',
    website: 'https://petticrows.com',
    active: true,
    notes: 'Over 800 Dragons built. Relocated to Cascais, Portugal in 2021',
  },
  {
    name: 'Doomernik',
    country: 'Netherlands',
    website: 'https://www.doomernik.nl',
    active: true,
    notes: 'Only Dragon builder in Netherlands. Known for hull stiffness and quality',
  },
  {
    name: 'Doomernik Yachts',
    country: 'Netherlands',
    website: 'https://www.doomernikyachts.com',
    active: true,
    notes: 'Full company name for Doomernik',
  },
  {
    name: 'Markus Glas',
    country: 'Germany',
    website: 'https://www.bootswerft-glas.de',
    active: true,
    notes: 'Premier Dragons builder',
  },
  {
    name: 'Vejle Yacht Services',
    country: 'Denmark',
    website: 'https://vys.dk',
    active: true,
    notes: 'Premier Dragons builder',
  },
  {
    name: 'Dominick',
    country: 'Unknown',
    active: true,
    notes: 'Dragon hull maker',
  },

  // ========== DORMANT / UNCERTAIN STATUS ==========
  {
    name: 'Børresens Bådebyggeri',
    country: 'Denmark',
    website: 'https://www.borresen.com',
    active: false,
    notes: '760+ Dragons built (1935-present). Listed as DORMANT in World Sailing database',
  },
  {
    name: 'Borresens', // Alternative spelling
    country: 'Denmark',
    website: 'https://www.borresen.com',
    active: false,
    notes: 'Common spelling variant of Børresens Bådebyggeri. 760+ Dragons built',
  },

  // ========== HISTORICAL BUILDERS - NO LONGER BUILDING DRAGONS ==========

  // Asia-Pacific Builders
  {
    name: 'Chang',
    country: 'Hong Kong',
    active: false,
    notes: 'Lowell Chang. Pioneered fiberglass Dragons in Hong Kong (1986+). Built 1987 World Championship winning boat',
  },
  {
    name: 'Lowell Chang',
    country: 'Hong Kong',
    active: false,
    notes: 'Full name for Chang. First fiberglass Dragon in HK (1986). 1987 World Champion boat builder',
  },

  // Danish Historical Builders
  {
    name: 'Pedersen & Thuesen',
    country: 'Denmark',
    active: false,
    notes: '97 Dragons built (1952-1970). Closed in 1983 after 34 years in business',
  },

  // German Historical Builders
  {
    name: 'Abeking & Rasmussen',
    country: 'Germany',
    active: false,
    notes: '148 Dragons built (1934-1971). Historic German yacht builder',
  },

  // Norwegian Historical Builders
  {
    name: 'Anker & Jensen',
    country: 'Norway',
    active: false,
    notes: '69 Dragons built (1930-1953). Johan Anker was original Dragon designer (1929)',
  },
  {
    name: 'Bjarne Aas',
    country: 'Norway',
    active: false,
    notes: '62 Dragons built (1939-1968). Norwegian wooden boat builder',
  },

  // French Historical Builders
  {
    name: 'Bonnin',
    country: 'France',
    active: false,
    notes: '74 Dragons built (1950-1968). Based in Arcachon',
  },

  // UK Historical Builders
  {
    name: 'Nunn Bros',
    country: 'UK',
    active: false,
    notes: 'Major UK wooden Dragon builder. No longer produces Dragons',
  },
  {
    name: 'Camper and Nicholson',
    country: 'UK',
    active: false,
    notes: 'Historic British yacht builder. Major Dragon builder in wooden boat era',
  },
  {
    name: 'Lallows',
    country: 'UK',
    active: false,
    notes: 'British wooden Dragon builder. No longer produces Dragons',
  },
  {
    name: 'Woodnutt',
    country: 'UK',
    active: false,
    notes: 'British wooden Dragon builder. No longer produces Dragons',
  },
  {
    name: 'Savell',
    country: 'UK',
    active: false,
    notes: 'Successful wooden Dragon builder internationally',
  },
];

/**
 * Get unique list of Dragon hull maker names (simplified for dropdowns)
 * Includes both active and historical builders
 */
export const DRAGON_HULL_MAKER_NAMES = Array.from(
  new Set(
    DRAGON_HULL_MAKERS.map(maker => maker.name)
  )
).sort();

/**
 * Get only active Dragon hull maker names
 */
export const ACTIVE_DRAGON_HULL_MAKER_NAMES = Array.from(
  new Set(
    DRAGON_HULL_MAKERS
      .filter(maker => maker.active)
      .map(maker => maker.name)
  )
).sort();

// ============================================================================
// RIG MAKERS
// ============================================================================

export const COMMON_RIG_MAKERS = [
  'Seldén',
  'Z-Spars',
  'Sparcraft',
  'Hall Spars',
  'Southern Spars',
  'Offshore Spars',
  'ProFurl',
].sort();

// ============================================================================
// SAIL MAKERS
// ============================================================================

export const COMMON_SAIL_MAKERS = [
  'North Sails',
  'Quantum Sails',
  'UK Sailmakers',
  'Elvstrøm Sails',
  'Hyde Sails',
  'Banks Sails',
  'Doyle Sails',
  'Hood Sailmakers',
  'Ullman Sails',
  'OneSails',
  'Dimension-Polyant', // Sailcloth manufacturer, also makes sails
].sort();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get hull makers by country
 */
export function getHullMakersByCountry(country: string): HullMaker[] {
  return DRAGON_HULL_MAKERS.filter(
    maker => maker.country.toLowerCase().includes(country.toLowerCase())
  );
}

/**
 * Get active hull makers only
 */
export function getActiveHullMakers(): HullMaker[] {
  return DRAGON_HULL_MAKERS.filter(maker => maker.active);
}

/**
 * Search hull makers by name (fuzzy match)
 */
export function searchHullMakers(query: string): HullMaker[] {
  const lowerQuery = query.toLowerCase();
  return DRAGON_HULL_MAKERS.filter(maker =>
    maker.name.toLowerCase().includes(lowerQuery)
  );
}
