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
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const fleets = await fleetService.getFleetsForUser(userId);
      setState({ data: fleets, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    fleets: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
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
