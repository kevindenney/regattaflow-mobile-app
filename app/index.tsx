/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute, shouldCompleteOnboarding, getOnboardingRoute } from '@/lib/utils/userTypeRouting';
import { HeroPhones } from '@/components/landing/HeroPhones';
import { ScrollFix } from '@/components/landing/ScrollFix';

export default function LandingPage() {
  const { signedIn, ready, userProfile, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready AND not loading profile
    if (!ready || loading || isRedirecting) return;

    // Only redirect if signed in AND profile is loaded (or explicitly null after loading)
    if (signedIn) {
      // If profile is still being fetched, wait for it
      // userProfile will be populated after signIn completes
      if (userProfile || (!loading && ready)) {
        setIsRedirecting(true);

        // Check if onboarding is needed
        if (shouldCompleteOnboarding(userProfile)) {
          router.replace(getOnboardingRoute(userProfile));
        } else {
          router.replace(getDashboardRoute(userProfile?.user_type));
        }
      }
    }
  }, [signedIn, ready, userProfile, loading, isRedirecting]);

  // Show landing page immediately - don't wait for auth
  // (Auth redirect will happen in useEffect once ready)
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  return (
    <Container style={styles.container}>
      <ScrollFix />
      <HeroPhones />
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
