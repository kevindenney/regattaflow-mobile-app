/**
 * Multi-Activity Schedule Types
 *
 * Data models for multi-activity races like the 4 Peaks race, where
 * crew members cycle between sailing, climbing, and resting activities.
 */

import type { WatchBlock, CrewMember as BaseCrewMember } from './watchSchedule';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/**
 * Types of activities that can occur during a multi-activity race
 */
export type ActivityType = 'sailing' | 'hove_to' | 'repositioning' | 'climb' | 'rest';

/**
 * Status of a crew member at any given time
 */
export type CrewStatus = 'on_boat' | 'climbing' | 'resting' | 'in_transit';

/**
 * Status of the boat during different activities
 */
export type BoatStatus = 'sailing' | 'hove_to' | 'repositioning' | 'at_anchor';

/**
 * Role of crew member in multi-activity race
 */
export type MultiActivityCrewRole = 'sailor' | 'climber' | 'both';

// =============================================================================
// FOUR PEAKS SPECIFIC
// =============================================================================

/**
 * The four peaks in the 4 Peaks race
 */
export const FOUR_PEAKS = [
  { id: 'lantau', name: 'Lantau Peak', location: 'Lantau Island', estimatedClimbHours: 2.5 },
  { id: 'stenhouse', name: 'Mount Stenhouse', location: 'Lamma Island', estimatedClimbHours: 3 },
  { id: 'violet_hill', name: 'Violet Hill', location: 'Hong Kong Island', estimatedClimbHours: 2.5 },
  { id: 'ma_on_shan', name: 'Ma On Shan', location: 'Sai Kung', estimatedClimbHours: 3 },
] as const;

export type FourPeakId = typeof FOUR_PEAKS[number]['id'];

/**
 * Default leg structure for 4 Peaks race
 */
export const FOUR_PEAKS_DEFAULT_LEGS = [
  {
    legNumber: 1,
    name: 'Leg 1: Start to Lantau',
    startLocation: 'Tai Tam Bay',
    endLocation: 'Lantau Island',
    estimatedDurationHours: 3,
    followedByPeak: 'lantau' as FourPeakId,
  },
  {
    legNumber: 2,
    name: 'Leg 2: Lantau to Lamma',
    startLocation: 'Lantau Island',
    endLocation: 'Lamma Island',
    estimatedDurationHours: 4,
    followedByPeak: 'stenhouse' as FourPeakId,
  },
  {
    legNumber: 3,
    name: 'Leg 3: Lamma to Repulse Bay',
    startLocation: 'Lamma Island',
    endLocation: 'Repulse Bay',
    estimatedDurationHours: 2,
    followedByPeak: 'violet_hill' as FourPeakId,
  },
  {
    legNumber: 4,
    name: 'Leg 4: Repulse Bay to Sai Kung',
    startLocation: 'Repulse Bay',
    endLocation: 'Sai Kung',
    estimatedDurationHours: 6,
    followedByPeak: 'ma_on_shan' as FourPeakId,
  },
  {
    legNumber: 5,
    name: 'Leg 5: Sai Kung to Finish',
    startLocation: 'Sai Kung',
    endLocation: 'Finish',
    estimatedDurationHours: 5,
    followedByPeak: null,
  },
];

// =============================================================================
// CREW TYPES
// =============================================================================

/**
 * Extended crew member with multi-activity role
 */
export interface MultiActivityCrewMember extends BaseCrewMember {
  /** Role in multi-activity race */
  multiActivityRole: MultiActivityCrewRole;
  /** Which peaks this crew member will climb (if climber/both) */
  assignedPeaks?: FourPeakId[];
}

/**
 * Crew status during a specific time period
 */
export interface CrewPeriodStatus {
  /** Crew member ID */
  crewId: string;
  /** Which period (leg ID or activity ID) */
  periodId: string;
  /** Status during this period */
  status: CrewStatus;
  /** Additional notes (e.g., "resting before Lantau climb") */
  notes?: string;
}

// =============================================================================
// LEG TYPES
// =============================================================================

/**
 * A leg of the race (sailing segment)
 */
export interface RaceLeg {
  /** Unique identifier */
  id: string;
  /** Display name (e.g., "Leg 1: Start to Lantau") */
  name: string;
  /** Sequential leg number */
  legNumber: number;
  /** Starting location */
  startLocation: string;
  /** Ending location */
  endLocation: string;
  /** Estimated duration in hours */
  estimatedDurationHours: number;
  /** Planned start time */
  startTime?: string; // ISO timestamp
  /** Planned end time */
  endTime?: string; // ISO timestamp
  /** Actual start time (filled during race) */
  actualStartTime?: string;
  /** Actual end time (filled during race) */
  actualEndTime?: string;
  /** Boat status during this leg */
  boatStatus: BoatStatus;
  /** Crew IDs who are on the boat during this leg */
  availableCrew: string[];
  /** Watch rotations within this leg (for longer legs) */
  watchBlocks?: WatchBlock[];
  /** Peak that follows this leg (if any) */
  followedByPeak?: FourPeakId | null;
  /** Notes about this leg */
  notes?: string;
}

// =============================================================================
// ACTIVITY TYPES
// =============================================================================

/**
 * An activity that occurs between or during legs (climb, rest, repositioning)
 */
export interface RaceActivity {
  /** Unique identifier */
  id: string;
  /** Type of activity */
  type: ActivityType;
  /** Display name (e.g., "Lantau Peak Climb") */
  name: string;
  /** Location of the activity */
  location?: string;
  /** Crew IDs participating in this activity */
  participants: string[];
  /** Estimated duration in hours */
  estimatedDurationHours: number;
  /** Planned start time */
  startTime?: string;
  /** Planned end time */
  endTime?: string;
  /** What the boat is doing during this activity */
  boatStatusDuring: BoatStatus;
  /** Crew IDs who remain on the boat during this activity */
  boatCrew?: string[];
  /** For climb activities: related peak ID */
  peakId?: FourPeakId;
  /** After which leg does this activity occur */
  afterLeg?: number;
  /** Notes about this activity */
  notes?: string;
}

// =============================================================================
// CLIMB TASK TYPES
// =============================================================================

/**
 * Time recording task status
 */
export type ClimbTaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Time recording for a peak climb
 */
export interface ClimbTask {
  /** Unique identifier */
  id: string;
  /** Which peak */
  peakId: FourPeakId;
  /** Peak name for display */
  peakName: string;
  /** Crew IDs who are climbing */
  climbers: string[];
  /** Climber names for display */
  climberNames: string[];
  /** Status of this climb */
  status: ClimbTaskStatus;
  /** Planned start time */
  plannedStartTime?: string;
  /** Time climber(s) left the boat */
  departureFromBoat?: string;
  /** Time reported to race control */
  reportedToRaceControl?: string;
  /** Time climber(s) arrived back at boat */
  arrivedBackAtBoat?: string;
  /** Total climb time in minutes (calculated or entered) */
  totalClimbTimeMinutes?: number;
  /** Notes about the climb */
  notes?: string;
}

// =============================================================================
// SCHEDULE TYPES
// =============================================================================

/**
 * Type of multi-activity race
 */
export type MultiActivityRaceType = 'four_peaks' | 'custom';

/**
 * Complete multi-activity race schedule
 */
export interface MultiActivitySchedule {
  /** Type of multi-activity race */
  raceType: MultiActivityRaceType;
  /** Race name */
  raceName: string;
  /** Race start time */
  raceStart: string; // ISO timestamp
  /** Estimated total race duration in hours */
  estimatedDuration: number;
  /** All crew members */
  crew: MultiActivityCrewMember[];
  /** All race legs */
  legs: RaceLeg[];
  /** All activities (climbs, rest periods, etc.) */
  activities: RaceActivity[];
  /** Climb task tracking (for peaks races) */
  climbTasks: ClimbTask[];
  /** Default watch length for within-leg rotations */
  watchLengthHours: number;
  /** Overall notes */
  notes?: string;
  /** When the schedule was created */
  createdAt: string;
  /** When the schedule was last updated */
  updatedAt: string;
}

// =============================================================================
// WIZARD STATE TYPES
// =============================================================================

/**
 * Steps in the Four Peaks wizard
 */
export type FourPeaksWizardStep = 'setup' | 'crew' | 'peaks' | 'review' | 'share';

/**
 * Form data during wizard creation
 */
export interface FourPeaksWizardFormData {
  /** Race start time */
  raceStartTime: string; // e.g., "10:30"
  /** Race date */
  raceDate: string; // ISO date
  /** Leg durations (can be customized) */
  legDurations: { [legNumber: number]: number };
  /** Crew with roles */
  crew: MultiActivityCrewMember[];
  /** Peak assignments */
  peakAssignments: { [peakId: string]: string[] }; // peak ID -> crew IDs
  /** Watch length for within-leg rotations */
  watchLengthHours: number;
  /** Notes */
  notes?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get peak info by ID
 */
export function getPeakById(peakId: FourPeakId) {
  return FOUR_PEAKS.find((p) => p.id === peakId);
}

/**
 * Get all peaks a crew member is assigned to climb
 */
export function getCrewPeaks(
  crewId: string,
  peakAssignments: { [peakId: string]: string[] }
): FourPeakId[] {
  return Object.entries(peakAssignments)
    .filter(([_, climbers]) => climbers.includes(crewId))
    .map(([peakId]) => peakId as FourPeakId);
}

/**
 * Check if crew member is climbing during a specific activity
 */
export function isCrewClimbing(
  crewId: string,
  activity: RaceActivity
): boolean {
  return activity.type === 'climb' && activity.participants.includes(crewId);
}

/**
 * Get crew available for boat duty during an activity
 */
export function getBoatCrewDuringActivity(
  allCrew: MultiActivityCrewMember[],
  activity: RaceActivity
): MultiActivityCrewMember[] {
  const climbingIds = new Set(activity.participants);
  return allCrew.filter((c) => !climbingIds.has(c.id));
}

/**
 * Calculate total climb time from timestamps
 */
export function calculateClimbTime(task: ClimbTask): number | undefined {
  if (task.departureFromBoat && task.arrivedBackAtBoat) {
    const departure = new Date(task.departureFromBoat).getTime();
    const arrival = new Date(task.arrivedBackAtBoat).getTime();
    return Math.round((arrival - departure) / (1000 * 60)); // minutes
  }
  return undefined;
}

/**
 * Format duration as human-readable string
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Get status color for activity type
 */
export function getActivityColor(type: ActivityType): string {
  switch (type) {
    case 'sailing':
      return '#007AFF'; // blue
    case 'hove_to':
      return '#FF9500'; // orange
    case 'repositioning':
      return '#5856D6'; // purple
    case 'climb':
      return '#34C759'; // green
    case 'rest':
      return '#8E8E93'; // gray
    default:
      return '#8E8E93';
  }
}

/**
 * Get display name for boat status
 */
export function getBoatStatusName(status: BoatStatus): string {
  switch (status) {
    case 'sailing':
      return 'Sailing';
    case 'hove_to':
      return 'Hove To';
    case 'repositioning':
      return 'Repositioning';
    case 'at_anchor':
      return 'At Anchor';
    default:
      return status;
  }
}
