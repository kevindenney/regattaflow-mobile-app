import React, {useEffect} from 'react';
import {Platform} from 'react-native';
import {Stack} from 'expo-router';
import {AuthProvider, useAuth} from '@/providers/AuthProvider';
import StripeProvider from '@/providers/StripeProvider';
import {GluestackUIProvider} from '@/components/ui/gluestack-ui-provider';
import {ErrorBoundary} from '@/components/ui/error';
import {NetworkStatusBanner} from '@/components/ui/network';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Splash from '@/components/Splash';
import {initializeImageCache} from '@/lib/imageConfig';
import {initializeMutationQueueHandlers} from '@/services/userManualClubsService';
import {initializeCrewMutationHandlers} from '@/services/crewManagementService';
import {initializeBoatMutationHandlers} from '@/services/SailorBoatService';
import {initializeRaceRegistrationMutationHandlers} from '@/services/RaceRegistrationService';
import '@/global.css';

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
       args[0].includes('Expo AV has been deprecated'))
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
       args[0].includes('fontfaceobserver'))
    ) {
      return;
    }
    // Also check if it's an Error object
    if (args[0] instanceof Error &&
        (args[0].message?.includes('timeout exceeded') ||
         args[0].message?.includes('6000ms') ||
         args[0].message?.includes('60000ms') ||
         args[0].message?.includes('fontfaceobserver'))) {
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

  // Catch uncaught errors (including font loading)
  window.addEventListener('error', (event) => {
    if (event.message?.includes('timeout exceeded') ||
        event.message?.includes('6000ms') ||
        event.message?.includes('60000ms') ||
        event.message?.includes('fontfaceobserver')) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  });

  // Override ErrorUtils for React Native Web (suppress font loading errors in development)
  if (typeof window !== 'undefined' && (window as any).ErrorUtils) {
    const originalReportError = (window as any).ErrorUtils.reportError;
    (window as any).ErrorUtils.reportError = function(error: Error) {
      if (error.message?.includes('timeout exceeded') ||
          error.message?.includes('6000ms') ||
          error.message?.includes('60000ms') ||
          error.message?.includes('fontfaceobserver')) {
        // Silently ignore font loading timeouts
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
      <Stack screenOptions={{headerShown: false}} />
    </>
  )
}

export default function RootLayout() {
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

      // Register Service Worker for offline bathymetry tile caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/bathymetry-sw.js')
          .then((registration) => {

          })
          .catch((error) => {

          });
      }

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GluestackUIProvider mode="light">
          <StripeProvider>
            <AuthProvider>
              <StackWithSplash />
            </AuthProvider>
          </StripeProvider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
