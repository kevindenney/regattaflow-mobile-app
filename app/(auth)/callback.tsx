import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/services/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (Platform.OS === 'web') {
          // Handle OAuth callback on web
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const tokenType = hashParams.get('token_type');

          if (accessToken && refreshToken) {
            // Set the session with tokens from OAuth callback
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              router.replace('/login?error=oauth_callback_failed');
              return;
            }

            // Check if user profile exists
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (!profile) {
              // Create user profile for OAuth users
              await supabase
                .from('users')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'Sailor',
                  user_type: 'sailor', // Default for OAuth signups
                  onboarding_completed: false,
                  subscription_status: 'trialing',
                  subscription_tier: 'free',
                });
            }

            // Redirect to onboarding or main app
            if (!profile?.onboarding_completed) {
              router.replace('/(auth)/onboarding');
            } else {
              router.replace('/(tabs)/map');
            }
          } else {
            // No tokens found, redirect to login with error
            router.replace('/login?error=oauth_no_tokens');
          }
        } else {
          // Handle mobile OAuth callback (if needed)
          router.replace('/(tabs)/map');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login?error=oauth_callback_error');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0f172a'
    }}>
      <ActivityIndicator size="large" color="#0ea5e9" />
      <ThemedText style={{
        marginTop: 16,
        color: '#cbd5e1',
        fontSize: 16
      }}>
        Completing authentication...
      </ThemedText>
    </View>
  );
}