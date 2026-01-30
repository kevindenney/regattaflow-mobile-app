/**
 * Sailor Tier Definitions
 *
 * Freemium model for individual sailors:
 * - Free: Limited races, basic features
 * - Individual: Full race features for solo sailors ($10/mo or $120/yr)
 * - Team: Full race features for teams up to 5 people ($40/mo or $480/yr)
 *
 * Learning modules are purchased separately ($30/yr each)
 */

export type SailorTier = 'free' | 'individual' | 'team';

export interface TierLimits {
  maxRaces: number;
  aiQueriesPerMonth: number;
  teamSharing: boolean;
  weatherAutomation: boolean;
  historicalData: boolean;
  offlineMode: boolean;
  advancedAnalytics: boolean;
  maxSeats: number;
}

export interface TierDefinition {
  id: SailorTier;
  name: string;
  description: string;
  price: string | null;
  priceMonthly: string | null;
  priceYearly: string | null;
  limits: TierLimits;
  features: string[];
  isPopular?: boolean;
}

/**
 * Sailor tier configuration
 * Updated: 2026-01-30
 *
 * New pricing structure:
 * - Free: $0
 * - Individual: $10/mo ($120/yr) - renamed from Basic
 * - Team: $40/mo ($480/yr) - renamed from Pro/Championship
 */
export const SAILOR_TIERS: Record<SailorTier, TierDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with race preparation',
    price: null,
    priceMonthly: null,
    priceYearly: null,
    limits: {
      maxRaces: 3,
      aiQueriesPerMonth: 5,
      teamSharing: false,
      weatherAutomation: false,
      historicalData: false,
      offlineMode: false,
      advancedAnalytics: false,
      maxSeats: 1,
    },
    features: [
      'Up to 3 races',
      'Basic race checklists',
      'Manual weather lookup',
      '5 AI queries per month',
      'Document upload',
    ],
  },
  individual: {
    id: 'individual',
    name: 'Individual',
    description: 'Full racing features for solo sailors',
    price: '$120/year',
    priceMonthly: '$10',
    priceYearly: '$120',
    limits: {
      maxRaces: Infinity,
      aiQueriesPerMonth: Infinity,
      teamSharing: false,
      weatherAutomation: true,
      historicalData: true,
      offlineMode: true,
      advancedAnalytics: true,
      maxSeats: 1,
    },
    features: [
      'Unlimited races',
      'Unlimited AI queries',
      'AI strategy analysis',
      'Automatic weather updates',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
      'Cloud backup & sync',
    ],
    isPopular: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'Full racing features for teams',
    price: '$480/year',
    priceMonthly: '$40',
    priceYearly: '$480',
    limits: {
      maxRaces: Infinity,
      aiQueriesPerMonth: Infinity,
      teamSharing: true,
      weatherAutomation: true,
      historicalData: true,
      offlineMode: true,
      advancedAnalytics: true,
      maxSeats: 5,
    },
    features: [
      'Everything in Individual',
      'Up to 5 team members',
      'Team sharing & collaboration',
      'Shared race preparation',
      'Team analytics dashboard',
      'Priority support',
    ],
  },
};

/**
 * Legacy tier mapping for backward compatibility
 * Maps old tier names to new tier names
 */
export const LEGACY_TIER_MAP: Record<string, SailorTier> = {
  basic: 'individual',
  pro: 'team',
  championship: 'team',
};

/**
 * Normalize tier name (handle legacy names)
 */
export function normalizeTier(tier: string | null | undefined): SailorTier {
  if (!tier) return 'free';
  const lowerTier = tier.toLowerCase();
  if (lowerTier in LEGACY_TIER_MAP) {
    return LEGACY_TIER_MAP[lowerTier];
  }
  if (lowerTier in SAILOR_TIERS) {
    return lowerTier as SailorTier;
  }
  return 'free';
}

/**
 * Feature definitions for gating
 */
export type GatedFeature =
  | 'unlimited_races'
  | 'ai_strategy'
  | 'team_sharing'
  | 'weather_automation'
  | 'historical_data'
  | 'offline_mode'
  | 'advanced_analytics';

export const FEATURE_REQUIREMENTS: Record<GatedFeature, SailorTier[]> = {
  unlimited_races: ['individual', 'team'],
  ai_strategy: ['individual', 'team'],
  team_sharing: ['team'],
  weather_automation: ['individual', 'team'],
  historical_data: ['individual', 'team'],
  offline_mode: ['individual', 'team'],
  advanced_analytics: ['individual', 'team'],
};

/**
 * Get tier limits for a given tier
 */
export function getTierLimits(tier: SailorTier): TierLimits {
  const normalizedTier = normalizeTier(tier);
  return SAILOR_TIERS[normalizedTier].limits;
}

/**
 * Check if a feature is available for a tier
 */
export function isFeatureAvailable(feature: GatedFeature, tier: SailorTier): boolean {
  const normalizedTier = normalizeTier(tier);
  return FEATURE_REQUIREMENTS[feature].includes(normalizedTier);
}

/**
 * Get the tier required for a feature
 */
export function getRequiredTier(feature: GatedFeature): SailorTier {
  return FEATURE_REQUIREMENTS[feature][0];
}

/**
 * Check if user has reached race limit
 */
export function hasReachedRaceLimit(raceCount: number, tier: SailorTier): boolean {
  const limits = getTierLimits(tier);
  return raceCount >= limits.maxRaces;
}

/**
 * Get remaining races for free tier
 */
export function getRemainingRaces(raceCount: number, tier: SailorTier): number | null {
  const limits = getTierLimits(tier);
  if (limits.maxRaces === Infinity) return null;
  return Math.max(0, limits.maxRaces - raceCount);
}

/**
 * Check if a tier supports team features
 */
export function hasTeamFeatures(tier: SailorTier): boolean {
  const normalizedTier = normalizeTier(tier);
  return SAILOR_TIERS[normalizedTier].limits.teamSharing;
}

/**
 * Get max seats for a tier
 */
export function getMaxSeats(tier: SailorTier): number {
  const normalizedTier = normalizeTier(tier);
  return SAILOR_TIERS[normalizedTier].limits.maxSeats;
}
