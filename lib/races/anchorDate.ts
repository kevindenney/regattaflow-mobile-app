/**
 * Unified anchor-date helper for the race timeline.
 *
 * Items on the timeline are either regattas (anchored on `start_date` or `date`)
 * or timeline steps (anchored strictly on `due_at`). Returning `null` means the
 * item is undated — the sort comparator and grid grouping both treat that case
 * specially (slot undated items adjacent to NOW).
 *
 * Single source of truth for every view (carousel, grid, past/future classifier).
 */

import type { CardRaceData } from '@/components/cards/types';

export function getAnchorDateMs(item: CardRaceData): number | null {
  const isStep = !!(item as any).isTimelineStep;
  const raw = isStep
    ? (item as any).due_at // steps: only due_at counts
    : ((item as any).start_date as string | undefined) || item.date;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}
