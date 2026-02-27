import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService, ConnectionStatus } from '@/services/RealtimeService';

/**
 * Hook for monitoring Supabase realtime connection status
 */
export function useRealtimeConnection() {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    realtimeService.getConnectionStatus()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = realtimeService.onConnectionStatusChange((newStatus) => {
      if (!isMountedRef.current) return;
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
      setIsReconnecting(newStatus === 'reconnecting');
    });

    return unsubscribe;
  }, []);

  const forceReconnect = useCallback(() => {
    realtimeService.forceReconnect();
  }, []);

  return {
    status,
    isConnected,
    isReconnecting,
    forceReconnect,
  };
}
