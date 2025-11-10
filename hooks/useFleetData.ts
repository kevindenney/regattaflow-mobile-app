import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import {
  FleetActivityEntry,
  FleetMembership,
  FleetOverview,
  fleetService,
} from '../services/fleetService';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const logger = createLogger('useFleetData');
export function useUserFleets(userId?: string | null) {
  const [state, setState] = useState<AsyncState<FleetMembership[]>>({
    data: null,
    loading: Boolean(userId),
    error: null,
  });

  const refresh = useCallback(async () => {
    const refreshStartTime = Date.now();
    logger.debug(`[useUserFleets] ========== REFRESH STARTED at ${new Date().toISOString()} ==========`);
    logger.debug('[useUserFleets] Refresh start timestamp:', refreshStartTime);
    logger.debug('[useUserFleets] User ID:', userId);

    if (!userId) {
      logger.debug('[useUserFleets] No userId, setting loading to false');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    logger.debug('[useUserFleets] Setting loading to true, calling fleetService.getFleetsForUser()...');
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const serviceCallStart = Date.now();
      const fleets = await fleetService.getFleetsForUser(userId);
      const serviceCallEnd = Date.now();
      const serviceCallDuration = serviceCallEnd - serviceCallStart;

      logger.debug('[useUserFleets] ========== SERVICE CALL COMPLETED ==========');
      logger.debug('[useUserFleets] Service call duration:', serviceCallDuration, 'ms');
      logger.debug('[useUserFleets] Fleets count:', fleets.length);
      logger.debug('[useUserFleets] Fleet IDs:', fleets.map(f => f.fleet.id));
      logger.debug('[useUserFleets] Fleet names:', fleets.map(f => f.fleet.name));
      logger.debug('[useUserFleets] Fleet data:', fleets);

      setState({ data: fleets, loading: false, error: null });

      const refreshEndTime = Date.now();
      const totalDuration = refreshEndTime - refreshStartTime;
      logger.debug('[useUserFleets] ========== REFRESH COMPLETED ==========');
      logger.debug('[useUserFleets] Refresh end timestamp:', refreshEndTime);
      logger.debug('[useUserFleets] Total refresh duration:', totalDuration, 'ms');
    } catch (error) {
      const errorTime = Date.now();
      logger.error('[useUserFleets] ========== REFRESH FAILED ==========');
      logger.error('[useUserFleets] Error timestamp:', errorTime);
      logger.error('[useUserFleets] Error fetching fleets:', error);
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [userId]);

  useEffect(() => {
    logger.debug('[useUserFleets] useEffect triggered, calling refresh');
    refresh();
  }, [refresh]);

  const result = useMemo(() => ({
    fleets: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);

  logger.debug('[useUserFleets] Returning result:', result);

  return result;
}

export function useFleetOverview(fleetId?: string | null) {
  const [state, setState] = useState<AsyncState<FleetOverview>>({
    data: null,
    loading: Boolean(fleetId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!fleetId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const overview = await fleetService.getFleetOverview(fleetId);
      setState({ data: overview, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [fleetId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    overview: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
}

export function useFleetActivity(fleetId?: string | null, options?: { limit?: number }) {
  const [state, setState] = useState<AsyncState<FleetActivityEntry[]>>({
    data: null,
    loading: Boolean(fleetId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!fleetId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const activity = await fleetService.getFleetActivity(fleetId, options);
      setState({ data: activity, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [fleetId, options?.limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    activity: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
}
