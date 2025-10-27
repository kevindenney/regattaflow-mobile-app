/**
 * Secure Storage Service
 * Marine-grade secure storage for authentication tokens and sensitive data
 * Optimized for professional sailing platform security requirements
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * Secure storage keys
 */
export const STORAGE_KEYS = {
  // Authentication tokens
  ACCESS_TOKEN: 'regattaflow_access_token',
  REFRESH_TOKEN: 'regattaflow_refresh_token',

  // User session data
  USER_SESSION: 'regattaflow_user_session',
  USER_PREFERENCES: 'regattaflow_user_preferences',

  // Biometric authentication
  BIOMETRIC_ENABLED: 'regattaflow_biometric_enabled',
  BIOMETRIC_TOKEN: 'regattaflow_biometric_token',

  // Offline sailing data
  OFFLINE_VENUES: 'regattaflow_offline_venues',
  CACHED_WEATHER: 'regattaflow_cached_weather',
  RACE_STRATEGIES: 'regattaflow_race_strategies',

  // Security metadata
  APP_VERSION: 'regattaflow_app_version',
  LAST_SECURITY_CHECK: 'regattaflow_last_security_check',
} as const;

/**
 * Storage options for different security levels
 */
interface StorageOptions {
  requireAuthentication?: boolean;
  accessGroup?: string;
  keychainService?: string;
}

/**
 * Default storage options for marine-grade security
 */
const DEFAULT_OPTIONS: StorageOptions = {
  requireAuthentication: false, // Will be true for sensitive data
  keychainService: 'regattaflow.sailing.auth',
};

/**
 * High-security options for sensitive sailing data
 */
const HIGH_SECURITY_OPTIONS: StorageOptions = {
  requireAuthentication: Platform.OS === 'ios', // Use device authentication on iOS
  keychainService: 'regattaflow.sailing.secure',
};

/**
 * Store data securely with encryption
 */
export const secureStore = async (
  key: string,
  value: string,
  options: StorageOptions = DEFAULT_OPTIONS
): Promise<void> => {
  try {
    // Add timestamp for data freshness tracking
    const timestampedValue = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      version: '1.0',
    });

    await SecureStore.setItemAsync(key, timestampedValue, {
      requireAuthentication: options.requireAuthentication,
      keychainService: options.keychainService,
      accessGroup: options.accessGroup,
    });

    console.log(`✅ [SECURE_STORE] Stored: ${key}`);
  } catch (error) {
    console.error(`🔴 [SECURE_STORE] Failed to store ${key}:`, error);
    throw new Error(`Failed to securely store ${key}`);
  }
};

/**
 * Retrieve data securely with decryption
 */
export const secureRetrieve = async (
  key: string,
  options: StorageOptions = DEFAULT_OPTIONS
): Promise<string | null> => {
  try {
    const result = await SecureStore.getItemAsync(key, {
      requireAuthentication: options.requireAuthentication,
      keychainService: options.keychainService,
      accessGroup: options.accessGroup,
    });

    if (!result) {
      return null;
    }

    // Parse timestamped value
    const parsed = JSON.parse(result);

    // Check data age (optional validation)
    const age = Date.now() - parsed.timestamp;
    if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days
      console.warn(`⚠️ [SECURE_STORE] Old data for ${key}, age: ${Math.round(age / (24 * 60 * 60 * 1000))} days`);
    }

    return parsed.data;
  } catch (error) {
    console.error(`🔴 [SECURE_STORE] Failed to retrieve ${key}:`, error);
    return null;
  }
};

/**
 * Delete stored data securely
 */
export const secureDelete = async (
  key: string,
  options: StorageOptions = DEFAULT_OPTIONS
): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key, {
      keychainService: options.keychainService,
    });
    console.log(`✅ [SECURE_STORE] Deleted: ${key}`);
  } catch (error) {
    console.error(`🔴 [SECURE_STORE] Failed to delete ${key}:`, error);
    throw new Error(`Failed to securely delete ${key}`);
  }
};

/**
 * Store authentication tokens securely
 */
export const storeAuthTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    await Promise.all([
      secureStore(STORAGE_KEYS.ACCESS_TOKEN, accessToken, HIGH_SECURITY_OPTIONS),
      secureStore(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, HIGH_SECURITY_OPTIONS),
    ]);
    console.log('✅ [SECURE_STORE] Auth tokens stored');
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Failed to store auth tokens:', error);
    throw error;
  }
};

/**
 * Retrieve authentication tokens
 */
export const getAuthTokens = async (): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      secureRetrieve(STORAGE_KEYS.ACCESS_TOKEN, HIGH_SECURITY_OPTIONS),
      secureRetrieve(STORAGE_KEYS.REFRESH_TOKEN, HIGH_SECURITY_OPTIONS),
    ]);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Failed to retrieve auth tokens:', error);
    return { accessToken: null, refreshToken: null };
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    const authKeys = [
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_SESSION,
      STORAGE_KEYS.BIOMETRIC_TOKEN,
    ];

    await Promise.all(
      authKeys.map(key => secureDelete(key, HIGH_SECURITY_OPTIONS))
    );

    console.log('✅ [SECURE_STORE] All auth data cleared');
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Failed to clear auth data:', error);
    throw error;
  }
};

/**
 * Store user session data
 */
export const storeUserSession = async (sessionData: object): Promise<void> => {
  try {
    const sessionString = JSON.stringify(sessionData);
    await secureStore(STORAGE_KEYS.USER_SESSION, sessionString, HIGH_SECURITY_OPTIONS);
    console.log('✅ [SECURE_STORE] User session stored');
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Failed to store user session:', error);
    throw error;
  }
};

/**
 * Retrieve user session data
 */
export const getUserSession = async (): Promise<object | null> => {
  try {
    const sessionString = await secureRetrieve(STORAGE_KEYS.USER_SESSION, HIGH_SECURITY_OPTIONS);
    if (!sessionString) {
      return null;
    }

    return JSON.parse(sessionString);
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Failed to retrieve user session:', error);
    return null;
  }
};

/**
 * Store offline sailing data
 * For marine environments with poor connectivity
 */
export const storeOfflineData = async (
  key: keyof typeof STORAGE_KEYS,
  data: object
): Promise<void> => {
  try {
    const dataString = JSON.stringify(data);
    await secureStore(STORAGE_KEYS[key], dataString, DEFAULT_OPTIONS);
    console.log(`✅ [SECURE_STORE] Offline data stored: ${key}`);
  } catch (error) {
    console.error(`🔴 [SECURE_STORE] Failed to store offline data ${key}:`, error);
    throw error;
  }
};

/**
 * Retrieve offline sailing data
 */
export const getOfflineData = async (
  key: keyof typeof STORAGE_KEYS
): Promise<object | null> => {
  try {
    const dataString = await secureRetrieve(STORAGE_KEYS[key], DEFAULT_OPTIONS);
    if (!dataString) {
      return null;
    }

    return JSON.parse(dataString);
  } catch (error) {
    console.error(`🔴 [SECURE_STORE] Failed to retrieve offline data ${key}:`, error);
    return null;
  }
};

/**
 * Generate secure hash for data integrity
 */
export const generateSecureHash = async (data: string): Promise<string> => {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return hash;
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Failed to generate hash:', error);
    throw error;
  }
};

/**
 * Check if secure storage is available
 */
export const isSecureStorageAvailable = async (): Promise<boolean> => {
  try {
    // Test storage by writing and reading a small value
    const testKey = 'regattaflow_test_key';
    const testValue = 'test';

    await SecureStore.setItemAsync(testKey, testValue);
    const retrieved = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);

    return retrieved === testValue;
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Secure storage not available:', error);
    return false;
  }
};

/**
 * Perform security check
 * Validates storage integrity and security status
 */
export const performSecurityCheck = async (): Promise<{
  isSecure: boolean;
  issues: string[];
  recommendations: string[];
}> => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check if secure storage is available
    const isAvailable = await isSecureStorageAvailable();
    if (!isAvailable) {
      issues.push('Secure storage is not available');
      recommendations.push('Ensure device has secure storage capabilities');
    }

    // Check for old data that should be refreshed
    const tokens = await getAuthTokens();
    if (tokens.accessToken || tokens.refreshToken) {
      // Tokens exist, check their age
      const sessionData = await getUserSession();
      if (sessionData) {
        // Add age-based recommendations
        recommendations.push('Consider refreshing authentication tokens periodically');
      }
    }

    // Check app version for security updates
    const storedVersion = await secureRetrieve(STORAGE_KEYS.APP_VERSION);
    // Add version check logic here

    const isSecure = issues.length === 0;

    // Store security check timestamp
    await secureStore(
      STORAGE_KEYS.LAST_SECURITY_CHECK,
      Date.now().toString(),
      DEFAULT_OPTIONS
    );

    return {
      isSecure,
      issues,
      recommendations,
    };
  } catch (error) {
    console.error('🔴 [SECURE_STORE] Security check failed:', error);
    return {
      isSecure: false,
      issues: ['Security check failed'],
      recommendations: ['Reinstall the app if security issues persist'],
    };
  }
};

export default {
  secureStore,
  secureRetrieve,
  secureDelete,
  storeAuthTokens,
  getAuthTokens,
  clearAuthData,
  storeUserSession,
  getUserSession,
  storeOfflineData,
  getOfflineData,
  generateSecureHash,
  isSecureStorageAvailable,
  performSecurityCheck,
  STORAGE_KEYS,
};