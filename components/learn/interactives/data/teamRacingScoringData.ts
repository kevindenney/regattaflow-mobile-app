/**
 * Team Racing Scoring - Lesson Data
 * Teaches 3v3 team racing combination scoring.
 *
 * In team racing (3v3), 6 boats race and each team has 3 boats.
 * The total of finishing positions always equals 21, so a team
 * wins if their combined positions total 10 or less (the opponent
 * gets 11 or more).
 *
 * C(6,3) = 20 possible combinations for one team's 3 positions.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ScoringScenario {
  id: string;
  title: string;
  description: string;
  teamPositions: number[]; // 3 finishing positions for the scoring team
  opponentPositions: number[]; // 3 finishing positions for the opponent
  teamTotal: number;
  opponentTotal: number;
  result: 'win' | 'lose';
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  boatAnimations: {
    position: number;
    team: 'blue' | 'red';
    finishOrder: number;
    xPercent: number;
  }[];
}

export interface CombinationEntry {
  positions: number[];
  total: number;
  result: 'win' | 'lose';
  margin: number; // positive = winning margin, negative = losing margin
  label: string;
}

// ---------------------------------------------------------------------------
// Helper to derive opponent positions from team positions
// ---------------------------------------------------------------------------

const ALL_POSITIONS = [1, 2, 3, 4, 5, 6];

function opponentPositions(team: number[]): number[] {
  return ALL_POSITIONS.filter((p) => !team.includes(p));
}

// ---------------------------------------------------------------------------
// Helper to build boat animations for a scenario
// ---------------------------------------------------------------------------

function buildBoatAnimations(
  teamPositions: number[],
  opponentPositions: number[],
): ScoringScenario['boatAnimations'] {
  // Spread 6 boats across the finish line from 10% to 90%
  const xValues = [10, 26, 42, 58, 74, 90];

  return ALL_POSITIONS.map((pos) => {
    const isTeam = teamPositions.includes(pos);
    return {
      position: pos,
      team: isTeam ? ('blue' as const) : ('red' as const),
      finishOrder: pos,
      xPercent: xValues[pos - 1],
    };
  });
}

// ---------------------------------------------------------------------------
// ALL_COMBINATIONS - every possible 3-position subset of {1..6}
// ---------------------------------------------------------------------------

function generateAllCombinations(): CombinationEntry[] {
  const combos: CombinationEntry[] = [];

  for (let a = 1; a <= 4; a++) {
    for (let b = a + 1; b <= 5; b++) {
      for (let c = b + 1; c <= 6; c++) {
        const positions = [a, b, c];
        const total = a + b + c;
        const opponentTotal = 21 - total;
        const result: 'win' | 'lose' = total <= 10 ? 'win' : 'lose';
        const margin = result === 'win' ? opponentTotal - total : total - opponentTotal;
        const label = `${a}-${b}-${c}`;

        combos.push({
          positions,
          total,
          result,
          margin: result === 'win' ? margin : -margin,
          label,
        });
      }
    }
  }

  return combos;
}

export const ALL_COMBINATIONS: CombinationEntry[] = generateAllCombinations();

// ---------------------------------------------------------------------------
// SCORING_SCENARIOS - 8 core teaching scenarios
// ---------------------------------------------------------------------------

export const SCORING_SCENARIOS: ScoringScenario[] = [
  // 1 - The Perfect Race
  {
    id: 'perfect-race',
    title: 'The Perfect Race',
    description: 'Your team sweeps the top three positions for a dominant victory.',
    teamPositions: [1, 2, 3],
    opponentPositions: [4, 5, 6],
    teamTotal: 6,
    opponentTotal: 15,
    result: 'win',
    explanation:
      '1+2+3 = 6, the lowest possible team total. The opponent scores 15. This is the maximum winning margin of 9 points and the ideal outcome in team racing.',
    difficulty: 'beginner',
    boatAnimations: buildBoatAnimations([1, 2, 3], [4, 5, 6]),
  },

  // 2 - Just Enough
  {
    id: 'just-enough',
    title: 'Just Enough',
    description: 'Your team scrapes across the winning threshold with a total of exactly 10.',
    teamPositions: [2, 3, 5],
    opponentPositions: [1, 4, 6],
    teamTotal: 10,
    opponentTotal: 11,
    result: 'win',
    explanation:
      '2+3+5 = 10, just meeting the magic number. The opponent has 1+4+6 = 11. In team racing every single position matters - this is the smallest possible winning margin.',
    difficulty: 'intermediate',
    boatAnimations: buildBoatAnimations([2, 3, 5], [1, 4, 6]),
  },

  // 3 - One Position Away
  {
    id: 'one-position-away',
    title: 'One Position Away',
    description: 'So close to winning, but one position too many tips the balance.',
    teamPositions: [2, 3, 6],
    opponentPositions: [1, 4, 5],
    teamTotal: 11,
    opponentTotal: 10,
    result: 'lose',
    explanation:
      '2+3+6 = 11, just one point over the threshold. Compare to "Just Enough" (2-3-5) - the difference is a single position swap between 5th and 6th place. That one place is the difference between winning and losing.',
    difficulty: 'intermediate',
    boatAnimations: buildBoatAnimations([2, 3, 6], [1, 4, 5]),
  },

  // 4 - The Cliff Edge
  {
    id: 'cliff-edge',
    title: 'The Cliff Edge',
    description: 'A first-place finish rescues the team despite a boat finishing last.',
    teamPositions: [1, 3, 6],
    opponentPositions: [2, 4, 5],
    teamTotal: 10,
    opponentTotal: 11,
    result: 'win',
    explanation:
      '1+3+6 = 10. Having a boat in 1st place is incredibly powerful - it allows the team to absorb even a last-place finish and still win. This is why protecting a lead boat is critical in team racing.',
    difficulty: 'intermediate',
    boatAnimations: buildBoatAnimations([1, 3, 6], [2, 4, 5]),
  },

  // 5 - Strong Middle
  {
    id: 'strong-middle',
    title: 'Strong Middle',
    description: 'Packing three boats into the top four gives a comfortable margin.',
    teamPositions: [2, 3, 4],
    opponentPositions: [1, 5, 6],
    teamTotal: 9,
    opponentTotal: 12,
    result: 'win',
    explanation:
      '2+3+4 = 9. Even though the opponent has the lead boat, grouping your three boats tightly in 2nd, 3rd, and 4th produces a solid 3-point winning margin. This shows the value of pack sailing.',
    difficulty: 'beginner',
    boatAnimations: buildBoatAnimations([2, 3, 4], [1, 5, 6]),
  },

  // 6 - Spread Out Loss
  {
    id: 'spread-out-loss',
    title: 'Spread Out Loss',
    description: 'Boats spread across the fleet leads to a clear defeat.',
    teamPositions: [2, 4, 6],
    opponentPositions: [1, 3, 5],
    teamTotal: 12,
    opponentTotal: 9,
    result: 'lose',
    explanation:
      '2+4+6 = 12. When your boats are evenly spread rather than grouped together, the total climbs quickly. The opponent\'s alternating 1-3-5 pattern beats you by 3 points.',
    difficulty: 'beginner',
    boatAnimations: buildBoatAnimations([2, 4, 6], [1, 3, 5]),
  },

  // 7 - Protected by 1-2
  {
    id: 'protected-by-1-2',
    title: 'Protected by 1-2',
    description: 'A dominant front pair carries the team despite a struggling third boat.',
    teamPositions: [1, 2, 6],
    opponentPositions: [3, 4, 5],
    teamTotal: 9,
    opponentTotal: 12,
    result: 'win',
    explanation:
      '1+2+6 = 9. Locking up the top two positions is so powerful that even a last-place finish results in a comfortable win. The 1-2 "cover" gives the third boat freedom to finish anywhere in positions 3 through 6.',
    difficulty: 'intermediate',
    boatAnimations: buildBoatAnimations([1, 2, 6], [3, 4, 5]),
  },

  // 8 - Worst Case
  {
    id: 'worst-case',
    title: 'Worst Case',
    description: 'All three team boats finish at the back for the maximum possible loss.',
    teamPositions: [4, 5, 6],
    opponentPositions: [1, 2, 3],
    teamTotal: 15,
    opponentTotal: 6,
    result: 'lose',
    explanation:
      '4+5+6 = 15, the worst possible total. The opponent has a perfect 1-2-3 sweep. Avoiding this requires at least one boat to break into the top three positions.',
    difficulty: 'beginner',
    boatAnimations: buildBoatAnimations([4, 5, 6], [1, 2, 3]),
  },
];

// ---------------------------------------------------------------------------
// COMBINATION_PROTECTION_SCENARIOS - Module 10-4 "Combination Protection"
// ---------------------------------------------------------------------------

export const COMBINATION_PROTECTION_SCENARIOS: ScoringScenario[] = [
  // 1 - Vulnerable Winner
  {
    id: 'protection-vulnerable-winner',
    title: 'Vulnerable Winner',
    description:
      'Your team is winning 1-2-6, but the 6th place boat is vulnerable to being passed by an opponent.',
    teamPositions: [1, 2, 6],
    opponentPositions: [3, 4, 5],
    teamTotal: 9,
    opponentTotal: 12,
    result: 'win',
    explanation:
      '1+2+6 = 9, a solid win. However, your 6th place boat is trailing the pack. If an opponent in 5th passes your 6th, the combo becomes 1-2-6 which stays the same. But the real danger is if your 2nd place boat gets passed: 1-3-6 = 10 still wins, but 1-4-6 = 11 loses. Protect your 2nd place boat - that is the real vulnerability here.',
    difficulty: 'advanced',
    boatAnimations: buildBoatAnimations([1, 2, 6], [3, 4, 5]),
  },

  // 2 - Cliff Edge Protection
  {
    id: 'protection-cliff-edge',
    title: 'Cliff Edge Protection',
    description:
      'Your team holds a razor-thin 1-3-6 winning combination. One wrong move costs the race.',
    teamPositions: [1, 3, 6],
    opponentPositions: [2, 4, 5],
    teamTotal: 10,
    opponentTotal: 11,
    result: 'win',
    explanation:
      '1+3+6 = 10, exactly on the winning threshold. Every position must be defended. If the opponent in 2nd passes your 1st, you get 2-3-6 = 11 and lose. If the opponent in 4th passes your 3rd, you get 1-4-6 = 11 and lose. Your lead boat must cover the opponent in 2nd, and your middle boat must keep the 4th place opponent behind. There is zero margin for error.',
    difficulty: 'advanced',
    boatAnimations: buildBoatAnimations([1, 3, 6], [2, 4, 5]),
  },

  // 3 - Losing Swap Needed
  {
    id: 'protection-losing-swap',
    title: 'Losing Swap Needed',
    description:
      'Your team is losing 2-4-6. Identify which swap turns the loss into a win.',
    teamPositions: [2, 4, 6],
    opponentPositions: [1, 3, 5],
    teamTotal: 12,
    opponentTotal: 9,
    result: 'lose',
    explanation:
      '2+4+6 = 12, a losing combination. To win, your team needs to drop the total to 10 or below. The most realistic swap: if your 4th place boat passes the opponent in 3rd, the combo becomes 2-3-6 = 11 (still losing!) so you need more. Two swaps - 4th past 3rd AND 6th past 5th - gives 2-3-5 = 10, a win. Alternatively, your 2nd place boat passing the leader gives 1-4-6 = 11, still not enough. Team racing tactics like pass-backs are essential here.',
    difficulty: 'advanced',
    boatAnimations: buildBoatAnimations([2, 4, 6], [1, 3, 5]),
  },

  // 4 - Pass-Back Opportunity
  {
    id: 'protection-pass-back',
    title: 'Pass-Back Opportunity',
    description:
      'Your team is losing 1-4-6. Your lead boat can slow down the opponent to create a pass-back.',
    teamPositions: [1, 4, 6],
    opponentPositions: [2, 3, 5],
    teamTotal: 11,
    opponentTotal: 10,
    result: 'lose',
    explanation:
      '1+4+6 = 11, just one point over the threshold. Your boat in 1st can execute a pass-back: slow down to block the opponent in 2nd, allowing your 4th place teammate to pass the opponent in 3rd. This transforms the combo from 1-4-6 (total 11, loss) to 1-3-6 (total 10, win) or even 2-3-6 (total 11) if you also slip. The key is precise execution - your lead boat must slow the opponent in 2nd without letting them escape.',
    difficulty: 'advanced',
    boatAnimations: buildBoatAnimations([1, 4, 6], [2, 3, 5]),
  },
];
