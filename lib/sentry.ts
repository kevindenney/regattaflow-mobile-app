import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry error monitoring.
 * Call once at app startup (before rendering).
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] No DSN configured, skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || (__DEV__ ? 'development' : 'production'),

    // Only send events in production (or staging)
    enabled: !__DEV__,

    // Sample 100% of errors, 20% of transactions for performance
    sampleRate: 1.0,
    tracesSampleRate: 0.2,

    // Attach user IP for geo data, strip PII from breadcrumbs
    sendDefaultPii: false,

    // Filter noisy errors that don't represent real issues
    beforeSend(event) {
      const message = event.exception?.values?.[0]?.value ?? '';

      // Skip font loading timeouts (non-critical, already suppressed in UI)
      if (
        message.includes('timeout exceeded') ||
        message.includes('fontfaceobserver')
      ) {
        return null;
      }

      // Skip native module errors in Expo Go (dev only, shouldn't reach prod)
      if (
        message.includes('Cannot find native module') ||
        message.includes('ExpoPushTokenManager') ||
        message.includes('ExpoDevice')
      ) {
        return null;
      }

      // Skip React Native Web deprecation warnings
      if (
        message.includes('shadow* style props are deprecated') ||
        message.includes('textShadow* style props are deprecated')
      ) {
        return null;
      }

      return event;
    },

    // Add platform tag for filtering in Sentry dashboard
    initialScope: {
      tags: {
        platform: Platform.OS,
      },
    },
  });
}

/**
 * Capture an error in Sentry with optional context.
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Set the current user for Sentry event attribution.
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  Sentry.setUser(user);
}

export { Sentry };
