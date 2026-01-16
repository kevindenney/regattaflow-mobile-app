/**
 * Timer Configuration Module
 *
 * Race-type-specific timer configurations for the countdown timer.
 * Different race types have different start sequences:
 * - Fleet/Team: Standard 5-minute RRS sequence
 * - Match: Shorter 4-minute sequence (typical match racing)
 * - Distance: Rolling start with no sequence timer
 */

export type RaceType = 'fleet' | 'distance' | 'match' | 'team';

export interface StartSequenceConfig {
  /** Duration of the start sequence in seconds */
  durationSeconds: number;
  /** Seconds at which to trigger haptic/audio alerts */
  alertIntervals: number[];
  /** Whether this race type supports sync button */
  usesSync: boolean;
  /** Human-readable label for the sequence */
  label: string;
}

/**
 * Timer configurations per race type
 */
export const TIMER_CONFIGS: Record<RaceType, StartSequenceConfig> = {
  fleet: {
    durationSeconds: 300, // 5 minutes
    alertIntervals: [300, 240, 60, 30, 10, 5, 4, 3, 2, 1, 0],
    usesSync: true,
    label: '5-Minute Sequence',
  },
  team: {
    durationSeconds: 300, // 5 minutes (same as fleet)
    alertIntervals: [300, 240, 60, 30, 10, 5, 4, 3, 2, 1, 0],
    usesSync: true,
    label: '5-Minute Sequence',
  },
  match: {
    durationSeconds: 240, // 4 minutes (typical match racing)
    alertIntervals: [240, 180, 60, 30, 10, 5, 4, 3, 2, 1, 0],
    usesSync: true,
    label: '4-Minute Sequence',
  },
  distance: {
    durationSeconds: 0, // Rolling start - no sequence
    alertIntervals: [],
    usesSync: false,
    label: 'Rolling Start',
  },
};

/**
 * Get timer configuration for a race type
 * Falls back to fleet config if unknown type
 */
export function getTimerConfig(raceType: RaceType | string | undefined): StartSequenceConfig {
  if (raceType && raceType in TIMER_CONFIGS) {
    return TIMER_CONFIGS[raceType as RaceType];
  }
  return TIMER_CONFIGS.fleet;
}

/**
 * Calculate sync time - rounds UP to nearest minute mark
 *
 * Examples:
 * - 4:47 (287s) → 5:00 (300s)
 * - 3:23 (203s) → 4:00 (240s)
 * - 0:45 (45s) → 1:00 (60s)
 * - 4:00 (240s) → 4:00 (240s) - no change if exactly on minute
 */
export function calculateSyncTime(currentSecondsRemaining: number): number {
  const currentMinutes = Math.floor(currentSecondsRemaining / 60);
  const currentSeconds = currentSecondsRemaining % 60;

  // If exactly on a minute mark, stay there
  if (currentSeconds === 0) {
    return currentSecondsRemaining;
  }

  // Otherwise, round up to next minute
  return (currentMinutes + 1) * 60;
}

/**
 * Check if a race type uses a traditional start sequence
 */
export function usesStartSequence(raceType: RaceType | string | undefined): boolean {
  const config = getTimerConfig(raceType);
  return config.durationSeconds > 0;
}
