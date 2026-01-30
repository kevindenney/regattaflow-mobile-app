/**
 * Date Bumping Utilities
 * Helpers for re-using previous year's race data with updated dates
 */

/**
 * Bump a date to the current year, preserving day-of-week when possible.
 * If the result is in the past, push forward one week.
 */
export function bumpDateToCurrentYear(originalDateStr: string): string {
  const original = new Date(originalDateStr);
  if (isNaN(original.getTime())) return originalDateStr;

  const now = new Date();
  const currentYear = now.getFullYear();
  const yearDelta = currentYear - original.getFullYear();

  if (yearDelta === 0) return originalDateStr;

  const bumped = new Date(original);
  bumped.setFullYear(bumped.getFullYear() + yearDelta);

  // Adjust to nearest matching weekday
  const originalDow = original.getDay();
  const bumpedDow = bumped.getDay();
  if (originalDow !== bumpedDow) {
    const diff = originalDow - bumpedDow;
    const adjustment = diff > 3 ? diff - 7 : diff < -3 ? diff + 7 : diff;
    bumped.setDate(bumped.getDate() + adjustment);
  }

  // If bumped date is in the past, push forward one week
  if (bumped < now) {
    bumped.setDate(bumped.getDate() + 7);
  }

  return bumped.toISOString().split('T')[0];
}

/**
 * Identify fields in a previous-year race that are likely stale and need review.
 */
export function getFieldsToReview(raceData: Record<string, any>): string[] {
  const fields: string[] = ['date', 'time'];

  if (raceData.notice_of_race_url) fields.push('NOR URL');
  if (raceData.event_website) fields.push('event website');
  if (raceData.entry_fees) fields.push('entry fees');
  if (raceData.entry_deadline) fields.push('entry deadline');
  if (raceData.registration_url || raceData.entry_form_url) fields.push('registration URL');
  if (raceData.metadata?.venue_name || raceData.start_area_name) fields.push('location');
  if (raceData.expected_conditions) fields.push('expected conditions');

  return fields;
}
