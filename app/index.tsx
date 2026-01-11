/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';
import { HeroPhones } from '@/components/landing/HeroPhones';
import { LandingNav } from '@/components/landing/LandingNav';
import { ScrollFix } from '@/components/landing/ScrollFix';
import { hasPersistedSessionHint, hasPersistedSessionHintAsync } from '@/services/supabase';
import { DashboardSkeleton } from '@/components/ui/loading';

export default function LandingPage() {
  const { signedIn, ready, userProfile, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(() => hasPersistedSessionHint());
  const searchParams = useLocalSearchParams<{ view?: string }>();

  // Allow authenticated users to view landing page if they explicitly request it
  const bypassRedirect = searchParams.view === 'landing';

  // Check storage on mount (for native async check)
  useEffect(() => {
    if (bypassRedirect || showSkeleton) return;

    hasPersistedSessionHintAsync().then((hasSession) => {
      if (hasSession) setShowSkeleton(true);
    });
  }, [bypassRedirect, showSkeleton]);

  useEffect(() => {
    // Wait for auth to be ready AND not loading profile
    if (!ready || loading || isRedirecting) return;

    // Only redirect if signed in AND profile is loaded (or explicitly null after loading)
    // BUT allow bypass if user explicitly wants to see landing page
    if (signedIn && !bypassRedirect) {
      // If profile is still being fetched, wait for it
      // userProfile will be populated after signIn completes
      if (userProfile || (!loading && ready)) {
        setIsRedirecting(true);

        // Check if onboarding is needed
        const destination = getDashboardRoute(userProfile?.user_type ?? null);

        router.replace(destination);
      }
    } else if (ready && !signedIn && showSkeleton) {
      // Session hint was wrong (expired/invalid token) - show landing page
      setShowSkeleton(false);
    }
  }, [signedIn, ready, userProfile, loading, isRedirecting, bypassRedirect, showSkeleton]);

  // Show skeleton for returning users while auth loads
  if ((showSkeleton || signedIn) && !bypassRedirect) {
    return <DashboardSkeleton />;
  }

  // Show landing page for visitors
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle = Platform.OS === 'web'
    ? [styles.container, styles.webContainer]
    : styles.container;

  return (
    <Container style={containerStyle}>
      <ScrollFix />
      <LandingNav transparent={true} sticky={true} />
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
