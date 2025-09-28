import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/src/services/supabase';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';

export default function AuthCallbackScreen() {
  useEffect(() => {
    let cancelled = false;

    const handleAuthCallback = async () => {
      console.log('🔁 [CALLBACK] Starting single-shot callback handler');

      try {
        // 1) Clean the URL hash immediately to prevent re-triggers
        try {
          const cleanUrl = window.location.pathname + window.location.search;
          console.log('🧹 [CALLBACK] Cleaning URL from:', window.location.href, 'to:', cleanUrl);
          window.history.replaceState(null, '', cleanUrl);
        } catch (e) {
          console.warn('⚠️ [CALLBACK] URL cleanup failed:', e);
        }

        // 2) Check for session - let Supabase reconcile OAuth state
        console.log('🔍 [CALLBACK] Checking session state...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('⚠️ [CALLBACK] getSession error:', error);
        }

        console.log('ℹ️ [CALLBACK] Current session:', {
          hasSession: !!data?.session,
          userId: data?.session?.user?.id,
          email: data?.session?.user?.email
        });

        // 3) Watchdog: Give session up to 3 seconds to arrive if not present
        let session = data?.session;
        if (!session) {
          console.log('⏳ [CALLBACK] No immediate session, waiting up to 3s...');
          const deadline = Date.now() + 3000;

          while (!session && Date.now() < deadline && !cancelled) {
            await new Promise(r => setTimeout(r, 150));
            const sessionCheck = await supabase.auth.getSession();
            session = sessionCheck.data?.session;

            if (session) {
              console.log('✅ [CALLBACK] Session arrived during wait');
              break;
            }
          }
        }

        // 4) Always navigate away from callback - never block here on profile loading
        if (!cancelled) {
          console.log('🚀 [CALLBACK] Navigating away from callback, hasSession:', !!session);
          console.log('🔍 [CALLBACK] Target route: /(tabs)/dashboard');

          // Always go to dashboard - profile will load there
          router.replace('/(tabs)/dashboard');
        }

      } catch (error) {
        console.error('🔴 [CALLBACK] Callback error:', error);
        if (!cancelled) {
          router.replace('/(auth)/login?error=callback_failed');
        }
      }
    };

    // Small delay to ensure page is loaded
    setTimeout(handleAuthCallback, 100);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0066CC" />
      <ThemedText style={{ marginTop: 16 }}>Completing sign in...</ThemedText>
    </ThemedView>
  );
}