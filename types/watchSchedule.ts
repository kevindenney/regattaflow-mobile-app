/**
 * Watch Schedule Types
 *
 * Data models for the Watch Schedule Creator tool used in distance/offshore racing
 * to plan crew watch rotations during long races.
 */

// =============================================================================
// WATCH SYSTEM TYPES
// =============================================================================

/**
 * Supported watch rotation systems
 * - 4on4off: Traditional 4 hours on, 4 hours off (2 watches)
 * - 3on3off: Shorter 3 hour rotations for larger crews
 */
export type WatchSystem = '4on4off' | '3on3off';

/**
 * Watch group identifier
 * Two watch groups alternate throughout the race
 */
export type WatchGroup = 'A' | 'B';

// =============================================================================
// CREW & SCHEDULE TYPES
// =============================================================================

/**
 * Individual crew member assigned to a watch
 */
export interface CrewMember {
  /** Unique identifier for this crew member */
  id: string;
  /** Crew member's name */
  name: string;
  /** Which watch group they're assigned to */
  watch: WatchGroup;
}

/**
 * A single watch block in the schedule
 */
export interface WatchBlock {
  /** Which watch group is on duty */
  watch: WatchGroup;
  /** Start time of this watch block */
  startTime: string; // ISO timestamp
  /** End time of this watch block */
  endTime: string; // ISO timestamp
  /** Duration in hours */
  durationHours: number;
  /** Names of crew members on this watch */
  crew: string[];
}

/**
 * Complete watch schedule for a race
 */
export interface WatchSchedule {
  /** Which rotation system is being used */
  system: WatchSystem;
  /** All crew members with their watch assignments */
  crew: CrewMember[];
  /** Race start time */
  raceStart: string; // ISO timestamp
  /** Estimated race duration in hours */
  estimatedDuration: number;
  /** Generated watch blocks */
  blocks: WatchBlock[];
  /** Optional notes about the schedule */
  notes?: string;
  /** When the schedule was created */
  createdAt: string; // ISO timestamp
  /** When the schedule was last updated */
  updatedAt: string; // ISO timestamp
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

/**
 * Steps in the Watch Schedule Creator wizard
 */
export type WatchScheduleStep = 'system' | 'crew' | 'timeline';

/**
 * Form data being collected during schedule creation
 */
export interface WatchScheduleFormData {
  system: WatchSystem | null;
  crew: CrewMember[];
  estimatedDuration: number;
  notes?: string;
}

// =============================================================================
// WATCH SYSTEM DESCRIPTIONS
// =============================================================================

export interface WatchSystemOption {
  id: WatchSystem;
  title: string;
  subtitle: string;
  description: string;
  duration: number; // hours per watch
  recommendedCrew: string;
}

export const WATCH_SYSTEM_OPTIONS: WatchSystemOption[] = [
  {
    id: '4on4off',
    title: 'Traditional',
    subtitle: '4 on / 4 off',
    description:
      'Two watches alternate every 4 hours. A proven system that provides good rest periods while maintaining watch continuity.',
    duration: 4,
    recommendedCrew: 'Best for 4-6 crew',
  },
  {
    id: '3on3off',
    title: 'Short Watch',
    subtitle: '3 on / 3 off',
    description:
      'Faster rotation with 3 hour watches. Reduces fatigue but requires more frequent handovers. Works well with larger crews.',
    duration: 3,
    recommendedCrew: 'Best for 6+ crew',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get watch duration in hours for a given system
 */
export function getWatchDuration(system: WatchSystem): number {
  return system === '4on4off' ? 4 : 3;
}

/**
 * Get display name for a watch system
 */
export function getWatchSystemName(system: WatchSystem): string {
  return system === '4on4off' ? '4 on / 4 off' : '3 on / 3 off';
}

/**
 * Get crew names for a specific watch group
 */
export function getCrewForWatch(
  crew: CrewMember[],
  watch: WatchGroup
): string[] {
  return crew.filter((c) => c.watch === watch).map((c) => c.name);
}
