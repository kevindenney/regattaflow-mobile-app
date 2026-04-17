/**
 * Unified sort comparator for the race timeline.
 *
 * Contract:
 *   - Completed items come first (left of NOW in the carousel, above the
 *     TODAY divider in the grid). Not-yet-done items come after.
 *   - Within each side, items are ordered by `sort_order` ASC — that's the
 *     user's manual order (drag-and-drop) and the creation order for new
 *     items. Dates are metadata only and do NOT drive position.
 *   - Id tiebreaker keeps sorts deterministic when sort_order collides.
 *
 * Used by both the horizontal carousel and the zoomed-out grid so they agree
 * on item position for every possible combination.
 */

import type { CardRaceData } from '@/components/cards/types';
import { isItemPast } from './isItemPast';

export function compareTimelineItems(
  a: CardRaceData,
  b: CardRaceData,
  _nowMs: number,
): number {
  const aDone = isItemPast(a);
  const bDone = isItemPast(b);
  if (aDone !== bDone) return aDone ? -1 : 1;

  const aSort = ((a as any).sort_order ?? 0) as number;
  const bSort = ((b as any).sort_order ?? 0) as number;
  if (aSort !== bSort) return aSort - bSort;

  return String(a.id).localeCompare(String(b.id));
}
