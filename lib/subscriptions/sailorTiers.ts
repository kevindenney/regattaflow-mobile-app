/**
 * Sailor Tier Definitions
 *
 * Freemium model for individual sailors:
 * - Free: Limited races, basic features
 * - Pro: Unlimited races, AI features, team sharing
 *
 * Aligns with existing subscription tiers in subscriptionService.ts
 */

export type SailorTier = 'free' | 'basic' | 'pro';

export interface TierLimits {
  maxRaces: number;
  aiQueriesPerMonth: number;
  teamSharing: boolean;
  weatherAutomation: boolean;
  historicalData: boolean;
  offlineMode: boolean;
  advancedAnalytics: boolean;
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
 * Yearly-only pricing (no monthly)
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
    },
    features: [
      'Up to 3 races',
      'Basic race checklists',
      'Manual weather lookup',
      '5 AI queries per month',
      'Document upload',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential tools for club racers',
    price: '$120/year',
    priceMonthly: null,
    priceYearly: '$120',
    limits: {
      maxRaces: Infinity,
      aiQueriesPerMonth: 20,
      teamSharing: false,
      weatherAutomation: true,
      historicalData: false,
      offlineMode: false,
      advancedAnalytics: false,
    },
    features: [
      'Unlimited races',
      '20 AI queries per month',
      'Automatic weather updates',
      'Race checklists & prep tools',
      'Document upload & storage',
      'Cloud backup & sync',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full racing features for serious sailors',
    price: '$360/year',
    priceMonthly: null,
    priceYearly: '$360',
    limits: {
      maxRaces: Infinity,
      aiQueriesPerMonth: Infinity,
      teamSharing: true,
      weatherAutomation: true,
      historicalData: true,
      offlineMode: true,
      advancedAnalytics: true,
    },
    features: [
      'Everything in Basic',
      'Unlimited AI queries',
      'AI strategy analysis',
      'Team sharing & collaboration',
      'Historical race data',
      'Offline mode',
      'Advanced analytics',
      'Priority support',
    ],
    isPopular: true,
  },
};

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
  unlimited_races: ['basic', 'pro'],
  ai_strategy: ['pro'],
  team_sharing: ['pro'],
  weather_automation: ['basic', 'pro'],
  historical_data: ['pro'],
  offline_mode: ['pro'],
  advanced_analytics: ['pro'],
};

/**
 * Get tier limits for a given tier
 */
export function getTierLimits(tier: SailorTier): TierLimits {
  return SAILOR_TIERS[tier].limits;
}

/**
 * Check if a feature is available for a tier
 */
export function isFeatureAvailable(feature: GatedFeature, tier: SailorTier): boolean {
  return FEATURE_REQUIREMENTS[feature].includes(tier);
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
