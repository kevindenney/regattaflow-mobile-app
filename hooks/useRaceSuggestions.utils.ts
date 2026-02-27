import type { CategorizedSuggestions } from '@/services/RaceSuggestionService';

export const EMPTY_SUGGESTIONS: CategorizedSuggestions = {
  clubRaces: [],
  fleetRaces: [],
  communityRaces: [],
  catalogMatches: [],
  previousYearRaces: [],
  patterns: [],
  templates: [],
  total: 0,
};

export function shouldPreservePreviousSuggestions(
  timedOut: boolean,
  incoming: CategorizedSuggestions,
  previous: CategorizedSuggestions | null
): boolean {
  return Boolean(timedOut && incoming.total === 0 && previous && previous.total > 0);
}
