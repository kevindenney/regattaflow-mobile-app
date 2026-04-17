/**
 * Unified sort comparator for the race timeline.
 *
 * Contract:
 *   - Both items dated → chronological ASC (tiebreak: sort_order, then id).
 *   - Both items undated → newest first (sort_order DESC) so the most recently
 *     created undated step sits closest to NOW.
 *   - One undated, one dated → undated slots immediately after NOW: it comes
 *     BEFORE future-dated items but AFTER past-dated items.
 *
 * Used by both the horizontal carousel and the zoomed-out grid so they agree
 * on item position for every possible combination.
 */

import type { CardRaceData } from '@/components/cards/types';
import { getAnchorDateMs } from './anchorDate';

export function compareTimelineItems(
  a: CardRaceData,
  b: CardRaceData,
  nowMs: number,
): number {
  const aDate = getAnchorDateMs(a);
  const bDate = getAnchorDateMs(b);
  const aNull = aDate === null;
  const bNull = bDate === null;

  // Both undated: newest first (DESC sort_order) → closest to NOW.
  if (aNull && bNull) {
    const aSort = ((a as any).sort_order ?? 0) as number;
    const bSort = ((b as any).sort_order ?? 0) as number;
    if (aSort !== bSort) return bSort - aSort;
    return String(a.id).localeCompare(String(b.id));
  }

  // Undated vs dated: slot undated immediately after NOW.
  if (aNull) return (bDate as number) >= nowMs ? -1 : 1;
  if (bNull) return (aDate as number) >= nowMs ? 1 : -1;

  // Both dated: chronological, tiebreak on sort_order then id.
  if (aDate !== bDate) return (aDate as number) - (bDate as number);
  const aSort = ((a as any).sort_order ?? 999) as number;
  const bSort = ((b as any).sort_order ?? 999) as number;
  if (aSort !== bSort) return aSort - bSort;
  return String(a.id).localeCompare(String(b.id));
}
