import { ErrorBoundary } from '@/components/ui/error';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { NetworkStatusBanner } from '@/components/ui/network';
import { PushNotificationHandler } from '@/components/notifications/PushNotificationHandler';
import '@/global.css';
import { initializeImageCache } from '@/lib/imageConfig';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import StripeProvider from '@/providers/StripeProvider';
import { initializeCrewMutationHandlers } from '@/services/crewManagementService';
import { initializeRaceRegistrationMutationHandlers } from '@/services/RaceRegistrationService';
import { initializeBoatMutationHandlers } from '@/services/SailorBoatService';
import { initializeMutationQueueHandlers } from '@/services/userManualClubsService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import React, { useEffect, useState } from 'react';
import { LogBox, Platform } from 'react-native';

// Suppress known warnings for native modules not available in Expo Go
// These errors occur because expo-notifications and expo-device require a development build
LogBox.ignoreLogs([
  'Cannot find native module',
  'ExpoPushTokenManager',
  'ExpoDevice',
  'Notifications.addNotificationReceivedListener is not a function',
  'Push notifications',
]);

// Suppress red box errors for native modules not available in Expo Go (native platforms only)
if (Platform.OS !== 'web' && __DEV__) {
  // ErrorUtils is a React Native global for error handling
  const RNErrorUtils = (global as any).ErrorUtils;
  if (RNErrorUtils) {
    const originalErrorHandler = RNErrorUtils.getGlobalHandler();
    RNErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      // Suppress push notification native module errors in Expo Go
      if (
        error?.message?.includes('Cannot find native module') ||
        error?.message?.includes('ExpoPushTokenManager') ||
        error?.message?.includes('ExpoDevice') ||
        error?.message?.includes('is not a function (it is undefined)')
      ) {
        // Log to console instead of showing red box
        console.log('[Suppressed] Push notification error (expected in Expo Go):', error.message);
        return;
      }
      // Pass other errors to the original handler
      originalErrorHandler(error, isFatal);
    });
  }
}

// Configure Reanimated logger to suppress strict mode warnings
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode warnings about shared value access during render
});

// Initialize i18n (must be imported before any components that use translations)
import '@/lib/i18n';

let FontFaceObserverModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FontFaceObserverModule = require('fontfaceobserver');
} catch (error) {
  FontFaceObserverModule = null;
}

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Suppress React Native Web deprecation warnings and font loading errors
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  if (FontFaceObserverModule?.prototype?.load) {
    const originalLoad = FontFaceObserverModule.prototype.load;
    FontFaceObserverModule.prototype.load = function patchedLoad(...args: any[]) {
      return originalLoad.apply(this, args).catch((error: Error) => {
        if (error?.message?.includes('timeout exceeded') ||
            error?.message?.includes('fontfaceobserver')) {
          return this;
        }
        throw error;
      });
    };
  }

  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('props.pointerEvents is deprecated') ||
       args[0].includes('"shadow*" style props are deprecated') ||
       args[0].includes('"textShadow*" style props are deprecated') ||
       args[0].includes('expo-av') ||
       args[0].includes('Expo AV has been deprecated') ||
       args[0].includes('Download the React DevTools') ||
       args[0].includes('useNativeDriver') ||
       args[0].includes('[Intervention] Slow network is detected'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    // Suppress font loading timeout errors (non-critical)
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('timeout exceeded') ||
       args[0].includes('6000ms') ||
       args[0].includes('60000ms') ||
       args[0].includes('fontfaceobserver') ||
       args[0].includes('"shadow*" style props are deprecated') ||
       args[0].includes('"textShadow*" style props are deprecated'))
    ) {
      return;
    }
    // Also check if it's an Error object
    if (args[0] instanceof Error &&
        (args[0].message?.includes('timeout exceeded') ||
         args[0].message?.includes('6000ms') ||
         args[0].message?.includes('60000ms') ||
         args[0].message?.includes('fontfaceobserver') ||
         args[0].message?.includes('shadow*') ||
         args[0].message?.includes('textShadow*'))) {
      return;
    }
    originalError.apply(console, args);
  };

  // Catch unhandled promise rejections for font loading
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('timeout exceeded') ||
        event.reason?.message?.includes('6000ms') ||
        event.reason?.message?.includes('60000ms') ||
        event.reason?.message?.includes('fontfaceobserver')) {
      event.preventDefault();
      return;
    }
  });

  // Catch uncaught errors (including font loading and shadow deprecation)
  window.addEventListener('error', (event) => {
    if (event.message?.includes('timeout exceeded') ||
        event.message?.includes('6000ms') ||
        event.message?.includes('60000ms') ||
        event.message?.includes('fontfaceobserver') ||
        event.message?.includes('Unexpected text node') ||
        event.message?.includes('shadow*') ||
        event.message?.includes('textShadow*')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  });

  // Override ErrorUtils for React Native Web (suppress font loading and shadow deprecation errors in development)
  if (typeof window !== 'undefined' && (window as any).ErrorUtils) {
    const originalReportError = (window as any).ErrorUtils.reportError;
    (window as any).ErrorUtils.reportError = function(error: Error) {
      if (error.message?.includes('timeout exceeded') ||
          error.message?.includes('6000ms') ||
          error.message?.includes('60000ms') ||
          error.message?.includes('fontfaceobserver') ||
          error.message?.includes('Unexpected text node') ||
          error.message?.includes('shadow*') ||
          error.message?.includes('textShadow*')) {
        // Silently ignore font loading timeouts and shadow deprecation warnings
        return;
      }
      return originalReportError(error);
    };
  }
}

function StackWithSplash() {
  const {state} = useAuth()

  // Don't block the app while checking auth - let routes handle their own loading states
  // This allows the landing page to render immediately
  return (
    <>
      <NetworkStatusBanner />
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="account" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="venue/post/create" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  // Load Manrope font family from Google Fonts
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // Initialize image cache and inject global CSS for web
  useEffect(() => {
    // Initialize expo-image cache for optimal performance
    initializeImageCache();

    // Initialize mutation queue for offline sync
    initializeMutationQueueHandlers();
    initializeCrewMutationHandlers();
    initializeBoatMutationHandlers();
    initializeRaceRegistrationMutationHandlers();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: auto;
        }
        #root {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .venueSplit {
          display: grid;
          grid-template-columns: 1fr 440px;
          height: 100vh;
        }
        #venue-map {
          min-height: 300px;
        }
      `;
      document.head.appendChild(style);

      // Set custom RegattaFlow R mark favicon (using data URI for reliable loading)
      const regattaFlowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="%230a1832"/><g transform="translate(16,16)"><circle r="11" stroke="white" stroke-width="1.5" fill="none"/><text x="0" y="3" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="700" fill="white">R</text><path d="M-6 5 Q-3 3.5 0 5 Q3 6.5 6 5" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/></g></svg>`;
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      favicon.href = `data:image/svg+xml,${regattaFlowSvg}`;
      document.head.appendChild(favicon);

      // Register Service Worker for offline bathymetry tile caching (prod only)
      if ('serviceWorker' in navigator) {
        if (process.env.NODE_ENV === 'production') {
          // Use base path for service worker (supports /regattaflow base path)
          const basePath = window.location.pathname.startsWith('/regattaflow') ? '/regattaflow' : '';
          navigator.serviceWorker
            .register(`${basePath}/bathymetry-sw.js`)
            .catch((error) => {
              console.warn('[BathymetrySW] Failed to register service worker', error);
            });
        } else {
          // Ensure dev sessions don't keep an old bathymetry SW around
          navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
              registrations
                .filter((reg) => reg?.scope?.includes('bathymetry'))
                .forEach((reg) => reg.unregister());
            })
            .catch(() => {
              // No-op
            });
        }
      }

      // On web, Expo Router keeps inactive routes mounted with aria-hidden="true". If focus
      // remains inside those hidden trees, Chrome emits "Blocked aria-hidden" warnings. Blur the
      // focused element and move focus to a safe fallback whenever focus enters an aria-hidden
      // ancestor.
      const handleFocusIn = (event: FocusEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        const hiddenAncestor = target.closest('[aria-hidden="true"]');
        if (!hiddenAncestor) return;

        requestAnimationFrame(() => {
          target.blur();
          if (!document.body.hasAttribute('tabindex')) {
            document.body.setAttribute('tabindex', '-1');
          }
          document.body.focus();
        });
      };

      // Also check for elements that are already focused when they become aria-hidden
      const handleAriaHiddenChange = () => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (!activeElement) return;
        
        const hiddenAncestor = activeElement.closest('[aria-hidden="true"]');
        if (hiddenAncestor) {
          requestAnimationFrame(() => {
            activeElement.blur();
            if (!document.body.hasAttribute('tabindex')) {
              document.body.setAttribute('tabindex', '-1');
            }
            document.body.focus();
          });
        }
      };

      // Use MutationObserver to watch for aria-hidden changes
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            handleAriaHiddenChange();
          }
        }
      });

      // Observe the entire document for aria-hidden attribute changes
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['aria-hidden'],
        subtree: true,
      });

      document.addEventListener('focusin', handleFocusIn, true);

      return () => {
        document.head.removeChild(style);
        document.removeEventListener('focusin', handleFocusIn, true);
        observer.disconnect();
        const addedFavicon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        if (addedFavicon) {
          addedFavicon.remove();
        }
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider mode="light">
          <StripeProvider>
            <AuthProvider>
              <PushNotificationHandler>
                <StackWithSplash />
              </PushNotificationHandler>
            </AuthProvider>
          </StripeProvider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
