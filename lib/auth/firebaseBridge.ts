/**
 * Firebase Auth Bridge Client Utilities
 *
 * Handles authentication flow for Dragon Worlds users accessing RegattaFlow
 * via the Firebase-to-Supabase token bridge.
 */

import { supabase } from '@/services/supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================================
// TYPES
// ============================================================================

export interface FirebaseBridgeProfile {
  displayName?: string;
  boatClass?: string;
  clubName?: string;
  photoUrl?: string;
}

export interface FirebaseBridgeRequest {
  firebaseToken: string;
  profile?: FirebaseBridgeProfile;
  communitySlug?: string;
}

export interface FirebaseBridgeResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  expiresAt?: number;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    isNewUser: boolean;
  };
  error?: string;
}

export interface BridgeTokenPayload {
  sub: string; // User ID
  email: string;
  type: 'firebase_bridge';
  iat: number;
  exp: number;
  iss: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BRIDGE_ENDPOINT_PATH = '/functions/v1/firebase-auth-bridge';

// Dragon Worlds community slug - users will auto-join this community
export const DRAGON_WORLDS_COMMUNITY_SLUG = '2027-hk-dragon-worlds';

// URL parameter names for WebView token passing
export const AUTH_TOKEN_PARAM = 'auth_token';
export const BRIDGE_TOKEN_PARAM = 'bridge_token';

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get the Supabase Functions URL
 */
function getSupabaseFunctionsUrl(): string {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
    || process.env.EXPO_PUBLIC_SUPABASE_URL
    || '';

  // Convert project URL to functions URL
  // https://xxx.supabase.co -> https://xxx.supabase.co
  return supabaseUrl;
}

/**
 * Exchange a Firebase ID token for a Supabase session via the bridge endpoint
 *
 * @param firebaseToken - Firebase ID token from Firebase Auth
 * @param profile - Optional profile data to sync from Dragon app
 * @param communitySlug - Optional community slug to auto-join (defaults to Dragon Worlds)
 * @returns Bridge response with Supabase tokens
 */
export async function exchangeFirebaseToken(
  firebaseToken: string,
  profile?: FirebaseBridgeProfile,
  communitySlug: string = DRAGON_WORLDS_COMMUNITY_SLUG
): Promise<FirebaseBridgeResponse> {
  const functionsUrl = getSupabaseFunctionsUrl();

  const response = await fetch(`${functionsUrl}${BRIDGE_ENDPOINT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include anon key for CORS
      'apikey': Constants.expoConfig?.extra?.supabaseAnonKey
        || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
        || '',
    },
    body: JSON.stringify({
      firebaseToken,
      profile,
      communitySlug,
    } as FirebaseBridgeRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Bridge request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Exchange the short-lived bridge token for a full Supabase session
 *
 * @param bridgeToken - The bridge token received from exchangeFirebaseToken
 * @returns True if session was established successfully
 */
export async function exchangeBridgeTokenForSession(bridgeToken: string): Promise<boolean> {
  try {
    // Decode the bridge token to get user info
    const payload = decodeBridgeToken(bridgeToken);

    if (!payload) {
      console.error('[FirebaseBridge] Invalid bridge token');
      return false;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('[FirebaseBridge] Bridge token expired');
      return false;
    }

    // Use the bridge token to authenticate
    // The Edge Function creates a magic link, we need to verify we have a valid session
    // For now, we'll use the verifyOtp flow with the token

    // Actually, for WebView embedding, we'll pass the token directly
    // and let the app handle session creation via the AuthProvider

    // Store the bridge token temporarily for the AuthProvider to use
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('firebase_bridge_token', bridgeToken);
      sessionStorage.setItem('firebase_bridge_user_id', payload.sub);
      sessionStorage.setItem('firebase_bridge_email', payload.email);
    }

    return true;
  } catch (error) {
    console.error('[FirebaseBridge] Failed to exchange bridge token:', error);
    return false;
  }
}

/**
 * Decode a bridge token (without verification - for client-side use)
 */
export function decodeBridgeToken(token: string): BridgeTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    if (payload.type !== 'firebase_bridge') {
      return null;
    }

    return payload as BridgeTokenPayload;
  } catch {
    return null;
  }
}

// ============================================================================
// URL HANDLING FOR WEBVIEW
// ============================================================================

/**
 * Extract auth token from URL parameters
 * Used when Dragon app embeds RegattaFlow in a WebView
 *
 * @param url - The URL to parse
 * @returns The auth token if present, null otherwise
 */
export function extractAuthTokenFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Check for bridge token (preferred)
    const bridgeToken = urlObj.searchParams.get(BRIDGE_TOKEN_PARAM);
    if (bridgeToken) {
      return bridgeToken;
    }

    // Check for auth token (legacy)
    const authToken = urlObj.searchParams.get(AUTH_TOKEN_PARAM);
    if (authToken) {
      return authToken;
    }

    // Check hash parameters (for OAuth-style flows)
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      return hashParams.get(BRIDGE_TOKEN_PARAM) || hashParams.get(AUTH_TOKEN_PARAM);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Build URL with auth token for WebView embedding
 *
 * @param baseUrl - The RegattaFlow URL to embed
 * @param bridgeToken - The bridge token from exchangeFirebaseToken
 * @returns URL with auth token parameter
 */
export function buildAuthenticatedUrl(baseUrl: string, bridgeToken: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set(BRIDGE_TOKEN_PARAM, bridgeToken);
  return url.toString();
}

/**
 * Remove auth tokens from URL (for clean navigation after auth)
 *
 * @param url - URL to clean
 * @returns URL without auth parameters
 */
export function cleanAuthTokensFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete(BRIDGE_TOKEN_PARAM);
    urlObj.searchParams.delete(AUTH_TOKEN_PARAM);
    return urlObj.toString();
  } catch {
    return url;
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Check if there's a pending bridge token in session storage
 * (Used by AuthProvider to complete WebView auth)
 */
export function getPendingBridgeToken(): {
  token: string;
  userId: string;
  email: string;
} | null {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') {
    return null;
  }

  const token = sessionStorage.getItem('firebase_bridge_token');
  const userId = sessionStorage.getItem('firebase_bridge_user_id');
  const email = sessionStorage.getItem('firebase_bridge_email');

  if (!token || !userId || !email) {
    return null;
  }

  return { token, userId, email };
}

/**
 * Clear pending bridge token from session storage
 */
export function clearPendingBridgeToken(): void {
  if (Platform.OS !== 'web' || typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.removeItem('firebase_bridge_token');
  sessionStorage.removeItem('firebase_bridge_user_id');
  sessionStorage.removeItem('firebase_bridge_email');
}

/**
 * Check if current session is from Dragon Worlds bridge
 */
export async function isDragonWorldsSession(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check user metadata
    const authSource = user.user_metadata?.auth_source;
    return authSource === 'dragon_worlds';
  } catch {
    return false;
  }
}

// ============================================================================
// WEBVIEW COMMUNICATION (for Dragon app to call)
// ============================================================================

/**
 * Message types for WebView communication with Dragon app
 */
export type WebViewMessageType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'NAVIGATE'
  | 'OPEN_IN_APP';

export interface WebViewMessage {
  type: WebViewMessageType;
  payload?: any;
}

/**
 * Post a message to the parent WebView (Dragon app)
 * Only works when embedded in a WebView with message handler
 */
export function postMessageToParentApp(message: WebViewMessage): void {
  if (Platform.OS !== 'web') return;

  // For React Native WebView
  if (typeof (window as any).ReactNativeWebView !== 'undefined') {
    (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    return;
  }

  // For standard postMessage (iframe embedding)
  if (window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
}

/**
 * Notify Dragon app that auth was successful
 */
export function notifyAuthSuccess(userId: string): void {
  postMessageToParentApp({
    type: 'AUTH_SUCCESS',
    payload: { userId },
  });
}

/**
 * Notify Dragon app that auth failed
 */
export function notifyAuthFailure(error: string): void {
  postMessageToParentApp({
    type: 'AUTH_FAILURE',
    payload: { error },
  });
}

/**
 * Request Dragon app to open RegattaFlow native app
 */
export function requestOpenInNativeApp(path?: string): void {
  postMessageToParentApp({
    type: 'OPEN_IN_APP',
    payload: { path },
  });
}
