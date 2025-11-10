import { useCallback, useEffect, useMemo, useState } from 'react';
import { BathymetricTidalService } from '@/services/BathymetricTidalService';
import type { UnderwaterAnalysis, UnderwaterAnalysisRequest } from '@/types/bathymetry';
import type { SailingVenue } from '@/lib/types/global-venues';

interface UseUnderwaterAnalysisParams {
  racingArea?: GeoJSON.Polygon | null;
  venue?: SailingVenue | null;
  raceTime?: Date | string | null;
  raceDurationMinutes?: number;
  enabled?: boolean;
}

interface UseUnderwaterAnalysisResult {
  analysis: UnderwaterAnalysis | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  available: boolean;
}

export function useUnderwaterAnalysis({
  racingArea,
  venue,
  raceTime,
  raceDurationMinutes = 90,
  enabled = true
}: UseUnderwaterAnalysisParams): UseUnderwaterAnalysisResult {
  const [analysis, setAnalysis] = useState<UnderwaterAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const service = useMemo(() => {
    try {
      return new BathymetricTidalService();
    } catch (err) {
      console.warn('useUnderwaterAnalysis: Unable to create BathymetricTidalService', err);
      return null;
    }
  }, []);

  const resolvedRaceTime = useMemo(() => {
    if (!raceTime) return new Date();
    if (raceTime instanceof Date) return raceTime;
    const parsed = new Date(raceTime);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [raceTime]);

  const available = Boolean(service && racingArea && venue);

  const runAnalysis = useCallback(async (): Promise<UnderwaterAnalysis | null> => {
    if (!service || !racingArea || !venue || !enabled) {
      return null;
    }

    const request: UnderwaterAnalysisRequest = {
      racingArea,
      raceTime: resolvedRaceTime,
      raceDuration: raceDurationMinutes,
      venue
    };

    return await service.analyzeRacingArea(request);
  }, [service, racingArea, venue, enabled, resolvedRaceTime, raceDurationMinutes]);

  useEffect(() => {
    if (!available || !enabled) {
      setAnalysis(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    void runAnalysis()
      .then((result) => {
        if (!isActive) return;
        setAnalysis(result);
      })
      .catch((err: any) => {
        if (!isActive) return;
        setAnalysis(null);
        setError(err instanceof Error ? err : new Error('Failed to analyze underwater conditions'));
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [available, enabled, runAnalysis]);

  const refetch = useCallback(async () => {
    if (!available || !enabled) {
      setAnalysis(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await runAnalysis();
      setAnalysis(result);
    } catch (err: any) {
      setAnalysis(null);
      setError(err instanceof Error ? err : new Error('Failed to analyze underwater conditions'));
    } finally {
      setLoading(false);
    }
  }, [available, enabled, runAnalysis]);

  return {
    analysis,
    loading,
    error,
    refetch,
    available
  };
}
