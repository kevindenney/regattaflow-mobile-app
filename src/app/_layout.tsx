import {Slot} from 'expo-router'
import {AuthProvider, useAuth} from '@/src/providers/AuthProvider'
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native'
import {useEffect} from 'react'
import {Platform} from 'react-native'

function Gate() {
  const {ready} = useAuth()

  console.log('🚪 [GATE] Gate rendering, ready:', ready);

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading RegattaFlow...</Text>
      </View>
    )
  }

  console.log('🚪 [GATE] About to render Slot...');
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
