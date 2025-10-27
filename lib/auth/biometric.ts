/**
 * Biometric Authentication Service
 * Marine-grade biometric security for professional sailing platform
 * Supports Face ID, Touch ID, and device-specific biometric authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';

// Platform compatibility debugging
console.log('🔍 [BIOMETRIC] Module loading - Platform:', Platform.OS);
console.log('🔍 [BIOMETRIC] SecureStore methods available:', Object.keys(SecureStore));
console.log('🔍 [BIOMETRIC] LocalAuthentication methods available:', Object.keys(LocalAuthentication));

/**
 * Web-compatible SecureStore wrapper
 * Falls back to localStorage on web platform
 */
const SecureStoreWrapper = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web platform
        console.log('🌐 [BIOMETRIC] Using localStorage fallback for key:', key);
        return localStorage.getItem(`secure_${key}`);
      }

      // Use native SecureStore for mobile platforms
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('🔴 [BIOMETRIC] SecureStore getItem error:', error);
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web platform
        console.log('🌐 [BIOMETRIC] Using localStorage fallback to set key:', key);
        localStorage.setItem(`secure_${key}`, value);
        return;
      }

      // Use native SecureStore for mobile platforms
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('🔴 [BIOMETRIC] SecureStore setItem error:', error);
      throw error;
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web platform
        console.log('🌐 [BIOMETRIC] Using localStorage fallback to delete key:', key);
        localStorage.removeItem(`secure_${key}`);
        return;
      }

      // Use native SecureStore for mobile platforms
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('🔴 [BIOMETRIC] SecureStore deleteItem error:', error);
      throw error;
    }
  }
};

interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  hasHardware: boolean;
  securityLevel: LocalAuthentication.SecurityLevel;
}

interface BiometricResult {
  success: boolean;
  error?: string;
  warning?: string;
}

/**
 * Key names for secure storage
 */
const BIOMETRIC_KEYS = {
  ENABLED: 'biometric_auth_enabled',
  TOKEN: 'biometric_auth_token',
  USER_ID: 'biometric_user_id',
} as const;

/**
 * Check device biometric capabilities
 * Essential for marine environment where gloves and wet conditions are common
 */
export const getBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    return {
      isAvailable: hasHardware && isEnrolled,
      isEnrolled,
      supportedTypes,
      hasHardware,
      securityLevel,
    };
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Error checking capabilities:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      supportedTypes: [],
      hasHardware: false,
      securityLevel: LocalAuthentication.SecurityLevel.NONE,
    };
  }
};

/**
 * Get user-friendly biometric type name
 */
export const getBiometricTypeName = (types: LocalAuthentication.AuthenticationType[]): string => {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris Recognition';
  }
  return 'Biometric';
};

/**
 * Authenticate user with biometrics
 * Optimized for marine environment with appropriate prompts
 */
export const authenticateWithBiometrics = async (): Promise<BiometricResult> => {
  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: capabilities.hasHardware
          ? 'No biometric data enrolled. Please set up biometric authentication in device settings.'
          : 'Biometric authentication is not available on this device.',
      };
    }

    const biometricTypeName = getBiometricTypeName(capabilities.supportedTypes);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `🌊 RegattaFlow Security`,
      subPromptMessage: `Use ${biometricTypeName} to access your sailing data securely`,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      requireConfirmation: Platform.OS === 'android', // Android best practice
    });

    if (result.success) {
      console.log('✅ [BIOMETRIC] Authentication successful');
      return { success: true };
    } else {
      const errorMessage = result.error === 'user_cancel'
        ? 'Authentication cancelled'
        : result.error === 'user_fallback'
        ? 'User selected fallback method'
        : `Authentication failed: ${result.error}`;

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Authentication error:', error);
    return {
      success: false,
      error: 'Biometric authentication encountered an error',
    };
  }
};

/**
 * Enable biometric authentication for user
 * Stores encrypted authentication token securely
 */
export const enableBiometricAuth = async (
  userId: string,
  authToken: string
): Promise<BiometricResult> => {
  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available',
      };
    }

    // First, authenticate to confirm user consent
    const authResult = await authenticateWithBiometrics();
    if (!authResult.success) {
      return authResult;
    }

    // Store biometric data securely
    await SecureStoreWrapper.setItemAsync(BIOMETRIC_KEYS.ENABLED, 'true');
    await SecureStoreWrapper.setItemAsync(BIOMETRIC_KEYS.USER_ID, userId);
    await SecureStoreWrapper.setItemAsync(BIOMETRIC_KEYS.TOKEN, authToken);

    console.log('✅ [BIOMETRIC] Biometric authentication enabled');

    return {
      success: true,
      warning: Platform.OS === 'ios'
        ? 'RegattaFlow will use Face ID for secure access to your sailing data'
        : 'RegattaFlow will use biometric authentication for secure access',
    };
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Error enabling biometric auth:', error);
    return {
      success: false,
      error: 'Failed to enable biometric authentication',
    };
  }
};

/**
 * Disable biometric authentication
 * Clears all stored biometric data
 */
export const disableBiometricAuth = async (): Promise<BiometricResult> => {
  try {
    // Clear all biometric data
    await SecureStoreWrapper.deleteItemAsync(BIOMETRIC_KEYS.ENABLED);
    await SecureStoreWrapper.deleteItemAsync(BIOMETRIC_KEYS.USER_ID);
    await SecureStoreWrapper.deleteItemAsync(BIOMETRIC_KEYS.TOKEN);

    console.log('✅ [BIOMETRIC] Biometric authentication disabled');

    return { success: true };
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Error disabling biometric auth:', error);
    return {
      success: false,
      error: 'Failed to disable biometric authentication',
    };
  }
};

/**
 * Check if biometric authentication is enabled
 */
export const isBiometricAuthEnabled = async (): Promise<boolean> => {
  try {
    console.log('🔍 [BIOMETRIC] Checking if enabled - Platform:', Platform.OS);

    const enabled = await SecureStoreWrapper.getItemAsync(BIOMETRIC_KEYS.ENABLED);
    console.log('✅ [BIOMETRIC] Successfully retrieved enabled status:', enabled);
    return enabled === 'true';
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Error checking if enabled:', error);
    console.error('🔴 [BIOMETRIC] Error details:', {
      name: error?.name,
      message: error?.message,
      platform: Platform.OS
    });
    return false;
  }
};

/**
 * Get stored biometric authentication token
 * Used for automatic sign-in after biometric verification
 */
export const getBiometricAuthToken = async (): Promise<string | null> => {
  try {
    console.log('🔍 [BIOMETRIC] Getting auth token - Platform:', Platform.OS);

    const enabled = await isBiometricAuthEnabled();
    if (!enabled) {
      console.log('🔍 [BIOMETRIC] Biometric auth not enabled, returning null');
      return null;
    }

    const token = await SecureStoreWrapper.getItemAsync(BIOMETRIC_KEYS.TOKEN);
    console.log('✅ [BIOMETRIC] Successfully retrieved token:', token ? 'EXISTS' : 'NULL');
    return token;
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Error getting auth token:', error);
    console.error('🔴 [BIOMETRIC] Token error details:', {
      name: error?.name,
      message: error?.message,
      platform: Platform.OS
    });
    return null;
  }
};

/**
 * Get stored biometric user ID
 */
export const getBiometricUserId = async (): Promise<string | null> => {
  try {
    console.log('🔍 [BIOMETRIC] Getting user ID - Platform:', Platform.OS);

    const enabled = await isBiometricAuthEnabled();
    if (!enabled) {
      console.log('🔍 [BIOMETRIC] Biometric auth not enabled for user ID');
      return null;
    }

    const userId = await SecureStoreWrapper.getItemAsync(BIOMETRIC_KEYS.USER_ID);
    console.log('✅ [BIOMETRIC] Successfully retrieved user ID:', userId ? 'EXISTS' : 'NULL');
    return userId;
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Error getting user ID:', error);
    console.error('🔴 [BIOMETRIC] User ID error details:', {
      name: error?.name,
      message: error?.message,
      platform: Platform.OS
    });
    return null;
  }
};

/**
 * Perform biometric login
 * Complete authentication flow with biometric verification
 */
export const biometricLogin = async (): Promise<{
  success: boolean;
  token?: string;
  userId?: string;
  error?: string;
}> => {
  try {
    const enabled = await isBiometricAuthEnabled();
    if (!enabled) {
      return {
        success: false,
        error: 'Biometric authentication is not enabled',
      };
    }

    // Authenticate with biometrics
    const authResult = await authenticateWithBiometrics();
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    // Get stored credentials
    const token = await getBiometricAuthToken();
    const userId = await getBiometricUserId();

    if (!token || !userId) {
      // Clear corrupted data
      await disableBiometricAuth();
      return {
        success: false,
        error: 'Biometric data is corrupted. Please re-enable biometric authentication.',
      };
    }

    return {
      success: true,
      token,
      userId,
    };
  } catch (error) {
    console.error('🔴 [BIOMETRIC] Login error:', error);
    return {
      success: false,
      error: 'Biometric login failed',
    };
  }
};

/**
 * Show biometric setup prompt
 * Marine-focused user experience for enabling biometric security
 */
export const showBiometricSetupPrompt = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const capabilities = getBiometricCapabilities();

    capabilities.then((caps) => {
      if (!caps.isAvailable) {
        resolve(false);
        return;
      }

      const biometricName = getBiometricTypeName(caps.supportedTypes);

      Alert.alert(
        '🌊 Secure Your Sailing Data',
        `Enable ${biometricName} for quick and secure access to RegattaFlow.\n\nPerfect for marine environments where you need fast access to race data.`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: `Enable ${biometricName}`,
            style: 'default',
            onPress: () => resolve(true),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  });
};

export default {
  getBiometricCapabilities,
  getBiometricTypeName,
  authenticateWithBiometrics,
  enableBiometricAuth,
  disableBiometricAuth,
  isBiometricAuthEnabled,
  getBiometricAuthToken,
  getBiometricUserId,
  biometricLogin,
  showBiometricSetupPrompt,
};