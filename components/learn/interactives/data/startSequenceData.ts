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
  x?: 'UP' | 'DOWN'; // Individual recall
}

export interface SequenceStep {
  time: number; // Seconds mark, e.g., -300 for 5 minutes
  label: string;
  visualState: FlagState;
  soundSignal: string;
  description: string;
  details?: string[]; // Added for Deeper Dive content
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
      'A series of short horn blasts signals attention - the starting sequence is about to begin',
      'The RC boat displays an orange flag to show the starting line is set',
      'Boats should begin maneuvering in the starting area',
      'Check wind direction and line bias before the sequence starts',
    ],
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
      'Class flag goes up - your class is starting in 5 minutes',
      'One single horn blast signals the warning',
      'Start your timing from this signal',
      'Begin planning your approach strategy',
    ],
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
      'P flag (blue and white) goes up',
      'One horn sound signals preparatory',
      'Rule 30.1 (I flag) or penalties may now apply',
      'Boats should be in the starting area',
    ],
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
      'One long horn sound',
      'Preparatory (P) flag is lowered',
      'Only Class flag and Orange flag remain',
      'Boats should be in position for final approach',
      'Get ready to accelerate at 30 seconds',
    ],
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
      'Turn sharply onto close-hauled course',
      'Head toward the windward mark (northwest)',
      'Accelerate to full speed',
      'Aim for your target position on the line',
    ],
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
      'Class flag drops',
      'P flag already down (dropped at 1 minute)',
      'One horn sound',
      'Cross the line at full speed heading toward the windward mark',
    ],
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

