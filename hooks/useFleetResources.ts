import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import { fleetService, type FleetResource } from '@/services/fleetService';

const logger = createLogger('useFleetResources');

interface FleetResourceState {
  data: FleetResource[];
  loading: boolean;
  error: Error | null;
}

export function useFleetResources(fleetId?: string | null, options?: { limit?: number }) {
  const [state, setState] = useState<FleetResourceState>({
    data: [],
    loading: Boolean(fleetId),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!fleetId) {
      setState(prev => ({ ...prev, loading: false, data: [] }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.debug('[useFleetResources] Loading resources for fleet', fleetId);
      const resources = await fleetService.getFleetResources(fleetId, options);
      setState({ data: resources, loading: false, error: null });
    } catch (error) {
      logger.error('[useFleetResources] Failed to load resources', error);
      setState({ data: [], loading: false, error: error as Error });
    }
  }, [fleetId, options?.limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({
    resources: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  }), [state, refresh]);
}
