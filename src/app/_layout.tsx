import React, {useEffect} from 'react'
import {Platform} from 'react-native'
import {Stack} from 'expo-router'
import {AuthProvider, useAuth} from '@/src/providers/AuthProvider'
import StripeProvider from '@/src/providers/StripeProvider.native'
import {GluestackUIProvider} from '@/src/components/ui/gluestack-ui-provider'
import {ErrorBoundary} from '@/src/components/ui/error'
import {NetworkStatusBanner} from '@/src/components/ui/network'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import Splash from '@/src/components/Splash'
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

// Suppress React Native Web deprecation warnings (from third-party libraries)
if (typeof window !== 'undefined' && Platform.OS === 'web') {
  const originalWarn = console.warn;
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
  // Inject global CSS for web
  useEffect(() => {
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
