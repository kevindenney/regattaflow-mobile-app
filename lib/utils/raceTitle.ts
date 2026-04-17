/**
 * Shared helpers for parsing information out of race / step titles.
 *
 * Club series regularly sail multiple back-to-back races in a single day
 * ("Moonraker Series Races 5 & 6"). Sailors create ONE step for the day, so
 * we infer the race count from the title to default the result sheet and
 * progress indicators correctly.
 */

/**
 * Infer how many individual races a step title refers to. Supports:
 *  - ranges: "races 5-7", "race 1–3", "r5 to 7"
 *  - lists:  "races 5 & 6", "race 1, 2, 3", "r1 and r2"
 *
 * Returns a count between 1 and `maxCount` (default 5 — the UI cap). Falls
 * back to 1 when nothing recognisable is found, so it's always safe to call.
 */
export function inferRaceCountFromTitle(
  title: string | null | undefined,
  maxCount = 5,
): number {
  if (!title) return 1;

  const t = title.toLowerCase();

  // Range: "races 5-7", "race 1–3", "r5 to 7"
  const range = t.match(/\b(?:races?|r)\s*(\d+)\s*(?:-|–|—|to|through|thru)\s*(\d+)\b/);
  if (range) {
    const start = parseInt(range[1], 10);
    const end = parseInt(range[2], 10);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      return Math.min(maxCount, Math.max(1, end - start + 1));
    }
  }

  // Enumerated list: "races 5 & 6", "race 1, 2, 3", "r1 and r2"
  const listMatch = t.match(/\b(?:races?|r)\s*(\d+(?:\s*(?:,|&|\+|and|\/)\s*r?\d+)+)\b/);
  if (listMatch) {
    const numbers = listMatch[1].match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return Math.min(maxCount, numbers.length);
    }
  }

  return 1;
}
