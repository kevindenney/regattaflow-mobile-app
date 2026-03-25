/**
 * Sailor Tier Definitions
 *
 * Updated: 2026-03-15
 * Pricing:
 * - Free: Limited races, basic features, 5 AI queries/month
 * - Individual: $10/mo or $100/yr — 50,000 AI tokens/month
 * - Pro: $30/mo or $250/yr — 500,000 AI tokens/month
 */

export type SailorTier = 'free' | 'individual' | 'pro';

export interface TierLimits {
  maxRaces: number;
  aiQueriesPerMonth: number;
  aiTokensPerMonth: number;
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
 * Updated: 2026-03-15
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
      aiTokensPerMonth: 5000,
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
      'MCP / AI assistant integration (read-only)',
    ],
  },
  individual: {
    id: 'individual',
    name: 'Individual',
    description: 'AI-powered race preparation',
    price: '$10/month',
    priceMonthly: '$10',
    priceYearly: '$100',
    limits: {
      maxRaces: Infinity,
      aiQueriesPerMonth: Infinity,
      aiTokensPerMonth: 50000,
      teamSharing: false,
      weatherAutomation: true,
      historicalData: true,
      offlineMode: true,
      advancedAnalytics: true,
      maxSeats: 1,
    },
    features: [
      'Unlimited races',
      '50,000 AI tokens per month',
      'AI strategy analysis',
      'Automatic weather updates',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
      'Cloud backup & sync',
      'MCP / AI assistant integration (read-only)',
    ],
    isPopular: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Maximum AI power for serious racers',
    price: '$30/month',
    priceMonthly: '$30',
    priceYearly: '$250',
    limits: {
      maxRaces: Infinity,
      aiQueriesPerMonth: Infinity,
      aiTokensPerMonth: 500000,
      teamSharing: true,
      weatherAutomation: true,
      historicalData: true,
      offlineMode: true,
      advancedAnalytics: true,
      maxSeats: 5,
    },
    features: [
      'Everything in Individual',
      '500,000 AI tokens per month',
      'Priority AI processing',
      'Team sharing & collaboration',
      'Team analytics dashboard',
      'Priority support',
      'MCP / AI assistant integration (read & write)',
    ],
  },
};

/**
 * Legacy tier mapping for backward compatibility
 */
export const LEGACY_TIER_MAP: Record<string, SailorTier> = {
  basic: 'individual',
  team: 'pro',
  championship: 'pro',
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
  | 'advanced_analytics'
  | 'mcp_access'
  | 'mcp_write';

export const FEATURE_REQUIREMENTS: Record<GatedFeature, SailorTier[]> = {
  unlimited_races: ['individual', 'pro'],
  ai_strategy: ['individual', 'pro'],
  team_sharing: ['pro'],
  weather_automation: ['individual', 'pro'],
  historical_data: ['individual', 'pro'],
  offline_mode: ['individual', 'pro'],
  advanced_analytics: ['individual', 'pro'],
  mcp_access: ['free', 'individual', 'pro'],
  mcp_write: ['pro'],
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

/**
 * Get AI token limit for a tier
 */
export function getAiTokenLimit(tier: SailorTier): number {
  const normalizedTier = normalizeTier(tier);
  return SAILOR_TIERS[normalizedTier].limits.aiTokensPerMonth;
}
