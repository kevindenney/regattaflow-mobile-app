/**
 * Shared past/future classifier for items in the unified race timeline.
 *
 * Status-based: completion is what puts an item on the past side of NOW.
 * Dates are metadata only — they're still displayed on cards but no longer
 * drive positioning. A Planned step with a date in the past still sits on
 * the planned side of NOW (the "OVERDUE" pill is the only cue that its due
 * date has slipped).
 *
 * Used by both TimelineGridView (zoomed-out grid) and the carousel
 * data pipeline (CardGrid via filteredCardGridRaces) so both views
 * agree on which items sit before the TODAY/NOW divider.
 */

import type { CardRaceData } from '@/components/cards/types';

export function isItemPast(race: CardRaceData): boolean {
  const status = String((race as any).stepStatus || (race as any).status || '').toLowerCase();
  return status === 'completed' || status === 'done';
}
