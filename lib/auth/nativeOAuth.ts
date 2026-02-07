/**
 * Native OAuth Service
 *
 * Handles Google and Apple Sign-In for native mobile platforms.
 * Uses native SDKs to get ID tokens, then exchanges with Supabase via signInWithIdToken.
 */

import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';

// Lazy-loaded modules (only imported when needed)
let GoogleSignin: typeof import('@react-native-google-signin/google-signin').GoogleSignin | null = null;
let AppleAuthentication: typeof import('expo-apple-authentication') | null = null;

/**
 * Configure and get the Google Sign-In instance
 */
const getGoogleSignIn = async () => {
  if (!GoogleSignin) {
    const module = await import('@react-native-google-signin/google-signin');
    GoogleSignin = module.GoogleSignin;

    // Configure Google Sign-In with client IDs
    GoogleSignin.configure({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Required for ID token
      offlineAccess: false,
    });
  }
  return GoogleSignin;
};

/**
 * Get the Apple Authentication module (iOS only)
 */
const getAppleAuth = async () => {
  if (Platform.OS !== 'ios') return null;
  if (!AppleAuthentication) {
    AppleAuthentication = await import('expo-apple-authentication');
  }
  return AppleAuthentication;
};

/**
 * Check if Apple Sign-In is available on this device
 */
export const isAppleSignInAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    const Apple = await getAppleAuth();
    return Apple?.isAvailableAsync() ?? false;
  } catch {
    return false;
  }
};

/**
 * Native Google Sign-In
 *
 * Uses @react-native-google-signin to show native Google Sign-In UI,
 * then exchanges the ID token with Supabase.
 */
export const nativeGoogleSignIn = async () => {
  const Google = await getGoogleSignIn();
  if (!Google) {
    throw new Error('Google Sign-In not available');
  }

  // Check for Play Services (Android) or general availability
  await Google.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Show native Google Sign-In UI
  const response = await Google.signIn();

  if (response.type === 'cancelled') {
    throw new Error('Google sign-in was cancelled');
  }

  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('No ID token returned from Google Sign-In');
  }

  // Exchange the ID token with Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    console.error('[NativeOAuth] Supabase signInWithIdToken failed:', error);
    throw error;
  }

  return data;
};

/**
 * Native Apple Sign-In (iOS only)
 *
 * Uses expo-apple-authentication to show native Apple Sign-In UI,
 * then exchanges the identity token with Supabase.
 */
export const nativeAppleSignIn = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  const Apple = await getAppleAuth();
  if (!Apple) {
    throw new Error('Apple Authentication not available');
  }

  let credential;
  try {
    // Show native Apple Sign-In UI
    credential = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope.FULL_NAME,
        Apple.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (appleError: any) {
    // Handle expo-apple-authentication specific error codes
    console.error('[NativeOAuth] Apple signInAsync failed:', appleError?.code, appleError?.message);

    // Preserve the error code for better error handling upstream
    const enhancedError = new Error(appleError?.message || 'Apple Sign-In failed');
    (enhancedError as any).code = appleError?.code || 'ERR_UNKNOWN';
    (enhancedError as any).originalError = appleError;
    throw enhancedError;
  }

  if (!credential.identityToken) {
    throw new Error('No identity token returned from Apple Sign-In');
  }

  // Exchange the identity token with Supabase
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    console.error('[NativeOAuth] Supabase signInWithIdToken failed:', error);
    throw error;
  }

  return data;
};

/**
 * Sign out from native OAuth providers
 * Call this when signing out of the app to clear provider sessions
 */
export const signOutFromNativeProviders = async () => {
  try {
    if (GoogleSignin) {
      // Just attempt to sign out - will be a no-op if not signed in
      await GoogleSignin.signOut();
    }
  } catch (error) {
    // Ignore errors - user may not be signed in with Google
    console.warn('[NativeOAuth] Error signing out from Google:', error);
  }
  // Apple Sign-In doesn't require explicit sign-out
};
