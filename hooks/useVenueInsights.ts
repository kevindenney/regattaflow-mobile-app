/**
 * useVenueInsights Hook
 *
 * Manages AI-generated venue insights including loading cached insights,
 * generating new insights, and handling visibility state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { venueIntelligenceService } from '@/services/VenueIntelligenceService';
import { supabase } from '@/services/supabase';
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
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const generateRunIdRef = useRef(0);
  const activeVenueIdRef = useRef<string | null>(currentVenue?.id ?? null);

  useEffect(() => {
    activeVenueIdRef.current = currentVenue?.id ?? null;
  }, [currentVenue?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
      generateRunIdRef.current += 1;
    };
  }, []);

  // Load cached insights from database
  const loadCachedInsights = useCallback(async (venueId: string) => {
    const runId = ++loadRunIdRef.current;
    const targetVenueId = venueId;
    const canCommit = () =>
      isMountedRef.current &&
      runId === loadRunIdRef.current &&
      activeVenueIdRef.current === targetVenueId;
    try {
      const cachedInsights = await venueIntelligenceService.getVenueInsights(venueId);

      if (cachedInsights) {
        logger.info('Loaded cached venue insights from database');
        if (!canCommit()) return;
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
    const runId = ++generateRunIdRef.current;
    const targetVenueId = currentVenue.id;
    const canCommit = () =>
      isMountedRef.current &&
      runId === generateRunIdRef.current &&
      activeVenueIdRef.current === targetVenueId;

    // If forcing regenerate, delete old insights first
    if (forceRegenerate) {
      await venueIntelligenceService.deleteInsights(targetVenueId);
    }

    if (!canCommit()) return;
    setLoadingInsights(true);
    try {
      const venueName =
        (typeof currentVenue?.name === 'string' && currentVenue.name.trim()) || 'this venue';
      const prompt = `You are a sailing venue analyst.
Generate concise venue intelligence for ${venueName}.
Return strict JSON only:
{
  "analysis": "string",
  "recommendations": {
    "safety": "string",
    "racing": "string",
    "cultural": "string",
    "practice": "string",
    "timing": "string"
  }
}`;

      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: {
          prompt,
          max_tokens: 700,
          temperature: 0.2,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate venue insights');
      }

      const text = typeof data?.text === 'string' ? data.text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Venue insights response was not valid JSON');
      }

      const generatedInsights: VenueInsightsData = {
        venueName,
        generatedAt: new Date().toISOString(),
        analysis: String((parsed as any).analysis || ''),
        recommendations: {
          safety: String((parsed as any)?.recommendations?.safety || ''),
          racing: String((parsed as any)?.recommendations?.racing || ''),
          cultural: String((parsed as any)?.recommendations?.cultural || ''),
        },
      };

      await venueIntelligenceService.saveVenueInsights({
        venueId: targetVenueId,
        venueName,
        analysis: generatedInsights.analysis as string,
        generatedAt: generatedInsights.generatedAt || new Date().toISOString(),
        recommendations: {
          safety: String((parsed as any)?.recommendations?.safety || ''),
          racing: String((parsed as any)?.recommendations?.racing || ''),
          cultural: String((parsed as any)?.recommendations?.cultural || ''),
          practice: String((parsed as any)?.recommendations?.practice || ''),
          timing: String((parsed as any)?.recommendations?.timing || ''),
        },
      });

      if (!canCommit()) return;
      setVenueInsights(generatedInsights);
      setShowInsights(true);
    } catch (error) {
      logger.error('Error getting venue insights:', error);
    } finally {
      if (!canCommit()) return;
      setLoadingInsights(false);
    }
  }, [currentVenue?.id, currentVenue?.name]);

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
      return;
    }
    setVenueInsights(null);
    setShowInsights(false);
    setLoadingInsights(false);
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
