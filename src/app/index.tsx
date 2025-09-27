/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { HeroTabs } from '@/src/components/landing/HeroTabs';
import { ScrollFix } from '@/src/components/landing/ScrollFix';

export default function LandingPage() {
  console.log('✅ [LANDING] LandingPage component loading with HeroTabs');

  const { user, loading } = useAuth();
  const [forceShowLanding, setForceShowLanding] = useState(false);

  // Debug logging for height issues
  console.log('🔍 [DEBUG] LandingPage render state:', {
    platform: Platform.OS,
    loading,
    userExists: !!user,
    forceShowLanding,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 'N/A',
    documentHeight: typeof document !== 'undefined' ? document.documentElement.scrollHeight : 'N/A'
  });

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ [LANDING] User authenticated, redirecting to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, loading]);

  // Timeout to force show landing page if auth takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('🚨 [DEBUG] Auth loading timeout, forcing landing page display');
        setForceShowLanding(true);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Show loading state while checking auth (unless forced)
  if (loading && !forceShowLanding) {
    const Container = Platform.OS === 'web' ? View : SafeAreaView;
    return (
      <Container style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* You could add a loading spinner here */}
        </View>
      </Container>
    );
  }

  // Show landing page for unauthenticated users (or if loading takes too long)
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  return (
    <Container style={styles.container}>
      <ScrollFix />
      <HeroTabs />
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        width: '100%',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});