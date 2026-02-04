/**
 * PushNotificationHandler - Global push notification setup component
 *
 * This component should be placed at the root of the app (inside AuthProvider)
 * to handle push notification registration and navigation.
 *
 * Features:
 * - Auto-registers for push notifications when user is authenticated
 * - Handles notification taps to navigate to relevant screens
 * - Shows foreground notifications as alerts/toasts (optional)
 */

import { useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationHandlerProps {
  /** Whether to show alerts for foreground notifications */
  showForegroundAlerts?: boolean;
  children?: React.ReactNode;
}

export function PushNotificationHandler({
  showForegroundAlerts = true,
  children,
}: PushNotificationHandlerProps) {
  const router = useRouter();

  // Handle notification tap - navigate to appropriate screen
  const handleNotificationTapped = useCallback(
    (data: Record<string, any>) => {
      // Handle message notifications
      if (data.thread_id) {
        router.push(`/crew-thread/${data.thread_id}`);
        return;
      }

      // Handle other notification types
      if (data.regatta_id) {
        router.push(`/race/${data.regatta_id}`);
        return;
      }

      // Handle profile-related notifications
      if (data.actor_id && data.type === 'new_follower') {
        router.push(`/sailor/${data.actor_id}`);
        return;
      }

      // Default: go to notifications list
      if (data.type) {
        router.push('/social-notifications');
      }
    },
    [router]
  );

  // Handle foreground notification - optionally show alert
  const handleNotificationReceived = useCallback(
    (notification: any) => {
      if (!showForegroundAlerts) return;

      const title = notification?.request?.content?.title;
      const body = notification?.request?.content?.body;
      const data = notification?.request?.content?.data || {};

      // Don't show alert for message notifications on iOS (use native banner)
      if (Platform.OS === 'ios' && data.thread_id) {
        return;
      }

      // Show alert for other notifications
      if (title) {
        Alert.alert(
          title,
          body || '',
          [
            { text: 'Dismiss', style: 'cancel' },
            {
              text: 'View',
              onPress: () => handleNotificationTapped(data),
            },
          ],
          { cancelable: true }
        );
      }
    },
    [showForegroundAlerts, handleNotificationTapped]
  );

  // Initialize push notifications
  const { isEnabled, error } = usePushNotifications({
    onNotificationTapped: handleNotificationTapped,
    onNotificationReceived: handleNotificationReceived,
    autoRegister: true,
  });

  // Log registration status (for debugging)
  useEffect(() => {
    if (__DEV__) {
      if (isEnabled) {
        console.log('[Push] Notifications registered successfully');
      } else if (error) {
        console.log('[Push] Registration failed:', error);
      }
    }
  }, [isEnabled, error]);

  // This component doesn't render anything itself
  return children ?? null;
}

export default PushNotificationHandler;
