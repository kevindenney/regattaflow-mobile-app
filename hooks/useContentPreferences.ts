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
  RaceType,
  UseContentPreferencesReturn,
} from '@/types/raceCardContent';
import { DEFAULT_CONTENT_PREFERENCES } from '@/types/raceCardContent';
import { createLogger } from '@/lib/utils/logger';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);

  // Storage key based on race ID or race type
  const storageKey = raceId
    ? `${STORAGE_KEY_PREFIX}race_${raceId}`
    : raceType
      ? `${STORAGE_KEY_PREFIX}type_${raceType}`
      : `${STORAGE_KEY_PREFIX}default`;
  const syncRunIdRef = useRef(0);
  const activeUserIdRef = useRef(user?.id ?? null);
  const activeStorageKeyRef = useRef(storageKey);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
    activeStorageKeyRef.current = storageKey;
  }, [user?.id, storageKey]);

  /**
   * Load preferences from local storage
   */
  const loadFromLocal = useCallback(async (): Promise<ContentModulePreferences | null> => {
    try {
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
      let data: any = null;
      let error: any = null;

      if (raceId) {
        const primary = await supabase
          .from('user_content_preferences')
          .select('*')
          .eq('user_id', user.id)
          .eq('race_id', raceId)
          .single();
        data = primary.data;
        error = primary.error;

        if (isMissingIdColumn(error, 'user_content_preferences', 'race_id')) {
          const fallback = await supabase
            .from('user_content_preferences')
            .select('*')
            .eq('user_id', user.id)
            .eq('regatta_id', raceId)
            .single();
          data = fallback.data;
          error = fallback.error;
        }
      } else if (raceType) {
        const typed = await supabase
          .from('user_content_preferences')
          .select('*')
          .eq('user_id', user.id)
          .is('race_id', null)
          .eq('race_type', raceType)
          .single();
        data = typed.data;
        error = typed.error;
        if (isMissingIdColumn(error, 'user_content_preferences', 'race_id')) {
          const fallback = await supabase
            .from('user_content_preferences')
            .select('*')
            .eq('user_id', user.id)
            .is('regatta_id', null)
            .eq('race_type', raceType)
            .single();
          data = fallback.data;
          error = fallback.error;
        }
      } else {
        const defaults = await supabase
          .from('user_content_preferences')
          .select('*')
          .eq('user_id', user.id)
          .is('race_id', null)
          .is('race_type', null)
          .single();
        data = defaults.data;
        error = defaults.error;
        if (isMissingIdColumn(error, 'user_content_preferences', 'race_id')) {
          const fallback = await supabase
            .from('user_content_preferences')
            .select('*')
            .eq('user_id', user.id)
            .is('regatta_id', null)
            .is('race_type', null)
            .single();
          data = fallback.data;
          error = fallback.error;
        }
      }

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
          ...(raceId ? { race_id: raceId } : {}),
          race_type: raceId ? null : raceType || null,
          preferences: {
            moduleOrder: prefs.moduleOrder,
            collapsedModules: prefs.collapsedModules,
            hiddenModules: prefs.hiddenModules,
          },
          updated_at: new Date().toISOString(),
        };

        const primary = await supabase
          .from('user_content_preferences')
          .upsert(payload, {
            onConflict: raceId ? 'user_id,race_id' : 'user_id,race_type',
          });
        let error = primary.error;

        if (raceId && isMissingIdColumn(error, 'user_content_preferences', 'race_id')) {
          const fallbackPayload = {
            user_id: user.id,
            regatta_id: raceId,
            race_id: null,
            race_type: null,
            preferences: payload.preferences,
            updated_at: payload.updated_at,
          };
          const fallback = await supabase
            .from('user_content_preferences')
            .upsert(fallbackPayload, {
              onConflict: 'user_id,regatta_id',
            });
          error = fallback.error;
        }

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
    const runId = ++loadRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === loadRunIdRef.current;

    if (!canCommit()) return null;
    setIsLoading(true);

    try {
      // Load from local first for instant response
      const localPrefs = await loadFromLocal();
      if (!canCommit()) return localPrefs;

      if (localPrefs) {
        setPreferences(localPrefs);
      } else {
        setPreferences(null);
      }

      if (!enableSync || !user?.id) {
        return localPrefs;
      }

      // Then try to load from Supabase (might be more recent)
      const cloudPrefs = await loadFromSupabase();
      if (!canCommit()) return cloudPrefs || localPrefs;

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
      if (!canCommit()) return null;
      setIsLoading(false);
    }
  }, [loadFromLocal, loadFromSupabase, saveToLocal, enableSync, user?.id]);

  /**
   * Save preferences (local immediately, cloud debounced)
   */
  const savePreferences = useCallback(
    async (updates: Partial<ContentModulePreferences>): Promise<void> => {
      const runId = ++syncRunIdRef.current;
      const targetUserId = user?.id ?? null;
      const targetStorageKey = storageKey;
      const canCommit = () =>
        isMountedRef.current &&
        runId === syncRunIdRef.current &&
        activeUserIdRef.current === targetUserId &&
        activeStorageKeyRef.current === targetStorageKey;

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
      if (canCommit()) setPreferences(updated);

      // Save to local immediately
      await saveToLocal(updated);
      if (!canCommit()) return;

      // Debounce cloud sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        if (!canCommit()) return;
        void syncToSupabase(updated);
      }, DEBOUNCE_MS);
    },
    [preferences, user?.id, raceId, raceType, saveToLocal, syncToSupabase, storageKey]
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
      syncRunIdRef.current += 1;
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
      isMountedRef.current = false;
      syncRunIdRef.current += 1;
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
