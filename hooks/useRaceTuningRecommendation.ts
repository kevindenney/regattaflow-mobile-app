/**
 * Hook to retrieve rig tuning recommendations for a race/boat class.
 * Normalizes the RaceTuningService response for UI components.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { raceTuningService, type RaceTuningRecommendation, type RaceTuningSetting } from '@/services/RaceTuningService';
import { createLogger } from '@/lib/utils/logger';

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
  
  // Use refs to track if we've already fetched with these params
  const hasFetchedRef = useRef(false);
  const lastFetchKeyRef = useRef<string>('');
  
  // Create a stable key for the current params (include boatId for equipment-aware fetches)
  const fetchKey = `${enabled}-${classId}-${className}-${boatId || 'no-boat'}-${averageWindSpeed}-${windMin}-${windMax}`;

  const fetchRecommendation = useCallback(async () => {
    console.log('🎣 [useRaceTuningRecommendation] Fetch called with:', {
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
      console.log('⏭️ [useRaceTuningRecommendation] Skipping fetch:', {
        enabled,
        hasClassId: !!classId,
        hasClassName: !!className
      });
      setRecommendation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📞 [useRaceTuningRecommendation] Calling raceTuningService.getRecommendations...');
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
      console.log('📦 [useRaceTuningRecommendation] Got result:', result ? {
        guideTitle: result.guideTitle,
        guideSource: result.guideSource,
        sectionTitle: result.sectionTitle,
        isAIGenerated: result.isAIGenerated,
        settingsCount: result.settings?.length,
        hasEquipmentContext: !!result.equipmentContext,
        equipmentNotes: result.equipmentSpecificNotes?.length || 0
      } : 'No recommendation returned');
      setRecommendation(result ?? null);
    } catch (err) {
      console.error('❌ [useRaceTuningRecommendation] Failed to load tuning recommendation:', err);
      setError(err as Error);
      setRecommendation(null);
    } finally {
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

    run();

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
