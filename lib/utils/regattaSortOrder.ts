/**
 * Compute the next sort_order for a new regatta belonging to `userId`.
 *
 * Used at every regatta insert site so new regattas land at the END of the
 * user's manual order. Without this, every new regatta would default to
 * `sort_order = 0` and leap to the top of any reordered list.
 *
 * Mirrors the pattern in services/TimelineStepService.ts:createStep — both
 * tables now consistently assign `(max + 1)` on insert.
 */

import { supabase } from '@/services/supabase';

export async function computeNextRegattaSortOrder(userId: string): Promise<number> {
  const { data: maxRow } = await supabase
    .from('regattas')
    .select('sort_order')
    .eq('created_by', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((maxRow?.sort_order ?? 0) as number) + 1;
}
