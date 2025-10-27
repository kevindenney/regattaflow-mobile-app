import { useCallback, useEffect, useMemo, useState } from 'react';
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

export function useUserFleets(userId?: string | null) {
  const [state, setState] = useState<AsyncState<FleetMembership[]>>({
    data: null,
    loading: Boolean(userId),
    error: null,
  });

  const refresh = useCallback(async () => {
    console.log('[useUserFleets] refresh called with userId:', userId);

    if (!userId) {
      console.log('[useUserFleets] No userId, setting loading to false');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    console.log('[useUserFleets] Setting loading to true');
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const fleets = await fleetService.getFleetsForUser(userId);
      console.log('[useUserFleets] Got fleets from service:', fleets.length, fleets);
      setState({ data: fleets, loading: false, error: null });
    } catch (error) {
      console.error('[useUserFleets] Error fetching fleets:', error);
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [userId]);

  useEffect(() => {
    console.log('[useUserFleets] useEffect triggered, calling refresh');
    refresh();
  }, [refresh]);

  const result = useMemo(() => ({
    fleets: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);

  console.log('[useUserFleets] Returning result:', {
    fleetsCount: result.fleets.length,
    loading: result.loading,
    error: result.error
  });

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
