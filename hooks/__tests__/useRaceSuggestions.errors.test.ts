import {
  buildSuggestionsUnavailableError,
  normalizeSuggestionError,
  extractSuggestionFailureSources,
} from '@/hooks/useRaceSuggestions.errors';

describe('useRaceSuggestions error helpers', () => {
  describe('buildSuggestionsUnavailableError', () => {
    it('returns null when there are no failed sources', () => {
      expect(buildSuggestionsUnavailableError(null)).toBeNull();
      expect(buildSuggestionsUnavailableError({ failedSources: [], sources: [] })).toBeNull();
    });

    it('tags source-unavailable errors as RLS when all failures are policy-related', () => {
      const error = buildSuggestionsUnavailableError({
        failedSources: ['club_events'],
        sources: [
          {
            name: 'club_events',
            failed: true,
            elapsedMs: 20,
            count: 0,
            errorMessage: 'permission denied for table club_members',
          },
        ],
      });

      expect(error).toBeInstanceOf(Error);
      expect((error as any).code).toBe('RACE_SUGGESTIONS_RLS');
    });

    it('tags source-unavailable errors as network when all failures are transport-related', () => {
      const error = buildSuggestionsUnavailableError({
        failedSources: ['catalog_matches'],
        sources: [
          {
            name: 'catalog_matches',
            failed: true,
            elapsedMs: 20,
            count: 0,
            errorMessage: 'network timeout while fetching',
          },
        ],
      });

      expect(error).toBeInstanceOf(Error);
      expect((error as any).code).toBe('RACE_SUGGESTIONS_NETWORK');
    });

    it('tags mixed source failures as generic unavailable', () => {
      const error = buildSuggestionsUnavailableError({
        failedSources: ['club_events', 'catalog_matches'],
        sources: [
          {
            name: 'club_events',
            failed: true,
            elapsedMs: 20,
            count: 0,
            errorMessage: 'permission denied',
          },
          {
            name: 'catalog_matches',
            failed: true,
            elapsedMs: 20,
            count: 0,
            errorMessage: 'network timeout',
          },
        ],
      });

      expect(error).toBeInstanceOf(Error);
      expect((error as any).code).toBe('RACE_SUGGESTIONS_SOURCES_UNAVAILABLE');
    });
  });

  describe('normalizeSuggestionError', () => {
    it('normalizes permission failures', () => {
      const error = normalizeSuggestionError({ message: 'Row-Level Security policy violation' });
      expect(error.message.startsWith('[RACE_SUGGESTIONS_RLS]')).toBe(true);
    });

    it('normalizes network failures', () => {
      const error = normalizeSuggestionError({ message: 'Network request failed' });
      expect(error.message.startsWith('[RACE_SUGGESTIONS_NETWORK]')).toBe(true);
    });
  });

  describe('extractSuggestionFailureSources', () => {
    it('prefers diagnostics failedSources when present', () => {
      expect(extractSuggestionFailureSources(['club_events'], 'anything')).toEqual(['club_events']);
    });

    it('extracts sources from tagged source-unavailable messages', () => {
      const message = '[RACE_SUGGESTIONS_SOURCES_UNAVAILABLE] Suggestion sources unavailable: fleet_races, templates';
      expect(extractSuggestionFailureSources(undefined, message)).toEqual(['fleet_races', 'templates']);
    });

    it('returns empty array when no diagnostics or source prefix', () => {
      expect(extractSuggestionFailureSources(undefined, 'Network request failed')).toEqual([]);
    });
  });
});
