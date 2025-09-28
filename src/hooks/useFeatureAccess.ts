/**
 * Feature Access Hook
 * Marine-grade feature gating for subscription-based sailing features
 * Provides simple boolean checks and upgrade prompts
 */

import { useState } from 'react';
import { useSubscription } from '@/src/lib/contexts/SubscriptionContext';
import PaywallModal from '@/src/components/subscriptions/PaywallModal';

interface FeatureConfig {
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
}

/**
 * Hook for checking feature access and showing upgrade prompts
 */
export function useFeatureGate(config: FeatureConfig | string) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { hasFeature, shouldShowUpgradePrompt } = useSubscription();

  const featureKey = typeof config === 'string' ? config : config.feature;
  const hasAccess = hasFeature(featureKey);
  const needsUpgrade = shouldShowUpgradePrompt(featureKey);

  /**
   * Check if user can access feature, show paywall if not
   */
  const checkAccess = (): boolean => {
    if (hasAccess) {
      return true;
    }

    if (needsUpgrade) {
      setShowPaywall(true);
    }

    return false;
  };

  /**
   * Force show paywall for feature
   */
  const showUpgrade = () => {
    setShowPaywall(true);
  };

  /**
   * Render paywall modal (use this in your component's render)
   */
  const PaywallComponent = () => {
    if (typeof config === 'string') {
      return (
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature={config}
        />
      );
    }

    return (
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={config.feature}
        title={config.title}
        description={config.description}
        benefits={config.benefits}
      />
    );
  };

  return {
    hasAccess,
    needsUpgrade,
    checkAccess,
    showUpgrade,
    PaywallComponent,
  };
}

/**
 * Premium feature wrapper component
 * Automatically gates features and shows upgrade prompts
 */
interface PremiumFeatureProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  benefits?: string[];
}

export function PremiumFeature({
  feature,
  children,
  fallback,
  title,
  description,
  benefits,
}: PremiumFeatureProps) {
  const { hasAccess, PaywallComponent } = useFeatureGate({
    feature,
    title,
    description,
    benefits,
  });

  if (!hasAccess && fallback) {
    return (
      <>
        {fallback}
        <PaywallComponent />
      </>
    );
  }

  if (!hasAccess) {
    return <PaywallComponent />;
  }

  return (
    <>
      {children}
      <PaywallComponent />
    </>
  );
}

/**
 * Common sailing feature configurations
 */
export const SAILING_FEATURES = {
  AI_RACE_ANALYSIS: {
    feature: 'ai_race_analysis',
    title: '🧠 AI Race Strategy',
    description: 'Get AI-powered tactical recommendations and race simulations',
    benefits: [
      'AI tactical recommendations during races',
      'Monte Carlo simulation with 1000+ scenarios',
      'Optimal course routing based on conditions',
      'Equipment setup optimization',
      'Performance prediction and analysis',
    ],
  },

  GLOBAL_VENUE_INTELLIGENCE: {
    feature: 'global_venue_intelligence',
    title: '🌍 Global Venue Intelligence',
    description: 'Access intelligence for 147+ sailing venues worldwide',
    benefits: [
      'Venue-specific tactical knowledge',
      'Local weather and condition patterns',
      'Cultural adaptation and protocols',
      'Historical racing data and insights',
      'Equipment recommendations by venue',
    ],
  },

  OFFLINE_CAPABILITIES: {
    feature: 'offline_capabilities',
    title: '📱 Offline Racing Mode',
    description: 'Full functionality without internet connection',
    benefits: [
      'Download race strategies for offline use',
      'Cached weather and venue data',
      'GPS tracking without connectivity',
      'Sync when connection restored',
      'Emergency-grade reliability',
    ],
  },

  PERFORMANCE_ANALYTICS: {
    feature: 'performance_analytics',
    title: '📊 Performance Analytics',
    description: 'Track your racing improvement with detailed analytics',
    benefits: [
      'Cross-venue performance comparison',
      'Long-term trend analysis',
      'Equipment correlation insights',
      'Goal tracking and progress reports',
      'Export data for coaching sessions',
    ],
  },

  UNLIMITED_DOCUMENTS: {
    feature: 'unlimited_documents',
    title: '📄 Unlimited Documents',
    description: 'Upload unlimited sailing instructions and race documents',
    benefits: [
      'Unlimited document uploads',
      'AI-powered document parsing',
      'Automatic course extraction',
      'Document organization and search',
      'Cloud backup and sync',
    ],
  },

  EQUIPMENT_OPTIMIZATION: {
    feature: 'equipment_optimization',
    title: '⚙️ Equipment Optimization',
    description: 'Get boat setup recommendations for every condition',
    benefits: [
      'Venue-specific setup guides',
      'Condition-based sail selection',
      'Equipment performance correlation',
      'Setup optimization for boat type',
      'Maintenance tracking and reminders',
    ],
  },
};

/**
 * Quick access hooks for common features
 */
export const useAIRaceAnalysis = () => useFeatureGate(SAILING_FEATURES.AI_RACE_ANALYSIS);
export const useGlobalVenueIntelligence = () => useFeatureGate(SAILING_FEATURES.GLOBAL_VENUE_INTELLIGENCE);
export const useOfflineCapabilities = () => useFeatureGate(SAILING_FEATURES.OFFLINE_CAPABILITIES);
export const usePerformanceAnalytics = () => useFeatureGate(SAILING_FEATURES.PERFORMANCE_ANALYTICS);
export const useUnlimitedDocuments = () => useFeatureGate(SAILING_FEATURES.UNLIMITED_DOCUMENTS);
export const useEquipmentOptimization = () => useFeatureGate(SAILING_FEATURES.EQUIPMENT_OPTIMIZATION);

export default useFeatureGate;