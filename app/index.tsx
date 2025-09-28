/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { HeroTabs } from '@/components/landing/HeroTabs';
import { AppHeader } from '@/components/layout/AppHeader';

export default function LandingPage() {
  const { user, userType, loading, signedIn } = useAuth();

  // Debug logging
  console.log('🏠 [LANDING] Page render DETAILED:', {
    user: user?.email || 'null',
    userId: user?.id,
    userType,
    loading,
    signedIn,
    shouldRedirect: !loading && user && userType,
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
    currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
    timestamp: new Date().toISOString()
  });

  // Auto-redirect based on authentication state
  useEffect(() => {
    console.log('🏠 [LANDING] useEffect triggered DETAILED:', {
      user: !!user,
      userId: user?.id,
      userType,
      loading,
      signedIn,
      currentUrl: window.location.href
    });

    if (!loading) {
      if (user && userType) {
        console.log(`✅ [LANDING] User authenticated as ${userType}, will redirect to dashboard`);
        console.log('🔍 [LANDING] About to redirect from:', window.location.pathname);

        // Route based on user type
        switch (userType) {
          case 'sailor':
            console.log('🚀 [LANDING] Redirecting to /(tabs) for sailor');
            router.replace('/(tabs)'); // Sailor tabs (defaults to documents)
            break;
          case 'club':
            console.log('🚀 [LANDING] Redirecting to club dashboard');
            router.replace('/(app)/club/dashboard'); // Club dashboard
            break;
          case 'coach':
            console.log('🚀 [LANDING] Redirecting to coach dashboard');
            router.replace('/(app)/coach/dashboard'); // Coach dashboard
            break;
          default:
            console.warn('❓ [LANDING] Unknown user type:', userType);
            console.log('🚀 [LANDING] Redirecting to /(tabs) as fallback');
            router.replace('/(tabs)'); // Fallback to tabs (defaults to documents)
        }
      } else if (user && !userType) {
        console.log('🔄 [LANDING] User authenticated but no userType, redirecting to tabs for onboarding');
        console.log('🔍 [LANDING] About to redirect from:', window.location.pathname);
        console.log('🚀 [LANDING] Redirecting to /(tabs) for new user');
        router.replace('/(tabs)'); // Fallback to tabs for new users
      } else if (!user) {
        console.log('🚪 [LANDING] User not authenticated, redirecting to login');
        console.log('🔍 [LANDING] About to redirect from:', window.location.pathname);
        console.log('🚀 [LANDING] Redirecting to /(auth)/login');
        router.replace('/(auth)/login'); // Redirect to login for unauthenticated users
      }
    } else {
      console.log('⏳ [LANDING] Loading auth state...');
    }
  }, [user, userType, loading, signedIn]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* You could add a loading spinner here */}
        </View>
      </SafeAreaView>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader transparent showLogo />
      <HeroTabs />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});