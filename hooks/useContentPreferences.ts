/**
 * useContentPreferences Hook
 *
 * Manages user preferences for race card content modules.
 * Uses local storage for immediate response with optional Supabase sync.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import type {
  ContentModulePreferences,
  ContentModuleId,
  RaceType,
  UseContentPreferencesReturn,
} from '@/types/raceCardContent';
import { DEFAULT_CONTENT_PREFERENCES } from '@/types/raceCardContent';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useContentPreferences');

const STORAGE_KEY_PREFIX = 'content_prefs_';
const DEBOUNCE_MS = 1000;

interface UseContentPreferencesOptions {
  /** Specific race ID (for per-race preferences) */
  raceId?: string;
  /** Race type (for type-level defaults when no raceId) */
  raceType?: RaceType;
  /** Enable Supabase sync (default: true) */
  enableSync?: boolean;
}

/**
 * Hook to manage content module preferences with local + cloud storage
 */
export function useContentPreferences({
  raceId,
  raceType,
  enableSync = true,
}: UseContentPreferencesOptions = {}): UseContentPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ContentModulePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Storage key based on race ID or race type
  const storageKey = raceId
    ? `${STORAGE_KEY_PREFIX}race_${raceId}`
    : raceType
      ? `${STORAGE_KEY_PREFIX}type_${raceType}`
      : `${STORAGE_KEY_PREFIX}default`;

  /**
   * Load preferences from local storage
   */
  const loadFromLocal = useCallback(async (): Promise<ContentModulePreferences | null> => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem(storageKey);

      if (stored) {
        const parsed = JSON.parse(stored) as ContentModulePreferences;
        return parsed;
      }

      return null;
    } catch (error) {
      logger.warn('Failed to load preferences from local storage', { error });
      return null;
    }
  }, [storageKey]);

  /**
   * Save preferences to local storage
   */
  const saveToLocal = useCallback(
    async (prefs: ContentModulePreferences): Promise<void> => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(storageKey, JSON.stringify(prefs));
        logger.debug('Saved preferences to local storage', { storageKey });
      } catch (error) {
        logger.warn('Failed to save preferences to local storage', { error });
      }
    },
    [storageKey]
  );

  /**
   * Load preferences from Supabase
   */
  const loadFromSupabase = useCallback(async (): Promise<ContentModulePreferences | null> => {
    if (!user?.id || !enableSync) return null;

    try {
      let query = supabase
        .from('user_content_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (raceId) {
        query = query.eq('race_id', raceId);
      } else if (raceType) {
        query = query.is('race_id', null).eq('race_type', raceType);
      } else {
        query = query.is('race_id', null).is('race_type', null);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code !== 'PGRST116') {
          // Not a "no rows" error
          logger.warn('Failed to load preferences from Supabase', { error });
        }
        return null;
      }

      if (data?.preferences) {
        return {
          userId: data.user_id,
          raceId: data.race_id,
          raceType: data.race_type,
          moduleOrder: data.preferences.moduleOrder || [],
          collapsedModules: data.preferences.collapsedModules || [],
          hiddenModules: data.preferences.hiddenModules || [],
          updatedAt: data.updated_at,
        };
      }

      return null;
    } catch (error) {
      logger.warn('Failed to load preferences from Supabase', { error });
      return null;
    }
  }, [user?.id, enableSync, raceId, raceType]);

  /**
   * Save preferences to Supabase (debounced)
   */
  const syncToSupabase = useCallback(
    async (prefs: ContentModulePreferences): Promise<void> => {
      if (!user?.id || !enableSync) return;

      try {
        const payload = {
          user_id: user.id,
          race_id: raceId || null,
          race_type: raceId ? null : raceType || null,
          preferences: {
            moduleOrder: prefs.moduleOrder,
            collapsedModules: prefs.collapsedModules,
            hiddenModules: prefs.hiddenModules,
          },
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('user_content_preferences')
          .upsert(payload, {
            onConflict: raceId ? 'user_id,race_id' : 'user_id,race_type',
          });

        if (error) {
          logger.warn('Failed to sync preferences to Supabase', { error });
        } else {
          logger.debug('Synced preferences to Supabase');
        }
      } catch (error) {
        logger.warn('Failed to sync preferences to Supabase', { error });
      }
    },
    [user?.id, enableSync, raceId, raceType]
  );

  /**
   * Load preferences (local first, then sync with cloud)
   */
  const loadPreferences = useCallback(async (): Promise<ContentModulePreferences | null> => {
    setIsLoading(true);

    try {
      // Load from local first for instant response
      const localPrefs = await loadFromLocal();

      if (localPrefs) {
        setPreferences(localPrefs);
      }

      // Then try to load from Supabase (might be more recent)
      const cloudPrefs = await loadFromSupabase();

      if (cloudPrefs) {
        // Compare timestamps, use more recent
        const localTime = localPrefs ? new Date(localPrefs.updatedAt).getTime() : 0;
        const cloudTime = new Date(cloudPrefs.updatedAt).getTime();

        if (cloudTime > localTime) {
          setPreferences(cloudPrefs);
          // Update local with cloud data
          await saveToLocal(cloudPrefs);
          return cloudPrefs;
        }
      }

      return localPrefs;
    } catch (error) {
      logger.error('Failed to load preferences', { error });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadFromLocal, loadFromSupabase, saveToLocal]);

  /**
   * Save preferences (local immediately, cloud debounced)
   */
  const savePreferences = useCallback(
    async (updates: Partial<ContentModulePreferences>): Promise<void> => {
      const updated: ContentModulePreferences = {
        ...DEFAULT_CONTENT_PREFERENCES,
        ...preferences,
        ...updates,
        userId: user?.id || '',
        raceId: raceId || null,
        raceType: raceId ? null : raceType || null,
        updatedAt: new Date().toISOString(),
      };

      // Update state immediately
      setPreferences(updated);

      // Save to local immediately
      await saveToLocal(updated);

      // Debounce cloud sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        syncToSupabase(updated);
      }, DEBOUNCE_MS);
    },
    [preferences, user?.id, raceId, raceType, saveToLocal, syncToSupabase]
  );

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async (): Promise<void> => {
    const defaults: ContentModulePreferences = {
      ...DEFAULT_CONTENT_PREFERENCES,
      userId: user?.id || '',
      raceId: raceId || null,
      raceType: raceId ? null : raceType || null,
      updatedAt: new Date().toISOString(),
    };

    setPreferences(defaults);
    await saveToLocal(defaults);

    // Sync reset to cloud
    if (enableSync && user?.id) {
      await syncToSupabase(defaults);
    }

    logger.info('Reset preferences to defaults');
  }, [user?.id, raceId, raceType, saveToLocal, syncToSupabase, enableSync]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    preferences,
    isLoading,
    savePreferences,
    loadPreferences,
    resetPreferences,
  };
}

export default useContentPreferences;
