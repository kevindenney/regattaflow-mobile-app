/**
 * OAuth Hook for RegattaFlow
 * Provides Google and Apple authentication with proper React hooks integration
 */

import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

// WebBrowser.maybeCompleteAuthSession() is required for Expo AuthSession to work properly
WebBrowser.maybeCompleteAuthSession();

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  additionalParameters?: Record<string, string>;
}

/**
 * OAuth configuration for each provider
 */
const getOAuthConfig = (provider: string): OAuthConfig => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'regattaflow',
    path: 'auth',
  });

  switch (provider) {
    case 'google':
      return {
        clientId: Platform.select({
          ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
          android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
          default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
        }),
        redirectUri,
        scopes: ['openid', 'profile', 'email'],
        additionalParameters: {
          prompt: 'select_account',
        },
      };

    case 'apple':
      return {
        clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'regattaflow.app',
        redirectUri,
        scopes: ['name', 'email'],
      };

    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
};

/**
 * Google OAuth Hook
 */
export const useGoogleAuth = () => {
  const config = getOAuthConfig('google');
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      additionalParameters: config.additionalParameters,
    },
    discovery
  );

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log('🔵 [OAUTH] ========================================');
      console.log('🔵 [OAUTH] Starting Google sign-in flow');
      console.log('🔍 [OAUTH] Platform:', Platform.OS);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('🔍 [OAUTH] Current URL:', window.location.href);
      }
      console.log('🔍 [OAUTH] Environment variables check:', {
        GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        supabaseKeyLength: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        currentPlatform: Platform.OS,
        currentClientId: config.clientId,
        redirectUri: config.redirectUri
      });

      // Validate critical environment variables
      if (!config.clientId) {
        console.error('🔴 [OAUTH] Missing Google Client ID for platform:', Platform.OS);
        throw new Error(`Missing Google Client ID for ${Platform.OS} platform`);
      }

      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
        console.error('🔴 [OAUTH] Invalid Supabase URL configuration');
        throw new Error('Supabase URL not properly configured');
      }

      if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'placeholder-key') {
        console.error('🔴 [OAUTH] Invalid Supabase Anon Key configuration');
        throw new Error('Supabase Anon Key not properly configured');
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const redirectUrl = `${window.location.origin}/callback`;
        console.log('🔍 [OAUTH] Configured redirect URL:', redirectUrl);
        console.log('🔍 [OAUTH] Window origin:', window.location.origin);
        console.log('🔍 [OAUTH] Full callback URL:', `${window.location.origin}/callback`);

        // Log the Supabase client configuration
        console.log('🔍 [OAUTH] Supabase client URL:', supabase.supabaseUrl);
        console.log('🔍 [OAUTH] Initiating OAuth with provider: google');

        // For web, use Supabase's direct OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        console.log('🔍 [OAUTH] Supabase OAuth response:', {
          data,
          error,
          hasProvider: data?.provider,
          hasUrl: data?.url,
          timestamp: new Date().toISOString()
        });

        if (error) {
          console.error('🔴 [OAUTH] Supabase OAuth error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            name: error.name,
            stack: error.stack,
            fullError: error,
            timestamp: new Date().toISOString(),
            supabaseProjectUrl: supabase.supabaseUrl,
            redirectUrlUsed: redirectUrl
          });

          // Log specific OAuth configuration hints
          if (error.message?.includes('client')) {
            console.error('🔴 [OAUTH] CLIENT ERROR - Check Google Client ID/Secret in Supabase dashboard');
            console.error('🔴 [OAUTH] Required: Client Secret must be set in Supabase > Authentication > Providers > Google');
          }

          if (error.message?.includes('redirect')) {
            console.error('🔴 [OAUTH] REDIRECT ERROR - Check authorized redirect URIs in Google Console');
            console.error('🔴 [OAUTH] Expected redirect URI:', redirectUrl);
          }

          if (error.message?.includes('scope') || error.message?.includes('access')) {
            console.error('🔴 [OAUTH] SCOPE ERROR - Check OAuth scopes in Google Console');
          }

          throw error;
        }

        if (data?.url) {
          console.log('🔍 [OAUTH] OAuth URL generated:', data.url);
          console.log('🔍 [OAUTH] Redirecting to OAuth provider...');
        }

        console.log('✅ [OAUTH] OAuth initiated successfully');
        console.log('🔵 [OAUTH] ========================================');
        return data;
      } else {
        // For mobile, use the existing Expo AuthSession flow
        if (!request) {
          throw new Error('Failed to create OAuth request');
        }

        const result = await promptAsync({
          useProxy: false,
          showInRecents: true,
        });

        if (result.type === 'success') {
          const { code } = result.params;

          if (!code) {
            throw new Error('No authorization code received');
          }

          // Exchange code for session with Supabase
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: config.redirectUri,
              queryParams: {
                code,
              },
            },
          });

          if (error) {
            throw error;
          }

          return data;
        } else if (result.type === 'error') {
          throw new Error(result.error?.message || 'OAuth authentication failed');
        } else {
          throw new Error('OAuth authentication was cancelled');
        }
      }
    } catch (error) {
      console.error('🔴 [OAUTH] Google sign-in error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    request,
    response,
  };
};

/**
 * Apple OAuth Hook
 */
export const useAppleAuth = () => {
  const config = getOAuthConfig('apple');
  const discovery = AuthSession.useAutoDiscovery('https://appleid.apple.com');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: config.clientId,
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  const signInWithApple = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // For web, use Supabase's direct OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${window.location.origin}/callback`,
          },
        });

        if (error) {
          throw error;
        }

        return data;
      }

      if (!request) {
        throw new Error('Failed to create Apple OAuth request');
      }

      const result = await promptAsync({
        useProxy: false, // Apple requires native flow
        showInRecents: true,
      });

      if (result.type === 'success') {
        const { code, id_token } = result.params;

        if (!code && !id_token) {
          throw new Error('No authorization code or ID token received');
        }

        // Exchange with Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: config.redirectUri,
            queryParams: {
              code: code || id_token,
            },
          },
        });

        if (error) {
          throw error;
        }

        return data;
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Apple authentication failed');
      } else {
        throw new Error('Apple authentication was cancelled');
      }
    } catch (error) {
      console.error('🔴 [OAUTH] Apple sign-in error:', error);
      throw error;
    }
  };

  return {
    signInWithApple,
    request,
    response,
  };
};