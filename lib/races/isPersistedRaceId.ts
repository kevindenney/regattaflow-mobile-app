/**
 * Returns true when a race/regatta id is a real persisted Postgres UUID —
 * i.e. safe to pass to `regatta_id=eq.{id}` Supabase filters.
 *
 * Returns false for:
 *   - null / undefined / empty
 *   - demo sample data ids (prefixed `demo-`)
 *   - optimistic client-side ids from in-flight timeline-step creation
 *     (prefixed `temp-`) — these are never valid regatta UUIDs and produce
 *     400 Bad Request if sent to `regatta_id=eq.{id}` URL filters
 *   - anything that doesn't match the canonical UUID shape
 *
 * Use this at the top of any hook or service call that fires a real DB
 * query keyed on a selectedRaceId/regatta_id that may transiently hold
 * a synthetic value.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPersistedRaceId(id: string | null | undefined): boolean {
  if (!id) return false;
  if (id.startsWith('demo-') || id.startsWith('temp-')) return false;
  return UUID_RE.test(id);
}
