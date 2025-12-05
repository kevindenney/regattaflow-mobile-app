/**
 * Timed Run Data
 * Ported from BetterAt Sail Racing
 */

export interface TimedRunVisualState {
  boat?: { opacity?: number; x?: number; y?: number; rotate?: number };
}

export interface TimedRunStep {
  time: number;
  label: string;
  description: string;
  visualState: TimedRunVisualState;
  details?: string[];
}

export const TIMED_RUN_SEQUENCE_STEPS: TimedRunStep[] = [
  {
    time: -210, // 3:30
    label: "3:30 - Begin First Run",
    description: "Begin on the left layline, sailing parallel to the start line.",
    visualState: { boat: { opacity: 1, x: 300, y: 280, rotate: 90 } },
    details: ["The goal is to establish a rhythm. This first leg will take 50 seconds."],
  },
  {
    time: -160, // 2:40
    label: "2:40 - End First Run, Begin Turn",
    description: "After 50 seconds, you've reached the right side. Begin your turn.",
    visualState: { boat: { opacity: 1, x: 580, y: 280, rotate: 90 } },
    details: ["A good tack or gybe should take about 10 seconds. This must be factored into your countdown."],
  },
  {
    time: -150, // 2:30
    label: "2:30 - Complete Turn, Begin Second Run",
    description: "After a 10-second turn, head back left across the box.",
    visualState: { boat: { opacity: 1, x: 580, y: 280, rotate: -90 } },
    details: ["Being aware of the countdown clock is the most critical part of this drill."],
  },
  {
    time: -100, // 1:40
    label: "1:40 - End Second Run, Begin Turn",
    description: "You've reached the left side again. Begin your next 10-second turn.",
    visualState: { boat: { opacity: 1, x: 300, y: 280, rotate: -90 } },
    details: ["This back-and-forth helps you hold your position in the starting area while waiting for the final minute."],
  },
  {
    time: -90, // 1:30
    label: "1:30 - Complete Turn, Begin Third Run",
    description: "Heading right one last time before the final approach.",
    visualState: { boat: { opacity: 1, x: 300, y: 280, rotate: 90 } },
    details: ["From this point, you should be looking for your final lane on the starting line."],
  },
  {
    time: -40, // 0:40
    label: "0:40 - End Third Run, Begin Final Turn",
    description: "The final parallel leg is complete. Begin the 10-second turn to approach the line.",
    visualState: { boat: { opacity: 1, x: 580, y: 280, rotate: 90 } },
    details: ["You are at the committee boat side of the box, preparing to head upwind on starboard tack."],
  },
  {
    time: -30, // 0:30
    label: "0:30 - The Final Approach",
    description: "You are now on your final 30-second run to the line on a close-hauled course.",
    visualState: { boat: { opacity: 1, x: 580, y: 280, rotate: -45 } },
    details: ["From here, you 'trim' time by adjusting speed. Luff up to slow down if early, or bear away to accelerate if late."],
  },
  {
    time: 0, // 0:00
    label: "The Start!",
    description: "Crossing the line at full speed, on time, in a clear lane.",
    visualState: { boat: { opacity: 1, x: 395, y: 175, rotate: -45 } },
    details: ["This disciplined approach ensures you are in control of your start. This is how races are won!"],
  },
];

