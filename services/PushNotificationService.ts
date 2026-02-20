/**
 * PushNotificationService - Handles push notification registration and management
 *
 * This service provides push notification functionality for the app.
 * Requires: npm install expo-notifications expo-device expo-constants
 *
 * Features:
 * - Register for push notifications
 * - Store token in Supabase
 * - Handle foreground/background notifications
 * - Unregister on logout
 */

import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

// These will be imported dynamically when available
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;
let Constants: typeof import('expo-constants') | null = null;
let initAttempted = false;
let isNativeAvailable = false;

// Initialize optional dependencies
async function initDependencies() {
  if (initAttempted) return;
  initAttempted = true;

  // Skip on web platform - push notifications only work on native
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // Import the modules - these may throw if native modules aren't available
    // (e.g., running in Expo Go instead of a development build)
    const notifModule = await import('expo-notifications');
    const deviceModule = await import('expo-device');
    const constantsModule = await import('expo-constants');

    // Verify that native modules are actually available by checking for key functions
    // These will be undefined in Expo Go or when native modules aren't linked
    if (
      notifModule &&
      typeof notifModule.addNotificationReceivedListener === 'function' &&
      typeof notifModule.getPermissionsAsync === 'function'
    ) {
      Notifications = notifModule;
      Device = deviceModule;
      Constants = constantsModule;
      isNativeAvailable = true;
    } else {
      // Module imported but functions not available (Expo Go scenario)
      if (__DEV__) {
        console.log(
          '[Push] Native modules not available. Push notifications require a development build.'
        );
      }
    }
  } catch {
    // Dependencies not installed or native modules not available - this is expected in Expo Go
    if (__DEV__) {
      console.log(
        '[Push] Native modules not available. Push notifications require a development build.'
      );
    }
  }
}

export interface PushNotificationState {
  isEnabled: boolean;
  token: string | null;
  error: string | null;
}

export class PushNotificationService {
  private static token: string | null = null;
  private static isInitialized = false;

  /**
   * Check if push notifications are available
   */
  static async isAvailable(): Promise<boolean> {
    await initDependencies();
    if (!isNativeAvailable || !Notifications || !Device) return false;
    return Device.isDevice;
  }

  /**
   * Register for push notifications and store token
   */
  static async register(): Promise<PushNotificationState> {
    await initDependencies();

    // Check if dependencies are available
    if (!isNativeAvailable || !Notifications || !Device || !Constants) {
      return {
        isEnabled: false,
        token: null,
        error:
          'Push notifications not available. Requires a development build (not Expo Go).',
      };
    }

    // Must be on a physical device
    if (!Device.isDevice) {
      return {
        isEnabled: false,
        token: null,
        error: 'Push notifications require a physical device',
      };
    }

    try {
      // Check/request permission
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return {
          isEnabled: false,
          token: null,
          error: 'Push notification permission denied',
        };
      }

      // Get the push token
      const projectId =
        Constants.default.expoConfig?.extra?.eas?.projectId ??
        Constants.default.easConfig?.projectId;

      if (!projectId) {
        return {
          isEnabled: false,
          token: null,
          error: 'Missing EAS project ID',
        };
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.token = tokenResponse.data;

      // Store token in Supabase
      await this.storeToken(this.token);

      // Configure notification handler for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0A84FF',
        });
      }

      this.isInitialized = true;

      return {
        isEnabled: true,
        token: this.token,
        error: null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to register';
      return {
        isEnabled: false,
        token: null,
        error: message,
      };
    }
  }

  /**
   * Store push token in Supabase
   */
  private static async storeToken(token: string): Promise<void> {
    const platform =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    try {
      await initDependencies();
      const deviceName = Device?.deviceName || undefined;

      const { error } = await supabase.rpc('register_push_token', {
        p_token: token,
        p_platform: platform,
        p_device_name: deviceName,
      });

      if (error) {
        console.error('Failed to store push token:', error);
      }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  /**
   * Unregister push notifications (e.g., on logout)
   */
  static async unregister(): Promise<void> {
    if (!this.token) return;

    try {
      await supabase.rpc('remove_push_token', {
        p_token: this.token,
      });

      this.token = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  }

  /**
   * Get the current push token
   */
  static getToken(): string | null {
    return this.token;
  }

  /**
   * Configure notification handlers
   * Call this in your app's root component
   */
  static async configureHandlers(options: {
    onNotificationReceived?: (notification: any) => void;
    onNotificationResponse?: (response: any) => void;
  }): Promise<() => void> {
    await initDependencies();

    // Check if native modules are actually available
    if (
      !isNativeAvailable ||
      !Notifications ||
      typeof Notifications.addNotificationReceivedListener !== 'function'
    ) {
      return () => {}; // No-op cleanup
    }

    // Handle notifications when app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        options.onNotificationReceived?.(notification);
      }
    );

    // Handle when user taps on notification
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        options.onNotificationResponse?.(response);
      });

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Schedule a local notification (for testing)
   */
  static async scheduleLocalNotification(options: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    delaySeconds?: number;
  }): Promise<string | null> {
    await initDependencies();

    if (!isNativeAvailable || !Notifications) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data,
        },
        trigger: options.delaySeconds
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: options.delaySeconds }
          : null,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Send a push notification to a user via the Supabase Edge Function.
   * This is the primary method for sending push notifications from the client.
   * The edge function handles token lookup, Expo Push API calls, and stale token cleanup.
   *
   * @param category - Notification category for preference checking (e.g. 'messages', 'booking_requests')
   */
  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
    category?: string
  ): Promise<boolean> {
    // Skip on web
    if (Platform.OS === 'web') return false;

    try {
      const { data: result, error } = await supabase.functions.invoke(
        'send-push-notification',
        {
          body: {
            recipients: [{ userId, title, body, data, category }],
          },
        }
      );

      if (error) {
        console.error('[Push] Error sending notification:', error);
        return false;
      }

      return result?.success ?? false;
    } catch (error) {
      console.error('[Push] Error invoking send-push-notification:', error);
      return false;
    }
  }

  /**
   * Send push notifications to multiple users in a single batch call.
   */
  static async sendPushNotificationBatch(
    recipients: Array<{
      userId: string;
      title: string;
      body: string;
      data?: Record<string, any>;
      category?: string;
    }>
  ): Promise<boolean> {
    if (Platform.OS === 'web' || recipients.length === 0) return false;

    try {
      const { data: result, error } = await supabase.functions.invoke(
        'send-push-notification',
        { body: { recipients } }
      );

      if (error) {
        console.error('[Push] Error sending batch notification:', error);
        return false;
      }

      return result?.success ?? false;
    } catch (error) {
      console.error('[Push] Error invoking batch send-push-notification:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled for the current device.
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    await initDependencies();
    if (!isNativeAvailable || !Notifications) return false;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }
}

export default PushNotificationService;
