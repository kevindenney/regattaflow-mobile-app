export function getDemoRaceStartDateISO(daysAhead = 7, hour = 11, minute = 0): string {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function getDemoRaceStartTimeLabel(hour = 11, minute = 0): string {
  // Return 24-hour format (HH:MM) - formatting functions will add AM/PM
  const hh = hour.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}
