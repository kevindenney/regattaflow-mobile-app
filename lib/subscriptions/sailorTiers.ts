/**
 * Tier Definitions
 *
 * Updated: 2026-03-30
 * Pricing:
 * - Free: Up to 3 interests, 5 AI queries/month
 * - Plus (aka individual): $9/mo or $89/yr — 50,000 AI tokens/month
 * - Pro: $29/mo or $249/yr — 500,000 AI tokens/month
 */

export type SailorTier = 'free' | 'individual' | 'plus' | 'pro';

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
 * Tier configuration
 * Updated: 2026-03-30
 */
const PLUS_TIER: TierDefinition = {
  id: 'plus',
  name: 'Plus',
  description: 'AI-powered learning',
  price: '$9/month',
  priceMonthly: '$9',
  priceYearly: '$89',
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
    'Unlimited interests & steps',
    '50,000 AI tokens per month',
    'AI coaching & suggestions',
    'Telegram assistant',
    'Progress analytics',
    'Offline mode',
    'MCP / AI assistant integration (read-only)',
  ],
  isPopular: true,
};

export const SAILOR_TIERS: Record<SailorTier, TierDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started',
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
      'Up to 3 learning interests',
      'Basic timeline management',
      '5 AI queries per month',
      'Document upload',
      'MCP / AI assistant integration (read-only)',
    ],
  },
  individual: PLUS_TIER,  // Legacy alias
  plus: PLUS_TIER,
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Power user AI',
    price: '$29/month',
    priceMonthly: '$29',
    priceYearly: '$249',
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
      'Everything in Plus',
      '500,000 AI tokens per month',
      'Priority AI processing',
      'MCP integrations',
      'Priority support',
    ],
  },
};

/**
 * Legacy tier mapping for backward compatibility
 */
export const LEGACY_TIER_MAP: Record<string, SailorTier> = {
  basic: 'plus',
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
