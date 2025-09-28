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
  const { user, userType, loading } = useAuth();

  // Debug logging
  console.log('🏠 [LANDING] Page render:', {
    user: user?.email || 'null',
    userType,
    loading,
    shouldRedirect: !loading && user && userType
  });

  // Auto-redirect authenticated users to role-based dashboard
  useEffect(() => {
    console.log('🏠 [LANDING] useEffect triggered:', { user: !!user, userType, loading });

    if (!loading && user && userType) {
      console.log(`✅ [LANDING] User authenticated as ${userType}, redirecting to dashboard`);

      // Route based on user type
      switch (userType) {
        case 'sailor':
          router.replace('/(tabs)/dashboard'); // Sailor dashboard
          break;
        case 'club':
          router.replace('/(app)/club/dashboard'); // Club dashboard
          break;
        case 'coach':
          router.replace('/(app)/coach/dashboard'); // Coach dashboard
          break;
        default:
          console.warn('Unknown user type:', userType);
          router.replace('/(tabs)/dashboard'); // Fallback to default dashboard
      }
    } else {
      console.log('🏠 [LANDING] Showing landing page - not authenticated');
    }
  }, [user, userType, loading]);

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