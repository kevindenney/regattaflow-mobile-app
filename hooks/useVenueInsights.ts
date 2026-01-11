/**
 * useVenueInsights Hook
 *
 * Manages AI-generated venue insights including loading cached insights,
 * generating new insights, and handling visibility state.
 */

import { useCallback, useEffect, useState } from 'react';
import { VenueIntelligenceAgent } from '@/services/agents/VenueIntelligenceAgent';
import { venueIntelligenceService } from '@/services/VenueIntelligenceService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useVenueInsights');

export interface VenueInsightsData {
  venueName: string;
  generatedAt?: string;
  recommendations?: {
    safety?: string;
    racing?: string;
    cultural?: string;
  };
  [key: string]: unknown;
}

export interface CurrentVenue {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface UseVenueInsightsParams {
  /** Current detected venue (from useVenueDetection) */
  currentVenue: CurrentVenue | null;
  /** GPS confidence level (0-1) for auto-triggering analysis */
  confidence: number;
}

export interface UseVenueInsightsReturn {
  /** Current venue insights data */
  venueInsights: VenueInsightsData | null;
  /** Whether insights are currently loading */
  loadingInsights: boolean;
  /** Whether insights card should be shown */
  showInsights: boolean;
  /** Handler to refresh/regenerate insights */
  handleGetVenueInsights: (forceRegenerate?: boolean) => Promise<void>;
  /** Handler to dismiss insights card */
  handleDismissInsights: () => void;
  /** Handler to view full venue intelligence */
  handleViewFullIntelligence: () => void;
}

/**
 * Hook for managing venue AI insights
 */
export function useVenueInsights({
  currentVenue,
  confidence,
}: UseVenueInsightsParams): UseVenueInsightsReturn {
  const [venueInsights, setVenueInsights] = useState<VenueInsightsData | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Create agent instance (memoized via useState to avoid recreation)
  const [venueAgent] = useState(() => new VenueIntelligenceAgent());

  // Load cached insights from database
  const loadCachedInsights = useCallback(async (venueId: string) => {
    try {
      const cachedInsights = await venueIntelligenceService.getVenueInsights(venueId);

      if (cachedInsights) {
        logger.info('Loaded cached venue insights from database');
        setVenueInsights(cachedInsights as VenueInsightsData);
        setShowInsights(true);
      } else {
        logger.debug('No cached insights found for venue:', venueId);
        // Insights will be null, triggering auto-generation if GPS confidence is high
      }
    } catch (error) {
      logger.error('Error loading cached insights:', error);
    }
  }, []);

  // Get AI insights for current venue (force regenerate)
  const handleGetVenueInsights = useCallback(async (forceRegenerate = false) => {
    if (!currentVenue?.id) return;

    // If forcing regenerate, delete old insights first
    if (forceRegenerate) {
      await venueIntelligenceService.deleteInsights(currentVenue.id);
    }

    setLoadingInsights(true);
    try {
      const result = await venueAgent.analyzeVenue(currentVenue.id);

      if (result.success) {
        setVenueInsights(result.insights as VenueInsightsData);
        setShowInsights(true);
      } else {
        logger.error('Failed to get venue insights:', result.error);
      }
    } catch (error) {
      logger.error('Error getting venue insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  }, [currentVenue?.id, venueAgent]);

  // Handler to dismiss insights card
  const handleDismissInsights = useCallback(() => {
    setShowInsights(false);
  }, []);

  // Handler to view full venue intelligence (placeholder - caller should implement navigation)
  const handleViewFullIntelligence = useCallback(() => {
    // This is a placeholder - the parent component should handle navigation
    logger.debug('View full intelligence requested');
  }, []);

  // Load cached insights from database when venue changes
  useEffect(() => {
    if (currentVenue?.id) {
      // Clear old insights immediately when venue changes
      setVenueInsights(null);
      setShowInsights(false);

      // Load cached insights for new venue
      loadCachedInsights(currentVenue.id);
    }
  }, [currentVenue?.id, loadCachedInsights]);

  // Trigger AI venue analysis when venue is detected (only if no cached insights)
  useEffect(() => {
    if (currentVenue && confidence > 0.5 && !venueInsights) {
      handleGetVenueInsights();
    }
  }, [currentVenue, confidence, venueInsights, handleGetVenueInsights]);

  return {
    venueInsights,
    loadingInsights,
    showInsights,
    handleGetVenueInsights,
    handleDismissInsights,
    handleViewFullIntelligence,
  };
}

export default useVenueInsights;
