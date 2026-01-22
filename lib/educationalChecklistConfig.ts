/**
 * Educational Checklist Configuration
 *
 * Defines the Pre-Race Preparation and Course Intelligence checklists
 * with associated educational lessons for each item.
 */

import type { ChecklistSectionConfig, EducationalChecklistItem } from '@/types/checklists';

// ============================================================================
// Pre-Race Preparation Items
// ============================================================================

// All race types for items that apply universally
const ALL_RACE_TYPES = ['fleet', 'match', 'team', 'distance'] as const;

export const PRE_RACE_PREPARATION_ITEMS: EducationalChecklistItem[] = [
  {
    id: 'nor_review',
    label: 'Review Notice of Race (NOR)',
    description: 'Read the NOR for entry requirements and race format',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'documents',
    toolType: 'full_wizard',
    toolId: 'nor_review',
    toolButtonLabel: 'Review Document',
    lesson: {
      id: 'nor_review_lesson',
      title: 'Understanding the Notice of Race',
      content: `The Notice of Race (NOR) is your first source of official information about a regatta. Published well before the event, it contains essential details about eligibility, entry requirements, schedule, and format.

Key sections to review: eligibility requirements (club membership, class rules), entry deadlines and fees, required documents (measurement certificates, insurance), schedule of events, and venue information. Pay special attention to any modifications to the Racing Rules of Sailing—these will be marked as changes to specific rules.

The NOR establishes the framework for the event. Understanding it ensures you meet all requirements before arriving at the venue and helps you plan your preparation timeline effectively.`,
      keyPoints: [
        'Check eligibility and entry requirements first',
        'Note entry deadlines and required documents',
        'Review the schedule for briefings and first start',
        'Look for rule modifications specific to this event',
      ],
      learningModuleSlug: 'racing-basics',
      learningModuleId: 'lesson-1-5-1',
    },
  },
  {
    id: 'si_review',
    label: 'Review Sailing Instructions (SI)',
    description: 'Study the SI for race procedures and signals',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'documents',
    toolType: 'full_wizard',
    toolId: 'si_review',
    toolButtonLabel: 'Review Document',
    lesson: {
      id: 'si_review_lesson',
      title: 'Mastering Sailing Instructions',
      content: `The Sailing Instructions (SI) contain the operational rules for racing. Unlike the NOR, the SI focuses on how racing will be conducted: start procedures, course configurations, finishing requirements, and protest procedures.

Critical sections include: schedule of races and warning signals, class flag assignments, racing area boundaries, course signals and mark descriptions, VHF channels, time limits, and penalty systems. Many races use unique course codes or shortened course procedures—understanding these before racing prevents confusion.

The SI may modify Racing Rules, so compare any rule changes against your RRS knowledge. Note any local rules about restricted areas, right-of-way near marks, or special starting procedures. The SI becomes your primary reference during the regatta.`,
      keyPoints: [
        'Memorize warning signal times and class flags',
        'Understand course signal systems and mark rounding',
        'Note VHF channel for race committee communications',
        'Review penalty systems (turns, scoring penalties)',
      ],
      learningModuleSlug: 'racing-basics',
      learningModuleId: 'lesson-1-5-1',
    },
  },
  {
    id: 'amendments_check',
    label: 'Check for Amendments',
    description: 'Look for any changes or updates to race documents',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'documents',
    toolType: 'full_wizard',
    toolId: 'amendments_viewer',
    toolButtonLabel: 'View Updates',
    lesson: {
      id: 'amendments_lesson',
      title: 'Staying Current with Amendments',
      content: `Race organizers frequently issue amendments to the SI or NOR based on weather forecasts, course changes, or administrative updates. Missing an amendment can result in disqualification or missed starts.

Amendments are typically posted on the official notice board (physical or online) and may be announced via VHF. They follow a numbering system (Amendment 1, 2, etc.) and clearly state what changes from the original document. Changes often include altered start times due to weather, course modifications, or mark replacements.

Check for amendments daily during a multi-day regatta, and always before the first start of each day. Set a reminder to check the notice board after arriving at the venue. Some events also post amendments on their website or send them via email to registered competitors.`,
      keyPoints: [
        'Check notice board daily for new amendments',
        'Amendments override original SI/NOR content',
        'Note the time amendments were posted',
        'Confirm via VHF if uncertain about changes',
      ],
    },
  },
  {
    id: 'vhf_channels',
    label: 'Note VHF Channels & Frequencies',
    description: 'Record radio channels for race communications',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'safety',
    toolType: 'full_wizard',
    toolId: 'vhf_input',
    toolButtonLabel: 'Set Channels',
    lesson: {
      id: 'vhf_lesson',
      title: 'VHF Radio Communications',
      content: `VHF radio is your lifeline to the race committee. The SI specifies the race channel (often 72 or 77 in the US, varying internationally) for official communications including postponements, course changes, and general recalls.

Monitor the race channel from the time you leave the dock. The RC may broadcast critical information—shortened courses, mark moves, or abandonment—that affects your race strategy. Keep transmissions brief and professional; the channel must remain clear for safety communications.

Many venues also designate a safety channel (typically Channel 16 internationally) for emergencies. Know both channels and how to switch quickly between them. Test your VHF before leaving the dock to ensure battery charge and clear transmission.`,
      keyPoints: [
        'Primary race channel for RC communications',
        'Channel 16 for international emergencies',
        'Monitor from launch until returning to dock',
        'Keep transmissions brief and professional',
      ],
    },
  },
  {
    id: 'scoring_system',
    label: 'Understand Scoring System',
    description: 'Know how results will be calculated',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'documents',
    toolType: 'full_wizard',
    toolId: 'scoring_calculator',
    toolButtonLabel: 'View Scoring',
    lesson: {
      id: 'scoring_lesson',
      title: 'Racing Scoring Systems',
      content: `Understanding the scoring system helps you make strategic decisions, especially in series racing. The most common system is Low Point, where first place scores 1 point, second scores 2, and so on. Lower total points win.

Key factors: discard rules (throw-outs) let you drop your worst race(s) after a certain number of races are completed. DNS, DNF, and DSQ typically score points equal to fleet size plus 1. Some series use bonus point systems or average scoring for tied boats.

For handicap racing, understand how ratings apply—whether time-on-time or time-on-distance, and when corrections are calculated. This affects tactical decisions like when to cover competitors versus sailing your own race. Review the SI's scoring section and know your standing entering each race.`,
      keyPoints: [
        'Low Point: lower total = better result',
        'Know discard rules and when they apply',
        'DNS/DNF/DSQ score fleet size + 1',
        'Handicap affects who you need to beat on corrected time',
      ],
    },
  },
];

// ============================================================================
// Course Intelligence Items
// ============================================================================

export const COURSE_INTELLIGENCE_ITEMS: EducationalChecklistItem[] = [
  {
    id: 'start_line_analysis',
    label: 'Identify Start Line Location & Bias',
    description: 'Analyze start line position and favored end',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'strategy',
    toolType: 'full_wizard',
    toolId: 'start_line_analyzer',
    toolButtonLabel: 'Analyze Line',
    lesson: {
      id: 'start_line_lesson',
      title: 'Reading the Start Line',
      content: `The start line sets up your entire race. Understanding line bias—which end offers an advantage—is fundamental to competitive sailing. A perfectly square line perpendicular to the wind is rare; most lines favor one end.

To identify bias: sight down the line and note which end is closer to the wind. The boat end (RC boat) is favored if the wind is from the right of perpendicular; the pin end favors if from the left. A 5-degree bias can mean a boat-length advantage.

Beyond bias, consider traffic patterns. Even at the favored end, crowding may cost more than the geometric advantage gains. Factor in your tactical preference—do you want to control others (start near fleet) or have freedom to execute your strategy (start where you can tack immediately)?

Practice line sights in the minutes before the start. The wind often shifts, changing the favored end.`,
      keyPoints: [
        'Sight down the line to identify bias',
        'Favored end is closer to the wind',
        'Consider crowding at the favored end',
        'Reassess bias as wind shifts before start',
      ],
      learningModuleSlug: 'winning-starts-first-beats',
      learningModuleId: 'lesson-3-2-1',
    },
  },
  {
    id: 'course_marks',
    label: 'Plot All Course Marks',
    description: 'Map mark locations and characteristics',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'navigation',
    toolType: 'full_wizard',
    toolId: 'course_map',
    toolButtonLabel: 'View Course',
    lesson: {
      id: 'course_marks_lesson',
      title: 'Knowing Your Course Marks',
      content: `Familiarity with mark locations prevents costly mistakes during racing. Study the SI's course diagrams and mark descriptions carefully. Know each mark's color, shape, and any distinguishing features.

For fixed marks, note GPS coordinates or ranges from landmarks. For temporary marks (inflatables), understand the RC's typical placement patterns—windward marks are often set at specific distances, and gate marks have standard separations.

Key mark information: rounding direction (port or starboard), any zone rules modifications, and whether marks are to be passed to port or starboard. Some courses use offset marks at the windward, or gates instead of a single leeward mark.

Visualize your approach to each mark before racing. Know your laylines and what other boats you might encounter. This mental preparation reduces decision-making load during the race.`,
      keyPoints: [
        'Know mark colors, shapes, and locations',
        'Understand rounding direction for each mark',
        'Note offset marks and gate configurations',
        'Pre-plan approaches and laylines',
      ],
    },
  },
  {
    id: 'wind_current_analysis',
    label: 'Analyze Wind & Current Direction',
    description: 'Study wind patterns and tidal currents',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'weather',
    toolType: 'full_wizard',
    toolId: 'weather_routing_wizard',
    toolButtonLabel: 'Weather Analysis',
    lesson: {
      id: 'wind_current_lesson',
      title: 'Wind and Current Strategy',
      content: `Wind and current are the invisible forces that determine race outcomes. Pre-race analysis of both gives you a strategic framework before you even launch.

Wind: Study historical patterns for the venue—thermal effects, geographic steering, and typical shift patterns. Note the forecast direction and any predicted shifts during your race window. Offshore venues often see wind backing throughout the day; coastal areas may experience sea breeze development.

Current: Obtain tide tables and understand current direction and strength for your race times. Current affects not just speed but pointing angles and laylines. Even 1 knot of current changes laylines by 10+ degrees in moderate wind.

Combine wind and current analysis: current against wind creates chop and affects wave patterns; current with wind flattens waves. Both affect boat speed and optimal sail trim. This environmental awareness separates prepared sailors from those reacting to conditions.`,
      keyPoints: [
        'Research historical wind patterns for the venue',
        'Check tide tables for current timing and strength',
        'Current affects laylines and pointing angles',
        'Wind against current creates rougher conditions',
      ],
      learningModuleSlug: 'race-preparation-mastery',
      learningModuleId: 'lesson-13-1-3',
    },
  },
  {
    id: 'leg_distances',
    label: 'Calculate Leg Distances & Laylines',
    description: 'Measure leg lengths and plan laylines',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'navigation',
    toolType: 'full_wizard',
    toolId: 'distance_calculator',
    toolButtonLabel: 'Calculate',
    lesson: {
      id: 'leg_distances_lesson',
      title: 'Calculating Legs and Laylines',
      content: `Knowing leg distances helps with time management, tactical planning, and recognizing opportunities. Longer legs offer more recovery time from poor starts; shorter legs reward aggressive tactics.

Laylines are the courses you must sail to fetch a mark without additional tacks. True laylines account for wind angle, boat pointing ability, and current. In a typical 45-degree pointing angle with a beat, your laylines are 90 degrees apart. Current shifts these angles—adverse current means you must sail higher, favorable current allows bearing off.

Pre-calculate laylines for different current scenarios. On the race course, you'll refine these based on actual conditions, but having baseline numbers provides a reference. Mark your laylines on your course chart.

Also note distance-based tactical positions: where can you split from the fleet? How long until you can judge if a side is paying? Understanding scale helps with risk management.`,
      keyPoints: [
        'Longer legs = more recovery time',
        'Laylines depend on wind angle + current',
        'Current shifts laylines significantly',
        'Pre-calculate for different scenarios',
      ],
    },
  },
  {
    id: 'restricted_areas',
    label: 'Identify Restricted Areas & Obstructions',
    description: 'Note any zones to avoid during racing',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'safety',
    toolType: 'full_wizard',
    toolId: 'restricted_areas_map',
    toolButtonLabel: 'View Map',
    lesson: {
      id: 'restricted_areas_lesson',
      title: 'Navigating Restrictions',
      content: `Every racing area has hazards and restrictions that affect your tactical options. Missing these in your preparation can result in penalties, damage, or dangerous situations.

Common restrictions include: shipping channels (often off-limits or require specific crossing rules), shallow areas (mark depths relative to your draft), marine protected zones, and areas reserved for other users (swim areas, anchored vessels). The SI usually defines these with coordinates or descriptions.

Fixed obstructions like rocks, jetties, or moored vessels affect laylines and mark approaches. Know their locations and give adequate clearance—remember that racing rules modify right-of-way near obstructions but don't eliminate the need for seamanship.

Map all restrictions on your course chart before racing. During the race, tactical pressure can narrow your focus—having restrictions pre-identified prevents sailing into problems while focused on competition.`,
      keyPoints: [
        'Shipping channels may have special rules',
        'Note shallow areas relative to your draft',
        'Fixed obstructions affect laylines',
        'Map restrictions before racing',
      ],
    },
  },
  {
    id: 'race_strategy',
    label: 'Plan Race Strategy & Game Plan',
    description: 'Develop your tactical approach',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'days_before',
    category: 'strategy',
    toolType: 'full_wizard',
    toolId: 'strategy_notes',
    toolButtonLabel: 'Plan Strategy',
    lesson: {
      id: 'race_strategy_lesson',
      title: 'Building Your Race Plan',
      content: `A race plan translates your preparation into actionable decisions. It's not a rigid script but a framework for making choices under pressure. Good plans are specific enough to guide action but flexible enough to adapt.

Structure your plan around key decisions: Which side of the first beat do you favor and why? What's your start strategy—pin, boat, or middle? Under what conditions would you abandon your initial plan? Who are your key competitors and how do they typically sail?

Include decision triggers: "If the wind shifts left 10 degrees, tack to starboard." "If I round the windward mark outside the top 10, sail the fleet's unfavored side." These if-then plans reduce decision time during racing.

Brief your crew on the plan. Everyone should understand the strategy, their role, and communication signals. A shared mental model keeps the boat working efficiently when pressure is high.`,
      keyPoints: [
        'Identify favored side of first beat',
        'Set decision triggers for plan changes',
        'Know your key competitors tactics',
        'Brief crew on strategy before start',
      ],
      learningModuleSlug: 'launch-phase-strategy',
      learningModuleId: 'lesson-14-1-1',
    },
  },
];

// ============================================================================
// Post-Race Review Items (Performance Analysis)
// ============================================================================

export const POST_RACE_REVIEW_ITEMS: EducationalChecklistItem[] = [
  {
    id: 'review_start_quality',
    label: 'Review Start Execution',
    description: 'Analyze your start compared to plan',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'tactics',
    toolType: 'full_wizard',
    toolId: 'review_start_quality',
    toolButtonLabel: 'Review',
    lesson: {
      id: 'start_review_lesson',
      title: 'Learning from Your Starts',
      content: `The start is often the most critical moment of the race, and reviewing your execution reveals patterns that improve future performance. Compare your planned start position and timing against what actually happened.

Key questions: Did you hit the line at full speed? Were you in the position you planned? How did your timing compare to boats around you? What forced any changes to your plan?

Analyze the first 30 seconds after the start—did you achieve clear air? Were you able to execute your first tactical move? If you were squeezed or forced into a defensive position, identify what you could do differently. Even good starts can be improved by studying the details.`,
      keyPoints: [
        'Compare planned vs actual start position',
        'Assess your timing relative to boats nearby',
        'Note what competitors did that affected you',
        'Identify one thing to do differently next time',
      ],
      learningModuleSlug: 'winning-starts-first-beats',
      learningModuleId: 'lesson-3-4-1',
    },
  },
  {
    id: 'review_upwind_performance',
    label: 'Review Upwind Legs',
    description: 'Analyze your windward performance',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'tactics',
    toolType: 'full_wizard',
    toolId: 'review_upwind_performance',
    toolButtonLabel: 'Review',
    lesson: {
      id: 'upwind_review_lesson',
      title: 'Analyzing Upwind Performance',
      content: `Upwind legs often determine race outcomes. Review your decision-making process: did you sail the correct side of the course? How well did you respond to wind shifts?

Consider boat speed—were you in the groove or struggling with settings? How did your pointing compare to nearby boats? If you lost positions upwind, identify whether it was strategic decisions, boat handling, or boat speed.

Review tacking efficiency: did you lose distance with each maneuver? Were your tacks smooth or did you stall? Understanding your upwind weaknesses helps prioritize practice sessions and tactical development.`,
      keyPoints: [
        'Evaluate side selection decisions',
        'Assess shift response timing',
        'Compare boat speed to competitors',
        'Note tacking efficiency',
      ],
      learningModuleSlug: 'winning-starts-first-beats',
      learningModuleId: 'lesson-3-5-1',
    },
  },
  {
    id: 'review_downwind_performance',
    label: 'Review Downwind Legs',
    description: 'Analyze your leeward performance',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'tactics',
    toolType: 'full_wizard',
    toolId: 'review_downwind_performance',
    toolButtonLabel: 'Review',
    lesson: {
      id: 'downwind_review_lesson',
      title: 'Analyzing Downwind Performance',
      content: `Downwind legs require different skills—wave surfing, gybe timing, and angle optimization. Review whether you sailed the fastest angles or sacrificed speed for tactical position.

In waves, did you catch runs and maximize surf time? Was your spinnaker or gennaker trim optimal? How did your VMG compare to boats nearby?

Gybing is critical downwind—were your gybes smooth and well-timed? Did you lose distance with each maneuver or maintain flow? If competitors gained on downwind legs, identify the specific factors contributing to their speed advantage.`,
      keyPoints: [
        'Evaluate VMG and sailing angles',
        'Assess wave surfing effectiveness',
        'Review gybe timing and execution',
        'Compare speed to nearby competitors',
      ],
    },
  },
  {
    id: 'review_mark_roundings',
    label: 'Review Mark Roundings',
    description: 'Analyze approaches and rounding quality',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'tactics',
    toolType: 'full_wizard',
    toolId: 'review_mark_roundings',
    toolButtonLabel: 'Review',
    lesson: {
      id: 'mark_rounding_lesson',
      title: 'Analyzing Mark Roundings',
      content: `Mark roundings are high-intensity moments where positions change rapidly. Review each rounding: did you approach on the layline or overshoot? How tight was your rounding arc?

Consider boat handling during the rounding—was the crew work smooth? Did you exit the mark in good shape, or did rushed execution cost you boat lengths?

At crowded marks, review your tactical positioning. Did you establish an inside overlap when advantageous? Were you forced wide by boats with rights? Understanding mark rounding dynamics helps you be more assertive in future races.`,
      keyPoints: [
        'Evaluate layline approach accuracy',
        'Assess rounding arc tightness',
        'Review crew coordination during roundings',
        'Note tactical gains or losses at marks',
      ],
    },
  },
  {
    id: 'review_tactical_decisions',
    label: 'Review Key Decisions',
    description: 'Analyze critical tactical choices',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'tactics',
    toolType: 'full_wizard',
    toolId: 'review_tactical_decisions',
    toolButtonLabel: 'Review',
    lesson: {
      id: 'tactical_decisions_lesson',
      title: 'Analyzing Key Decisions',
      content: `Every race has pivotal moments where a decision significantly affected your result. Identify 2-3 key decision points and analyze them in detail.

For each decision: What information did you have? What were your options? Why did you choose as you did? With hindsight, what would you do differently?

Pay special attention to decisions that felt right in the moment but didn't work out—understanding why helps refine your decision-making process. Similarly, review decisions that worked—was it skill or luck? Building pattern recognition improves future choices.`,
      keyPoints: [
        'Identify 2-3 pivotal decision points',
        'Analyze available information at each moment',
        'Consider alternative options you had',
        'Distinguish skill from luck in outcomes',
      ],
      learningModuleSlug: 'race-preparation-mastery',
      learningModuleId: 'lesson-13-2-1',
    },
  },
];

// ============================================================================
// Learning & Improvement Items
// ============================================================================

export const LEARNING_CAPTURE_ITEMS: EducationalChecklistItem[] = [
  {
    id: 'identify_key_learning',
    label: 'Identify Key Learning',
    description: 'What was the most important lesson?',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'strategy',
    toolType: 'full_wizard',
    toolId: 'identify_key_learning',
    toolButtonLabel: 'Reflect',
    lesson: {
      id: 'key_learning_lesson',
      title: 'Capturing Key Learnings',
      content: `Every race teaches something. The key is capturing that lesson while it's fresh—before the details fade and the insight is lost.

Focus on one primary learning. Trying to improve everything at once dilutes focus. Ask yourself: "If I could only remember one thing from this race, what would help me most?"

The best learnings are specific and actionable. Not "I need to start better" but "I need to be more aggressive establishing position in the final 30 seconds." Write it down in a way you'll understand weeks later.`,
      keyPoints: [
        'Focus on one primary learning',
        'Make it specific and actionable',
        'Write it down while fresh',
        'Connect it to something you can practice',
      ],
    },
  },
  {
    id: 'note_what_worked',
    label: 'Note What Worked Well',
    description: 'Capture your successes',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'strategy',
    toolType: 'full_wizard',
    toolId: 'note_what_worked',
    toolButtonLabel: 'Reflect',
    lesson: {
      id: 'what_worked_lesson',
      title: 'Recognizing Success Patterns',
      content: `It's natural to focus on mistakes, but recognizing what went well is equally important. Success patterns are your competitive advantages—know them so you can rely on them under pressure.

Review moments where you gained position or executed cleanly. What contributed to that success? Preparation? Boat handling? Good reads? Understanding your strengths helps you design race strategies that play to them.

Positive recognition also builds confidence. Acknowledge when you made good decisions, even if the outcome wasn't perfect due to factors outside your control.`,
      keyPoints: [
        'Identify 2-3 things that went well',
        'Understand why they worked',
        'Note patterns you can rely on',
        'Build confidence from successes',
      ],
    },
  },
  {
    id: 'plan_improvement_areas',
    label: 'Plan Improvement Areas',
    description: 'Set specific development goals',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'strategy',
    toolType: 'full_wizard',
    toolId: 'plan_improvement_areas',
    toolButtonLabel: 'Plan',
    lesson: {
      id: 'improvement_plan_lesson',
      title: 'Planning Improvement',
      content: `Improvement requires deliberate practice of specific skills. From your race review, identify 1-2 areas where focused practice would make the biggest difference.

Be specific: "Improve upwind boat speed" is too vague. "Practice roll tacking in light air" or "Work on hiking technique through full beat" gives you something concrete to do.

Create accountability—schedule practice time, find a partner, or set measurable goals. Review these areas before your next race to see if the practice translated to performance.`,
      keyPoints: [
        'Identify 1-2 specific improvement areas',
        'Make goals concrete and measurable',
        'Schedule time for deliberate practice',
        'Review progress before next race',
      ],
      learningModuleSlug: 'race-preparation-mastery',
      learningModuleId: 'lesson-13-3-1',
    },
  },
  {
    id: 'request_coach_feedback',
    label: 'Request Coach Feedback',
    description: 'Get external perspective on your performance',
    raceTypes: [...ALL_RACE_TYPES],
    phase: 'after_race',
    category: 'strategy',
    toolType: 'full_wizard',
    toolId: 'request_coach_feedback',
    toolButtonLabel: 'Request',
    lesson: {
      id: 'coach_feedback_lesson',
      title: 'Getting External Feedback',
      content: `Your own perspective is limited—you can only see from your boat. Coaches, fellow sailors, and observers often notice things you missed.

When requesting feedback, be specific about what you want to know. "How was my race?" invites vague responses. "I felt slow upwind in the second beat—did you notice anything?" gives the observer focus.

Be open to feedback that contradicts your perception. The gap between how you think you sailed and how it looked from outside often reveals blind spots. Thank people for honest feedback—it's more valuable than compliments.`,
      keyPoints: [
        'Ask specific questions about your performance',
        'Be open to surprising observations',
        'Seek video review if available',
        'Compare external view to your perception',
      ],
    },
  },
];

// ============================================================================
// Section Configurations
// ============================================================================

export const PRE_RACE_PREPARATION_CONFIG: ChecklistSectionConfig = {
  id: 'pre_race_preparation',
  title: 'Pre-Race Preparation',
  icon: 'FileText',
  description: 'Review essential race documents before race day',
  items: PRE_RACE_PREPARATION_ITEMS,
  defaultExpanded: true,
};

export const COURSE_INTELLIGENCE_CONFIG: ChecklistSectionConfig = {
  id: 'course_intelligence',
  title: 'Course Intelligence',
  icon: 'Map',
  description: 'Analyze the course and plan your strategy',
  items: COURSE_INTELLIGENCE_ITEMS,
  defaultExpanded: true,
};

export const POST_RACE_REVIEW_CONFIG: ChecklistSectionConfig = {
  id: 'post_race_review',
  title: 'Performance Analysis',
  icon: 'Target',
  description: 'Review your race performance in detail',
  items: POST_RACE_REVIEW_ITEMS,
  defaultExpanded: true,
};

export const LEARNING_CAPTURE_CONFIG: ChecklistSectionConfig = {
  id: 'learning_capture',
  title: 'Learning & Improvement',
  icon: 'GraduationCap',
  description: 'Capture learnings and plan improvement',
  items: LEARNING_CAPTURE_ITEMS,
  defaultExpanded: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all educational checklist items
 */
export function getAllEducationalItems(): EducationalChecklistItem[] {
  return [
    ...PRE_RACE_PREPARATION_ITEMS,
    ...COURSE_INTELLIGENCE_ITEMS,
    ...POST_RACE_REVIEW_ITEMS,
    ...LEARNING_CAPTURE_ITEMS,
  ];
}

/**
 * Get an educational item by its ID
 */
export function getEducationalItemById(id: string): EducationalChecklistItem | undefined {
  return getAllEducationalItems().find(item => item.id === id);
}

/**
 * Get all checklist section configs
 */
export function getAllSectionConfigs(): ChecklistSectionConfig[] {
  return [
    PRE_RACE_PREPARATION_CONFIG,
    COURSE_INTELLIGENCE_CONFIG,
    POST_RACE_REVIEW_CONFIG,
    LEARNING_CAPTURE_CONFIG,
  ];
}

/**
 * Get pre-race section configs (for days_before phase)
 */
export function getPreRaceSectionConfigs(): ChecklistSectionConfig[] {
  return [PRE_RACE_PREPARATION_CONFIG, COURSE_INTELLIGENCE_CONFIG];
}

/**
 * Get post-race section configs (for after_race phase)
 */
export function getPostRaceSectionConfigs(): ChecklistSectionConfig[] {
  return [POST_RACE_REVIEW_CONFIG, LEARNING_CAPTURE_CONFIG];
}
