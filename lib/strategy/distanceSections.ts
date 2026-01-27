/**
 * Distance Racing Strategy Sections
 *
 * Offshore/passage racing strategy phases:
 * - PASSAGE PLANNING: Route overview, weather windows, safety
 * - WEATHER ROUTING: Wind, current, routing options
 * - WATCH SCHEDULE: Crew rotation, rest periods
 * - CREW MANAGEMENT: Fatigue, nutrition, emergency protocols
 * - LEG N: Navigation and tactics per leg (dynamic)
 * - PEAK: Climbing strategy for multi-activity races like Four Peaks
 */

import type {
  DistanceRaceData,
  DynamicPhaseKey,
  PhaseInfo,
  RaceTypeStrategyConfig,
  StrategySectionMeta,
} from '@/types/raceStrategy';

/**
 * Static distance racing phases (always present)
 */
export const DISTANCE_STATIC_PHASES: PhaseInfo[] = [
  { key: 'passage', label: 'PASSAGE PLANNING' },
  { key: 'weatherRouting', label: 'WEATHER ROUTING' },
  { key: 'watchSchedule', label: 'WATCH SCHEDULE' },
  { key: 'crewManagement', label: 'CREW MANAGEMENT' },
];

/**
 * Static distance racing sections (always present)
 */
export const DISTANCE_STATIC_SECTIONS: StrategySectionMeta[] = [
  // Passage Planning
  {
    id: 'passage.routeOverview',
    phase: 'passage',
    title: 'Route Overview',
    icon: 'map-outline',
    description: 'High-level route planning and key waypoints',
    defaultTip:
      'Study the route chart carefully. Identify key decision points where conditions may dictate route changes.',
    raceTypes: ['distance'],
  },
  {
    id: 'passage.weatherWindows',
    phase: 'passage',
    title: 'Weather Windows',
    icon: 'weather-partly-cloudy',
    description: 'Identify optimal departure and arrival windows based on weather',
    defaultTip:
      'Look for weather windows that align your boat speed with favorable conditions. Avoid scheduling arrival during fronts.',
    raceTypes: ['distance'],
  },
  {
    id: 'passage.safetyConsiderations',
    phase: 'passage',
    title: 'Safety Considerations',
    icon: 'shield-check',
    description: 'Identify hazards, escape routes, and contingency plans',
    defaultTip:
      'Know your ports of refuge along the route. Have contingency plans for equipment failure or crew injury.',
    raceTypes: ['distance'],
  },
  // Weather Routing
  {
    id: 'weatherRouting.windStrategy',
    phase: 'weatherRouting',
    title: 'Wind Strategy',
    icon: 'weather-windy',
    description: 'Plan route based on forecast wind patterns',
    defaultTip:
      'Study GRIB files and identify where to position for optimal VMG. Consider the cost of sailing extra distance for better wind.',
    raceTypes: ['distance'],
  },
  {
    id: 'weatherRouting.currentTideStrategy',
    phase: 'weatherRouting',
    title: 'Current & Tide Strategy',
    icon: 'waves',
    description: 'Plan timing around tidal gates and currents',
    defaultTip:
      'Time your passage through tidal gates. Even small currents compound over long distances.',
    raceTypes: ['distance'],
  },
  {
    id: 'weatherRouting.routingOptions',
    phase: 'weatherRouting',
    title: 'Routing Options',
    icon: 'routes',
    description: 'Compare routing scenarios and decision points',
    defaultTip:
      'Run multiple routing scenarios. Identify where routes diverge and what conditions would favor each option.',
    raceTypes: ['distance'],
  },
  // Watch Schedule
  {
    id: 'watchSchedule.rotationPlan',
    phase: 'watchSchedule',
    title: 'Rotation Plan',
    icon: 'account-switch',
    description: 'Plan watch rotation timing and crew assignments',
    defaultTip:
      'Match watch length to expected conditions. Shorter watches in heavy weather, longer in light air.',
    raceTypes: ['distance'],
  },
  {
    id: 'watchSchedule.handoffProtocols',
    phase: 'watchSchedule',
    title: 'Handoff Protocols',
    icon: 'swap-horizontal',
    description: 'Define watch changeover procedures',
    defaultTip:
      'Establish clear handoff procedures: status report, weather update, upcoming waypoints, crew status.',
    raceTypes: ['distance'],
  },
  {
    id: 'watchSchedule.restPeriods',
    phase: 'watchSchedule',
    title: 'Rest Periods',
    icon: 'sleep',
    description: 'Plan crew rest and recovery',
    defaultTip:
      'Prioritize quality rest for off-watch crew. A well-rested crew makes better decisions.',
    raceTypes: ['distance'],
  },
  // Crew Management
  {
    id: 'crewManagement.fatigueManagement',
    phase: 'crewManagement',
    title: 'Fatigue Management',
    icon: 'battery-medium',
    description: 'Monitor and manage crew fatigue levels',
    defaultTip:
      'Track hours of sleep for each crew member. Rotate heavy positions to prevent burnout.',
    raceTypes: ['distance'],
  },
  {
    id: 'crewManagement.nutrition',
    phase: 'crewManagement',
    title: 'Nutrition',
    icon: 'food-apple',
    description: 'Plan meals and hydration strategy',
    defaultTip:
      'Schedule regular meals and snacks. Dehydration affects decision-making before physical performance.',
    raceTypes: ['distance'],
  },
  {
    id: 'crewManagement.emergencyProtocols',
    phase: 'crewManagement',
    title: 'Emergency Protocols',
    icon: 'alert-circle',
    description: 'Review emergency procedures and assignments',
    defaultTip:
      'Review MOB procedures before departure. Ensure all crew know their emergency assignments.',
    raceTypes: ['distance'],
  },
];

/**
 * Generate dynamic leg sections from race data
 */
export function generateDistanceLegSections(raceData: DistanceRaceData): {
  phases: PhaseInfo[];
  sections: StrategySectionMeta[];
} {
  const phases: PhaseInfo[] = [];
  const sections: StrategySectionMeta[] = [];

  // Use legs if provided, otherwise fall back to waypoints
  const legs = raceData.legs || [];

  if (legs.length === 0 && raceData.routeWaypoints) {
    // Generate legs from waypoints
    const waypoints = raceData.routeWaypoints;
    for (let i = 0; i < waypoints.length - 1; i++) {
      legs.push({
        legNumber: i + 1,
        name: `Leg ${i + 1}: ${waypoints[i].name} to ${waypoints[i + 1].name}`,
        startLocation: waypoints[i].name,
        endLocation: waypoints[i + 1].name,
        followedByPeak: null,
      });
    }
  }

  // Generate phase and sections for each leg
  legs.forEach((leg) => {
    const legPhaseKey = `leg-${leg.legNumber}` as DynamicPhaseKey;
    const legLabel = leg.name || `LEG ${leg.legNumber}`;

    // Add leg phase
    phases.push({
      key: legPhaseKey,
      label: legLabel.toUpperCase(),
    });

    // Add leg navigation section
    sections.push({
      id: `leg.${leg.legNumber}.navigation`,
      phase: legPhaseKey,
      title: 'Navigation',
      icon: 'navigation',
      description: `Navigation strategy for ${leg.startLocation} to ${leg.endLocation}`,
      defaultTip:
        'Plan your course considering current, wind, and obstacles. Identify key waypoints and decision points.',
      raceTypes: ['distance'],
      legIndex: leg.legNumber - 1,
    });

    // Add leg tactics section
    sections.push({
      id: `leg.${leg.legNumber}.tactics`,
      phase: legPhaseKey,
      title: 'Tactical Approach',
      icon: 'compass',
      description: `Tactical decisions for this leg`,
      defaultTip:
        'Consider shore effects, laylines, traffic separation, and positioning for the next leg.',
      raceTypes: ['distance'],
      legIndex: leg.legNumber - 1,
    });

    // If this leg is followed by a peak climb (Four Peaks), add peak section
    if (leg.followedByPeak && raceData.peaks) {
      const peak = raceData.peaks.find((p) => p.id === leg.followedByPeak);
      if (peak) {
        const peakPhaseKey = `peak-${peak.id}` as DynamicPhaseKey;

        // Add peak phase
        phases.push({
          key: peakPhaseKey,
          label: peak.name.toUpperCase(),
        });

        // Add peak climbing strategy section
        sections.push({
          id: `peak.${peak.id}.climbStrategy`,
          phase: peakPhaseKey,
          title: 'Climb Strategy',
          icon: 'mountain',
          description: `Strategy for the ${peak.name} climb at ${peak.location}`,
          defaultTip: `Estimated climb time: ${peak.estimatedClimbHours}h. Plan crew rest before departure and assign backup climbers.`,
          raceTypes: ['distance'],
          peakId: peak.id,
        });

        // Add peak crew assignment section
        sections.push({
          id: `peak.${peak.id}.crewAssignment`,
          phase: peakPhaseKey,
          title: 'Crew Assignment',
          icon: 'account-group',
          description: `Crew assignments for ${peak.name}`,
          defaultTip:
            'Assign primary and backup climbers. Ensure boat crew can sail short-handed during the climb.',
          raceTypes: ['distance'],
          peakId: peak.id,
        });

        // Add peak timing section
        sections.push({
          id: `peak.${peak.id}.timing`,
          phase: peakPhaseKey,
          title: 'Timing & Communication',
          icon: 'timer',
          description: `Timing and communication plan for ${peak.name}`,
          defaultTip:
            'Establish check-in times and communication protocols. Know the race control reporting requirements.',
          raceTypes: ['distance'],
          peakId: peak.id,
        });
      }
    }
  });

  return { phases, sections };
}

/**
 * Distance racing strategy configuration
 */
export const DISTANCE_RACING_CONFIG: RaceTypeStrategyConfig = {
  raceType: 'distance',
  phases: DISTANCE_STATIC_PHASES,
  staticSections: DISTANCE_STATIC_SECTIONS,
  generateDynamicSections: generateDistanceLegSections,
};
