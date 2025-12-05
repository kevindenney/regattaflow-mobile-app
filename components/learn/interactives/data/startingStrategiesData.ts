/**
 * Starting Strategies Data
 * Ported from BetterAt Sail Racing
 */

export interface StrategyVisualState {
  blue?: { opacity?: number; x?: number; y?: number; rotate?: number };
  red?: { opacity?: number; x?: number; y?: number; rotate?: number };
  yellow?: { opacity?: number; x?: number; y?: number; rotate?: number };
}

export interface StrategyStep {
  time?: number;
  label: string;
  description: string;
  visualState: StrategyVisualState;
  details?: string[];
}

export const PORT_TACK_APPROACH_STEPS: StrategyStep[] = [
  {
    time: -80, // 1:20
    label: "1:20 - The Port Tack Approach",
    description: "You (blue) are on port tack, on a close reach, sailing from outside the pin layline towards the RC boat.",
    visualState: {
      blue: { opacity: 1, x: 150, y: 300, rotate: 60 },
      red: { opacity: 1, x: 700, y: 250, rotate: -45 },
    },
    details: ["This setup move allows you to gauge the line and identify a potential 'hole' in the line of starboard-tack boats."],
  },
  {
    time: -50,
    label: "0:50 - Engage the Target",
    description: "As a starboard tack boat (red) approaches, you tack onto starboard to meet them.",
    visualState: {
      blue: { opacity: 1, x: 500, y: 240, rotate: -45 },
      red: { opacity: 1, x: 580, y: 230, rotate: -45 },
    },
    details: ["By tacking onto their line, you are setting up the next maneuver. You are now the windward boat."],
  },
  {
    time: -30,
    label: "0:30 - The Lee-Bow Tack",
    description: "Just before the red boat can establish an overlap, you tack back onto port tack directly underneath their bow.",
    visualState: {
      blue: { opacity: 1, x: 520, y: 220, rotate: 45 },
      red: { opacity: 1, x: 580, y: 230, rotate: -45 },
    },
    details: ["This is the 'lee-bow' tack. You are now the leeward boat, but because red was changing course, you are clear to establish this position."],
  },
  {
    time: -25,
    label: "0:25 - Forcing the Tack",
    description: "Your sail blocks the wind to the red boat (giving them 'dirty air'). They are now forced to tack away.",
    visualState: {
      blue: { opacity: 1, x: 520, y: 220, rotate: 45 },
      red: { opacity: 1, x: 590, y: 225, rotate: 45 },
    },
    details: ["The red boat has lost speed and is forced to a disadvantageous position, leaving a perfect hole for you."],
  },
  {
    time: 0,
    label: "0:00 - The Start",
    description: "You accelerate into the hole you created and win the start.",
    visualState: {
      blue: { opacity: 1, x: 480, y: 195, rotate: 45 },
      red: { opacity: 0 },
    },
    details: ["This is a very high-level maneuver that uses the rules and physics to create an advantage out of nothing."],
  },
];

// Placeholder for other strategies (to be implemented)
export const SLOW_CONTROLLED_STEPS: StrategyStep[] = [
  {
    label: "Coming Soon",
    description: "This animation will be built out in a future step.",
    visualState: { blue: { opacity: 0 }, red: { opacity: 0 }, yellow: { opacity: 0 } },
    details: ["This is a placeholder to prevent the application from crashing."],
  },
];

export const BARGING_DEFENSE_STEPS: StrategyStep[] = [
  {
    label: "Coming Soon",
    description: "This animation will be built out in a future step.",
    visualState: { blue: { opacity: 0 }, red: { opacity: 0 }, yellow: { opacity: 0 } },
    details: ["This is a placeholder to prevent the application from crashing."],
  },
];

export const VANDERBILT_START_STEPS: StrategyStep[] = [
  {
    label: "Coming Soon",
    description: "This animation will be built out in a future step.",
    visualState: { blue: { opacity: 0 }, red: { opacity: 0 }, yellow: { opacity: 0 } },
    details: ["This is a placeholder to prevent the application from crashing."],
  },
];

