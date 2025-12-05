/**
 * Positioning Data
 * Ported from BetterAt Sail Racing
 */

export interface PositioningVisualState {
  blue?: { opacity?: number; x?: number; y?: number; rotate?: number };
  red?: { opacity?: number; x?: number; y?: number; rotate?: number };
  yellow?: { opacity?: number; x?: number; y?: number; rotate?: number };
  hole?: { opacity?: number };
}

export interface PositioningStep {
  label: string;
  description: string;
  visualState: PositioningVisualState;
  details?: string[];
}

export const POSITIONING_SEQUENCE_STEPS: PositioningStep[] = [
  {
    label: "Step 1: Holding Your Spot (Starboard)",
    description: "You (blue) are holding your spot on starboard tack. A windward boat (red) boxes you in.",
    visualState: {
      blue: { opacity: 1, x: 400, y: 240, rotate: -45 },
      red: { opacity: 1, x: 460, y: 235, rotate: -45 },
      yellow: { opacity: 1, x: 250, y: 350, rotate: 45 },
    },
    details: [
      "As a starboard tack boat, you have right-of-way over port tack boats.",
      "Your goal is to protect the valuable 'hole' to leeward (to your left).",
    ],
  },
  {
    label: "Step 2: Port Tack Attacker Approaches",
    description: "Yellow approaches on port tack, aiming for your leeward hole. You prepare to defend.",
    visualState: {
      blue: { opacity: 1, x: 400, y: 240, rotate: -45 },
      red: { opacity: 1, x: 460, y: 235, rotate: -45 },
      yellow: { opacity: 1, x: 350, y: 280, rotate: 45 },
    },
    details: [
      "The yellow boat is attempting to force you to react. You must hold your ground and protect your space.",
    ],
  },
  {
    label: "Step 3: The Squeeze & Yellow's Tack",
    description: "You pivot your bow down towards yellow, who is forced to tack away immediately to avoid a collision.",
    visualState: {
      blue: { opacity: 1, x: 400, y: 240, rotate: -65 },
      red: { opacity: 1, x: 460, y: 235, rotate: -45 },
      yellow: { opacity: 1, x: 340, y: 290, rotate: -45 },
    },
    details: [
      "By turning your bow down, you enforce your right-of-way. Yellow must keep clear.",
      "Their only option is to perform a 'crash tack', which loses them speed and position.",
    ],
  },
  {
    label: "Step 4: The Hole is Created",
    description: "With yellow forced away, you have successfully defended and created a perfect hole to accelerate into.",
    visualState: {
      blue: { opacity: 1, x: 400, y: 240, rotate: -45 },
      red: { opacity: 1, x: 460, y: 235, rotate: -45 },
      yellow: { opacity: 1, x: 320, y: 300, rotate: -45 },
      hole: { opacity: 0.4 },
    },
    details: [
      "By proactively defending your leeward space, you have manufactured your own perfect starting lane.",
      "This space is now yours to use for the final acceleration.",
    ],
  },
  {
    label: "Step 5: The Final Acceleration",
    description: "You bear away into the hole and accelerate for a perfect start, leaving the other boats in your bad air.",
    visualState: {
      blue: { opacity: 1, x: 360, y: 195, rotate: -45 },
      red: { opacity: 1, x: 440, y: 230, rotate: -45 },
      yellow: { opacity: 0 },
      hole: { opacity: 0 },
    },
    details: [
      "You now have clear air and room to accelerate, hitting the line at full speed.",
    ],
  },
];

