/**
 * usePushNotifications Hook
 *
 * React hook for managing push notification registration and handling.
 * Automatically registers for push notifications when the user is authenticated.
 *
 * Usage:
 * ```tsx
 * function App() {
 *   const { isEnabled, error, register } = usePushNotifications({
 *     onNotificationTapped: (data) => {
 *       if (data.thread_id) {
 *         router.push(`/crew-thread/${data.thread_id}`);
 *       }
 *     },
 *   });
 *
 *   return <YourApp />;
 * }
 * ```
 *
 * Requires: npm install expo-notifications expo-device expo-constants
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import {
  PushNotificationService,
  PushNotificationState,
} from '@/services/PushNotificationService';

interface UsePushNotificationsOptions {
  /** Called when a notification is received while app is in foreground */
  onNotificationReceived?: (notification: any) => void;
  /** Called when user taps on a notification */
  onNotificationTapped?: (data: Record<string, any>) => void;
  /** Auto-register when user is authenticated (default: true) */
  autoRegister?: boolean;
}

interface UsePushNotificationsResult {
  /** Whether push notifications are enabled */
  isEnabled: boolean;
  /** Current push token (if registered) */
  token: string | null;
  /** Error message if registration failed */
  error: string | null;
  /** Loading state during registration */
  isLoading: boolean;
  /** Manually trigger registration */
  register: () => Promise<PushNotificationState>;
  /** Unregister from push notifications */
  unregister: () => Promise<void>;
}

export function usePushNotifications(
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsResult {
  const {
    onNotificationReceived,
    onNotificationTapped,
    autoRegister = true,
  } = options;

  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isEnabled: false,
    token: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasRegisteredRef = useRef(false);

  // Register for push notifications
  const register = useCallback(async (): Promise<PushNotificationState> => {
    setIsLoading(true);
    try {
      const result = await PushNotificationService.register();
      setState(result);
      hasRegisteredRef.current = result.isEnabled;
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unregister from push notifications
  const unregister = useCallback(async (): Promise<void> => {
    await PushNotificationService.unregister();
    setState({
      isEnabled: false,
      token: null,
      error: null,
    });
    hasRegisteredRef.current = false;
  }, []);

  // Configure notification handlers
  useEffect(() => {
    const setup = async () => {
      cleanupRef.current = await PushNotificationService.configureHandlers({
        onNotificationReceived: (notification) => {
          // Call user callback
          onNotificationReceived?.(notification);
        },
        onNotificationResponse: (response) => {
          // Extract data from notification
          const data = response?.notification?.request?.content?.data || {};
          onNotificationTapped?.(data);
        },
      });
    };

    setup();

    return () => {
      cleanupRef.current?.();
    };
  }, [onNotificationReceived, onNotificationTapped]);

  // Auto-register when user is authenticated
  useEffect(() => {
    if (autoRegister && isAuthenticated && user && !hasRegisteredRef.current) {
      register();
    }
  }, [autoRegister, isAuthenticated, user, register]);

  // Unregister when user logs out
  useEffect(() => {
    if (!isAuthenticated && hasRegisteredRef.current) {
      unregister();
    }
  }, [isAuthenticated, unregister]);

  // Re-register when app comes to foreground (token may have changed)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === 'active' &&
        isAuthenticated &&
        hasRegisteredRef.current
      ) {
        // Silently re-register to refresh token
        PushNotificationService.register().then((result) => {
          setState(result);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated]);

  return {
    isEnabled: state.isEnabled,
    token: state.token,
    error: state.error,
    isLoading,
    register,
    unregister,
  };
}

export default usePushNotifications;
