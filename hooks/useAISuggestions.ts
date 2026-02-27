/**
 * useAISuggestions — React hook for cross-interest AI suggestions.
 *
 * Provides active suggestions for the current interest, with methods
 * to apply, dismiss, and save them. Handles loading state and
 * automatic refresh when the interest changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInterest } from '@/hooks/useInterest';
import { useAuth } from '@/providers/AuthProvider';
import {
  getActiveSuggestions,
  updateSuggestionStatus,
  generateAndSaveSuggestions,
} from '@/services/ai/crossInterestSuggestions';
import type { AISuggestion, UserInterestActivity } from '@/services/ai/crossInterestSuggestions';
import type { InterestSlug } from '@/lib/skillTaxonomy';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useAISuggestions');

interface UseAISuggestionsResult {
  /** Active suggestions for the current interest */
  suggestions: AISuggestion[];
  /** Whether suggestions are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Apply a suggestion to the current plan/event */
  applySuggestion: (suggestion: AISuggestion, eventId?: string) => Promise<void>;
  /** Dismiss a suggestion (hides it and trains the engine) */
  dismissSuggestion: (suggestion: AISuggestion) => Promise<void>;
  /** Save a suggestion for later */
  saveSuggestion: (suggestion: AISuggestion) => Promise<void>;
  /** Force refresh suggestions */
  refresh: () => Promise<void>;
  /** Whether any suggestions are available */
  hasSuggestions: boolean;
}

export function useAISuggestions(): UseAISuggestionsResult {
  const { currentInterest } = useInterest();
  const { user } = useAuth();

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastInterestRef = useRef<string | null>(null);

  // Fetch active suggestions when interest changes
  const fetchSuggestions = useCallback(async () => {
    if (!user?.id || !currentInterest?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const active = await getActiveSuggestions(user.id, currentInterest.id);
      setSuggestions(active);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      logger.error('[useAISuggestions] Fetch error:', e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentInterest?.id]);

  // Auto-fetch when interest changes
  useEffect(() => {
    if (!currentInterest?.id) return;
    if (lastInterestRef.current === currentInterest.id) return;

    lastInterestRef.current = currentInterest.id;
    fetchSuggestions();
  }, [currentInterest?.id, fetchSuggestions]);

  // Apply a suggestion
  const applySuggestion = useCallback(
    async (suggestion: AISuggestion, eventId?: string) => {
      try {
        await updateSuggestionStatus(suggestion.id, 'applied', eventId);
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      } catch (err) {
        logger.error('[useAISuggestions] Apply error:', err);
      }
    },
    [],
  );

  // Dismiss a suggestion
  const dismissSuggestion = useCallback(
    async (suggestion: AISuggestion) => {
      try {
        await updateSuggestionStatus(suggestion.id, 'dismissed');
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      } catch (err) {
        logger.error('[useAISuggestions] Dismiss error:', err);
      }
    },
    [],
  );

  // Save a suggestion for later
  const saveSuggestion = useCallback(
    async (suggestion: AISuggestion) => {
      try {
        await updateSuggestionStatus(suggestion.id, 'saved');
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
      } catch (err) {
        logger.error('[useAISuggestions] Save error:', err);
      }
    },
    [],
  );

  return {
    suggestions,
    isLoading,
    error,
    applySuggestion,
    dismissSuggestion,
    saveSuggestion,
    refresh: fetchSuggestions,
    hasSuggestions: suggestions.length > 0,
  };
}

export default useAISuggestions;
