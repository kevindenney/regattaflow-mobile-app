/**
 * Demo Mode Utilities
 *
 * FIX 4: Centralized detection of demo/development mode for graceful degradation.
 * Checks API keys and environment to determine if services should use fallbacks.
 */

import Constants from 'expo-constants';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DemoMode');

// Cache the demo mode status to avoid repeated checks
let cachedDemoMode: boolean | null = null;
let cachedMissingServices: string[] | null = null;

/**
 * API key environment variable names and their display labels
 */
const API_KEY_CONFIG = {
  anthropic: {
    envKey: 'EXPO_PUBLIC_ANTHROPIC_API_KEY',
    label: 'Anthropic Claude',
    required: false, // Core AI features
  },
  stormglass: {
    envKey: 'EXPO_PUBLIC_STORMGLASS_API_KEY',
    label: 'StormGlass Weather',
    required: false, // Weather data
  },
  googleMaps: {
    envKey: 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    label: 'Google Maps',
    required: false, // Map rendering
  },
  supabase: {
    envKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    label: 'Supabase',
    required: true, // Database access
  },
} as const;

/**
 * Check if a specific API key is configured and valid
 */
export function isApiKeyConfigured(service: keyof typeof API_KEY_CONFIG): boolean {
  const config = API_KEY_CONFIG[service];
  const key = process.env[config.envKey];

  // Check for missing, placeholder, or empty keys
  if (!key || key === 'placeholder' || key === '' || key === 'undefined') {
    return false;
  }

  return true;
}

/**
 * Get list of services running in demo/mock mode
 */
export function getMissingServices(): string[] {
  if (cachedMissingServices !== null) {
    return cachedMissingServices;
  }

  const missing: string[] = [];

  for (const [service, config] of Object.entries(API_KEY_CONFIG)) {
    if (!isApiKeyConfigured(service as keyof typeof API_KEY_CONFIG)) {
      missing.push(config.label);
    }
  }

  cachedMissingServices = missing;
  return missing;
}

/**
 * Check if the app is running in demo mode
 * Demo mode is active when critical API keys are missing
 *
 * @returns true if app should show demo/fallback indicators
 */
export function isDemoMode(): boolean {
  if (cachedDemoMode !== null) {
    return cachedDemoMode;
  }

  // Check if Anthropic API key is missing (main AI features)
  const hasAnthropicKey = isApiKeyConfigured('anthropic');

  // Also check expo config for API keys (some may be in app.config.js)
  const configExtra =
    Constants.expoConfig?.extra ||
    // @ts-ignore - manifest is only available in classic builds
    Constants.manifest?.extra ||
    // @ts-ignore - manifest2 exists in Expo Go / EAS builds
    Constants.manifest2?.extra ||
    {};

  const hasConfigAnthropicKey = Boolean(
    configExtra?.anthropicApiKey &&
    configExtra.anthropicApiKey !== 'placeholder'
  );

  // Demo mode if no valid Anthropic key from either source
  const inDemoMode = !hasAnthropicKey && !hasConfigAnthropicKey;

  if (inDemoMode) {
    logger.debug('App running in demo mode', {
      missingServices: getMissingServices(),
    });
  }

  cachedDemoMode = inDemoMode;
  return inDemoMode;
}

/**
 * Check if a specific service is available
 */
export function isServiceAvailable(service: keyof typeof API_KEY_CONFIG): boolean {
  return isApiKeyConfigured(service);
}

/**
 * Get demo mode status with details for UI display
 */
export function getDemoModeStatus(): {
  isDemoMode: boolean;
  missingServices: string[];
  message: string;
} {
  const demoMode = isDemoMode();
  const missing = getMissingServices();

  let message = '';
  if (demoMode) {
    if (missing.length === 0) {
      message = 'Running in demo mode';
    } else if (missing.length === 1) {
      message = `${missing[0]} not configured - using mock data`;
    } else {
      message = `${missing.length} services not configured - using mock data`;
    }
  }

  return {
    isDemoMode: demoMode,
    missingServices: missing,
    message,
  };
}

/**
 * Clear cached demo mode status (useful for testing or after config changes)
 */
export function clearDemoModeCache(): void {
  cachedDemoMode = null;
  cachedMissingServices = null;
}

/**
 * Check specifically if weather services are available
 */
export function isWeatherServiceAvailable(): boolean {
  // Weather can work with Open-Meteo (free) even without StormGlass
  // So we don't consider missing StormGlass as demo mode for weather
  return true;
}

/**
 * Check specifically if AI services are available
 */
export function isAIServiceAvailable(): boolean {
  return isApiKeyConfigured('anthropic');
}
