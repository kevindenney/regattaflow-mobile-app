import React, {useEffect} from 'react'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'
import {AuthProvider, useAuth} from '@/providers/AuthProvider'
import StripeProvider from '@/providers/StripeProvider'
import {GluestackUIProvider} from '@/components/ui/gluestack-ui-provider'
import {ErrorBoundary} from '@/components/ui/error'
import {NetworkStatusBanner} from '@/components/ui/network'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import Splash from '@/components/Splash'
import {initializeImageCache} from '@/lib/imageConfig'
import '@/global.css'

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
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('props.pointerEvents is deprecated') ||
       args[0].includes('"shadow*" style props are deprecated') ||
       args[0].includes('"textShadow*" style props are deprecated'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    // Suppress font loading timeout errors (non-critical)
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('timeout exceeded') || args[0].includes('6000ms'))
    ) {
      return;
    }
    // Also check if it's an Error object
    if (args[0] instanceof Error && args[0].message?.includes('timeout exceeded')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Catch unhandled promise rejections for font loading
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('timeout exceeded') ||
        event.reason?.message?.includes('6000ms')) {
      event.preventDefault();
      return;
    }
  });

  // Catch uncaught errors (including font loading)
  window.addEventListener('error', (event) => {
    if (event.message?.includes('timeout exceeded') ||
        event.message?.includes('6000ms')) {
      event.preventDefault();
      return;
    }
  });
}

function StackWithSplash() {
  const {state} = useAuth()

  if (state === 'checking') {
    return <Splash />
  }

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
            console.log('✅ Bathymetry Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Bathymetry Service Worker registration failed:', error);
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
