/**
 * Biometric Authentication Service
 * Marine-grade biometric security for professional sailing platform
 * Supports Face ID, Touch ID, and device-specific biometric authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('Biometric');

/**
 * Web-compatible SecureStore wrapper
 * Falls back to localStorage on web platform
 */
const SecureStoreWrapper = {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(`secure_${key}`);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error('SecureStore getItem error:', error);
      return null;
    }
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(`secure_${key}`, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error('SecureStore setItem error:', error);
      throw error;
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(`secure_${key}`);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error('SecureStore deleteItem error:', error);
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
    logger.error('Error checking capabilities:', error);
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
    logger.error('Authentication error:', error);
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

    return {
      success: true,
      warning: Platform.OS === 'ios'
        ? 'RegattaFlow will use Face ID for secure access to your sailing data'
        : 'RegattaFlow will use biometric authentication for secure access',
    };
  } catch (error) {
    logger.error('Error enabling biometric auth:', error);
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

    return { success: true };
  } catch (error) {
    logger.error('Error disabling biometric auth:', error);
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
    const enabled = await SecureStoreWrapper.getItemAsync(BIOMETRIC_KEYS.ENABLED);
    return enabled === 'true';
  } catch (error) {
    logger.error('Error checking if biometric enabled:', error);
    return false;
  }
};

/**
 * Get stored biometric authentication token
 * Used for automatic sign-in after biometric verification
 */
export const getBiometricAuthToken = async (): Promise<string | null> => {
  try {
    const enabled = await isBiometricAuthEnabled();
    if (!enabled) {
      return null;
    }

    const token = await SecureStoreWrapper.getItemAsync(BIOMETRIC_KEYS.TOKEN);
    return token;
  } catch (error) {
    logger.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get stored biometric user ID
 */
export const getBiometricUserId = async (): Promise<string | null> => {
  try {
    const enabled = await isBiometricAuthEnabled();
    if (!enabled) {
      return null;
    }

    const userId = await SecureStoreWrapper.getItemAsync(BIOMETRIC_KEYS.USER_ID);
    return userId;
  } catch (error) {
    logger.error('Error getting user ID:', error);
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
    logger.error('Login error:', error);
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