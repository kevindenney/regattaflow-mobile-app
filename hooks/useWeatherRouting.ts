/**
 * useWeatherRouting Hook
 *
 * Manages weather routing analysis for distance races.
 * Fetches weather conditions along the route, compares models,
 * and identifies decision points.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RouteWaypoint } from '@/types/raceEvents';
import type {
  WeatherRoutingAnalysis,
  LegWeatherAnalysis,
  ModelForecast,
  ModelAgreementSummary,
  DecisionPoint,
  SailChangePlan,
  RiskLevel,
  RoutingRecommendation,
  WeatherRoutingStep,
  WeatherModelName,
} from '@/types/weatherRouting';
import { weatherRoutingService } from '@/services/WeatherRoutingService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useWeatherRouting');

// =============================================================================
// Types
// =============================================================================

export interface UseWeatherRoutingOptions {
  /** Race event ID for saving analysis */
  raceEventId: string | null;
  /** Route waypoints */
  waypoints: RouteWaypoint[] | null;
  /** Race start time (ISO string) */
  startTime: string | null;
  /** Boat ID for sail inventory lookup */
  boatId?: string | null;
  /** Average boat speed assumption (default 6 kts) */
  avgBoatSpeedKts?: number;
  /** Weather models to compare */
  models?: WeatherModelName[];
  /** Hours of forecast to fetch */
  hoursAhead?: number;
  /** Whether to enable the hook */
  enabled?: boolean;
}

export interface UseWeatherRoutingReturn {
  // Analysis Data
  /** Complete weather routing analysis */
  analysis: WeatherRoutingAnalysis | null;
  /** Individual leg weather conditions */
  legs: LegWeatherAnalysis[];
  /** Weather forecasts from different models */
  modelForecasts: ModelForecast[];
  /** Summary of model agreement */
  modelAgreement: ModelAgreementSummary | null;
  /** Strategic decision points along route */
  decisionPoints: DecisionPoint[];
  /** Recommended sail changes */
  sailPlan: SailChangePlan[];
  /** Overall risk assessment */
  overallRisk: RiskLevel | null;
  /** Generated recommendations */
  recommendations: RoutingRecommendation[];

  // Route Info
  /** Total distance in nautical miles */
  totalDistanceNm: number;
  /** Estimated total duration in hours */
  estimatedDurationHours: number;

  // State
  /** Current wizard step */
  step: WeatherRoutingStep;
  /** Whether analysis is loading */
  isLoading: boolean;
  /** Whether models are being fetched */
  isLoadingModels: boolean;
  /** Error during analysis */
  error: Error | null;

  // Actions
  /** Refresh weather analysis */
  refreshAnalysis: () => Promise<void>;
  /** Fetch specific models */
  fetchModels: (modelNames: WeatherModelName[]) => Promise<void>;
  /** Set current step */
  setStep: (step: WeatherRoutingStep) => void;
  /** Update boat speed assumption */
  setAvgBoatSpeed: (speed: number) => void;
  /** Current boat speed setting */
  avgBoatSpeed: number;

  // Helpers
  /** Whether route has enough waypoints */
  hasValidRoute: boolean;
  /** Risk color for UI */
  riskColor: string;
  /** Agreement level color */
  agreementColor: string;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useWeatherRouting({
  raceEventId,
  waypoints,
  startTime,
  boatId,
  avgBoatSpeedKts = 6,
  models = ['OPENMETEO', 'GFS'],
  hoursAhead = 72,
  enabled = true,
}: UseWeatherRoutingOptions): UseWeatherRoutingReturn {
  const queryClient = useQueryClient();

  // Local state
  const [step, setStep] = useState<WeatherRoutingStep>('loading');
  const [avgBoatSpeed, setAvgBoatSpeed] = useState(avgBoatSpeedKts);
  const [selectedModels, setSelectedModels] = useState<WeatherModelName[]>(models);

  // Validate inputs
  const hasValidRoute = useMemo(() => {
    return Array.isArray(waypoints) && waypoints.length >= 2;
  }, [waypoints]);

  const validStartTime = useMemo(() => {
    if (!startTime) return null;
    const date = new Date(startTime);
    return isNaN(date.getTime()) ? null : date;
  }, [startTime]);

  const isEnabled = enabled && hasValidRoute && !!validStartTime && !!raceEventId;

  // Debug logging
  logger.info('[useWeatherRouting] Configuration', {
    enabled,
    hasValidRoute,
    waypointsLength: waypoints?.length ?? 0,
    validStartTime: validStartTime?.toISOString() ?? null,
    raceEventId,
    isEnabled,
  });

  // Query key for caching
  const queryKey = useMemo(
    () => [
      'weather-routing',
      raceEventId,
      waypoints?.length,
      validStartTime?.toISOString(),
      avgBoatSpeed,
      selectedModels.join(','),
    ],
    [raceEventId, waypoints?.length, validStartTime, avgBoatSpeed, selectedModels]
  );

  // Main analysis query
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!waypoints || !validStartTime || !raceEventId) {
        throw new Error('Missing required parameters for weather routing');
      }

      logger.info('[useWeatherRouting] Fetching analysis', {
        raceEventId,
        waypointCount: waypoints.length,
        startTime: validStartTime.toISOString(),
        avgBoatSpeed,
        models: selectedModels,
      });

      const result = await weatherRoutingService.getRouteWeatherAnalysis({
        raceEventId,
        waypoints,
        startTime: validStartTime,
        boatId: boatId || undefined,
        avgBoatSpeedKts: avgBoatSpeed,
        models: selectedModels,
        hoursAhead,
      });

      logger.info('[useWeatherRouting] Analysis complete', {
        legCount: result.legs.length,
        modelCount: result.models.length,
        decisionPointCount: result.decisionPoints.length,
        overallRisk: result.overallRisk,
      });

      return result;
    },
    enabled: isEnabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });

  // Update step based on loading state
  useEffect(() => {
    if (isLoading) {
      setStep('loading');
    } else if (analysis) {
      setStep('overview');
    }
  }, [isLoading, analysis]);

  // Refresh analysis
  const refreshAnalysis = useCallback(async () => {
    setStep('loading');
    await refetch();
  }, [refetch]);

  // Fetch specific models
  const fetchModels = useCallback(
    async (modelNames: WeatherModelName[]) => {
      setSelectedModels(modelNames);
      // The query will auto-refetch due to queryKey change
    },
    []
  );

  // Update boat speed
  const handleSetAvgBoatSpeed = useCallback((speed: number) => {
    if (speed > 0 && speed < 50) {
      setAvgBoatSpeed(speed);
      // Invalidate query to refetch with new speed
      queryClient.invalidateQueries({ queryKey: ['weather-routing', raceEventId] });
    }
  }, [queryClient, raceEventId]);

  // Computed values
  const legs = analysis?.legs ?? [];
  const modelForecasts = analysis?.models ?? [];
  const modelAgreement = analysis?.modelAgreement ?? null;
  const decisionPoints = analysis?.decisionPoints ?? [];
  const sailPlan = analysis?.sailPlan ?? [];
  const overallRisk = analysis?.overallRisk ?? null;
  const recommendations = analysis?.recommendations ?? [];
  const totalDistanceNm = analysis?.totalDistanceNm ?? 0;
  const estimatedDurationHours = analysis?.estimatedDurationHours ?? 0;

  // UI helpers
  const riskColor = useMemo(() => {
    switch (overallRisk) {
      case 'extreme':
        return '#FF3B30'; // iOS red
      case 'high':
        return '#FF9500'; // iOS orange
      case 'medium':
        return '#FFCC00'; // iOS yellow
      case 'low':
      default:
        return '#34C759'; // iOS green
    }
  }, [overallRisk]);

  const agreementColor = useMemo(() => {
    switch (modelAgreement?.overallAgreement) {
      case 'low':
        return '#FF9500'; // iOS orange
      case 'moderate':
        return '#FFCC00'; // iOS yellow
      case 'high':
      default:
        return '#34C759'; // iOS green
    }
  }, [modelAgreement]);

  return {
    // Analysis Data
    analysis: analysis ?? null,
    legs,
    modelForecasts,
    modelAgreement,
    decisionPoints,
    sailPlan,
    overallRisk,
    recommendations,

    // Route Info
    totalDistanceNm,
    estimatedDurationHours,

    // State
    step,
    isLoading,
    isLoadingModels: isLoading, // Same for now
    error: error as Error | null,

    // Actions
    refreshAnalysis,
    fetchModels,
    setStep,
    setAvgBoatSpeed: handleSetAvgBoatSpeed,
    avgBoatSpeed,

    // Helpers
    hasValidRoute,
    riskColor,
    agreementColor,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to get just the leg summary for a quick overview
 */
export function useWeatherRoutingLegSummary(
  analysis: WeatherRoutingAnalysis | null
) {
  return useMemo(() => {
    if (!analysis) return null;

    const { legs } = analysis;
    const totalLegs = legs.length;
    const highRiskLegs = legs.filter(
      (l) => l.riskLevel === 'high' || l.riskLevel === 'extreme'
    ).length;

    // Calculate average wind across all legs
    const avgWind =
      legs.reduce((sum, leg) => sum + leg.weather.wind.speedAvg, 0) / totalLegs;

    // Get wind range
    const minWind = Math.min(...legs.map((l) => l.weather.wind.speedMin));
    const maxWind = Math.max(...legs.map((l) => l.weather.wind.speedMax));

    // Get max wave height
    const maxWave = Math.max(
      ...legs.map((l) => l.weather.waves?.heightMax ?? 0)
    );

    return {
      totalLegs,
      highRiskLegs,
      avgWind: Math.round(avgWind),
      windRange: { min: Math.round(minWind), max: Math.round(maxWind) },
      maxWave: maxWave.toFixed(1),
      hasHighRisk: highRiskLegs > 0,
    };
  }, [analysis]);
}

/**
 * Hook to format leg ETA times
 */
export function useFormattedLegETAs(legs: LegWeatherAnalysis[]) {
  return useMemo(() => {
    return legs.map((leg) => {
      const eta = leg.eta;
      const dayName = eta.toLocaleDateString('en-US', { weekday: 'short' });
      const time = eta.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return {
        legIndex: leg.legIndex,
        etaFormatted: `${dayName} ${time}`,
        etaDate: eta,
      };
    });
  }, [legs]);
}
