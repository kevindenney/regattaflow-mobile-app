/**
 * Shared past/future classifier for items in the unified race timeline.
 *
 * Used by both TimelineGridView (zoomed-out grid) and the carousel
 * data pipeline (CardGrid via filteredCardGridRaces) so both views
 * agree on which items sit before the TODAY/NOW divider.
 *
 * Timeline steps anchor on `due_at`; regattas anchor on `start_date`/`date`.
 * Completed regattas count as past regardless of date. Undated steps count
 * as future so a user can drag an undated prep step above the next race.
 */

import { isRacePast } from '@/components/cards/types';
import type { CardRaceData } from '@/components/cards/types';
import { getAnchorDateMs } from './anchorDate';

export function isItemPast(race: CardRaceData): boolean {
  const isStep = !!(race as any).isTimelineStep;
  const status = (race as any).stepStatus || (race as any).status;
  if (!isStep && status === 'completed') return true;

  const anchorMs = getAnchorDateMs(race);

  // Undated items are "future" — a user can slot them just after NOW.
  if (anchorMs === null) return false;

  // Steps: strict due_at compare. Regattas: use isRacePast so the time-of-day
  // component (startTime) is honored for same-day races.
  if (isStep) return anchorMs < Date.now();
  const dateStr = ((race as any).start_date as string | undefined) || race.date;
  return isRacePast(dateStr!, race.startTime);
}
