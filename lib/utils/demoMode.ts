/**
 * Demo Mode Utilities
 *
 * FIX 4: Centralized detection of demo/development mode for graceful degradation.
 * Checks API keys and environment to determine if services should use fallbacks.
 */

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
    envKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    label: 'AI Edge Functions',
    required: false, // AI runs through secured edge functions
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
  let key: string | undefined;
  switch (service) {
    case 'anthropic':
      key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      break;
    case 'googleMaps':
      key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      break;
    case 'supabase':
      key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      break;
    default:
      key = undefined;
      break;
  }

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

  // Demo mode is determined by missing required services (currently Supabase).
  const missingRequiredServices = Object.entries(API_KEY_CONFIG).filter(
    ([service, config]) =>
      config.required && !isApiKeyConfigured(service as keyof typeof API_KEY_CONFIG)
  );
  const inDemoMode = missingRequiredServices.length > 0;

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
  // Weather works with Open-Meteo (free), always available
  return true;
}

/**
 * Check specifically if AI services are available
 */
export function isAIServiceAvailable(): boolean {
  // AI runs through Supabase edge functions; availability depends on Supabase config.
  return isApiKeyConfigured('supabase');
}
