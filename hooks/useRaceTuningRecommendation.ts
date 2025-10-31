/**
 * Hook to retrieve rig tuning recommendations for a race/boat class.
 * Normalizes the RaceTuningService response for UI components.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { raceTuningService, type RaceTuningRecommendation, type RaceTuningSetting } from '@/services/RaceTuningService';

export interface UseRaceTuningOptions {
  classId?: string | null;
  className?: string | null;
  averageWindSpeed?: number | null;
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

export function useRaceTuningRecommendation(options: UseRaceTuningOptions): UseRaceTuningResult {
  const {
    classId,
    className,
    averageWindSpeed,
    pointsOfSail = 'upwind',
    limit = 1,
    enabled = true,
  } = options;

  const [recommendation, setRecommendation] = useState<RaceTuningRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecommendation = useCallback(async () => {
    if (!enabled || (!classId && !className)) {
      setRecommendation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [result] = await raceTuningService.getRecommendations({
        classId,
        className,
        averageWindSpeed: averageWindSpeed ?? undefined,
        pointsOfSail,
        limit,
      });
      setRecommendation(result ?? null);
    } catch (err) {
      console.error('[useRaceTuningRecommendation] Failed to load tuning recommendation:', err);
      setError(err as Error);
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, classId, className, averageWindSpeed, pointsOfSail, limit]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await fetchRecommendation();
    };

    run();

    return () => {
      cancelled = true;
      if (cancelled) {
        // Best effort cleanup by ignoring late state updates; fetchRecommendation handles classId/enabled guards
      }
    };
  }, [fetchRecommendation]);

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
