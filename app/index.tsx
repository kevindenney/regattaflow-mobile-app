/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';
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
        const destination = getDashboardRoute(userProfile?.user_type ?? null);

        router.replace(destination);
      }
    }
  }, [signedIn, ready, userProfile, loading, isRedirecting]);

  // Show landing page immediately - don't wait for auth
  // (Auth redirect will happen in useEffect once ready)
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle = Platform.OS === 'web'
    ? [styles.container, styles.webContainer]
    : styles.container;

  return (
    <Container style={containerStyle}>
      <ScrollFix />
      <HeroPhones />
    </Container>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  webContainer: ViewStyle;
  loadingContainer: ViewStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webContainer: {
    minHeight: '100vh' as any,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
