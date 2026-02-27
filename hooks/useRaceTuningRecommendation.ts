/**
 * Hook to retrieve rig tuning recommendations for a race/boat class.
 * Normalizes the RaceTuningService response for UI components.
 */

import { createLogger } from '@/lib/utils/logger';
import { raceTuningService, type RaceTuningRecommendation, type RaceTuningSetting, type EquipmentContext } from '@/services/RaceTuningService';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseRaceTuningOptions {
  classId?: string | null;
  className?: string | null;
  boatId?: string | null;  // NEW: Optional boat ID for equipment-aware recommendations
  averageWindSpeed?: number | null;
  windMin?: number | null;
  windMax?: number | null;
  windDirection?: number | null;
  gusts?: number | null;
  waveHeight?: string | null;
  currentSpeed?: number | null;
  currentDirection?: number | null;
  pointsOfSail?: 'upwind' | 'downwind' | 'reach' | 'all';
  limit?: number;
  enabled?: boolean;
}

export interface RigSettingSummary {
  key: string;
  label: string;
  value: string;
}

interface UseRaceTuningResult {
  recommendation: RaceTuningRecommendation | null;
  settings: RigSettingSummary[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const PRIORITY_ORDER: string[] = [
  'upper_shrouds',
  'lower_shrouds',
  'forestay_length',
  'mast_rake',
  'spreader_sweep',
  'backstay_tension',
];

function selectTopSettings(settings: RaceTuningSetting[], limit: number): RigSettingSummary[] {
  if (!settings || settings.length === 0) return [];

  const selected: RigSettingSummary[] = [];
  const usedKeys = new Set<string>();

  const addSetting = (setting?: RaceTuningSetting | null) => {
    if (!setting || !setting.value || usedKeys.has(setting.key)) return;
    selected.push({
      key: setting.key,
      label: setting.label,
      value: setting.value,
    });
    usedKeys.add(setting.key);
  };

  PRIORITY_ORDER.forEach(priorityKey => {
    if (selected.length >= limit) return;
    const match = settings.find(setting => setting.key === priorityKey);
    addSetting(match);
  });

  if (selected.length < limit) {
    settings.forEach(setting => {
      if (selected.length >= limit) return;
      addSetting(setting);
    });
  }

  return selected;
}

const logger = createLogger('useRaceTuningRecommendation');

function normalizeTuningErrorMessage(input?: string | null): string {
  const message = (input || '').toLowerCase();
  if (!message) return 'Unable to load rig tuning right now.';
  if (message.includes('[ai_tuning_unavailable]')) {
    return 'AI tuning service is currently unavailable for this account.';
  }
  if (message.includes('[ai_tuning_no_recommendations]')) {
    return 'No rig tuning recommendations available for these conditions yet.';
  }
  if (
    message.includes('[ai_tuning_declined]') ||
    message.includes('[ai_tuning_invalid_response]') ||
    message.includes('[ai_tuning_parse_error]')
  ) {
    return 'AI tuning could not generate a valid setup from current inputs. Try refreshing with updated wind conditions.';
  }
  if (message.includes('[ai_tuning_chat_failed]') || message.includes('[ai_tuning_empty_response]')) {
    return 'AI tuning service is temporarily unavailable. Please try again shortly.';
  }
  if (message.includes('[ai_tuning_generation_failed]') || message.includes('[ai_tuning_guide_generation_failed]')) {
    return 'Unable to generate tuning guidance right now. Please try again.';
  }
  if (message.includes('skill unavailable') || message.includes('skill initialization')) {
    return 'AI tuning service is initializing. Pull to refresh in a moment.';
  }
  if (message.includes('ai rig tuning unavailable')) {
    return 'AI tuning service is currently unavailable for this account.';
  }
  if (message.includes('supabase configuration is missing') || message.includes('not configured')) {
    return 'Rig tuning is not configured yet.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network issue while loading rig tuning. Try again.';
  }
  if (message.includes('returned no recommendations')) {
    return 'No rig tuning recommendations available for these conditions yet.';
  }
  if (message.includes('declined to generate tuning') || message.includes('unable to find json')) {
    return 'AI tuning could not generate a valid setup from current inputs. Try refreshing with updated wind conditions.';
  }
  if (message.includes('failed to parse json')) {
    return 'AI tuning response was invalid. Please try again.';
  }
  if (message.includes('credit') || message.includes('overload') || message.includes('rate limit')) {
    return 'AI tuning is temporarily unavailable. Please try again shortly.';
  }
  return 'Unable to load rig tuning right now.';
}

export function useRaceTuningRecommendation(options: UseRaceTuningOptions): UseRaceTuningResult {
  const {
    classId,
    className,
    boatId,
    averageWindSpeed,
    windMin,
    windMax,
    windDirection,
    gusts,
    waveHeight,
    currentSpeed,
    currentDirection,
    pointsOfSail = 'upwind',
    limit = 1,
    enabled = true,
  } = options;

  const [recommendation, setRecommendation] = useState<RaceTuningRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  
  // Use refs to track if we've already fetched with these params
  const hasFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');
  
  // Create a stable key for the current params (include boatId for equipment-aware fetches)
  const fetchKey = `${enabled}-${classId}-${className}-${boatId || 'no-boat'}-${averageWindSpeed}-${windMin}-${windMax}`;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  const fetchRecommendation = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === fetchRunIdRef.current;

    logger.debug('🎣 Fetch called with:', {
      enabled,
      classId,
      className,
      boatId,
      averageWindSpeed,
      windMin,
      windMax,
      gusts,
      pointsOfSail,
      limit
    });

    if (!enabled || (!classId && !className)) {
      logger.debug('⏭️ Skipping fetch:', {
        enabled,
        hasClassId: !!classId,
        hasClassName: !!className
      });
      if (!canCommit()) return;
      setError(null);
      setRecommendation(null);
      setLoading(false);
      return;
    }

    if (!canCommit()) return;
    setLoading(true);
    setError(null);

    try {
      logger.debug('📞 Calling raceTuningService.getRecommendations...');
      const [result] = await raceTuningService.getRecommendations({
        classId,
        className,
        boatId,  // Pass boatId for equipment-aware recommendations
        averageWindSpeed: averageWindSpeed ?? undefined,
        windMin,
        windMax,
        windDirection,
        gusts,
        waveHeight,
        currentSpeed,
        currentDirection,
        pointsOfSail,
        limit,
      });
      logger.debug('📦 Got result:', result ? {
        guideTitle: result.guideTitle,
        guideSource: result.guideSource,
        sectionTitle: result.sectionTitle,
        isAIGenerated: result.isAIGenerated,
        settingsCount: result.settings?.length,
        hasEquipmentContext: !!result.equipmentContext,
        equipmentNotes: result.equipmentSpecificNotes?.length || 0
      } : 'No recommendation returned');
      if (!canCommit()) return;
      setRecommendation(result ?? null);
    } catch (err) {
      const rawMessage = (err as Error)?.message || 'Unknown rig tuning error';
      logger.debug('Tuning recommendation not available:', rawMessage.substring(0, 200));
      if (!canCommit()) return;
      const normalizedMessage = normalizeTuningErrorMessage(rawMessage);
      const normalizedError = new Error(normalizedMessage);
      (normalizedError as any).cause = rawMessage;
      setError(normalizedError);
      setRecommendation(null);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [enabled, classId, className, boatId, averageWindSpeed, windMin, windMax, windDirection, gusts, waveHeight, currentSpeed, currentDirection, pointsOfSail, limit]);

  useEffect(() => {
    // Only fetch if the key parameters have changed
    if (lastFetchKeyRef.current === fetchKey && hasFetchedRef.current) {
      return;
    }
    
    lastFetchKeyRef.current = fetchKey;
    hasFetchedRef.current = true;
    
    let cancelled = false;

    const run = async () => {
      if (!cancelled) {
        await fetchRecommendation();
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchKey, fetchRecommendation]);

  const settings = useMemo(() => {
    if (!recommendation) return [];
    return selectTopSettings(recommendation.settings ?? [], 4);
  }, [recommendation]);

  return {
    recommendation,
    settings,
    loading,
    error,
    refresh: fetchRecommendation,
  };
}

/**
 * Hook for Tufte "small multiples" display - fetches all wind range sections
 */
export interface UseAllWindRangesOptions {
  classId?: string | null;
  className?: string | null;
  boatId?: string | null;
  averageWindSpeed?: number | null;
  enabled?: boolean;
}

export interface WindRangeData {
  light: RaceTuningRecommendation | null;
  medium: RaceTuningRecommendation | null;
  heavy: RaceTuningRecommendation | null;
  currentRange: 'light' | 'medium' | 'heavy' | null;
  equipmentContext: EquipmentContext | null;
}

interface UseAllWindRangesResult {
  data: WindRangeData;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAllWindRangeSections(options: UseAllWindRangesOptions): UseAllWindRangesResult {
  const {
    classId,
    className,
    boatId,
    averageWindSpeed,
    enabled = true,
  } = options;

  const [data, setData] = useState<WindRangeData>({
    light: null,
    medium: null,
    heavy: null,
    currentRange: null,
    equipmentContext: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);

  const hasFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');
  const fetchKey = `${enabled}-${classId}-${className}-${boatId || 'no-boat'}`;

  const fetchData = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === fetchRunIdRef.current;

    if (!enabled || (!classId && !className)) {
      if (!canCommit()) return;
      setError(null);
      setData({
        light: null,
        medium: null,
        heavy: null,
        currentRange: null,
        equipmentContext: null,
      });
      return;
    }

    if (!canCommit()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await raceTuningService.getAllWindRangeSections({
        classId,
        className,
        boatId,
      });

      // Set tuning data; currentRange is calculated separately via its own effect
      // to avoid race conditions when weather data loads after tuning data
      if (!canCommit()) return;
      setData(prev => ({
        ...result,
        currentRange: prev.currentRange, // Preserve current range from separate effect
      }));
    } catch (err) {
      const rawMessage = (err as Error)?.message || 'Unknown rig tuning error';
      logger.debug('Failed to fetch all wind ranges:', rawMessage.substring(0, 200));
      if (!canCommit()) return;
      setError(new Error(normalizeTuningErrorMessage(rawMessage)));
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [enabled, classId, className, boatId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (lastFetchKeyRef.current === fetchKey && hasFetchedRef.current) {
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    hasFetchedRef.current = true;

    let cancelled = false;
    const run = async () => {
      if (!cancelled) {
        await fetchData();
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [fetchKey, fetchData]);

  // Separate effect to reactively update currentRange when averageWindSpeed changes
  // This fixes a race condition where weather data loads after tuning data,
  // causing currentRange to remain null even when wind speed is available
  useEffect(() => {
    const currentRange = raceTuningService.determineWindRange(averageWindSpeed);
    if (!isMountedRef.current) return;
    setData(prev => {
      // Only update if currentRange has actually changed
      if (prev.currentRange === currentRange) {
        return prev;
      }
      return {
        ...prev,
        currentRange,
      };
    });
  }, [averageWindSpeed]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
