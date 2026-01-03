/**
 * useRaceSuggestions Hook
 * Manages race suggestions state and interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  raceSuggestionService,
  type CategorizedSuggestions,
  type RaceSuggestion,
} from '@/services/RaceSuggestionService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceSuggestions');

export interface UseRaceSuggestionsResult {
  suggestions: CategorizedSuggestions | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  acceptSuggestion: (suggestionId: string, modifiedFields?: string[]) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => Promise<void>;
  invalidateCache: () => Promise<void>;
}

export function useRaceSuggestions(): UseRaceSuggestionsResult {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<CategorizedSuggestions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load suggestions for the current user
   * Non-blocking: returns quickly with cached/empty data, loads fresh in background
   */
  const loadSuggestions = useCallback(async () => {
    logger.debug('[loadSuggestions] invoked', { hasUser: !!user, userId: user?.id });

    if (!user?.id) {
      logger.warn('[loadSuggestions] No user ID, skipping suggestion load');
      setLoading(false);
      return;
    }

    // Set loading briefly while we check cache
    setLoading(true);
    setError(null);

    try {
      logger.debug('[loadSuggestions] Starting suggestion fetch for user:', user.id);

      // Fast path: Get suggestions with a short timeout
      // The service will return cached data quickly if available
      const timeoutMs = 3000; // Short timeout - just for cached data
      const timeoutPromise = new Promise<CategorizedSuggestions>((resolve) =>
        setTimeout(() => {
          logger.debug('[loadSuggestions] Fast path timeout, returning empty');
          resolve({ clubRaces: [], fleetRaces: [], patterns: [], templates: [], total: 0 });
        }, timeoutMs)
      );

      const data = await Promise.race([
        raceSuggestionService.getSuggestionsForUser(user.id),
        timeoutPromise
      ]);

      logger.debug('[loadSuggestions] Received suggestions:', {
        total: data.total,
        clubRaces: data.clubRaces.length,
        fleetRaces: data.fleetRaces.length,
        patterns: data.patterns.length,
        templates: data.templates.length,
      });

      setSuggestions(data);
      setLoading(false);

      // If we got empty data (timeout or no cache), try loading in background
      if (data.total === 0) {
        logger.debug('[loadSuggestions] No suggestions yet, will try background refresh');
        // Don't await - let it run in background
        raceSuggestionService.getSuggestionsForUser(user.id)
          .then((freshData) => {
            if (freshData.total > 0) {
              logger.debug('[loadSuggestions] Background refresh got data:', freshData.total);
              setSuggestions(freshData);
            }
          })
          .catch((err) => {
            logger.debug('[loadSuggestions] Background refresh failed (non-critical):', err);
          });
      }
    } catch (err) {
      logger.error('[loadSuggestions] Error loading suggestions:', err);
      setError(err as Error);
      // Set empty suggestions on error so UI doesn't stay in loading state
      setSuggestions({ clubRaces: [], fleetRaces: [], patterns: [], templates: [], total: 0 });
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Refresh suggestions (force reload)
   */
  const refresh = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Invalidate cache first to force fresh data
      await raceSuggestionService.invalidateCache(user.id);

      // Reload suggestions
      await loadSuggestions();
    } catch (err) {
      logger.error('[refresh] Error refreshing suggestions:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [user?.id, loadSuggestions]);

  /**
   * Accept a suggestion (user added the race)
   */
  const acceptSuggestion = useCallback(
    async (suggestionId: string, modifiedFields?: string[]) => {
      if (!user?.id) return;

      try {
        logger.debug('[acceptSuggestion] Recording acceptance:', suggestionId);

        await raceSuggestionService.recordFeedback(
          user.id,
          suggestionId,
          modifiedFields && modifiedFields.length > 0 ? 'modified' : 'accepted',
          modifiedFields
        );

        // Remove the accepted suggestion from local state
        if (suggestions) {
          const filterSuggestion = (s: RaceSuggestion) => s.id !== suggestionId;
          setSuggestions({
            clubRaces: suggestions.clubRaces.filter(filterSuggestion),
            fleetRaces: suggestions.fleetRaces.filter(filterSuggestion),
            patterns: suggestions.patterns.filter(filterSuggestion),
            templates: suggestions.templates.filter(filterSuggestion),
            total: suggestions.total - 1,
          });
        }
      } catch (err) {
        logger.error('[acceptSuggestion] Error recording acceptance:', err);
      }
    },
    [user?.id, suggestions]
  );

  /**
   * Dismiss a suggestion (user doesn't want to see it)
   */
  const dismissSuggestion = useCallback(
    async (suggestionId: string) => {
      if (!user?.id) return;

      try {
        logger.debug('[dismissSuggestion] Recording dismissal:', suggestionId);

        await raceSuggestionService.recordFeedback(user.id, suggestionId, 'dismissed');

        // Remove the dismissed suggestion from local state
        if (suggestions) {
          const filterSuggestion = (s: RaceSuggestion) => s.id !== suggestionId;
          setSuggestions({
            clubRaces: suggestions.clubRaces.filter(filterSuggestion),
            fleetRaces: suggestions.fleetRaces.filter(filterSuggestion),
            patterns: suggestions.patterns.filter(filterSuggestion),
            templates: suggestions.templates.filter(filterSuggestion),
            total: suggestions.total - 1,
          });
        }
      } catch (err) {
        logger.error('[dismissSuggestion] Error recording dismissal:', err);
      }
    },
    [user?.id, suggestions]
  );

  /**
   * Invalidate the cache (for when user joins new club/fleet)
   */
  const invalidateCache = useCallback(async () => {
    if (!user?.id) return;

    try {
      logger.debug('[invalidateCache] Invalidating cache for user:', user.id);
      await raceSuggestionService.invalidateCache(user.id);
      await loadSuggestions();
    } catch (err) {
      logger.error('[invalidateCache] Error invalidating cache:', err);
    }
  }, [user?.id, loadSuggestions]);

  /**
   * Load suggestions on mount
   */
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh,
    acceptSuggestion,
    dismissSuggestion,
    invalidateCache,
  };
}

/**
 * Hook to get a specific suggestion by ID
 */
export function useRaceSuggestion(suggestionId: string | null): {
  suggestion: RaceSuggestion | null;
  loading: boolean;
} {
  const { suggestions, loading } = useRaceSuggestions();
  const [suggestion, setSuggestion] = useState<RaceSuggestion | null>(null);

  useEffect(() => {
    if (!suggestionId || !suggestions) {
      setSuggestion(null);
      return;
    }

    // Find suggestion across all categories
    const allSuggestions = [
      ...suggestions.clubRaces,
      ...suggestions.fleetRaces,
      ...suggestions.patterns,
      ...suggestions.templates,
    ];

    const found = allSuggestions.find((s) => s.id === suggestionId);
    setSuggestion(found || null);
  }, [suggestionId, suggestions]);

  return { suggestion, loading };
}
