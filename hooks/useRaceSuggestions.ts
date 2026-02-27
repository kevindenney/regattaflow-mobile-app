/**
 * useRaceSuggestions Hook
 * Manages race suggestions state and interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  raceSuggestionService,
  type CategorizedSuggestions,
  type RaceSuggestion,
} from '@/services/RaceSuggestionService';
import { createLogger } from '@/lib/utils/logger';
import { EMPTY_SUGGESTIONS, shouldPreservePreviousSuggestions } from '@/hooks/useRaceSuggestions.utils';
import {
  buildSuggestionsUnavailableError,
  normalizeSuggestionError,
} from '@/hooks/useRaceSuggestions.errors';

const logger = createLogger('useRaceSuggestions');

export interface UseRaceSuggestionsResult {
  suggestions: CategorizedSuggestions | null;
  diagnostics: SuggestionDiagnostics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  acceptSuggestion: (suggestionId: string, modifiedFields?: string[]) => Promise<void>;
  dismissSuggestion: (suggestionId: string) => Promise<void>;
  invalidateCache: () => Promise<void>;
}

export function useRaceSuggestions(): UseRaceSuggestionsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [suggestions, setSuggestions] = useState<CategorizedSuggestions | null>(null);
  const [diagnostics, setDiagnostics] = useState<SuggestionDiagnostics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(userId);

  useEffect(() => {
    activeUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
    };
  }, []);

  /**
   * Load suggestions for the current user
   * Non-blocking: returns quickly with cached/empty data, loads fresh in background
   */
  const loadSuggestions = useCallback(async () => {
    const startedAt = Date.now();
    const runId = ++loadRunIdRef.current;
    const targetUserId = userId;
    const canCommit = () =>
      isMountedRef.current &&
      runId === loadRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    logger.debug('[loadSuggestions] invoked', { hasUser: !!userId, userId });

    if (!targetUserId) {
      logger.warn('[loadSuggestions] No user ID, skipping suggestion load');
      if (!canCommit()) return;
      setSuggestions(null);
      setDiagnostics(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Set loading briefly while we check cache
    if (!canCommit()) return;
    setLoading(true);
    setError(null);

    try {
      logger.debug('[loadSuggestions] Starting suggestion fetch for user:', targetUserId);

      // Fast path: Get suggestions with a short timeout
      // The service will return cached data quickly if available
      const timeoutMs = 3000; // Short timeout - just for cached data
      let timedOut = false;
      const sourcePromise = raceSuggestionService.getSuggestionsForUser(targetUserId);
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<CategorizedSuggestions>((resolve) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          logger.debug('[loadSuggestions] Fast path timeout, returning empty');
          resolve(EMPTY_SUGGESTIONS);
        }, timeoutMs);
      });

      const data = await Promise.race([
        sourcePromise,
        timeoutPromise
      ]);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      logger.debug('[loadSuggestions] Received suggestions:', {
        elapsedMs: Date.now() - startedAt,
        timedOut,
        total: data.total,
        clubRaces: data.clubRaces.length,
        fleetRaces: data.fleetRaces.length,
        patterns: data.patterns.length,
        templates: data.templates.length,
      });

      if (!canCommit()) return;
      setSuggestions((prev) => {
        // Preserve existing suggestions when fast-path timeout returns empty data.
        if (shouldPreservePreviousSuggestions(timedOut, data, prev)) {
          return prev;
        }
        return data;
      });
      if (!timedOut) {
        setDiagnostics(data.diagnostics ?? null);
        if (data.total === 0) {
          setError(buildSuggestionsUnavailableError(data.diagnostics));
        } else {
          setError(null);
        }
      }
      setLoading(false);

      // If we got empty data (timeout or no cache), try loading in background
      if (data.total === 0) {
        logger.debug('[loadSuggestions] No suggestions yet, will try background refresh');
        // If timeout won the race, continue using the in-flight source request.
        // Otherwise, kick off a fresh background refresh.
        const backgroundPromise =
          timedOut ? sourcePromise : raceSuggestionService.getSuggestionsForUser(targetUserId);
        backgroundPromise
          .then((freshData) => {
            if (!canCommit()) return;
            if (freshData.total > 0) {
              logger.debug('[loadSuggestions] Background refresh got data:', freshData.total);
              setSuggestions(freshData);
              setDiagnostics(freshData.diagnostics ?? null);
              setError(null);
            } else {
              setDiagnostics(freshData.diagnostics ?? null);
              setError(buildSuggestionsUnavailableError(freshData.diagnostics));
            }
          })
          .catch((err) => {
            logger.error('[loadSuggestions] Background refresh failed:', err);
            if (!canCommit()) return;
            setError(normalizeSuggestionError(err));
            setSuggestions((prev) => prev ?? EMPTY_SUGGESTIONS);
          });
      }
    } catch (err) {
      logger.error('[loadSuggestions] Error loading suggestions:', err);
      if (!canCommit()) return;
      setError(normalizeSuggestionError(err));
      // Preserve previous suggestions on transient errors; only initialize empty if none exist.
      setSuggestions((prev) => prev ?? EMPTY_SUGGESTIONS);
      setLoading(false);
    } finally {
      // Defensive timer cleanup for early throw/cancel paths.
      // (timeoutId is function-scoped above and may already be null)
    }
  }, [userId]);

  /**
   * Refresh suggestions (force reload)
   */
  const refresh = useCallback(async () => {
    const targetUserId = activeUserIdRef.current;
    if (!targetUserId) return;

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      // Invalidate cache first to force fresh data
      await raceSuggestionService.invalidateCache(targetUserId);
      if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return;

      // Reload suggestions
      await loadSuggestions();
    } catch (err) {
      logger.error('[refresh] Error refreshing suggestions:', err);
      if (!isMountedRef.current) return;
      setError(normalizeSuggestionError(err));
      setLoading(false);
    }
  }, [loadSuggestions]);

  /**
   * Accept a suggestion (user added the race)
   */
  const acceptSuggestion = useCallback(
    async (suggestionId: string, modifiedFields?: string[]) => {
      const targetUserId = activeUserIdRef.current;
      if (!targetUserId) return;

      try {
        logger.debug('[acceptSuggestion] Recording acceptance:', suggestionId);

        await raceSuggestionService.recordFeedback(
          targetUserId,
          suggestionId,
          modifiedFields && modifiedFields.length > 0 ? 'modified' : 'accepted',
          modifiedFields
        );

        if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return;

        // Remove the accepted suggestion from local state using functional update to avoid stale closures.
        setSuggestions((prev) => {
          if (!prev) return prev;
          const filterSuggestion = (s: RaceSuggestion) => s.id !== suggestionId;
          const exists =
            prev.clubRaces.some((s) => s.id === suggestionId) ||
            prev.fleetRaces.some((s) => s.id === suggestionId) ||
            prev.communityRaces.some((s) => s.id === suggestionId) ||
            prev.catalogMatches.some((s) => s.id === suggestionId) ||
            prev.previousYearRaces.some((s) => s.id === suggestionId) ||
            prev.patterns.some((s) => s.id === suggestionId) ||
            prev.templates.some((s) => s.id === suggestionId);
          return {
            clubRaces: prev.clubRaces.filter(filterSuggestion),
            fleetRaces: prev.fleetRaces.filter(filterSuggestion),
            communityRaces: prev.communityRaces.filter(filterSuggestion),
            catalogMatches: prev.catalogMatches.filter(filterSuggestion),
            previousYearRaces: prev.previousYearRaces.filter(filterSuggestion),
            patterns: prev.patterns.filter(filterSuggestion),
            templates: prev.templates.filter(filterSuggestion),
            total: exists ? Math.max(0, prev.total - 1) : prev.total,
          };
        });
      } catch (err) {
        logger.error('[acceptSuggestion] Error recording acceptance:', err);
        if (!isMountedRef.current) return;
        setError(normalizeSuggestionError(err));
      }
    },
    []
  );

  /**
   * Dismiss a suggestion (user doesn't want to see it)
   */
  const dismissSuggestion = useCallback(
    async (suggestionId: string) => {
      const targetUserId = activeUserIdRef.current;
      if (!targetUserId) return;

      try {
        logger.debug('[dismissSuggestion] Recording dismissal:', suggestionId);

        await raceSuggestionService.recordFeedback(targetUserId, suggestionId, 'dismissed');

        if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return;

        // Remove the dismissed suggestion from local state using functional update to avoid stale closures.
        setSuggestions((prev) => {
          if (!prev) return prev;
          const filterSuggestion = (s: RaceSuggestion) => s.id !== suggestionId;
          const exists =
            prev.clubRaces.some((s) => s.id === suggestionId) ||
            prev.fleetRaces.some((s) => s.id === suggestionId) ||
            prev.communityRaces.some((s) => s.id === suggestionId) ||
            prev.catalogMatches.some((s) => s.id === suggestionId) ||
            prev.previousYearRaces.some((s) => s.id === suggestionId) ||
            prev.patterns.some((s) => s.id === suggestionId) ||
            prev.templates.some((s) => s.id === suggestionId);
          return {
            clubRaces: prev.clubRaces.filter(filterSuggestion),
            fleetRaces: prev.fleetRaces.filter(filterSuggestion),
            communityRaces: prev.communityRaces.filter(filterSuggestion),
            catalogMatches: prev.catalogMatches.filter(filterSuggestion),
            previousYearRaces: prev.previousYearRaces.filter(filterSuggestion),
            patterns: prev.patterns.filter(filterSuggestion),
            templates: prev.templates.filter(filterSuggestion),
            total: exists ? Math.max(0, prev.total - 1) : prev.total,
          };
        });
      } catch (err) {
        logger.error('[dismissSuggestion] Error recording dismissal:', err);
        if (!isMountedRef.current) return;
        setError(normalizeSuggestionError(err));
      }
    },
    []
  );

  /**
   * Invalidate the cache (for when user joins new club/fleet)
   */
  const invalidateCache = useCallback(async () => {
    const targetUserId = activeUserIdRef.current;
    if (!targetUserId) return;
    if (!isMountedRef.current) return;

    try {
      logger.debug('[invalidateCache] Invalidating cache for user:', targetUserId);
      await raceSuggestionService.invalidateCache(targetUserId);
      if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return;
      await loadSuggestions();
    } catch (err) {
      logger.error('[invalidateCache] Error invalidating cache:', err);
      if (!isMountedRef.current) return;
      setError(normalizeSuggestionError(err));
    }
  }, [loadSuggestions]);

  /**
   * Load suggestions on mount
   */
  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    diagnostics,
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
      ...suggestions.communityRaces,
      ...suggestions.catalogMatches,
      ...suggestions.previousYearRaces,
      ...suggestions.patterns,
      ...suggestions.templates,
    ];

    const found = allSuggestions.find((s) => s.id === suggestionId);
    setSuggestion(found || null);
  }, [suggestionId, suggestions]);

  return { suggestion, loading };
}
