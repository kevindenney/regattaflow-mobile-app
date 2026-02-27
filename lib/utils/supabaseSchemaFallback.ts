export type SchemaIdColumn = 'regatta_id' | 'race_id';

/**
 * Detects missing-column errors across Postgres + PostgREST error formats.
 */
export function isMissingSupabaseColumn(error: any, qualifiedColumn?: string): boolean {
  if (!error) return false;

  const codeMatch = error.code === '42703' || error.code === 'PGRST204';
  if (!codeMatch) return false;

  if (!qualifiedColumn) return true;
  return typeof error.message === 'string' && error.message.includes(qualifiedColumn);
}

export function isMissingIdColumn(
  error: any,
  table: string,
  column: SchemaIdColumn
): boolean {
  return isMissingSupabaseColumn(error, `${table}.${column}`);
}

/**
 * Detects missing relation/table errors from PostgREST/Supabase responses.
 */
export function isMissingRelationError(error: any): boolean {
  if (!error) return false;
  const message = typeof error?.message === 'string' ? error.message : '';
  return message.includes('relation') || message.includes('does not exist');
}
