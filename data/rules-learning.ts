/**
 * Learning content for racing rules and documents
 * Progressive disclosure: brief → detailed → academy links
 */

export interface RulesLearning {
  brief: string;
  detailed?: {
    whatItIs: string;
    whyItMatters: string;
    keyPoints: string[];
    commonIssues: string[];
  };
  academyLinks?: {
    courseId?: string;
    interactiveId?: string;
    videoUrl?: string;
    articleSlug?: string;
  };
}

/**
 * Learning content keyed by normalized rules key
 */
export const RULES_LEARNING: Record<string, RulesLearning> = {
  nor_review: {
    brief: 'Notice of Race contains regatta-wide rules',
    detailed: {
      whatItIs: 'The NOR is the advance notice that defines the regatta. It covers eligibility, schedule, courses, scoring, and special rules.',
      whyItMatters: 'NOR rules apply to the entire regatta. Missing a NOR requirement can prevent you from racing or result in penalty.',
      keyPoints: [
        'Entry requirements and deadlines',
        'Measurement and equipment rules',
        'Schedule of races',
        'Special course/area information',
        'Penalty systems in use',
        'Prize categories',
      ],
      commonIssues: [
        'Missing entry deadline',
        'Not meeting measurement requirements',
        'Wrong safety equipment',
        'Missing required documents',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'NORQuizInteractive',
    },
  },

  si_review: {
    brief: 'Sailing Instructions are race-specific rules',
    detailed: {
      whatItIs: 'SIs are the detailed rules for racing at the venue. They override RRS where specifically stated and define local procedures.',
      whyItMatters: 'SIs contain critical information like course descriptions, flag signals, time limits, and penalty systems. Know them or risk DSQ.',
      keyPoints: [
        'Signals and course designation',
        'Starting and finishing procedures',
        'Penalty systems (turns, SCP, etc.)',
        'Time limits',
        'Radio communications',
        'Restricted areas',
      ],
      commonIssues: [
        'Not knowing course signals',
        'Missing time limit',
        'Wrong penalty turns',
        'Sailing through restricted area',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SIInterpreterInteractive',
    },
  },

  course_signals: {
    brief: 'Flags and signals that designate the course',
    detailed: {
      whatItIs: 'Course signals tell you which course to sail. Usually flags or boards displayed before or at the start.',
      whyItMatters: 'Sailing the wrong course = DNF. Know how the RC will display course information.',
      keyPoints: [
        'Where course is displayed',
        'How to read course designation',
        'Mark identifiers',
        'Shortened course signal',
        'Change of course signal',
      ],
      commonIssues: [
        'Not seeing course signal',
        'Confusing mark identifiers',
        'Missing course change',
        'Wrong interpretation',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'CourseSignalsInteractive',
    },
  },

  starting_signals: {
    brief: 'Flags and sounds for start sequence',
    detailed: {
      whatItIs: 'Starting signals are the flags and sounds that define the start sequence. Standard is 5-4-1-0 minute pattern.',
      whyItMatters: 'Timing the start is everything. Know the signals to be at the line at maximum speed when the gun goes.',
      keyPoints: [
        'Class flag = 5 minutes',
        'Preparatory flag = 4 minutes',
        'Preparatory removed = 1 minute',
        'Start signal = gun/horn',
        'General recall = First Sub',
        'Individual recall = X flag',
      ],
      commonIssues: [
        'Missing flag in sun glare',
        'Not hearing sound signals',
        'Confusing different class starts',
        'Not knowing recall procedures',
      ],
    },
    academyLinks: {
      courseId: 'racing-starts',
      interactiveId: 'StartingSequenceInteractive',
    },
  },

  recall_procedures: {
    brief: 'What happens if boats are OCS',
    detailed: {
      whatItIs: 'Recall procedures handle boats that start too early. Individual recalls use X flag; general recalls restart everyone.',
      whyItMatters: 'Being over early and not coming back = OCS/DNS. Know when you\'re being recalled.',
      keyPoints: [
        'X flag = individual recall',
        'First Substitute = general recall',
        'Watch for your sail number',
        'Return and restart correctly',
        'Z flag/U flag/Black flag penalties',
      ],
      commonIssues: [
        'Not noticing recall flag',
        'Wrong side return',
        'Missing Black flag rule',
        'Not clearing the line',
      ],
    },
    academyLinks: {
      courseId: 'racing-starts',
      interactiveId: 'StartingSequenceInteractive',
    },
  },

  penalty_system: {
    brief: 'Understand penalties for rule infractions',
    detailed: {
      whatItIs: 'When you break a rule, you can take a penalty (turns) or face protest. SIs define what penalties apply.',
      whyItMatters: 'Taking penalty promptly = small cost. Going to protest room = bigger risk. Know the system in use.',
      keyPoints: [
        'Two-turns penalty (standard)',
        'One-turn in zone',
        'Scoring penalty (SCP)',
        'When penalty is required',
        'How to do penalty turns correctly',
      ],
      commonIssues: [
        'Not taking penalty when required',
        'Wrong number of turns',
        'Not clearing boats before turns',
        'Not knowing which system applies',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'RaceDocumentsAdvancedInteractive',
    },
  },

  protest_procedures: {
    brief: 'Formal process for rule disputes',
    detailed: {
      whatItIs: 'Protests are formal complaints about rule violations. Proper procedure is required for protest to be valid.',
      whyItMatters: 'If you\'re protested, you need to defend yourself. If you want to protest, you need proper procedure.',
      keyPoints: [
        'Hail "Protest" at time of incident',
        'Display protest flag promptly',
        'File written protest on time',
        'Include required information',
        'Know hearing procedures',
      ],
      commonIssues: [
        'No hail at incident',
        'Flag not displayed',
        'Missing filing deadline',
        'Incomplete protest form',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'RaceDocumentsAdvancedInteractive',
    },
  },

  right_of_way: {
    brief: 'Fundamental rules for avoiding collisions',
    detailed: {
      whatItIs: 'Right-of-way rules determine which boat must keep clear. Basic rules: starboard over port, windward keeps clear, astern keeps clear.',
      whyItMatters: 'Breaking right-of-way rules risks collision and disqualification. Know who has right of way instantly.',
      keyPoints: [
        'Port gives way to starboard',
        'Windward keeps clear of leeward',
        'Boat astern keeps clear',
        'Boat tacking/gybing keeps clear',
        'Limitations on right-of-way boat',
      ],
      commonIssues: [
        'Wrong call on overlap',
        'Not knowing when overlap starts',
        'Assuming too much room',
        'Not giving room to avoid',
      ],
    },
    academyLinks: {
      courseId: 'racing-rules',
      interactiveId: 'RightOfWayInteractive',
    },
  },

  mark_room: {
    brief: 'Rules for room at marks and obstructions',
    detailed: {
      whatItIs: 'Mark-room rules define what room boats must give at marks. Overlaps at zone entry determine entitlements.',
      whyItMatters: 'Mark roundings are tactical hotspots. Knowing mark-room rules prevents fouls and protests.',
      keyPoints: [
        'Zone = 3 boat lengths',
        'Overlap before zone matters',
        'Inside boat gets room',
        'Proper course at marks',
        'Limitations on mark-room',
      ],
      commonIssues: [
        'Late overlap attempts',
        'Not giving proper room',
        'Taking more than mark-room',
        'Wrong idea of zone size',
      ],
    },
    academyLinks: {
      courseId: 'racing-rules',
      interactiveId: 'MarkRoomInteractive',
    },
  },

  time_limits: {
    brief: 'Finish within time or score DNF',
    detailed: {
      whatItIs: 'Time limits define how long you have to finish. Missing the limit scores DNF even if you cross the line.',
      whyItMatters: 'In light air, time limits can catch out struggling boats. Know the limit and race accordingly.',
      keyPoints: [
        'Overall race time limit',
        'Mark time limits (if any)',
        'Extension provisions',
        'Finishing window after first boat',
      ],
      commonIssues: [
        'Not knowing time limit exists',
        'Wrong calculation of window',
        'Not racing to beat limit',
        'Assuming extension will be given',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SIInterpreterInteractive',
    },
  },

  safety_regulations: {
    brief: 'Required safety equipment and procedures',
    detailed: {
      whatItIs: 'Safety regulations specify required equipment and crew qualifications. May come from NOR, SI, class rules, or local authority.',
      whyItMatters: 'Missing safety requirements can prevent you from starting or result in disqualification. Safety first.',
      keyPoints: [
        'PFD requirements',
        'Safety equipment checklist',
        'Medical/emergency procedures',
        'Required qualifications',
        'Equipment inspections',
      ],
      commonIssues: [
        'Expired safety equipment',
        'Missing required items',
        'Failed pre-race inspection',
        'Wrong type of PFD',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  scoring_system: {
    brief: 'How results are calculated',
    detailed: {
      whatItIs: 'Scoring systems determine how race results translate to series standings. Low point is most common.',
      whyItMatters: 'Understanding scoring helps with risk/reward decisions during racing. Series implications affect race tactics.',
      keyPoints: [
        'Low Point Scoring System',
        'Points for finish positions',
        'Penalty scores (DSQ, DNF, etc.)',
        'Throw-outs/discards',
        'Tie-breaking procedures',
      ],
      commonIssues: [
        'Not knowing throw-out schedule',
        'Wrong risk calculation',
        'Forgetting DNF = big points',
        'Missing tie-breaker implications',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'RaceDocumentsAdvancedInteractive',
    },
  },

  class_rules: {
    brief: 'One-design or handicap class requirements',
    detailed: {
      whatItIs: 'Class rules define what equipment is allowed and measurement requirements. Keep boat class-legal.',
      whyItMatters: 'Illegal boat = DSQ for all races. Class rules ensure fair competition.',
      keyPoints: [
        'Measurement requirements',
        'Allowed modifications',
        'Prohibited equipment',
        'Sail inventory limits',
        'Crew weight limits (if any)',
      ],
      commonIssues: [
        'Equipment not class-legal',
        'Missed measurement deadline',
        'Wrong sail inventory',
        'Illegal modifications',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'RaceDocumentsBasicsInteractive',
    },
  },

  postponement_abandonment: {
    brief: 'Signals for delayed or canceled races',
    detailed: {
      whatItIs: 'AP flag delays start; N flag with others abandons races. Know what to do when racing is interrupted.',
      whyItMatters: 'Racing in wrong sequence or area after changes = wrong race. Stay alert to RC signals.',
      keyPoints: [
        'AP = postponement, wait',
        'N = abandonment',
        'AP over H = ashore',
        'AP over A = no more racing today',
        'Return to starting area procedures',
      ],
      commonIssues: [
        'Missing postponement flag',
        'Wrong reaction to abandonment',
        'Not returning to correct area',
        'Missing new start sequence',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'CourseSignalsInteractive',
    },
  },

  restricted_areas: {
    brief: 'Areas marked off-limits during racing',
    detailed: {
      whatItIs: 'SIs may define areas that are off-limits during racing. Sailing through = penalty or DSQ.',
      whyItMatters: 'Restricted areas may protect swimmers, commercial traffic, or shallow water. Know where you can\'t go.',
      keyPoints: [
        'Check SI for restricted areas',
        'How areas are marked',
        'Penalty for entering',
        'Emergency exceptions',
      ],
      commonIssues: [
        'Not reading SI carefully',
        'Taking shortcut through area',
        'Not seeing boundary marks',
        'Assuming area open after start',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SIInterpreterInteractive',
    },
  },
};

/**
 * Get learning content for a rules key
 */
export function getRulesLearning(key: string): RulesLearning | undefined {
  const normalized = key.toLowerCase().replace(/\s+/g, '_');
  return RULES_LEARNING[normalized];
}

/**
 * Get brief explanation for a rules topic
 */
export function getRulesBrief(key: string): string | undefined {
  return getRulesLearning(key)?.brief;
}
