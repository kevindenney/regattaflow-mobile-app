/**
 * Multi-Activity Schedule Generator
 *
 * Generates schedules for multi-activity races like the 4 Peaks race.
 * Handles leg-based scheduling with dynamic crew assignments based on
 * climbing and resting requirements.
 */

import { generateCrewId } from './generateSchedule';
import type { WatchBlock, WatchGroup } from '@/types/watchSchedule';
import {
  FOUR_PEAKS,
  FOUR_PEAKS_DEFAULT_LEGS,
  type FourPeakId,
  type MultiActivitySchedule,
  type MultiActivityCrewMember,
  type RaceLeg,
  type RaceActivity,
  type ClimbTask,
  type FourPeaksWizardFormData,
  type BoatStatus,
  getPeakById,
} from '@/types/multiActivitySchedule';

// =============================================================================
// SCHEDULE GENERATION
// =============================================================================

/**
 * Create a complete multi-activity schedule from wizard form data
 */
export function createMultiActivitySchedule(
  formData: FourPeaksWizardFormData
): MultiActivitySchedule {
  const {
    raceStartTime,
    raceDate,
    legDurations,
    crew,
    peakAssignments,
    watchLengthHours,
    notes,
  } = formData;

  // Parse start datetime
  const [hours, minutes] = raceStartTime.split(':').map(Number);
  const startDateTime = new Date(raceDate);
  startDateTime.setHours(hours, minutes, 0, 0);
  const raceStart = startDateTime.toISOString();

  // Generate legs with times
  const legs = generateLegs(raceStart, legDurations, crew, peakAssignments);

  // Generate activities (climbs)
  const activities = generateActivities(legs, crew, peakAssignments);

  // Generate climb tasks
  const climbTasks = generateClimbTasks(peakAssignments, crew);

  // Calculate total duration
  const estimatedDuration = calculateTotalDuration(legs, activities);

  // Generate watch blocks within longer legs
  const legsWithWatches = generateWithinLegWatches(
    legs,
    activities,
    crew,
    peakAssignments,
    watchLengthHours
  );

  const now = new Date().toISOString();

  return {
    raceType: 'four_peaks',
    raceName: '4 Peaks Race',
    raceStart,
    estimatedDuration,
    crew,
    legs: legsWithWatches,
    activities,
    climbTasks,
    watchLengthHours,
    notes,
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// LEG GENERATION
// =============================================================================

/**
 * Generate race legs with timing and crew assignments
 */
export function generateLegs(
  raceStart: string,
  legDurations: { [legNumber: number]: number },
  crew: MultiActivityCrewMember[],
  peakAssignments: { [peakId: string]: string[] }
): RaceLeg[] {
  const legs: RaceLeg[] = [];
  let currentTime = new Date(raceStart);

  for (const defaultLeg of FOUR_PEAKS_DEFAULT_LEGS) {
    const duration = legDurations[defaultLeg.legNumber] ?? defaultLeg.estimatedDurationHours;

    const startTime = new Date(currentTime);
    const endTime = new Date(currentTime);
    endTime.setMinutes(endTime.getMinutes() + duration * 60);

    // Determine which crew is available for this leg
    const availableCrew = getCrewAvailableForLeg(
      defaultLeg.legNumber,
      crew,
      peakAssignments
    );

    const leg: RaceLeg = {
      id: `leg-${defaultLeg.legNumber}`,
      name: defaultLeg.name,
      legNumber: defaultLeg.legNumber,
      startLocation: defaultLeg.startLocation,
      endLocation: defaultLeg.endLocation,
      estimatedDurationHours: duration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      boatStatus: 'sailing',
      availableCrew: availableCrew.map((c) => c.id),
      followedByPeak: defaultLeg.followedByPeak,
    };

    legs.push(leg);

    // Advance time by leg duration plus climb duration if applicable
    currentTime = endTime;

    // If there's a peak after this leg, account for climb time
    if (defaultLeg.followedByPeak) {
      const peak = getPeakById(defaultLeg.followedByPeak);
      if (peak) {
        currentTime.setMinutes(currentTime.getMinutes() + peak.estimatedClimbHours * 60);
      }
    }
  }

  return legs;
}

/**
 * Determine which crew members are available for a specific leg
 * Based on climbing assignments and rest requirements
 */
function getCrewAvailableForLeg(
  legNumber: number,
  crew: MultiActivityCrewMember[],
  peakAssignments: { [peakId: string]: string[] }
): MultiActivityCrewMember[] {
  // Build a map of which peaks come before each leg
  const peakBeforeLeg: { [legNumber: number]: FourPeakId | null } = {
    1: null, // First leg, no prior peak
    2: 'lantau', // After Lantau climb
    3: 'stenhouse', // After Mount Stenhouse climb
    4: 'violet_hill', // After Violet Hill climb
    5: 'ma_on_shan', // After Ma On Shan climb
  };

  // Build a map of which peaks come after each leg
  const peakAfterLeg: { [legNumber: number]: FourPeakId | null } = {
    1: 'lantau',
    2: 'stenhouse',
    3: 'violet_hill',
    4: 'ma_on_shan',
    5: null,
  };

  const available: MultiActivityCrewMember[] = [];

  for (const member of crew) {
    // Sailors are always available
    if (member.multiActivityRole === 'sailor') {
      available.push(member);
      continue;
    }

    // For climbers, check if they need to rest before/after their climbs
    const memberPeaks = member.assignedPeaks || [];

    // Check if member is resting before their upcoming climb
    const upcomingPeak = peakAfterLeg[legNumber];
    const needsRestBefore = upcomingPeak && memberPeaks.includes(upcomingPeak);

    // Check if member is recovering after their previous climb
    const previousPeak = peakBeforeLeg[legNumber];
    const needsRestAfter = previousPeak && memberPeaks.includes(previousPeak);

    // For leg 1: Climbers rest before Lantau climb
    if (legNumber === 1 && needsRestBefore) {
      // Climbers should rest before their first climb
      // But they can still be available in reduced capacity
      // For 4 Peaks, primary climbers (Eric/Ada) rest on Leg 1
      continue;
    }

    // For legs after a climb: Climbers may need recovery time
    // However, for 4 Peaks, they typically rejoin after being picked up
    // The key exception is the Lamma leg (leg 3) where Eric/Ada just got picked up
    if (legNumber === 3 && previousPeak === 'stenhouse' && memberPeaks.includes('stenhouse')) {
      // Just picked up from Lamma climb, need rest
      continue;
    }

    // For leg 4: Everyone who climbed recently needs rest
    // Kevin/Glen after Violet Hill, Eric/Ada before Ma On Shan
    if (legNumber === 4) {
      const justClimbedVioletHill = memberPeaks.includes('violet_hill');
      const willClimbMaOnShan = memberPeaks.includes('ma_on_shan');

      if (justClimbedVioletHill || willClimbMaOnShan) {
        // Climbers rest during this long leg
        continue;
      }
    }

    // For leg 5: Eric/Ada rest after Ma On Shan (initially)
    if (legNumber === 5 && previousPeak === 'ma_on_shan' && memberPeaks.includes('ma_on_shan')) {
      // Can still be available later in leg
      // We'll handle this with watch blocks
    }

    available.push(member);
  }

  return available;
}

// =============================================================================
// ACTIVITY GENERATION
// =============================================================================

/**
 * Generate race activities (climbs, repositioning, etc.)
 */
export function generateActivities(
  legs: RaceLeg[],
  crew: MultiActivityCrewMember[],
  peakAssignments: { [peakId: string]: string[] }
): RaceActivity[] {
  const activities: RaceActivity[] = [];

  for (const leg of legs) {
    if (!leg.followedByPeak) continue;

    const peak = getPeakById(leg.followedByPeak);
    if (!peak) continue;

    const climbers = peakAssignments[leg.followedByPeak] || [];
    if (climbers.length === 0) continue;

    // Calculate activity times
    const activityStart = leg.endTime ? new Date(leg.endTime) : new Date();
    const activityEnd = new Date(activityStart);
    activityEnd.setMinutes(activityEnd.getMinutes() + peak.estimatedClimbHours * 60);

    // Determine boat status during climb
    // Special case: Lamma (Mount Stenhouse) - boat repositions while climbers climb
    const isLamma = leg.followedByPeak === 'stenhouse';
    const boatStatus: BoatStatus = isLamma ? 'repositioning' : 'hove_to';

    // Get boat crew (non-climbers)
    const boatCrew = crew
      .filter((c) => !climbers.includes(c.id))
      .map((c) => c.id);

    const activity: RaceActivity = {
      id: `climb-${leg.followedByPeak}`,
      type: 'climb',
      name: `${peak.name} Climb`,
      location: peak.location,
      participants: climbers,
      estimatedDurationHours: peak.estimatedClimbHours,
      startTime: activityStart.toISOString(),
      endTime: activityEnd.toISOString(),
      boatStatusDuring: boatStatus,
      boatCrew,
      peakId: leg.followedByPeak,
      afterLeg: leg.legNumber,
      notes: isLamma
        ? 'Boat repositions around Lamma Island to pickup point while climbers ascend'
        : 'Boat hove to waiting for climbers to return',
    };

    activities.push(activity);
  }

  return activities;
}

// =============================================================================
// CLIMB TASK GENERATION
// =============================================================================

/**
 * Generate climb task tracking objects
 */
export function generateClimbTasks(
  peakAssignments: { [peakId: string]: string[] },
  crew: MultiActivityCrewMember[]
): ClimbTask[] {
  const tasks: ClimbTask[] = [];

  for (const peak of FOUR_PEAKS) {
    const climberIds = peakAssignments[peak.id] || [];
    if (climberIds.length === 0) continue;

    const climberNames = climberIds
      .map((id) => crew.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    const task: ClimbTask = {
      id: `task-${peak.id}`,
      peakId: peak.id,
      peakName: peak.name,
      climbers: climberIds,
      climberNames,
      status: 'pending',
    };

    tasks.push(task);
  }

  return tasks;
}

// =============================================================================
// WITHIN-LEG WATCH GENERATION
// =============================================================================

/**
 * Generate watch blocks within longer legs
 */
export function generateWithinLegWatches(
  legs: RaceLeg[],
  activities: RaceActivity[],
  crew: MultiActivityCrewMember[],
  peakAssignments: { [peakId: string]: string[] },
  watchLengthHours: number
): RaceLeg[] {
  const minLegDurationForWatches = 4; // Only generate watches for legs >= 4 hours

  return legs.map((leg) => {
    if (leg.estimatedDurationHours < minLegDurationForWatches) {
      // Short leg - no watches needed, full available crew is on duty
      return leg;
    }

    // Get available crew for this leg
    const availableCrew = crew.filter((c) => leg.availableCrew.includes(c.id));

    if (availableCrew.length < 2) {
      // Not enough crew for watch rotation
      return leg;
    }

    // Split crew into two watch groups
    const watchA = availableCrew.filter((_, i) => i % 2 === 0);
    const watchB = availableCrew.filter((_, i) => i % 2 !== 0);

    // Generate watch blocks
    const watchBlocks = generateWatchBlocksForLeg(
      leg.startTime!,
      leg.estimatedDurationHours,
      watchLengthHours,
      watchA,
      watchB
    );

    return {
      ...leg,
      watchBlocks,
    };
  });
}

/**
 * Generate watch blocks for a specific leg
 */
function generateWatchBlocksForLeg(
  legStartTime: string,
  legDurationHours: number,
  watchLengthHours: number,
  watchA: MultiActivityCrewMember[],
  watchB: MultiActivityCrewMember[]
): WatchBlock[] {
  const blocks: WatchBlock[] = [];
  let currentTime = new Date(legStartTime);
  let elapsedHours = 0;
  let currentWatch: WatchGroup = 'A';

  while (elapsedHours < legDurationHours) {
    const blockStartTime = new Date(currentTime);
    const remainingHours = legDurationHours - elapsedHours;
    const blockDuration = Math.min(watchLengthHours, remainingHours);

    const blockEndTime = new Date(currentTime);
    blockEndTime.setMinutes(blockEndTime.getMinutes() + blockDuration * 60);

    const crewForWatch = currentWatch === 'A' ? watchA : watchB;

    blocks.push({
      watch: currentWatch,
      startTime: blockStartTime.toISOString(),
      endTime: blockEndTime.toISOString(),
      durationHours: blockDuration,
      crew: crewForWatch.map((c) => c.name),
    });

    currentTime = blockEndTime;
    elapsedHours += blockDuration;
    currentWatch = currentWatch === 'A' ? 'B' : 'A';
  }

  return blocks;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate total race duration including all legs and activities
 */
export function calculateTotalDuration(
  legs: RaceLeg[],
  activities: RaceActivity[]
): number {
  const legDuration = legs.reduce((sum, leg) => sum + leg.estimatedDurationHours, 0);
  const activityDuration = activities.reduce(
    (sum, activity) => sum + activity.estimatedDurationHours,
    0
  );
  return legDuration + activityDuration;
}

/**
 * Format schedule for text sharing
 */
export function formatScheduleForShare(
  schedule: MultiActivitySchedule,
  raceName?: string
): string {
  const title = raceName || schedule.raceName || 'Watch Schedule';

  let text = `\u{23F0} WATCH SCHEDULE - ${title}\n`;
  text += `${'━'.repeat(40)}\n\n`;

  // Race summary
  const startDate = new Date(schedule.raceStart);
  text += `Start: ${startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })} at ${formatTime(startDate)}\n`;
  text += `Duration: ~${Math.round(schedule.estimatedDuration)} hours\n\n`;

  // Crew by role
  text += `\u{1F465} CREW ROLES\n`;
  const climbers = schedule.crew.filter(
    (c) => c.multiActivityRole === 'climber' || c.multiActivityRole === 'both'
  );
  const sailors = schedule.crew.filter((c) => c.multiActivityRole === 'sailor');

  if (climbers.length > 0) {
    text += `Climbers: ${climbers.map((c) => c.name).join(', ')}\n`;
  }
  if (sailors.length > 0) {
    text += `Sailors: ${sailors.map((c) => c.name).join(', ')}\n`;
  }

  text += `\n`;

  // Schedule by leg and activity
  text += `\u{1F4C5} SCHEDULE\n`;

  for (const leg of schedule.legs) {
    const legStart = leg.startTime ? formatTime(new Date(leg.startTime)) : '?';
    const legEnd = leg.endTime ? formatTime(new Date(leg.endTime)) : '?';

    text += `\n${leg.name} (${legStart} - ${legEnd}):\n`;

    // Available crew for this leg
    const availableCrewNames = schedule.crew
      .filter((c) => leg.availableCrew.includes(c.id))
      .map((c) => c.name);

    if (availableCrewNames.length > 0) {
      text += `  Boat crew: ${availableCrewNames.join(', ')}\n`;
    }

    // Watch blocks within leg
    if (leg.watchBlocks && leg.watchBlocks.length > 0) {
      text += `  Watches:\n`;
      for (const block of leg.watchBlocks) {
        const blockStart = formatTime(new Date(block.startTime));
        const blockEnd = formatTime(new Date(block.endTime));
        text += `    ${blockStart}-${blockEnd}: ${block.crew.join(', ')}\n`;
      }
    }

    // Activity after leg (climb)
    if (leg.followedByPeak) {
      const activity = schedule.activities.find((a) => a.peakId === leg.followedByPeak);
      if (activity) {
        const actStart = activity.startTime ? formatTime(new Date(activity.startTime)) : '?';
        const actEnd = activity.endTime ? formatTime(new Date(activity.endTime)) : '?';

        const climberNames = schedule.crew
          .filter((c) => activity.participants.includes(c.id))
          .map((c) => c.name);

        text += `\nDuring ${activity.name} (~${actStart}-${actEnd}):\n`;
        text += `  Climbers: ${climberNames.join(', ')}\n`;
        text += `  Boat: ${activity.boatStatusDuring === 'repositioning' ? 'Repositioning' : 'Hove to'}\n`;
        text += `  Tasks:\n`;
        text += `    \u{2610} Record departure from boat time\n`;
        text += `    \u{2610} Record time reporting to race control\n`;
        text += `    \u{2610} Record arrival back at boat time\n`;
        text += `    \u{2610} Record total climb time\n`;
      }
    }
  }

  text += `\n${'━'.repeat(40)}\n`;

  return text;
}

/**
 * Format time as HH:MM AM/PM
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get default form data for a new 4 Peaks schedule
 */
export function getDefaultFourPeaksFormData(): FourPeaksWizardFormData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const legDurations: { [key: number]: number } = {};
  for (const leg of FOUR_PEAKS_DEFAULT_LEGS) {
    legDurations[leg.legNumber] = leg.estimatedDurationHours;
  }

  return {
    raceStartTime: '10:30',
    raceDate: today.toISOString().split('T')[0],
    legDurations,
    crew: [],
    peakAssignments: {
      lantau: [],
      stenhouse: [],
      violet_hill: [],
      ma_on_shan: [],
    },
    watchLengthHours: 2,
  };
}

/**
 * Create a new crew member for multi-activity race
 */
export function createMultiActivityCrewMember(
  name: string,
  role: 'sailor' | 'climber' | 'both',
  assignedPeaks: FourPeakId[] = []
): MultiActivityCrewMember {
  return {
    id: generateCrewId(),
    name,
    watch: 'A' as const, // Default, will be reassigned during scheduling
    multiActivityRole: role,
    assignedPeaks: role === 'sailor' ? [] : assignedPeaks,
  };
}
