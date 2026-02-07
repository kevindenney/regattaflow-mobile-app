/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import { HeroPhones } from '@/components/landing/HeroPhones';
import { LandingNav } from '@/components/landing/LandingNav';
import { ScrollFix } from '@/components/landing/ScrollFix';
import { DashboardSkeleton } from '@/components/ui/loading';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';
import { useAuth } from '@/providers/AuthProvider';
import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { hasPersistedSessionHint, hasPersistedSessionHintAsync } from '@/services/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingPage() {
  const { signedIn, ready, userProfile, loading, isGuest, state, enterGuestMode } = useAuth();
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

    // Guest mode: redirect to races tab
    if ((isGuest || state === 'guest') && !bypassRedirect) {
      setIsRedirecting(true);
      router.replace('/(tabs)/races');
      return;
    }

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
    } else if (ready && !signedIn && !isGuest && !bypassRedirect) {
      // Non-logged-in users: show onboarding first (if not seen), then enter guest mode → /races
      OnboardingStateService.hasSeenOnboarding().then((hasSeen) => {
        if (hasSeen) {
          // Returning user who has seen onboarding - enter guest mode directly
          enterGuestMode();
        } else {
          // New user - show onboarding flow first
          setIsRedirecting(true);
          router.replace('/onboarding');
        }
      });
    } else if (ready && !signedIn && !isGuest && showSkeleton) {
      // Session hint was wrong (expired/invalid token) - show landing page
      setShowSkeleton(false);
    }
  }, [signedIn, ready, userProfile, loading, isRedirecting, bypassRedirect, showSkeleton, isGuest, state, enterGuestMode]);

  // Show skeleton while auth is loading, for returning users, or during redirect
  // This prevents flash of landing page before auto-entering guest mode
  const willAutoEnterGuest = ready && !signedIn && !isGuest && !bypassRedirect;
  if ((!ready || showSkeleton || signedIn || isRedirecting || willAutoEnterGuest) && !bypassRedirect) {
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
