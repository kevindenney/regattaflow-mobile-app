/**
 * usePhaseCompletionCounts Hook
 *
 * Aggregates checklist completion counts across all race phases.
 * Used to show completion checkmarks on phase tabs when a phase is complete.
 *
 * Tufte principle: Clean labels reduce visual clutter. Only show checkmarks
 * on completion rather than progress counts like "3/19".
 */

import { useMemo } from 'react';
import { useRaceChecklist } from './useRaceChecklist';
import type { RacePhase } from '@/components/cards/types';
import type { RaceType } from '@/types/raceEvents';

/**
 * Completion counts for a single phase
 */
export interface PhaseCompletionCount {
  completed: number;
  total: number;
  progress: number; // 0-1
  isComplete: boolean;
}

/**
 * All phase completion counts
 */
export type PhaseCompletionCounts = Record<RacePhase, PhaseCompletionCount>;

/**
 * Options for usePhaseCompletionCounts hook
 */
interface UsePhaseCompletionCountsOptions {
  regattaId: string;
  raceType: RaceType;
  enabled?: boolean;
}

/**
 * Hook to get completion counts for all race phases
 *
 * @param options - Hook options
 * @returns Object with completion counts per phase
 */
export function usePhaseCompletionCounts({
  regattaId,
  raceType,
  enabled = true,
}: UsePhaseCompletionCountsOptions): {
  counts: PhaseCompletionCounts;
  isLoading: boolean;
} {
  // Get checklist data for each phase
  // These hooks are designed to be called conditionally based on enabled flag
  const daysBeforeChecklist = useRaceChecklist({
    regattaId,
    raceType,
    phase: 'days_before',
    includeCarryover: true,
  });

  const raceMorningChecklist = useRaceChecklist({
    regattaId,
    raceType,
    phase: 'race_morning',
    includeCarryover: false,
  });

  const onWaterChecklist = useRaceChecklist({
    regattaId,
    raceType,
    phase: 'on_water',
    includeCarryover: false,
  });

  const afterRaceChecklist = useRaceChecklist({
    regattaId,
    raceType,
    phase: 'after_race',
    includeCarryover: false,
  });

  // Aggregate loading state
  const isLoading =
    daysBeforeChecklist.isLoading ||
    raceMorningChecklist.isLoading ||
    onWaterChecklist.isLoading ||
    afterRaceChecklist.isLoading;

  // Build counts object
  const counts = useMemo((): PhaseCompletionCounts => {
    const buildPhaseCount = (
      completedCount: number,
      totalCount: number
    ): PhaseCompletionCount => ({
      completed: completedCount,
      total: totalCount,
      progress: totalCount > 0 ? completedCount / totalCount : 0,
      isComplete: totalCount > 0 && completedCount === totalCount,
    });

    return {
      days_before: buildPhaseCount(
        daysBeforeChecklist.completedCount,
        daysBeforeChecklist.totalCount
      ),
      race_morning: buildPhaseCount(
        raceMorningChecklist.completedCount,
        raceMorningChecklist.totalCount
      ),
      on_water: buildPhaseCount(
        onWaterChecklist.completedCount,
        onWaterChecklist.totalCount
      ),
      after_race: buildPhaseCount(
        afterRaceChecklist.completedCount,
        afterRaceChecklist.totalCount
      ),
    };
  }, [
    daysBeforeChecklist.completedCount,
    daysBeforeChecklist.totalCount,
    raceMorningChecklist.completedCount,
    raceMorningChecklist.totalCount,
    onWaterChecklist.completedCount,
    onWaterChecklist.totalCount,
    afterRaceChecklist.completedCount,
    afterRaceChecklist.totalCount,
  ]);

  return { counts, isLoading };
}

/**
 * Format completion count for display in a tab label
 *
 * Shows only a checkmark when phase is complete, nothing otherwise.
 * This keeps tab labels clean (e.g., "Prep" instead of "Prep 3/19").
 *
 * Examples:
 * - (5, 5) => " ✓" (all complete)
 * - (3, 5) => "" (in progress - no count shown)
 * - (0, 5) => "" (not started - no count shown)
 * - (0, 0) => "" (no items)
 */
export function formatPhaseCompletionLabel(
  completed: number,
  total: number,
  showCheckmark = true
): string {
  // Only show checkmark when all items complete
  if (total > 0 && completed === total && showCheckmark) {
    return ' ✓';
  }

  // No counts shown - clean labels
  return '';
}

export default usePhaseCompletionCounts;
