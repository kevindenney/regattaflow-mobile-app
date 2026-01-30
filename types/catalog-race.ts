/**
 * Catalog Race Types
 *
 * Types for the public catalog of major regattas.
 */

// ============================================================================
// ENUMS & UNIONS
// ============================================================================

export type CatalogRaceType =
  | 'fleet'
  | 'distance'
  | 'match'
  | 'team'
  | 'offshore'
  | 'coastal'
  | 'dinghy';

export type RaceLevel =
  | 'world_championship'
  | 'continental'
  | 'national'
  | 'regional'
  | 'club'
  | 'open';

export type RaceRecurrence =
  | 'annual'
  | 'biennial'
  | 'quadrennial'
  | 'one_time'
  | 'series';

// ============================================================================
// CONFIG
// ============================================================================

export const RACE_TYPE_CONFIG: Record<CatalogRaceType, { label: string; icon: string }> = {
  fleet: { label: 'Fleet', icon: 'boat-outline' },
  distance: { label: 'Distance', icon: 'navigate-outline' },
  match: { label: 'Match', icon: 'swap-horizontal-outline' },
  team: { label: 'Team', icon: 'people-outline' },
  offshore: { label: 'Offshore', icon: 'compass-outline' },
  coastal: { label: 'Coastal', icon: 'water-outline' },
  dinghy: { label: 'Dinghy', icon: 'boat-outline' },
};

export const RACE_LEVEL_CONFIG: Record<RaceLevel, { label: string; shortLabel: string }> = {
  world_championship: { label: 'World Championship', shortLabel: 'Worlds' },
  continental: { label: 'Continental', shortLabel: 'Continental' },
  national: { label: 'National', shortLabel: 'National' },
  regional: { label: 'Regional', shortLabel: 'Regional' },
  club: { label: 'Club', shortLabel: 'Club' },
  open: { label: 'Open', shortLabel: 'Open' },
};

export const RACE_RECURRENCE_CONFIG: Record<RaceRecurrence, { label: string }> = {
  annual: { label: 'Annual' },
  biennial: { label: 'Biennial' },
  quadrennial: { label: 'Quadrennial' },
  one_time: { label: 'One-time' },
  series: { label: 'Series' },
};

// ============================================================================
// CORE INTERFACE
// ============================================================================

export interface CatalogRace {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  venue_id: string | null;
  organizing_authority: string | null;
  organizing_club_id: string | null;
  description: string | null;
  website_url: string | null;
  race_type: CatalogRaceType | null;
  boat_classes: string[];
  level: RaceLevel | null;
  recurrence: RaceRecurrence | null;
  typical_month: number | null;
  typical_duration_days: number | null;
  next_edition_date: string | null;
  country: string | null;
  region: string | null;
  follower_count: number;
  discussion_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPERS
// ============================================================================

export function formatRaceLocation(race: CatalogRace): string | null {
  const parts: string[] = [];
  if (race.region) parts.push(race.region);
  if (race.country) parts.push(race.country);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function formatTypicalMonth(month: number | null): string | null {
  if (!month || month < 1 || month > 12) return null;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1];
}
