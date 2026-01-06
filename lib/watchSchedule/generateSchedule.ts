/**
 * Watch Schedule Generator
 *
 * Generates watch rotation blocks for distance/offshore races.
 * Supports 4on/4off and 3on/3off watch systems.
 */

import type {
  WatchSystem,
  WatchGroup,
  CrewMember,
  WatchBlock,
  WatchSchedule,
} from '@/types/watchSchedule';
import { getWatchDuration, getCrewForWatch } from '@/types/watchSchedule';

// =============================================================================
// GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate watch blocks for a given race configuration
 *
 * @param system - Watch system (4on4off or 3on3off)
 * @param raceStart - ISO timestamp for race start
 * @param estimatedDuration - Estimated race duration in hours
 * @param crew - Array of crew members with watch assignments
 * @param startingWatch - Which watch starts first (defaults to A)
 * @returns Array of watch blocks covering the race duration
 */
export function generateWatchBlocks(
  system: WatchSystem,
  raceStart: string,
  estimatedDuration: number,
  crew: CrewMember[],
  startingWatch: WatchGroup = 'A'
): WatchBlock[] {
  const watchDuration = getWatchDuration(system);
  const blocks: WatchBlock[] = [];

  const startTime = new Date(raceStart);
  let currentTime = new Date(startTime);
  let currentWatch: WatchGroup = startingWatch;
  let elapsedHours = 0;

  // Generate blocks until we cover the estimated duration
  while (elapsedHours < estimatedDuration) {
    const blockStartTime = new Date(currentTime);

    // Calculate remaining hours - last block may be shorter
    const remainingHours = estimatedDuration - elapsedHours;
    const blockDuration = Math.min(watchDuration, remainingHours);

    // Calculate end time for this block
    const blockEndTime = new Date(currentTime);
    blockEndTime.setHours(blockEndTime.getHours() + blockDuration);

    // Get crew names for this watch
    const crewNames = getCrewForWatch(crew, currentWatch);

    blocks.push({
      watch: currentWatch,
      startTime: blockStartTime.toISOString(),
      endTime: blockEndTime.toISOString(),
      durationHours: blockDuration,
      crew: crewNames,
    });

    // Move to next block
    currentTime = blockEndTime;
    elapsedHours += blockDuration;
    currentWatch = currentWatch === 'A' ? 'B' : 'A';
  }

  return blocks;
}

/**
 * Create a complete watch schedule
 *
 * @param config - Configuration for the schedule
 * @returns Complete WatchSchedule object
 */
export function createWatchSchedule(config: {
  system: WatchSystem;
  raceStart: string;
  estimatedDuration: number;
  crew: CrewMember[];
  startingWatch?: WatchGroup;
  notes?: string;
}): WatchSchedule {
  const {
    system,
    raceStart,
    estimatedDuration,
    crew,
    startingWatch = 'A',
    notes,
  } = config;

  const blocks = generateWatchBlocks(
    system,
    raceStart,
    estimatedDuration,
    crew,
    startingWatch
  );

  const now = new Date().toISOString();

  return {
    system,
    crew,
    raceStart,
    estimatedDuration,
    blocks,
    notes,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format a time range for display
 * @param startTime - ISO timestamp
 * @param endTime - ISO timestamp
 * @returns Formatted string like "10:00 - 14:00"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Format a date and time for display
 * @param isoString - ISO timestamp
 * @returns Formatted string like "Wed, Jan 7 at 10:00"
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get total watch time for a specific watch group
 * @param blocks - Array of watch blocks
 * @param watch - Watch group to sum
 * @returns Total hours for that watch
 */
export function getTotalWatchHours(
  blocks: WatchBlock[],
  watch: WatchGroup
): number {
  return blocks
    .filter((block) => block.watch === watch)
    .reduce((total, block) => total + block.durationHours, 0);
}

/**
 * Count total watch periods for a specific watch group
 * @param blocks - Array of watch blocks
 * @param watch - Watch group to count
 * @returns Number of watch periods for that watch
 */
export function getWatchPeriodCount(
  blocks: WatchBlock[],
  watch: WatchGroup
): number {
  return blocks.filter((block) => block.watch === watch).length;
}

/**
 * Validate that crew is assigned to both watches
 * @param crew - Array of crew members
 * @returns Object with validation result and error message
 */
export function validateCrewAssignment(crew: CrewMember[]): {
  valid: boolean;
  error?: string;
} {
  const watchA = crew.filter((c) => c.watch === 'A');
  const watchB = crew.filter((c) => c.watch === 'B');

  if (crew.length === 0) {
    return { valid: false, error: 'At least one crew member is required' };
  }

  if (watchA.length === 0) {
    return { valid: false, error: 'Watch A has no crew assigned' };
  }

  if (watchB.length === 0) {
    return { valid: false, error: 'Watch B has no crew assigned' };
  }

  return { valid: true };
}

/**
 * Generate a unique ID for a crew member
 * @returns Unique string ID
 */
export function generateCrewId(): string {
  return `crew_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate progress percentage through the race at a given time
 * @param currentTime - ISO timestamp of current time
 * @param raceStart - ISO timestamp of race start
 * @param estimatedDuration - Estimated race duration in hours
 * @returns Progress percentage (0-100)
 */
export function calculateRaceProgress(
  currentTime: string,
  raceStart: string,
  estimatedDuration: number
): number {
  const current = new Date(currentTime).getTime();
  const start = new Date(raceStart).getTime();
  const durationMs = estimatedDuration * 60 * 60 * 1000;

  const elapsed = current - start;
  const progress = (elapsed / durationMs) * 100;

  return Math.max(0, Math.min(100, progress));
}

/**
 * Find which watch block is active at a given time
 * @param blocks - Array of watch blocks
 * @param currentTime - ISO timestamp to check
 * @returns Active block or null if no block is active
 */
export function findActiveBlock(
  blocks: WatchBlock[],
  currentTime: string
): WatchBlock | null {
  const current = new Date(currentTime).getTime();

  return (
    blocks.find((block) => {
      const start = new Date(block.startTime).getTime();
      const end = new Date(block.endTime).getTime();
      return current >= start && current < end;
    }) || null
  );
}
