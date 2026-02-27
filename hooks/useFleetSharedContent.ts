import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import {
  fleetService,
  type FleetCourseSummary,
  type FleetRaceSummary,
} from '@/services/fleetService';

const logger = createLogger('useFleetSharedContent');

interface FleetSharedContentState {
  courses: FleetCourseSummary[];
  races: FleetRaceSummary[];
  loading: boolean;
  error: Error | null;
}

export function useFleetSharedContent(params: { clubId?: string | null; classId?: string | null }) {
  const [state, setState] = useState<FleetSharedContentState>({
    courses: [],
    races: [],
    loading: Boolean(params.clubId || params.classId),
    error: null,
  });
  const isMountedRef = useRef(true);
  const refreshRunIdRef = useRef(0);
  const activeContextRef = useRef(`${params.clubId ?? ''}|${params.classId ?? ''}`);

  useEffect(() => {
    activeContextRef.current = `${params.clubId ?? ''}|${params.classId ?? ''}`;
  }, [params.clubId, params.classId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      refreshRunIdRef.current += 1;
    };
  }, []);

  const refresh = useCallback(async () => {
    const runId = ++refreshRunIdRef.current;
    const contextKey = `${params.clubId ?? ''}|${params.classId ?? ''}`;
    const canCommit = () =>
      isMountedRef.current &&
      runId === refreshRunIdRef.current &&
      activeContextRef.current === contextKey;

    if (!params.clubId && !params.classId) {
      if (!canCommit()) return;
      setState(prev => ({ ...prev, loading: false, courses: [], races: [] }));
      return;
    }

    if (!canCommit()) return;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [courses, races] = await Promise.all([
        fleetService.getFleetCourses({ clubId: params.clubId, limit: 6 }),
        fleetService.getFleetUpcomingRaces({ classId: params.classId, limit: 6 }),
      ]);

      if (!canCommit()) return;
      setState({
        courses,
        races,
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('[useFleetSharedContent] Failed to load shared items', error);
      if (!canCommit()) return;
      setState({
        courses: [],
        races: [],
        loading: false,
        error: error as Error,
      });
    }
  }, [params.clubId, params.classId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({
    courses: state.courses,
    races: state.races,
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
}
