/**
 * OAuth Authentication Service
 * Marine-grade social authentication for professional sailing platform
 * Supports Google and Apple OAuth with Expo AuthSession
 */

// @ts-nocheck

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

// WebBrowser.maybeCompleteAuthSession() is required for Expo AuthSession to work properly
WebBrowser.maybeCompleteAuthSession();

interface OAuthProvider {
  name: 'google' | 'apple';
  displayName: string;
  icon: string;
}

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  additionalParameters?: Record<string, string>;
}

/**
 * OAuth provider configurations
 */
const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    name: 'google',
    displayName: 'Google',
    icon: '🌊', // Marine-themed icon placeholder
  },
  apple: {
    name: 'apple',
    displayName: 'Apple',
    icon: '🧭', // Navigation-themed icon placeholder
  },
};

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
        clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'io.regattaflow.app',
        redirectUri,
        scopes: ['name', 'email'],
      };

    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
};

/**
 * Google OAuth Authentication
 * Professional-grade authentication for sailing professionals
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const config = getOAuthConfig('google');

    const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');

    const request = new AuthSession.AuthRequest({
      clientId: config.clientId,
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      responseType: AuthSession.ResponseType.Code,
      additionalParameters: config.additionalParameters,
    });

    const result = await request.promptAsync(discovery, {
      useProxy: Platform.OS === 'web',
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
  } catch (error) {

    throw error;
  }
};

/**
 * Apple OAuth Authentication
 * Native Apple authentication for iOS users
 */
export const signInWithApple = async (): Promise<void> => {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const config = getOAuthConfig('apple');

    const discovery = await AuthSession.fetchDiscoveryAsync('https://appleid.apple.com');

    const request = new AuthSession.AuthRequest({
      clientId: config.clientId,
      scopes: config.scopes,
      redirectUri: config.redirectUri,
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await request.promptAsync(discovery, {
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

    throw error;
  }
};

/**
 * Get available OAuth providers based on platform
 */
export const getAvailableProviders = (): OAuthProvider[] => {
  const providers = [OAUTH_PROVIDERS.google];

  // Apple Sign-In is only available on iOS
  if (Platform.OS === 'ios') {
    providers.push(OAUTH_PROVIDERS.apple);
  }

  return providers;
};

/**
 * Check if OAuth is properly configured
 */
export const isOAuthConfigured = (provider: string): boolean => {
  try {
    const config = getOAuthConfig(provider);
    return !!config.clientId;
  } catch {
    return false;
  }
};

/**
 * Deep linking handler for OAuth callbacks
 * Handles OAuth redirects for maritime app navigation
 */
export const handleOAuthRedirect = async (url: string): Promise<boolean> => {
  try {

    // Parse the redirect URL
    const { hostname, pathname, searchParams } = new URL(url);

    if (hostname === 'auth' || pathname.includes('auth')) {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (code) {

        // The OAuth flow will be completed by the auth session
        return true;
      }
    }

    return false;
  } catch (error) {

    return false;
  }
};

export default {
  signInWithGoogle,
  signInWithApple,
  getAvailableProviders,
  isOAuthConfigured,
  handleOAuthRedirect,
};
