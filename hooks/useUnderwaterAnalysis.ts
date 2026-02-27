import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BathymetricTidalService } from '@/services/BathymetricTidalService';
import type { UnderwaterAnalysis, UnderwaterAnalysisRequest } from '@/types/bathymetry';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useUnderwaterAnalysis');

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
  const isMountedRef = useRef(true);
  const runIdRef = useRef(0);

  const service = useMemo(() => {
    try {
      return new BathymetricTidalService();
    } catch (err) {
      logger.warn('Unable to create BathymetricTidalService', err);
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      runIdRef.current += 1;
    };
  }, []);

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

    const runId = ++runIdRef.current;
    const canCommit = () => isMountedRef.current && runId === runIdRef.current;
    if (!canCommit()) return;
    setLoading(true);
    setError(null);

    void runAnalysis()
      .then((result) => {
        if (!canCommit()) return;
        setAnalysis(result);
      })
      .catch((err: any) => {
        if (!canCommit()) return;
        setAnalysis(null);
        setError(err instanceof Error ? err : new Error('Failed to analyze underwater conditions'));
      })
      .finally(() => {
        if (!canCommit()) return;
        setLoading(false);
      });
  }, [available, enabled, runAnalysis]);

  const refetch = useCallback(async () => {
    const runId = ++runIdRef.current;
    const canCommit = () => isMountedRef.current && runId === runIdRef.current;
    if (!available || !enabled) {
      if (!canCommit()) return;
      setAnalysis(null);
      setError(null);
      return;
    }

    if (!canCommit()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await runAnalysis();
      if (!canCommit()) return;
      setAnalysis(result);
    } catch (err: any) {
      if (!canCommit()) return;
      setAnalysis(null);
      setError(err instanceof Error ? err : new Error('Failed to analyze underwater conditions'));
    } finally {
      if (!canCommit()) return;
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
