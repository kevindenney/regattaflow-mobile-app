import {Slot} from 'expo-router'
import {AuthProvider, useAuth} from '@/src/providers/AuthProvider'
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native'
import {useEffect} from 'react'
import {Platform} from 'react-native'

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

function Gate() {
  const {ready} = useAuth()

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading RegattaFlow...</Text>
      </View>
    )
  }

  return <Slot/>
}

function ErrorBoundary({children}:{children: React.ReactNode}) {
  useEffect(()=>{
    if (Platform.OS === 'web') {
      window.addEventListener('error', (e)=>{
        console.error('[UI] error', e.error || e)
      })
      return ()=>{}
    }
  }, [])

  return <>{children}</>
}

export default function RootLayout() {
  // Inject global CSS for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
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
      <AuthProvider>
        <Gate/>
      </AuthProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B'
  }
})
