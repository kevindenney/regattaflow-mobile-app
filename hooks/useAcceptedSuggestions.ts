/**
 * useAcceptedSuggestions
 *
 * Convenience hook that exposes only accepted follower suggestions
 * grouped by category. Designed for use in phase content components.
 */

import { useCallback, useMemo } from 'react';
import { useFollowerSuggestions } from './useFollowerSuggestions';
import type { FollowerSuggestion, SuggestionCategory } from '@/services/FollowerSuggestionService';

export function useAcceptedSuggestions(raceId: string | undefined) {
  const { acceptedByCategory, dismissSuggestion } = useFollowerSuggestions(raceId);

  const forCategory = useCallback(
    (category: SuggestionCategory): FollowerSuggestion[] =>
      acceptedByCategory[category] ?? [],
    [acceptedByCategory]
  );

  return { forCategory, dismissSuggestion };
}
