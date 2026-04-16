/**
 * BetterAt — Logo-only public page.
 * Signed-in users are redirected to their dashboard.
 * Everyone else sees just the logo.
 * Login is available at /(auth)/login for those who know the URL.
 */

import { BetterAtLogo } from '@/components/BetterAtLogo';
import { DashboardSkeleton } from '@/components/ui/loading';
import { getLastTabRoute } from '@/lib/utils/userTypeRouting';
import { useAuth } from '@/providers/AuthProvider';
import { hasPersistedSessionHint, hasPersistedSessionHintAsync } from '@/services/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function LandingPage() {
  const { signedIn, ready, userProfile, loading, isGuest, state } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(() => hasPersistedSessionHint());

  const isNative = Platform.OS !== 'web';

  // Native: always redirect (to dashboard or login)
  useEffect(() => {
    if (!(isNative && ready && !loading && !isRedirecting)) return;

    setIsRedirecting(true);
    if (signedIn) {
      router.replace(getLastTabRoute(userProfile?.user_type ?? null));
    } else {
      router.replace('/(auth)/login');
    }
  }, [isNative, ready, loading, isRedirecting, signedIn, userProfile]);

  // Web: check for persisted session hint
  useEffect(() => {
    if (isNative || showSkeleton) return;
    hasPersistedSessionHintAsync().then((hasSession) => {
      if (hasSession) setShowSkeleton(true);
    });
  }, [isNative, showSkeleton]);

  // Web: redirect signed-in users to dashboard
  useEffect(() => {
    if (isNative || !ready || loading || isRedirecting) return;

    if (signedIn) {
      setIsRedirecting(true);
      router.replace(getLastTabRoute(userProfile?.user_type ?? null));
    } else if (showSkeleton) {
      // Session hint was stale — stop showing skeleton, show logo
      setShowSkeleton(false);
    }
  }, [isNative, signedIn, ready, userProfile, loading, isRedirecting, showSkeleton]);

  // Native: skeleton while redirecting
  if (isNative) {
    return <DashboardSkeleton />;
  }

  // Web: skeleton while checking auth or redirecting
  if (!ready || showSkeleton || signedIn || isRedirecting) {
    return <DashboardSkeleton />;
  }

  // Public page: just the logo
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <BetterAtLogo size={72} />
        <Text style={styles.wordmark}>BetterAt</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh' as any,
  },
  centered: {
    alignItems: 'center',
    gap: 16,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
});
