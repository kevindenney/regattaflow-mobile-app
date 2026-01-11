/**
 * Learning content for tactical racing decisions
 * Progressive disclosure: brief → detailed → academy links
 */

export interface TacticsLearning {
  brief: string;
  detailed?: {
    whatItDoes: string;
    effect: string;
    keyConsiderations: string[];
    commonMistakes: string[];
  };
  academyLinks?: {
    courseId?: string;
    interactiveId?: string;
    videoUrl?: string;
    articleSlug?: string;
  };
}

/**
 * Learning content keyed by normalized topic key
 */
export const TACTICS_LEARNING: Record<string, TacticsLearning> = {
  start_line_bias: {
    brief: 'Which end of the start line gives an advantage',
    detailed: {
      whatItDoes: 'Line bias occurs when one end of the line is closer to the first mark. Even a 5-degree bias gives significant advantage.',
      effect: 'Starting at the favored end can give 2-5 boat lengths immediately. This is often the single biggest gain available.',
      keyConsiderations: [
        'Check bias before each start (it changes)',
        'Bias can shift during sequence',
        'Balance bias vs. crowd at favored end',
        'Consider which side you want to go',
      ],
      commonMistakes: [
        'Not checking bias at all',
        'Assuming yesterday\'s bias applies today',
        'Fighting for a favored end you can\'t win',
        'Ignoring strategic preference for bias',
      ],
    },
    academyLinks: {
      courseId: 'racing-starts',
      interactiveId: 'LineBiasInteractive',
    },
  },

  favored_end: {
    brief: 'Calculate which end to start based on wind and strategy',
    detailed: {
      whatItDoes: 'The favored end gives you more distance toward the first mark. Combine this with strategic side preference.',
      effect: 'Optimal start position = favored end + room to execute strategy. Sometimes sacrifice bias for strategic flexibility.',
      keyConsiderations: [
        'Sight the line (head to wind)',
        'Note which bow is higher',
        'Factor in first leg strategy',
        'Consider crowd distribution',
      ],
      commonMistakes: [
        'Only considering bias, not strategy',
        'Poor line sight technique',
        'Not adjusting for last-minute shifts',
        'Underestimating crowd at pin',
      ],
    },
    academyLinks: {
      courseId: 'racing-starts',
      interactiveId: 'FavoredEndInteractive',
    },
  },

  laylines: {
    brief: 'The sailing angle that allows you to just fetch the mark',
    detailed: {
      whatItDoes: 'Laylines define the minimum angle needed to reach the windward mark. They shift with wind and current changes.',
      effect: 'Sailing to layline early commits you to that side. Overstanding wastes distance. Understanding laylines prevents overstanding.',
      keyConsiderations: [
        'Calculate layline with current',
        'Factor in wind shifts',
        'Leave margin for safety',
        'Watch other boats for reference',
      ],
      commonMistakes: [
        'Hitting layline too early',
        'Not accounting for current',
        'Overstanding significantly',
        'Tacking short and having to pinch',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'LaylineCalculatorInteractive',
    },
  },

  wind_shifts: {
    brief: 'Changes in wind direction that affect optimal course',
    detailed: {
      whatItDoes: 'Wind shifts change your heading and VMG. Playing shifts correctly can gain many boat lengths.',
      effect: 'Tack on headers, stay on lifts. In oscillating breeze, work the shifts. In persistent shift, go toward new wind.',
      keyConsiderations: [
        'Is breeze oscillating or persistent?',
        'What is the shift range?',
        'Which side has the next shift?',
        'What does the forecast say?',
      ],
      commonMistakes: [
        'Tacking on every small header',
        'Missing persistent shift clues',
        'Not tracking shift pattern',
        'Fighting the shift pattern',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WindShiftPredictionInteractive',
    },
  },

  course_strategy: {
    brief: 'Understanding the course layout for tactical advantage',
    detailed: {
      whatItDoes: 'Course layout knowledge helps you plan your strategy before the race. Know marks, distances, and rounding directions.',
      effect: 'Familiarity with course shapes, mark locations, and leg lengths helps you anticipate tactical decisions and plan ahead.',
      keyConsiderations: [
        'Identify all marks and their order',
        'Note rounding directions (port/starboard)',
        'Understand course length and leg distances',
        'Look for geographic effects on each leg',
      ],
      commonMistakes: [
        'Not studying course before the race',
        'Missing mark identification on water',
        'Forgetting rounding direction changes',
        'Not planning for course variations',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'LaylineCalculatorInteractive',
    },
  },

  fleet_positioning: {
    brief: 'Where to position relative to other boats',
    detailed: {
      whatItDoes: 'Fleet position affects your tactical options and risk level. Position for clear air and strategic flexibility.',
      effect: 'Good position = clear air, room to maneuver, pressure on competition. Poor position = dirty air, limited options.',
      keyConsiderations: [
        'Stay between fleet and mark',
        'Avoid corners in close racing',
        'Cover threats, hunt opportunities',
        'Maintain clear air lanes',
      ],
      commonMistakes: [
        'Sailing to corners early',
        'Getting stuck in dirty air',
        'Over-covering one boat',
        'Losing touch with the fleet',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  clear_air: {
    brief: 'Undisturbed wind for maximum boat speed',
    detailed: {
      whatItDoes: 'Dirty air from boats ahead can slow you by 10-30%. Finding clear air is essential for speed.',
      effect: 'Clear air = full power, optimal angles. Dirty air = reduced speed, forced to bear off, falling behind.',
      keyConsiderations: [
        'Stay 3-4 boat lengths clear',
        'Wind shadow extends 10+ lengths',
        'Turbulence affects your sails',
        'The closer ahead, the worse it gets',
      ],
      commonMistakes: [
        'Sailing in obvious dirty air',
        'Thinking you can power through',
        'Lee-bowing too close',
        'Following boats into bad air',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  mark_rounding: {
    brief: 'Tactical approach and execution at marks',
    detailed: {
      whatItDoes: 'Mark roundings are high-value tactical moments. Good roundings gain positions, bad ones lose them.',
      effect: 'Wide-tight rounding at leeward mark maintains momentum. Proper inside overlap = room. Clean rounding = no protests.',
      keyConsiderations: [
        'Plan approach 5 boat lengths out',
        'Establish inside position early',
        'Execute wide-and-tight technique',
        'Communicate overlaps clearly',
      ],
      commonMistakes: [
        'Last-second approach decisions',
        'Fighting lost battles at marks',
        'Not holding proper course',
        'Forgetting mark-room rules',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'MarkRoundingTacticsInteractive',
    },
  },

  upwind_strategy: {
    brief: 'How to approach the windward leg',
    detailed: {
      whatItDoes: 'Upwind strategy combines start position, shift strategy, and fleet management into a coherent plan.',
      effect: 'Good strategy = sailing shortest path, playing shifts, maintaining options. Bad strategy = extra distance, wrong side.',
      keyConsiderations: [
        'Which side is favored overall?',
        'Where is the first shift?',
        'What will the fleet do?',
        'What are the geographic effects?',
      ],
      commonMistakes: [
        'No plan before the start',
        'Abandoning plan too quickly',
        'Following the fleet blindly',
        'Ignoring persistent shifts',
      ],
    },
    academyLinks: {
      courseId: 'racing-strategy',
      interactiveId: 'UpwindTacticsInteractive',
    },
  },

  downwind_strategy: {
    brief: 'How to approach the downwind legs',
    detailed: {
      whatItDoes: 'Downwind strategy focuses on VMG angles, surfing opportunities, and wind pressure.',
      effect: 'Good downwind sailing = fastest VMG, catching waves, staying in pressure. Can gain or lose multiple positions.',
      keyConsiderations: [
        'What are optimal VMG angles?',
        'Where is the best pressure?',
        'Are there surfing opportunities?',
        'Which gybe is favored?',
      ],
      commonMistakes: [
        'Sailing too deep in light air',
        'Missing gust opportunities',
        'Gybing too often',
        'Not using waves properly',
      ],
    },
    academyLinks: {
      courseId: 'racing-strategy',
      interactiveId: 'DownwindBasicsInteractive',
    },
  },

  course_sides: {
    brief: 'Choosing which side of the course to favor',
    detailed: {
      whatItDoes: 'Course side selection is based on wind shifts, current, pressure, and geographic effects. One side usually pays.',
      effect: 'Right side wins some races, left wins others. Understanding why lets you make the right call.',
      keyConsiderations: [
        'What does the forecast suggest?',
        'Where is the current favorable?',
        'Are there geographic wind bends?',
        'What happened in previous races?',
      ],
      commonMistakes: [
        'Always going to favorite side',
        'Ignoring new information',
        'Committing too early',
        'Not having a side preference',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  covering: {
    brief: 'Defensive sailing to protect a lead',
    detailed: {
      whatItDoes: 'Covering keeps boats behind you by staying between them and the mark. Essential when protecting positions.',
      effect: 'Good cover = boats behind can\'t pass without you seeing it. Loose cover = insurance. Tight cover = pressure.',
      keyConsiderations: [
        'Who are your main threats?',
        'How tight should the cover be?',
        'When to cover vs. sail your race?',
        'Cover the fleet or individuals?',
      ],
      commonMistakes: [
        'Covering too early in the race',
        'Covering wrong boats',
        'Cover so tight you slow down',
        'Forgetting to sail fast',
      ],
    },
    academyLinks: {
      courseId: 'racing-strategy',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  risk_management: {
    brief: 'When to take risks and when to play safe',
    detailed: {
      whatItDoes: 'Risk management balances potential gain against potential loss. Series standing affects risk appetite.',
      effect: 'Smart risks can win races. Unnecessary risks lose series. Match risk level to situation.',
      keyConsiderations: [
        'What is your series standing?',
        'What do you need in this race?',
        'What are the odds of success?',
        'What if it doesn\'t work out?',
      ],
      commonMistakes: [
        'Taking big risks early',
        'Not taking needed risks late',
        'Same approach every race',
        'Not knowing when to consolidate',
      ],
    },
    academyLinks: {
      courseId: 'racing-strategy',
      interactiveId: 'FleetPositioningInteractive',
    },
  },

  current_strategy: {
    brief: 'Using tidal current to your advantage',
    detailed: {
      whatItDoes: 'Current affects boat speed over ground. Sailing in favorable current and avoiding foul current gains positions.',
      effect: '1 knot of current over an hour is 1 nautical mile. In close racing, current is often the deciding factor.',
      keyConsiderations: [
        'Where is current strongest?',
        'How does current change across course?',
        'When does current turn?',
        'How to adjust laylines for current?',
      ],
      commonMistakes: [
        'Ignoring current completely',
        'Assuming uniform current',
        'Not checking current at marks',
        'Wrong layline calculations',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'CurrentReadingInteractive',
    },
  },

  starting_technique: {
    brief: 'Execution skills for a good start',
    detailed: {
      whatItDoes: 'Starting technique combines boat handling, timing, and awareness into a controlled start at speed.',
      effect: 'Good technique = hitting the line at speed, on time, with clear air. Worth multiple positions immediately.',
      keyConsiderations: [
        'Time and distance practice runs',
        'Boat handling in close quarters',
        'Awareness of boats around you',
        'Backup plans if blocked',
      ],
      commonMistakes: [
        'Starting too early (OCS)',
        'Starting too late (bow back)',
        'No speed at the gun',
        'Getting trapped by leeward boat',
      ],
    },
    academyLinks: {
      courseId: 'racing-starts',
      interactiveId: 'TimedRunInteractive',
    },
  },

  positioning_defense: {
    brief: 'Protecting your position from attacks',
    detailed: {
      whatItDoes: 'Defensive positioning protects you from boats trying to take your wind, position, or overlap.',
      effect: 'Good defense = maintaining clear air, staying between threats and mark, not giving away positions.',
      keyConsiderations: [
        'Where are threats coming from?',
        'What do rules allow/require?',
        'When to defend vs. keep racing?',
        'How aggressive should defense be?',
      ],
      commonMistakes: [
        'Not noticing threats early',
        'Breaking rules while defending',
        'Slowing down too much to defend',
        'Defending wrong boats',
      ],
    },
    academyLinks: {
      courseId: 'racing-starts',
      interactiveId: 'PositioningInteractive',
    },
  },
};

/**
 * Get learning content for a tactics key
 */
export function getTacticsLearning(key: string): TacticsLearning | undefined {
  const normalized = key.toLowerCase().replace(/\s+/g, '_');
  return TACTICS_LEARNING[normalized];
}

/**
 * Get brief explanation for a tactics topic
 */
export function getTacticsBrief(key: string): string | undefined {
  return getTacticsLearning(key)?.brief;
}
