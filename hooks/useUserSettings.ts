/**
 * useUserSettings Hook
 *
 * Manages global user settings for app features like learning tips.
 * Uses AsyncStorage for persistence.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/lib/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/** Interest-aware default units — only sailing uses nautical */
const NAUTICAL_INTERESTS = new Set(['sail-racing', 'sailing']);

function getDefaultUnits(interestSlug?: string | null): UnitSystem {
  if (interestSlug && NAUTICAL_INTERESTS.has(interestSlug)) return 'nautical';
  return 'metric';
}

const DEFAULT_SETTINGS: UserSettings = {
  showQuickTips: true,
  showLearningLinks: true,
  units: 'metric',
};

export interface UseUserSettingsReturn {
  settings: UserSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
}

/**
 * Hook to manage global user settings
 * @param interestSlug - Optional current interest slug used to set smart defaults
 *                       (e.g., sailing → nautical units, everything else → metric)
 */
export function useUserSettings(interestSlug?: string | null): UseUserSettingsReturn {
  const defaultUnits = getDefaultUnits(interestSlug);
  const interestDefaults = { ...DEFAULT_SETTINGS, units: defaultUnits };
  const [settings, setSettings] = useState<UserSettings>(interestDefaults);
  const [isLoading, setIsLoading] = useState(true);
  const settingsRef = useRef<UserSettings>(interestDefaults);
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
    };
  }, []);

  /**
   * Load settings from AsyncStorage
   */
  const loadSettings = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === loadRunIdRef.current;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserSettings>;
        // Merge with defaults to handle new settings added over time
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        if (!canCommit()) return;
        setSettings(merged);
      } else {
        if (!canCommit()) return;
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      logger.warn('Failed to load user settings', { error });
      if (!canCommit()) return;
      setSettings(DEFAULT_SETTINGS);
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
    }
  }, []);

  /**
   * Save settings to AsyncStorage
   */
  const saveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
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
      const newSettings = { ...settingsRef.current, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [saveSettings]
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
    void loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
  };
}

export default useUserSettings;
