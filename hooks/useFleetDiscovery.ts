import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import { FleetDiscoveryService, type Fleet as DiscoveryFleet } from '@/services/FleetDiscoveryService';

interface FleetSuggestionState {
  data: DiscoveryFleet[];
  loading: boolean;
  error: Error | null;
}

const logger = createLogger('useFleetDiscovery');

export function useFleetSuggestions(params: { userId?: string | null; classId?: string | null } = {}) {
  const [state, setState] = useState<FleetSuggestionState>({
    data: [],
    loading: Boolean(params.userId || params.classId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!params.userId && !params.classId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let fleets: DiscoveryFleet[] = [];

      if (params.userId) {
        logger.debug('[useFleetDiscovery] Loading suggestions for user', params.userId);
        fleets = await FleetDiscoveryService.getSuggestedFleets(params.userId);
      } else if (params.classId) {
        logger.debug('[useFleetDiscovery] Discovering fleets for class', params.classId);
        fleets = await FleetDiscoveryService.discoverFleets(undefined, params.classId, 12);
      }

      setState({ data: fleets, loading: false, error: null });
    } catch (error) {
      logger.error('[useFleetDiscovery] Failed to load fleet suggestions', error);
      setState({ data: [], loading: false, error: error as Error });
    }
  }, [params.userId, params.classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    suggestions: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
}

export function useTrendingFleets(limit: number = 8) {
  const [state, setState] = useState<FleetSuggestionState>({
    data: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const fleets = await FleetDiscoveryService.discoverFleets(undefined, undefined, limit);
      setState({ data: fleets, loading: false, error: null });
    } catch (error) {
      logger.error('[useFleetDiscovery] Failed to load trending fleets', error);
      setState({ data: [], loading: false, error: error as Error });
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    fleets: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
}
