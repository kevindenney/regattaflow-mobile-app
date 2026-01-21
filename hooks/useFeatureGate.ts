/**
 * useFeatureGate Hook
 *
 * Central hook for checking tier access and managing feature gates.
 * Used throughout the app to:
 * - Check if a feature is available for the user's tier
 * - Track race usage limits
 * - Trigger upgrade prompts at strategic moments
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  GatedFeature,
  SailorTier,
  isFeatureAvailable,
  getTierLimits,
  hasReachedRaceLimit,
  getRemainingRaces,
  getRequiredTier,
  SAILOR_TIERS,
} from '@/lib/subscriptions/sailorTiers';

export interface FeatureGateResult {
  /** Whether the feature is available */
  isAvailable: boolean;
  /** Whether the user is a guest (not signed in) */
  isGuest: boolean;
  /** User's current tier */
  tier: SailorTier;
  /** Tier required to access this feature */
  requiredTier: SailorTier;
  /** Human-readable name of required tier */
  requiredTierName: string;
  /** Function to trigger upgrade prompt */
  promptUpgrade: () => void;
}

export interface RaceLimitResult {
  /** Whether user has reached their race limit */
  hasReachedLimit: boolean;
  /** Current race count */
  currentCount: number;
  /** Maximum allowed races (null if unlimited) */
  maxRaces: number | null;
  /** Remaining races (null if unlimited) */
  remaining: number | null;
  /** User's current tier */
  tier: SailorTier;
  /** Whether user is a guest */
  isGuest: boolean;
  /** Function to trigger upgrade prompt */
  promptUpgrade: () => void;
}

export interface UseFeatureGateReturn {
  /** Check if a specific feature is available */
  checkFeature: (feature: GatedFeature) => FeatureGateResult;
  /** Check race limit status */
  checkRaceLimit: (raceCount: number) => RaceLimitResult;
  /** User's current tier */
  tier: SailorTier;
  /** Whether user is a guest */
  isGuest: boolean;
  /** Whether user is on free tier */
  isFree: boolean;
  /** Whether user is on basic tier */
  isBasic: boolean;
  /** Whether user has pro tier */
  isPro: boolean;
  /** Tier display name */
  tierName: string;
  /** Trigger upgrade prompt */
  promptUpgrade: (feature?: GatedFeature, context?: string) => void;
  /** Trigger sign-up prompt for guests */
  promptSignUp: (context?: string) => void;
}

/**
 * Hook for managing feature gates and tier checking
 */
export function useFeatureGate(): UseFeatureGateReturn {
  const { user, isGuest, userProfile } = useAuth();

  // Determine user's tier
  // Priority: subscription_tier from profile > 'free' for signed in > 'free' for guests
  const tier: SailorTier = useMemo(() => {
    if (isGuest) return 'free';
    if (!user) return 'free';
    // Check user profile for subscription tier
    const subscriptionTier = (userProfile as any)?.subscription_tier;
    if (subscriptionTier && ['free', 'basic', 'pro'].includes(subscriptionTier)) {
      return subscriptionTier as SailorTier;
    }
    return 'free';
  }, [user, isGuest, userProfile]);

  const tierName = SAILOR_TIERS[tier].name;
  const isFree = tier === 'free';
  const isBasic = tier === 'basic';
  const isPro = tier === 'pro';

  /**
   * Trigger upgrade prompt
   * Can be customized based on feature and context
   */
  const promptUpgrade = useCallback((feature?: GatedFeature, context?: string) => {
    // This will be connected to the UpgradePrompt modal
    // For now, we'll dispatch an event that components can listen to
    const event = new CustomEvent('regattaflow:upgrade-prompt', {
      detail: { feature, context, currentTier: tier },
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }, [tier]);

  /**
   * Trigger sign-up prompt for guests
   */
  const promptSignUp = useCallback((context?: string) => {
    const event = new CustomEvent('regattaflow:signup-prompt', {
      detail: { context, isGuest: true },
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }, []);

  /**
   * Check if a specific feature is available
   */
  const checkFeature = useCallback((feature: GatedFeature): FeatureGateResult => {
    const available = isFeatureAvailable(feature, tier);
    const requiredTier = getRequiredTier(feature);

    return {
      isAvailable: available,
      isGuest,
      tier,
      requiredTier,
      requiredTierName: SAILOR_TIERS[requiredTier].name,
      promptUpgrade: () => promptUpgrade(feature),
    };
  }, [tier, isGuest, promptUpgrade]);

  /**
   * Check race limit status
   */
  const checkRaceLimit = useCallback((raceCount: number): RaceLimitResult => {
    const limits = getTierLimits(tier);
    const reachedLimit = hasReachedRaceLimit(raceCount, tier);
    const remaining = getRemainingRaces(raceCount, tier);

    return {
      hasReachedLimit: reachedLimit,
      currentCount: raceCount,
      maxRaces: limits.maxRaces === Infinity ? null : limits.maxRaces,
      remaining,
      tier,
      isGuest,
      promptUpgrade: () => promptUpgrade('unlimited_races', 'race_limit'),
    };
  }, [tier, isGuest, promptUpgrade]);

  return {
    checkFeature,
    checkRaceLimit,
    tier,
    isGuest,
    isFree,
    isBasic,
    isPro,
    tierName,
    promptUpgrade,
    promptSignUp,
  };
}

/**
 * Convenience hook for checking a single feature
 */
export function useFeatureCheck(feature: GatedFeature): FeatureGateResult {
  const { checkFeature } = useFeatureGate();
  return checkFeature(feature);
}

/**
 * Convenience hook for checking race limits
 */
export function useRaceLimitCheck(raceCount: number): RaceLimitResult {
  const { checkRaceLimit } = useFeatureGate();
  return checkRaceLimit(raceCount);
}

export default useFeatureGate;
