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
   */
  const loadSuggestions = useCallback(async () => {
    logger.debug('[loadSuggestions] invoked', { hasUser: !!user, userId: user?.id });

    if (!user?.id) {
      logger.warn('[loadSuggestions] No user ID, skipping suggestion load');
      setLoading(false);
      return;
    }

    try {
      logger.debug('[loadSuggestions] Starting suggestion fetch for user:', user.id);
      setLoading(true);
      setError(null);

      logger.debug('[loadSuggestions] Fetching suggestions for user:', user.id);
      const data = await raceSuggestionService.getSuggestionsForUser(user.id);

      logger.debug('[loadSuggestions] Received suggestions:', {
        total: data.total,
        clubRaces: data.clubRaces.length,
        fleetRaces: data.fleetRaces.length,
        patterns: data.patterns.length,
        templates: data.templates.length,
      });

      if (data.total === 0) {
        logger.info('[loadSuggestions] No suggestions returned for user, showing empty state', {
          userId: user.id,
        });
      }

      setSuggestions(data);
    } catch (err) {
      logger.error('[loadSuggestions] Error loading suggestions:', err);
      setError(err as Error);
    } finally {
      logger.debug('[loadSuggestions] Load complete, setting loading to false');
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
