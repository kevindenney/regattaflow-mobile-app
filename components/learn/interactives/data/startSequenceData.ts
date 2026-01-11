/**
 * Starting Sequence Data
 * Ported from BetterAt Sail Racing
 */

export interface FlagState {
  orange?: 'UP' | 'DOWN';
  class?: 'UP' | 'DOWN';
  p?: 'UP' | 'DOWN';
  i?: 'UP' | 'DOWN';
  z?: 'UP' | 'DOWN';
  black?: 'UP' | 'DOWN';
  u?: 'UP' | 'DOWN'; // U flag (Rule 30.3)
  x?: 'UP' | 'DOWN'; // Individual recall
}

export interface DeepDiveContent {
  whyItMatters?: string[];
  commonMistakes?: string[];
  advancedTactics?: string[];
  rulesAndRegulations?: string[];
  proTips?: string[];
}

export interface SequenceStep {
  time: number; // Seconds mark, e.g., -300 for 5 minutes
  label: string;
  visualState: FlagState;
  soundSignal: string;
  description: string;
  details?: string[]; // Basic details for quick reference
  deepDive?: DeepDiveContent; // Comprehensive deep dive content
  action?: 'MOVE' | 'HOLD';
  blueStart?: { x: number; y: number; rotate: number };
  redStart?: { x: number; y: number; rotate: number };
  audio?: 'six' | 'five' | 'four' | 'one' | 'start';
}

export interface PreparatoryFlagOption {
  flagId: 'p' | 'i' | 'z' | 'black' | 'u';
  imagePath: string;
  name: string;
  description: string;
}

export const RACING_SEQUENCE_STEPS: SequenceStep[] = [
  // ==================== RC ON STATION (6:00) ====================
  {
    time: -360, // 6:00
    label: 'RC on Station',
    visualState: { orange: 'UP', class: 'DOWN' },
    soundSignal: 'series of short blasts (attention horn)',
    description: 'The orange flag on the RC boat indicates it is on station and marks one end of the starting line.',
    details: [
      'A series of short horn blasts (typically 3-4 blasts) signals attention - the starting sequence is about to begin',
      'The RC boat displays an orange flag to show the starting line is set and marks one end of the line',
      'Boats should begin maneuvering in the starting area, observing wind conditions and line position',
      'Check wind direction and line bias before the sequence starts - this information is crucial for your start strategy',
      'The orange flag remains up throughout the sequence until the race starts',
      'Use this time to identify the favored end of the line and plan your approach',
      'Watch for other boats and maintain safe maneuvering distance',
    ],
    deepDive: {
      whyItMatters: [
        'The RC on Station signal is your first indication that the race committee has set the starting line and is ready to begin the sequence',
        'This is your opportunity to gather critical information about wind conditions, line position, and course setup before the sequence begins',
        'Understanding the line position relative to the wind helps you plan your approach strategy and identify the favored end',
        'Early observation of traffic patterns helps you avoid congestion and find clear air for your start',
        'The attention signal gives you time to mentally prepare and ensure your crew is ready for the sequence',
      ],
      commonMistakes: [
        'Ignoring the attention signal and not beginning to observe conditions early enough',
        'Failing to check wind direction and line bias before the sequence starts, leaving you unprepared',
        'Getting too close to other boats during pre-sequence maneuvering, creating unnecessary risk',
        'Not identifying the pin end mark clearly, leading to confusion about line position',
        'Starting your timing too early or not having a reliable timer ready',
        'Not communicating with your crew about observations and strategy before the sequence begins',
      ],
      advancedTactics: [
        'Use this time to take multiple wind readings from different positions to understand wind patterns and shifts',
        'Observe how other boats are positioning themselves - experienced sailors often reveal line bias through their positioning',
        'Check the RC boat\'s position relative to the pin - if it\'s significantly offset, one end may be heavily favored',
        'Look for visual indicators like ripples, flags, or telltales on other boats to confirm wind direction',
        'If conditions are shifty, note the timing and magnitude of shifts to predict future changes',
        'Position yourself where you can clearly see both the RC boat and pin end mark for accurate line sighting',
      ],
      rulesAndRegulations: [
        'The orange flag is not a racing signal itself - it simply indicates the RC boat is on station (RRS Definition: Starting Line)',
        'No racing rules apply yet - boats are free to maneuver without penalty until the warning signal',
        'The attention signal (series of short blasts) is not defined in the Racing Rules but is a common practice',
        'You must be able to see the RC boat and its signals - if you cannot, you may not be in the starting area',
        'The starting line is defined by the RC boat (orange flag) and the pin end mark - both must be visible',
      ],
      proTips: [
        'Start your stopwatch or timer when you hear the attention signal - this helps you track the full sequence',
        'Take a mental snapshot of wind direction, line position, and traffic - conditions can change quickly',
        'If you\'re unsure about line bias, position yourself near the middle of the line for maximum flexibility',
        'Watch experienced sailors in your fleet - their positioning often reveals valuable tactical information',
        'Use this time to check your equipment, ensure your crew is ready, and mentally prepare for the sequence',
        'In light air, boats may be slow to respond - give yourself extra time and space',
        'In heavy air, traffic can be more dangerous - stay further from the line and other boats',
      ],
    },
    action: 'MOVE',
    blueStart: { x: 250, y: 320, rotate: 90 },
    redStart: { x: 420, y: 305, rotate: 90 },
  },
  // Sailing east - every 5 seconds
  { time: -355, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 285, y: 318, rotate: 90 }, redStart: { x: 455, y: 303, rotate: 90 } },
  { time: -350, label: 'Maneuvering', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: 'Boats sail parallel to the starting line on starboard tack.', action: 'MOVE', blueStart: { x: 320, y: 315, rotate: 90 }, redStart: { x: 490, y: 300, rotate: 90 } },
  { time: -345, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 360, y: 314, rotate: 90 }, redStart: { x: 525, y: 299, rotate: 90 } },
  { time: -340, label: 'Maneuvering', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: 'Approaching the committee boat end of the line.', action: 'MOVE', blueStart: { x: 400, y: 312, rotate: 90 }, redStart: { x: 560, y: 298, rotate: 90 } },
  { time: -335, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 440, y: 311, rotate: 90 }, redStart: { x: 580, y: 297, rotate: 90 } },
  { time: -330, label: 'Maneuvering', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: 'Near starboard layline - time to tack.', action: 'MOVE', blueStart: { x: 480, y: 310, rotate: 90 }, redStart: { x: 600, y: 295, rotate: 90 } },
  // Tack to port - bow turns THROUGH the wind (counterclockwise: 90° → 45° → 0° → 315° → 270°)
  { time: -327, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 495, y: 310, rotate: 45 }, redStart: { x: 598, y: 296, rotate: 45 } },
  { time: -325, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 505, y: 311, rotate: 0 }, redStart: { x: 596, y: 297, rotate: 0 } },
  { time: -323, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 512, y: 312, rotate: 315 }, redStart: { x: 592, y: 298, rotate: 315 } },
  { time: -320, label: 'Maneuvering', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: 'Boats tack onto port and sail back toward the pin.', action: 'MOVE', blueStart: { x: 520, y: 315, rotate: 270 }, redStart: { x: 580, y: 300, rotate: 270 } },
  { time: -315, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 485, y: 317, rotate: 270 }, redStart: { x: 555, y: 303, rotate: 270 } },
  { time: -310, label: 'Maneuvering', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: 'Sailing west on port tack.', action: 'MOVE', blueStart: { x: 450, y: 318, rotate: 270 }, redStart: { x: 530, y: 305, rotate: 270 } },
  { time: -305, label: '', visualState: { orange: 'UP', class: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 415, y: 319, rotate: 270 }, redStart: { x: 500, y: 307, rotate: 270 } },
  // ==================== WARNING SIGNAL (5:00) ====================
  {
    time: -300, // 5:00 - Warning Signal
    label: 'Warning Signal',
    visualState: { orange: 'UP', class: 'UP' },
    soundSignal: '1 sound (horn)',
    description: 'The Class Flag is raised. The starting sequence has officially begun!',
    details: [
      'Class flag goes up - your class is starting in 5 minutes (this is the official start of the sequence)',
      'One single horn blast signals the warning - this is your reference point for all timing',
      'Start your timing from this signal - use a countdown timer or watch to track the sequence',
      'Begin planning your approach strategy - consider wind direction, line bias, and traffic',
      'The class flag is specific to your boat class (e.g., J/24, Laser, etc.)',
      'If multiple classes are racing, each will have their own warning signal at different times',
      'The standard sequence is: 5 minutes (Warning) → 4 minutes (Preparatory) → 1 minute (One Minute) → 0 (Start)',
      'During this time, boats typically sail parallel to the starting line, observing conditions',
    ],
    deepDive: {
      whyItMatters: [
        'The Warning Signal marks the official beginning of the starting sequence - all timing is based on this moment',
        'This is when the Race Committee commits to starting your class at a specific time, allowing you to plan your approach',
        'The 5-minute countdown gives you time to observe conditions, position yourself, and execute your start strategy',
        'Understanding the sequence timing is critical - mistakes here can lead to being over early or late to the line',
        'The class flag ensures you know which start you\'re preparing for in multi-class races',
      ],
      commonMistakes: [
        'Not starting your timer immediately when the warning signal sounds, leading to timing errors',
        'Failing to identify which class flag is yours in multi-class races, preparing for the wrong start',
        'Not paying attention to the signal and missing the start of the sequence entirely',
        'Assuming all classes start at the same time - each class has its own 5-minute sequence',
        'Not using a reliable timing device - phone timers can be unreliable, use a dedicated sailing watch',
      ],
      advancedTactics: [
        'Use the 5-minute period to take multiple wind readings and identify wind patterns or oscillations',
        'Observe how the fleet is positioning itself - this can reveal line bias and favored approaches',
        'Plan your approach based on wind conditions: in light air, start near the favored end; in heavy air, consider a conservative position',
        'If the wind is shifting, note the timing and magnitude of shifts to predict the wind at the start',
        'Position yourself where you can clearly see the RC boat and all signals throughout the sequence',
        'Use this time to communicate with your crew about strategy, timing, and responsibilities',
      ],
      rulesAndRegulations: [
        'RRS 26: The warning signal is made 5 minutes before the starting signal (RRS 26.1)',
        'The class flag must be displayed from the warning signal until the starting signal (RRS 26.1)',
        'The warning signal is one sound signal (RRS 26.1)',
        'If the race is postponed or abandoned after the warning signal, a new sequence will begin',
        'The starting line is defined by the RC boat and the pin end mark - both must be visible',
      ],
      proTips: [
        'Always use a dedicated sailing timer or watch - phone timers can be unreliable or drain battery',
        'Start your timer the moment you hear the horn - don\'t wait to see the flag',
        'In multi-class races, know your class flag and listen for your specific warning signal',
        'Use the 5-minute period to finalize your strategy but stay flexible if conditions change',
        'Practice timing drills to develop an internal sense of the sequence',
        'If you miss the warning signal, look for the class flag and start your timer immediately',
        'Keep your timer visible and accessible - you\'ll need to check it frequently during the sequence',
      ],
    },
    action: 'MOVE',
    blueStart: { x: 380, y: 320, rotate: 270 },
    redStart: { x: 470, y: 308, rotate: 270 },
    audio: 'five',
  },
  { time: -295, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 350, y: 321, rotate: 270 }, redStart: { x: 440, y: 310, rotate: 270 } },
  { time: -290, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: 'Continue sailing toward the pin end.', action: 'MOVE', blueStart: { x: 320, y: 322, rotate: 270 }, redStart: { x: 410, y: 312, rotate: 270 } },
  { time: -285, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 290, y: 324, rotate: 270 }, redStart: { x: 380, y: 314, rotate: 270 } },
  { time: -280, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: 'Approaching the pin end.', action: 'MOVE', blueStart: { x: 260, y: 325, rotate: 270 }, redStart: { x: 350, y: 315, rotate: 270 } },
  // Tack to starboard - bow turns THROUGH the wind (clockwise: 270° → 315° → 0° → 45° → 90°)
  { time: -277, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 252, y: 326, rotate: 315 }, redStart: { x: 340, y: 316, rotate: 315 } },
  { time: -275, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 246, y: 327, rotate: 0 }, redStart: { x: 332, y: 317, rotate: 0 } },
  { time: -273, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 242, y: 328, rotate: 45 }, redStart: { x: 325, y: 318, rotate: 45 } },
  { time: -270, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: 'Boats tack near the pin and head back east.', action: 'MOVE', blueStart: { x: 240, y: 328, rotate: 90 }, redStart: { x: 320, y: 318, rotate: 90 } },
  { time: -265, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 270, y: 327, rotate: 90 }, redStart: { x: 350, y: 317, rotate: 90 } },
  { time: -260, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: 'Sailing east on starboard tack.', action: 'MOVE', blueStart: { x: 300, y: 325, rotate: 90 }, redStart: { x: 380, y: 315, rotate: 90 } },
  { time: -255, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 330, y: 324, rotate: 90 }, redStart: { x: 415, y: 313, rotate: 90 } },
  { time: -250, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: 'Continue east toward the RC boat.', action: 'MOVE', blueStart: { x: 360, y: 322, rotate: 90 }, redStart: { x: 450, y: 310, rotate: 90 } },
  { time: -245, label: '', visualState: { orange: 'UP', class: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 390, y: 320, rotate: 90 }, redStart: { x: 485, y: 308, rotate: 90 } },
  // ==================== PREPARATORY SIGNAL (4:00) ====================
  {
    time: -240, // 4:00 - Preparatory Signal
    label: 'Preparatory Signal',
    visualState: { orange: 'UP', class: 'UP', p: 'UP' },
    soundSignal: '1 sound (horn)',
    description: 'The Preparatory (P) flag is raised. 4 minutes until start!',
    details: [
      'P flag (blue and white checkered) goes up - 4 minutes until start',
      'One horn sound signals preparatory - this is a critical timing point',
      'Rule 30.1 (I flag) or penalties may now apply - check the sailing instructions for specific rules',
      'Boats should be in the starting area - you must be able to see the RC boat and flags',
      'The P flag indicates the preparatory period - boats must follow specific rules during this time',
      'If the I flag is displayed with the P flag, boats must pass through the starting line before the 1-minute signal',
      'The Z flag (black with yellow stripe) means a 20% penalty applies to boats over the line early',
      'The Black flag means immediate disqualification for boats over the line early',
      'Use this time to finalize your position and approach strategy',
      'Watch for line bias - one end of the line may be favored due to wind angle',
    ],
    deepDive: {
      whyItMatters: [
        'The Preparatory Signal is when specific racing rules begin to apply, making it a critical transition point',
        'This is your last chance to make major position adjustments before the final minute',
        'Understanding which penalty flags are displayed (I, Z, Black) is essential to avoid costly mistakes',
        'The 4-minute mark is when most boats finalize their approach strategy',
        'This signal confirms the start is proceeding as planned - any changes after this point are rare',
      ],
      commonMistakes: [
        'Not checking which penalty flags are displayed (I, Z, Black) and violating rules unknowingly',
        'Failing to be in the starting area - you must be able to see the RC boat and its signals',
        'Not understanding Rule 30.1 (I flag) requirements and failing to cross the line before 1 minute',
        'Getting too close to the line too early, leaving no room to adjust if you\'re early',
        'Not finalizing your strategy and making last-minute changes that confuse your crew',
        'Ignoring line bias changes that may have occurred since the warning signal',
      ],
      advancedTactics: [
        'If the I flag is displayed, plan to cross the line before 1 minute - this is mandatory, not optional',
        'Use the 4-minute period to confirm line bias and adjust your target position if needed',
        'In shifty conditions, note any wind changes and adjust your approach accordingly',
        'Position yourself where you have options - don\'t commit to one end too early',
        'Watch for traffic patterns - experienced sailors often reveal favored positions through their movements',
        'If you\'re unsure about penalty flags, ask the RC or check the sailing instructions before the start',
      ],
      rulesAndRegulations: [
        'RRS 30.1 (I Flag Rule): If flag I is displayed, boats must pass through the starting line before the 1-minute signal',
        'RRS 30.2 (Z Flag Rule): If flag Z is displayed, boats OCS in the last minute receive a 20% scoring penalty',
        'RRS 30.3 (Black Flag Rule): If the black flag is displayed, boats OCS in the last minute are disqualified',
        'RRS 30.4: The black flag may be displayed without the P flag in some circumstances',
        'The P flag must be displayed from the preparatory signal until 1 minute before the start',
        'You must be in the starting area and able to see the RC boat and its signals',
      ],
      proTips: [
        'Always check the sailing instructions before racing - they specify which penalty flags will be used',
        'If you see the I flag, plan your approach to cross the line before 1 minute - this is non-negotiable',
        'The Z flag penalty (20%) can be severe - be extra cautious if this flag is displayed',
        'The Black flag means immediate DSQ - if you see this, be extremely conservative in your approach',
        'Use the 4-minute period to confirm your strategy with your crew and ensure everyone understands the plan',
        'If conditions have changed significantly, don\'t be afraid to adjust your strategy',
        'Watch other boats but don\'t follow blindly - make your own tactical decisions',
      ],
    },
    action: 'MOVE',
    blueStart: { x: 420, y: 318, rotate: 90 },
    redStart: { x: 520, y: 305, rotate: 90 },
    audio: 'four',
  },
  { time: -235, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 450, y: 317, rotate: 90 }, redStart: { x: 545, y: 303, rotate: 90 } },
  { time: -230, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 480, y: 316, rotate: 90 }, redStart: { x: 565, y: 301, rotate: 90 } },
  { time: -225, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 500, y: 315, rotate: 90 }, redStart: { x: 580, y: 300, rotate: 90 } },
  { time: -220, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Continue sailing east.', action: 'MOVE', blueStart: { x: 520, y: 314, rotate: 90 }, redStart: { x: 590, y: 299, rotate: 90 } },
  // Tack to port - bow turns THROUGH the wind (counterclockwise: 90° → 45° → 0° → 315° → 270°)
  { time: -215, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 535, y: 313, rotate: 45 }, redStart: { x: 598, y: 298, rotate: 45 } },
  { time: -212, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 542, y: 312, rotate: 0 }, redStart: { x: 601, y: 298, rotate: 0 } },
  { time: -208, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 544, y: 312, rotate: 315 }, redStart: { x: 602, y: 298, rotate: 315 } },
  { time: -205, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 542, y: 312, rotate: 270 }, redStart: { x: 600, y: 298, rotate: 270 } },
  { time: -200, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Tack onto port, sail west.', action: 'MOVE', blueStart: { x: 525, y: 313, rotate: 270 }, redStart: { x: 590, y: 299, rotate: 270 } },
  { time: -195, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 500, y: 315, rotate: 270 }, redStart: { x: 570, y: 301, rotate: 270 } },
  { time: -190, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 475, y: 316, rotate: 270 }, redStart: { x: 550, y: 303, rotate: 270 } },
  { time: -185, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 462, y: 317, rotate: 270 }, redStart: { x: 540, y: 304, rotate: 270 } },
  { time: -180, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Three minutes to go. Continue west.', action: 'MOVE', blueStart: { x: 450, y: 318, rotate: 270 }, redStart: { x: 530, y: 305, rotate: 270 } },
  { time: -175, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 425, y: 319, rotate: 270 }, redStart: { x: 505, y: 307, rotate: 270 } },
  { time: -170, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 400, y: 320, rotate: 270 }, redStart: { x: 480, y: 308, rotate: 270 } },
  { time: -165, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 380, y: 321, rotate: 270 }, redStart: { x: 465, y: 309, rotate: 270 } },
  { time: -160, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Sailing toward the pin end.', action: 'MOVE', blueStart: { x: 360, y: 322, rotate: 270 }, redStart: { x: 450, y: 310, rotate: 270 } },
  { time: -155, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 335, y: 323, rotate: 270 }, redStart: { x: 425, y: 312, rotate: 270 } },
  { time: -150, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 310, y: 324, rotate: 270 }, redStart: { x: 400, y: 313, rotate: 270 } },
  { time: -145, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 295, y: 325, rotate: 270 }, redStart: { x: 385, y: 314, rotate: 270 } },
  { time: -140, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Approaching the pin.', action: 'MOVE', blueStart: { x: 280, y: 325, rotate: 270 }, redStart: { x: 370, y: 315, rotate: 270 } },
  { time: -135, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 268, y: 326, rotate: 270 }, redStart: { x: 358, y: 316, rotate: 270 } },
  // Tack to starboard - bow turns THROUGH the wind (clockwise: 270° → 315° → 0° → 45° → 90°)
  { time: -132, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 260, y: 327, rotate: 315 }, redStart: { x: 350, y: 317, rotate: 315 } },
  { time: -128, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 254, y: 328, rotate: 0 }, redStart: { x: 345, y: 318, rotate: 0 } },
  { time: -125, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 252, y: 329, rotate: 45 }, redStart: { x: 342, y: 319, rotate: 45 } },
  // Tack to starboard - sailing east (final pass)
  { time: -120, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Two minutes to go. Tack to starboard for final approach setup.', action: 'MOVE', blueStart: { x: 250, y: 330, rotate: 90 }, redStart: { x: 340, y: 320, rotate: 90 } },
  { time: -115, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 270, y: 328, rotate: 90 }, redStart: { x: 360, y: 318, rotate: 90 } },
  { time: -110, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 290, y: 327, rotate: 90 }, redStart: { x: 380, y: 317, rotate: 90 } },
  { time: -105, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 310, y: 325, rotate: 90 }, redStart: { x: 400, y: 315, rotate: 90 } },
  { time: -100, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Sailing east, setting up position.', action: 'MOVE', blueStart: { x: 330, y: 324, rotate: 90 }, redStart: { x: 420, y: 314, rotate: 90 } },
  { time: -95, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 350, y: 322, rotate: 90 }, redStart: { x: 445, y: 312, rotate: 90 } },
  { time: -90, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 365, y: 321, rotate: 90 }, redStart: { x: 465, y: 310, rotate: 90 } },
  { time: -85, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 380, y: 320, rotate: 90 }, redStart: { x: 480, y: 309, rotate: 90 } },
  { time: -80, label: 'Maneuvering', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: 'Continue east toward starting position.', action: 'MOVE', blueStart: { x: 395, y: 318, rotate: 90 }, redStart: { x: 495, y: 307, rotate: 90 } },
  { time: -75, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 408, y: 317, rotate: 90 }, redStart: { x: 510, y: 305, rotate: 90 } },
  { time: -70, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 420, y: 316, rotate: 90 }, redStart: { x: 525, y: 303, rotate: 90 } },
  { time: -65, label: '', visualState: { orange: 'UP', class: 'UP', p: 'UP' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 430, y: 315, rotate: 90 }, redStart: { x: 535, y: 302, rotate: 90 } },
  // ==================== ONE MINUTE SIGNAL (1:00) ====================
  {
    time: -60, // 1:00 - One Minute Signal
    label: 'One Minute Signal',
    visualState: { orange: 'UP', class: 'UP', p: 'DOWN' },
    soundSignal: '1 long sound (horn)',
    description: 'One minute to start! P flag comes down.',
    details: [
      'One long horn sound (distinct from the short blasts) - 1 minute until start',
      'Preparatory (P) flag is lowered - this is a key visual signal',
      'Only Class flag and Orange flag remain - the sequence is nearing completion',
      'Boats should be in position for final approach - you should be near your target starting position',
      'Get ready to accelerate at 30 seconds - this is when boats typically turn onto close-hauled course',
      'The final minute is critical - maintain awareness of other boats and your position relative to the line',
      'If you\'re too early, you may need to slow down or sail away from the line',
      'If you\'re too late, you may need to accelerate or adjust your approach angle',
      'Watch the RC boat for any last-minute signals or changes',
      'The one-minute signal is your cue to begin the final countdown',
    ],
    deepDive: {
      whyItMatters: [
        'The 1-minute signal is the final major timing checkpoint before the start - after this, time moves quickly',
        'The P flag coming down is a critical visual confirmation that the sequence is proceeding normally',
        'This is your last opportunity to make significant position adjustments before the final approach',
        'The final minute requires intense focus and awareness - mistakes here are costly',
        'Understanding your position relative to the line at 1 minute helps you plan your acceleration',
      ],
      commonMistakes: [
        'Being too close to the line at 1 minute, leaving no room to accelerate without going over early',
        'Not being aware of your position relative to the line and other boats',
        'Failing to plan your acceleration and turning onto close-hauled course',
        'Getting distracted and losing track of time during the final minute',
        'Not adjusting your position if you realize you\'re too early or too late',
        'Ignoring other boats and creating dangerous situations',
      ],
      advancedTactics: [
        'At 1 minute, you should be positioned where you can accelerate to your target spot on the line',
        'If you\'re early, use techniques like luffing, sailing a wider angle, or even sailing away from the line',
        'If you\'re late, you may need to accelerate more aggressively or take a more direct approach',
        'Watch other boats\' positions - if the fleet is bunched at one end, the other end may offer clear air',
        'In light air, you need more time to accelerate - start your approach earlier',
        'In heavy air, boats accelerate quickly - be careful not to be too early',
        'Use the 1-minute signal to confirm your timing and adjust if necessary',
      ],
      rulesAndRegulations: [
        'RRS 26.2: The preparatory signal is made 4 minutes before the starting signal',
        'RRS 26.2: The preparatory flag is lowered 1 minute before the starting signal',
        'RRS 30.1: If flag I was displayed, boats must have passed through the starting line before this signal',
        'The one-minute signal is one long sound signal (distinct from short blasts)',
        'After the P flag is lowered, only the class flag and orange flag remain until the start',
      ],
      proTips: [
        'The long horn sound is distinct - learn to recognize it so you don\'t confuse it with other signals',
        'Use the P flag coming down as a visual confirmation - don\'t rely solely on sound',
        'At 1 minute, check your position relative to the line and adjust if needed',
        'Communicate with your crew about your position and plan for the final approach',
        'Stay calm and focused - the final minute can be stressful, but panic leads to mistakes',
        'If you\'re unsure about your position, err on the side of being slightly early - you can slow down',
        'Practice the final minute in practice starts to develop a sense of timing and positioning',
      ],
    },
    action: 'MOVE',
    blueStart: { x: 440, y: 314, rotate: 90 },
    redStart: { x: 545, y: 301, rotate: 90 },
    audio: 'one',
  },
  { time: -58, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 448, y: 313, rotate: 90 }, redStart: { x: 552, y: 300, rotate: 90 } },
  { time: -56, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 456, y: 312, rotate: 90 }, redStart: { x: 558, y: 299, rotate: 90 } },
  { time: -54, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 462, y: 311, rotate: 90 }, redStart: { x: 564, y: 298, rotate: 90 } },
  { time: -52, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 468, y: 310, rotate: 90 }, redStart: { x: 570, y: 297, rotate: 90 } },
  { time: -50, label: 'Final Setup', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '50 seconds. Maintaining course.', action: 'MOVE', blueStart: { x: 475, y: 309, rotate: 90 }, redStart: { x: 576, y: 296, rotate: 90 } },
  { time: -48, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 480, y: 308, rotate: 90 }, redStart: { x: 580, y: 295, rotate: 90 } },
  { time: -46, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 485, y: 307, rotate: 90 }, redStart: { x: 582, y: 294, rotate: 90 } },
  { time: -44, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 490, y: 306, rotate: 90 }, redStart: { x: 584, y: 293, rotate: 90 } },
  { time: -42, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 494, y: 305, rotate: 90 }, redStart: { x: 586, y: 292, rotate: 90 } },
  { time: -40, label: 'Final Setup', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '40 seconds. Setting up for the turn.', action: 'MOVE', blueStart: { x: 498, y: 304, rotate: 90 }, redStart: { x: 588, y: 291, rotate: 90 } },
  { time: -38, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 500, y: 302, rotate: 90 }, redStart: { x: 590, y: 290, rotate: 90 } },
  { time: -36, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 502, y: 300, rotate: 90 }, redStart: { x: 590, y: 288, rotate: 90 } },
  { time: -34, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 502, y: 298, rotate: 60 }, redStart: { x: 590, y: 286, rotate: 60 } },
  { time: -32, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '32 seconds. Beginning to turn!', action: 'MOVE', blueStart: { x: 500, y: 295, rotate: 30 }, redStart: { x: 588, y: 283, rotate: 30 } },
  // ==================== FINAL APPROACH (0:30) - TURN UPWIND ====================
  // After turning, boats head northwest toward the start line
  // At -30s, boats are well south of the line, beginning their final approach
  {
    time: -30, // 0:30 - NOW they turn!
    label: 'Final Approach',
    visualState: { orange: 'UP', class: 'UP', p: 'DOWN' },
    soundSignal: '',
    description: '30 seconds! Turn onto close-hauled course!',
    details: [
      'Turn sharply onto close-hauled course - this is the critical maneuver',
      'Head toward the windward mark (typically upwind) - your course should be optimized for VMG',
      'Accelerate to full speed - boats need momentum to cross the line effectively',
      'Aim for your target position on the line - consider line bias and traffic',
      '30 seconds is the standard time for the final approach turn - this gives you time to build speed',
      'Close-hauled means sailing as close to the wind as possible while maintaining speed',
      'The angle depends on your boat type - dinghies can sail closer to the wind than keelboats',
      'Watch for other boats - maintain right-of-way and avoid collisions',
      'If you\'re early, you may need to slow down by luffing or sailing a wider angle',
      'If you\'re late, you may need to accelerate more aggressively or take a riskier approach',
      'The goal is to cross the line at full speed, on time, in clear air',
    ],
    deepDive: {
      whyItMatters: [
        'The 30-second turn is the most critical maneuver of the start - it determines your speed and position at the gun',
        'Turning too early leaves you vulnerable to being over early; turning too late means you won\'t have enough speed',
        'The angle and timing of your turn directly affect your ability to cross the line at full speed',
        'This is when boats commit to their final approach - there\'s no going back after this point',
        'Your speed at the start determines your position in the fleet and access to clear air',
      ],
      commonMistakes: [
        'Turning too early and being over the line before the start signal',
        'Turning too late and not having enough speed to cross the line effectively',
        'Not accelerating aggressively enough, leaving you slow at the start',
        'Turning to the wrong angle - too high (pinching) or too low (overstanding)',
        'Not watching other boats and creating dangerous situations or losing right-of-way',
        'Panicking and making erratic course changes instead of a smooth, controlled turn',
      ],
      advancedTactics: [
        'The optimal turn angle depends on wind conditions: in light air, you may need a wider angle to maintain speed',
        'In heavy air, you can sail closer to the wind but must maintain boat speed',
        'Use your boat\'s VMG (Velocity Made Good) to optimize your angle - the angle that gives you the best speed toward the mark',
        'If you\'re early, turn to a wider angle (lower) to slow down while maintaining speed',
        'If you\'re late, turn to a tighter angle (higher) and accelerate more aggressively',
        'Watch other boats\' angles - if everyone is pinching, there may be more wind lower',
        'In shifty conditions, turn to take advantage of a header or minimize the effect of a lift',
      ],
      rulesAndRegulations: [
        'RRS 11: A windward boat must keep clear of a leeward boat',
        'RRS 12: A boat clear astern must keep clear of a boat clear ahead',
        'RRS 13: While tacking, a boat must keep clear of boats on a tack',
        'RRS 14: A boat must avoid contact if reasonably possible',
        'RRS 15: A boat acquiring right-of-way must initially give the other boat room to keep clear',
        'You must not be over the line before the start signal - your bow must be behind the line',
      ],
      proTips: [
        'Practice the 30-second turn in practice starts to develop a feel for timing and angle',
        'In light air, start your turn slightly earlier (35-40 seconds) to give yourself more time to accelerate',
        'In heavy air, you can turn later (25-30 seconds) as boats accelerate quickly',
        'Communicate with your crew about your position and timing - they can help you judge',
        'If you\'re unsure, err on the side of being slightly early - you can always slow down',
        'Watch the fleet - if everyone is turning at the same time, you may want to be slightly different',
        'The goal is to cross the line at full speed, on time, in clear air - prioritize these in order',
      ],
    },
    action: 'MOVE',
    blueStart: { x: 495, y: 360, rotate: 315 }, // Close-hauled starboard tack (heading NW)
    redStart: { x: 582, y: 358, rotate: 315 },
  },
  { time: -29, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 488, y: 356, rotate: 315 }, redStart: { x: 576, y: 354, rotate: 315 } },
  { time: -28, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 481, y: 352, rotate: 315 }, redStart: { x: 570, y: 350, rotate: 315 } },
  { time: -27, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 474, y: 348, rotate: 315 }, redStart: { x: 564, y: 346, rotate: 315 } },
  { time: -26, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 467, y: 344, rotate: 315 }, redStart: { x: 558, y: 342, rotate: 315 } },
  { time: -25, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 460, y: 340, rotate: 315 }, redStart: { x: 552, y: 338, rotate: 315 } },
  { time: -24, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 453, y: 336, rotate: 315 }, redStart: { x: 546, y: 334, rotate: 315 } },
  { time: -23, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 446, y: 332, rotate: 315 }, redStart: { x: 540, y: 330, rotate: 315 } },
  { time: -22, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 439, y: 328, rotate: 315 }, redStart: { x: 534, y: 326, rotate: 315 } },
  { time: -21, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 432, y: 324, rotate: 315 }, redStart: { x: 528, y: 322, rotate: 315 } },
  { time: -20, label: 'Final Approach', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '20 seconds! Building speed toward the line.', action: 'MOVE', blueStart: { x: 425, y: 320, rotate: 315 }, redStart: { x: 522, y: 318, rotate: 315 } },
  { time: -19, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 418, y: 316, rotate: 315 }, redStart: { x: 516, y: 314, rotate: 315 } },
  { time: -18, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 411, y: 312, rotate: 315 }, redStart: { x: 510, y: 310, rotate: 315 } },
  { time: -17, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 404, y: 308, rotate: 315 }, redStart: { x: 504, y: 306, rotate: 315 } },
  { time: -16, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 397, y: 304, rotate: 315 }, redStart: { x: 498, y: 302, rotate: 315 } },
  { time: -15, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 390, y: 300, rotate: 315 }, redStart: { x: 492, y: 298, rotate: 315 } },
  { time: -14, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 383, y: 296, rotate: 315 }, redStart: { x: 490, y: 294, rotate: 315 } },
  { time: -13, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 376, y: 292, rotate: 315 }, redStart: { x: 488, y: 290, rotate: 315 } },
  { time: -12, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 369, y: 288, rotate: 315 }, redStart: { x: 486, y: 286, rotate: 315 } },
  { time: -11, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 362, y: 284, rotate: 315 }, redStart: { x: 484, y: 282, rotate: 315 } },
  // At -10 seconds, boats are approaching - centers well south of line
  { time: -10, label: 'Final Approach', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '10 seconds! Full speed toward the line!', action: 'MOVE', blueStart: { x: 360, y: 280, rotate: 315 }, redStart: { x: 500, y: 278, rotate: 315 } },
  { time: -9, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 355, y: 274, rotate: 315 }, redStart: { x: 496, y: 272, rotate: 315 } },
  { time: -8, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 350, y: 268, rotate: 315 }, redStart: { x: 492, y: 266, rotate: 315 } },
  { time: -7, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 345, y: 262, rotate: 315 }, redStart: { x: 488, y: 260, rotate: 315 } },
  { time: -6, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 340, y: 256, rotate: 315 }, redStart: { x: 485, y: 254, rotate: 315 } },
  // At -5 seconds, boat CENTERS are at y=250, bows extend ~25px NW to ~y=225 (well south of line at y=200)
  { time: -5, label: 'Final Approach', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '5 seconds! Bows just below the line!', action: 'MOVE', blueStart: { x: 335, y: 250, rotate: 315 }, redStart: { x: 482, y: 248, rotate: 315 } },
  { time: -4, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 330, y: 244, rotate: 315 }, redStart: { x: 480, y: 242, rotate: 315 } },
  { time: -3, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 325, y: 238, rotate: 315 }, redStart: { x: 478, y: 236, rotate: 315 } },
  { time: -2, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 320, y: 232, rotate: 315 }, redStart: { x: 476, y: 230, rotate: 315 } },
  { time: -1, label: '', visualState: { orange: 'UP', class: 'UP', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 315, y: 228, rotate: 315 }, redStart: { x: 474, y: 226, rotate: 315 } },
  // ==================== START SIGNAL (0:00) ====================
  // At start, center at y=224, bow extends ~25px NW to y=199 (just at/crossing the line at y=200)
  {
    time: 0, // 0:00 - Start Signal - BOW CROSSING THE LINE!
    label: 'Start Signal',
    visualState: { orange: 'UP', class: 'DOWN', p: 'DOWN' },
    soundSignal: '1 sound (horn)',
    description: 'GO! The race has started!',
    details: [
      'Class flag drops - this is the START signal!',
      'P flag already down (dropped at 1 minute) - only the orange flag remains',
      'One horn sound - the race has officially begun',
      'Cross the line at full speed heading toward the windward mark',
      'Your bow must cross the line after the start signal - crossing early results in a penalty',
      'The line is defined by the RC boat (orange flag) and the pin end mark',
      'Once you cross, you\'re racing - focus on speed and clear air',
      'Avoid being blanketed by other boats - maintain your position and speed',
      'The start is often the most critical part of the race - a good start can win the race',
      'If you\'re over early, you must return to the pre-start side and restart',
      'Watch for other boats - right-of-way rules apply immediately after the start',
    ],
    deepDive: {
      whyItMatters: [
        'The start is often the most critical part of the race - a good start can put you in the lead, while a bad start can put you at the back',
        'Crossing the line at full speed gives you immediate access to clear air and the ability to sail your own race',
        'Your position relative to other boats at the start determines your options for the first leg',
        'Being over early (OCS) results in penalties that can ruin your race',
        'The start sets the tone for the entire race - confidence and momentum begin here',
      ],
      commonMistakes: [
        'Being over the line early (OCS) and having to restart, losing significant time',
        'Starting too conservatively and being buried in the fleet with no clear air',
        'Not accelerating to full speed, leaving you slow and vulnerable',
        'Getting blanketed by other boats immediately after the start',
        'Not watching other boats and losing right-of-way or creating dangerous situations',
        'Panicking if you\'re over early and not executing a proper restart',
      ],
      advancedTactics: [
        'If you\'re over early, immediately return to the pre-start side - don\'t wait for a recall signal',
        'After crossing, focus on speed and clear air - don\'t make unnecessary tacks',
        'If you\'re in clear air, protect it - don\'t let other boats get to windward of you',
        'If you\'re in bad air, look for opportunities to tack or find clear air',
        'Watch for wind shifts immediately after the start - they can be significant',
        'In light air, clear air is more important than position - prioritize getting clear',
        'In heavy air, position and speed are more important - fight for the favored side',
      ],
      rulesAndRegulations: [
        'RRS 26.3: The starting signal is made at the starting time',
        'RRS 26.3: The class flag is removed at the starting signal',
        'RRS 30: Penalties apply to boats over the line early (OCS) in the last minute',
        'RRS 29.1: A boat that starts early must return and restart',
        'RRS 11: A windward boat must keep clear of a leeward boat',
        'RRS 12: A boat clear astern must keep clear of a boat clear ahead',
        'The starting line is defined by the RC boat and the pin end mark',
      ],
      proTips: [
        'If you think you might be over early, return immediately - don\'t wait for a recall signal',
        'After the start, focus on speed and clear air - these are more important than position initially',
        'Watch for wind shifts - they often occur right after the start',
        'If you\'re in bad air, look for opportunities to tack or find clear air',
        'Communicate with your crew about your position and strategy',
        'Stay calm and focused - the start can be chaotic, but panic leads to mistakes',
        'Practice starts regularly to develop a feel for timing and positioning',
        'Learn from each start - analyze what worked and what didn\'t',
      ],
    },
    action: 'MOVE',
    blueStart: { x: 310, y: 224, rotate: 315 }, // Bow just crossing the line
    redStart: { x: 472, y: 222, rotate: 315 },
    audio: 'start',
  },
  // ==================== POST-START - Boats continue north ====================
  { time: 1, label: '', visualState: { orange: 'UP', class: 'DOWN', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 305, y: 218, rotate: 315 }, redStart: { x: 468, y: 216, rotate: 315 } },
  { time: 2, label: 'Racing', visualState: { orange: 'UP', class: 'DOWN', p: 'DOWN' }, soundSignal: '', description: 'Racing to the first mark!', action: 'MOVE', blueStart: { x: 300, y: 212, rotate: 315 }, redStart: { x: 464, y: 210, rotate: 315 } },
  { time: 3, label: '', visualState: { orange: 'UP', class: 'DOWN', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 295, y: 206, rotate: 315 }, redStart: { x: 460, y: 204, rotate: 315 } },
  { time: 4, label: '', visualState: { orange: 'UP', class: 'DOWN', p: 'DOWN' }, soundSignal: '', description: '', action: 'MOVE', blueStart: { x: 290, y: 200, rotate: 315 }, redStart: { x: 456, y: 198, rotate: 315 } },
  { time: 5, label: 'Racing', visualState: { orange: 'UP', class: 'DOWN', p: 'DOWN' }, soundSignal: '', description: 'Clear of the line, racing upwind!', action: 'MOVE', blueStart: { x: 285, y: 194, rotate: 315 }, redStart: { x: 452, y: 192, rotate: 315 } },
];

// Quiz questions for the starting sequence lesson
export const STARTING_SEQUENCE_QUIZ = [
  {
    id: 'q1',
    question: 'What does the orange flag on the RC boat signify?',
    options: [
      { id: 'a', text: 'The race is about to start', isCorrect: false },
      { id: 'b', text: 'The RC boat is on station and marks one end of the starting line', isCorrect: true },
      { id: 'c', text: 'There is an emergency', isCorrect: false },
      { id: 'd', text: 'The course has been shortened', isCorrect: false },
    ],
    explanation: 'The orange flag indicates the RC (Race Committee) boat is "on station" and marks one end of the starting line. This is your signal that the starting area is set up and ready.',
    hint: 'Think about what you need to know before the sequence begins...',
  },
  {
    id: 'q2',
    question: 'How long before the start is the Warning Signal given?',
    options: [
      { id: 'a', text: '1 minute', isCorrect: false },
      { id: 'b', text: '3 minutes', isCorrect: false },
      { id: 'c', text: '4 minutes', isCorrect: false },
      { id: 'd', text: '5 minutes', isCorrect: true },
    ],
    explanation: 'The Warning Signal is given 5 minutes before the start. This is when your class flag goes up with one horn sound. Remember: 5-4-1-0 is the standard sequence!',
    hint: 'The standard sequence is 5-4-1-0. When does it begin?',
  },
  {
    id: 'q3',
    question: 'What flag is raised at the Preparatory Signal (4 minutes)?',
    options: [
      { id: 'a', text: 'Orange flag', isCorrect: false },
      { id: 'b', text: 'Class flag', isCorrect: false },
      { id: 'c', text: 'P flag (Preparatory)', isCorrect: true },
      { id: 'd', text: 'Black flag', isCorrect: false },
    ],
    explanation: 'The P flag (blue and white "Papa" flag) is the standard Preparatory signal at 4 minutes. Other flags like I, Z, or Black may replace it to indicate special rules.',
    hint: 'The "P" in Preparatory is a clue...',
  },
  {
    id: 'q4',
    question: 'What happens to the flags at the Start Signal?',
    options: [
      { id: 'a', text: 'All flags go up', isCorrect: false },
      { id: 'b', text: 'The Class flag is dropped', isCorrect: true },
      { id: 'c', text: 'Only the orange flag is dropped', isCorrect: false },
      { id: 'd', text: 'A new flag is raised', isCorrect: false },
    ],
    explanation: 'At the start signal (0:00), the Class flag is dropped with one horn sound. The P flag was already lowered at the 1-minute signal. The orange flag stays up as it marks the RC boat position.',
    hint: 'The P flag comes down at 1 minute, so what flag is left to drop at the start?',
  },
  {
    id: 'q5',
    question: 'In the final 30 seconds before the start, what should you do?',
    options: [
      { id: 'a', text: 'Slow down and wait', isCorrect: false },
      { id: 'b', text: 'Turn away from the line', isCorrect: false },
      { id: 'c', text: 'Turn upwind and accelerate toward the starting line', isCorrect: true },
      { id: 'd', text: 'Tack back and forth', isCorrect: false },
    ],
    explanation: 'In the final 30 seconds, turn onto your close-hauled course and accelerate! You want to cross the line at full speed. Time your approach so your bow crosses right at the gun.',
    hint: 'You want maximum speed when crossing the line...',
  },
];

export const PREPARATORY_FLAG_OPTIONS: PreparatoryFlagOption[] = [
  {
    flagId: 'p',
    imagePath: '/flags/p-flag.svg',
    name: 'Preparatory Flag (P)',
    description: 'Standard preparatory signal. Most common flag used.',
  },
  {
    flagId: 'i',
    imagePath: '/flags/i-flag.svg',
    name: 'Round-the-Ends Flag (I)',
    description: 'Boats must round either end of the starting line if they are over early.',
  },
  {
    flagId: 'z',
    imagePath: '/flags/z-flag.svg',
    name: '20% Penalty Flag (Z)',
    description: 'Boats over early receive a 20% scoring penalty.',
  },
  {
    flagId: 'black',
    imagePath: '/flags/black-flag.svg',
    name: 'Disqualification Flag (Black)',
    description: 'Boats over early are disqualified without a hearing.',
  },
  {
    flagId: 'u',
    imagePath: '/flags/u-flag.svg',
    name: 'U Flag',
    description: 'Boats over early must round the ends and restart.',
  },
];

