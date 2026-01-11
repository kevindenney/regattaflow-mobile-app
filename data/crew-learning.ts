/**
 * Learning content for crew coordination and management
 * Progressive disclosure: brief → detailed → academy links
 */

export interface CrewLearning {
  brief: string;
  detailed?: {
    whatItIs: string;
    whyItMatters: string;
    bestPractices: string[];
    communicationTips: string[];
  };
  academyLinks?: {
    courseId?: string;
    interactiveId?: string;
    videoUrl?: string;
    articleSlug?: string;
  };
}

/**
 * Learning content keyed by normalized crew key
 */
export const CREW_LEARNING: Record<string, CrewLearning> = {
  role_assignments: {
    brief: 'Clear roles prevent confusion and conflicts',
    detailed: {
      whatItIs: 'Every crew member should know their primary job and backup responsibilities. Overlap causes confusion.',
      whyItMatters: 'Clear roles mean fast maneuvers, quick decisions, and no missed tasks. Ambiguity costs positions.',
      bestPractices: [
        'Assign primary and backup roles',
        'Brief before leaving dock',
        'Walk through each maneuver',
        'Establish who makes which calls',
        'Define communication protocol',
      ],
      communicationTips: [
        'Use crew names, not "hey you"',
        'Confirm understanding of assignments',
        'Repeat back critical instructions',
        'Signal when ready for maneuvers',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  crew_communication: {
    brief: 'Clear communication enables fast execution',
    detailed: {
      whatItIs: 'Standardized calls and hand signals ensure everyone knows what\'s happening, even in noisy conditions.',
      whyItMatters: 'Miscommunication leads to fouled maneuvers, missed opportunities, and crew frustration.',
      bestPractices: [
        'Establish standard calls for maneuvers',
        'Use hand signals as backup',
        'Keep radio/verbal traffic concise',
        'Confirm critical information',
        'Brief new terminology',
      ],
      communicationTips: [
        '"Ready to tack" - preparation call',
        '"Tacking" - execution call',
        '"Made it" - confirmation',
        'Repeat back numbers and directions',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  watch_schedule: {
    brief: 'Manage crew energy over long races',
    detailed: {
      whatItIs: 'For longer races, rotating watch schedules keep crew fresh and alert throughout.',
      whyItMatters: 'Tired crew make mistakes. Fresh crew are fast and safe. Plan rest strategically.',
      bestPractices: [
        'Rotate heavy work positions',
        'Schedule breaks before fatigue hits',
        'Keep critical positions staffed',
        'Consider individual strengths',
        'Plan for conditions changes',
      ],
      communicationTips: [
        'Announce watch changes clearly',
        'Brief relieving crew on situation',
        'Hand off tasks explicitly',
        'Note any issues for next watch',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  emergency_procedures: {
    brief: 'Know what to do when things go wrong',
    detailed: {
      whatItIs: 'Every crew member should know MOB, fire, collision, and other emergency procedures.',
      whyItMatters: 'Emergencies require instant, correct action. Practice before you need it.',
      bestPractices: [
        'Brief MOB procedure every race',
        'Know location of safety gear',
        'Assign emergency roles',
        'Practice recovery maneuvers',
        'Know first aid basics',
      ],
      communicationTips: [
        '"MOB!" - immediate alert',
        'Point at person in water',
        'Count heads regularly',
        'Clear, calm commands in emergency',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  pre_race_briefing: {
    brief: 'Align crew on plan before leaving dock',
    detailed: {
      whatItIs: 'A pre-race briefing ensures everyone knows the conditions, strategy, and their role.',
      whyItMatters: 'Briefed crew executes confidently. Unbriefed crew hesitates and questions.',
      bestPractices: [
        'Review weather forecast',
        'Discuss race strategy',
        'Cover SI key points',
        'Assign roles for the day',
        'Address questions',
      ],
      communicationTips: [
        'Keep briefing focused (5-10 min)',
        'Ask for questions and concerns',
        'Confirm everyone heard key points',
        'Schedule mid-race check-ins',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  maneuver_coordination: {
    brief: 'Synchronized crew work for clean maneuvers',
    detailed: {
      whatItIs: 'Tacks, gybes, sets, and douses require coordinated crew action. Practice builds speed.',
      whyItMatters: 'Smooth maneuvers maintain boat speed. Botched maneuvers lose positions.',
      bestPractices: [
        'Walk through maneuvers before race',
        'Use consistent command sequence',
        'Time-critical actions together',
        'Debrief failed maneuvers',
        'Practice in similar conditions',
      ],
      communicationTips: [
        '"Ready?" - check crew is prepared',
        '"Go!" - execution command',
        '"Clear" - confirmation complete',
        'Call timing for sheet work',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  tactical_input: {
    brief: 'Crew eyes on wind, boats, and course',
    detailed: {
      whatItIs: 'Crew should provide tactical information to the helm - wind shifts, boat positions, mark bearings.',
      whyItMatters: 'Multiple sets of eyes catch things the helm misses. Good info flow wins races.',
      bestPractices: [
        'Assign lookout responsibilities',
        'Report wind shifts with compass',
        'Track boats around you',
        'Call approaching boats clearly',
        'Watch for course changes',
      ],
      communicationTips: [
        '"Lift" / "Header" with degrees',
        '"Boat crossing" with sail number',
        '"Puff in 30 seconds"',
        'Clear, relevant information only',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WindShiftPredictionInteractive',
    },
  },

  crew_weight: {
    brief: 'Position crew weight for boat balance',
    detailed: {
      whatItIs: 'Crew weight placement affects boat trim, speed, and handling. Move weight for conditions.',
      whyItMatters: 'Wrong weight position can slow the boat significantly. Right weight = fast and balanced.',
      bestPractices: [
        'Move weight to windward upwind',
        'Move forward in light air',
        'Move aft in waves',
        'Keep movements smooth',
        'Balance boat side-to-side',
      ],
      communicationTips: [
        '"Hike!" - more weight needed',
        '"In a bit" - ease weight position',
        '"Forward" / "Aft" - trim adjustment',
        'Confirm position changes',
      ],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'HelmBalanceInteractive',
    },
  },

  sail_trimming: {
    brief: 'Continuous sail adjustment for speed',
    detailed: {
      whatItIs: 'Trimmers keep sails optimized for the conditions moment-to-moment.',
      whyItMatters: 'Well-trimmed sails = maximum speed. Stalled or flogging sails = slow.',
      bestPractices: [
        'Watch telltales constantly',
        'Adjust for every wind change',
        'Coordinate with helm',
        'Know target shapes for conditions',
        'Communicate trim changes',
      ],
      communicationTips: [
        '"Trim on" / "Ease"',
        '"Backwinding" - need adjustment',
        'Call when at optimal trim',
        'Report when sail shape changes',
      ],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'MainsailControlsInteractive',
    },
  },

  morale_energy: {
    brief: 'Keep crew positive and engaged',
    detailed: {
      whatItIs: 'Racing is mentally demanding. Positive crew energy improves performance and enjoyment.',
      whyItMatters: 'Frustrated crew stops trying. Engaged crew finds the extra speed.',
      bestPractices: [
        'Acknowledge good work',
        'Stay calm after mistakes',
        'Focus on solutions, not blame',
        'Celebrate small wins',
        'Keep perspective - it\'s a race',
      ],
      communicationTips: [
        '"Nice tack!"',
        '"We\'ll get it next time"',
        '"What can we do better?"',
        'Keep frustration in check',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  new_crew_integration: {
    brief: 'Bring new crew up to speed quickly',
    detailed: {
      whatItIs: 'New crew members need to learn the boat and crew dynamics. Good integration helps them contribute faster.',
      whyItMatters: 'Well-integrated new crew become assets. Poorly integrated crew slow everyone down.',
      bestPractices: [
        'Show boat layout and systems',
        'Explain standard calls',
        'Start with simpler roles',
        'Pair with experienced crew',
        'Ask about their experience',
      ],
      communicationTips: [
        'Encourage questions',
        'Explain "why" not just "what"',
        'Be patient with learning curve',
        'Provide constructive feedback',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  conflict_resolution: {
    brief: 'Handle disagreements constructively',
    detailed: {
      whatItIs: 'Racing is stressful and disagreements happen. How you handle them affects team performance.',
      whyItMatters: 'Unresolved conflicts fester. Addressed conflicts build trust.',
      bestPractices: [
        'Address issues after racing',
        'Focus on actions, not people',
        'Listen to all perspectives',
        'Find actionable solutions',
        'Move forward positively',
      ],
      communicationTips: [
        '"Let\'s talk about that later"',
        '"What would help?"',
        '"I felt..." not "You always..."',
        'Thank people for raising issues',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },
};

/**
 * Get learning content for a crew key
 */
export function getCrewLearning(key: string): CrewLearning | undefined {
  const normalized = key.toLowerCase().replace(/\s+/g, '_');
  return CREW_LEARNING[normalized];
}

/**
 * Get brief explanation for a crew topic
 */
export function getCrewBrief(key: string): string | undefined {
  return getCrewLearning(key)?.brief;
}
