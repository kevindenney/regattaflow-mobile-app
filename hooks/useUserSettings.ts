/**
 * useUserSettings Hook
 *
 * Manages global user settings for app features like learning tips.
 * Uses AsyncStorage for persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useUserSettings');

const STORAGE_KEY = 'user_settings';

/** Unit system for distance and speed measurements */
export type UnitSystem = 'nautical' | 'metric' | 'imperial';

/** Display labels for unit systems */
export const UNIT_LABELS: Record<UnitSystem, string> = {
  nautical: 'Nautical (nm, kts)',
  metric: 'Metric (km, km/h)',
  imperial: 'Imperial (mi, mph)',
};

/** Short display labels for inline display */
export const UNIT_SHORT_LABELS: Record<UnitSystem, string> = {
  nautical: 'Nautical',
  metric: 'Metric',
  imperial: 'Imperial',
};

export interface UserSettings {
  /** Show quick tips on checklist items */
  showQuickTips: boolean;
  /** Show learning links to academy content */
  showLearningLinks: boolean;
  /** Unit system for distance and speed measurements */
  units: UnitSystem;
}

const DEFAULT_SETTINGS: UserSettings = {
  showQuickTips: true,
  showLearningLinks: true,
  units: 'nautical',
};

export interface UseUserSettingsReturn {
  settings: UserSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
}

/**
 * Hook to manage global user settings
 */
export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load settings from AsyncStorage
   */
  const loadSettings = useCallback(async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserSettings>;
        // Merge with defaults to handle new settings added over time
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      logger.warn('Failed to load user settings', { error });
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save settings to AsyncStorage
   */
  const saveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      logger.warn('Failed to save user settings', { error });
    }
  }, []);

  /**
   * Update a single setting
   */
  const updateSetting = useCallback(
    async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  /**
   * Reset all settings to defaults
   */
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
  };
}

export default useUserSettings;
