/**
 * Team Racing Types
 *
 * Types for team racing format (typically 3v3 or 4v4)
 * Common in college sailing and youth programs
 */

export interface TeamMember {
  id: string;
  name: string;
  sailNumber: string;
  boatClass?: string;
  role?: 'skipper' | 'crew';
}

export interface RacingTeam {
  id: string;
  name: string; // e.g., "RHKYC A"
  clubName?: string;
  teamColor: string; // For visual identification (e.g., '#3B82F6' for blue)
  members: TeamMember[];
}

export interface TeamRaceResult {
  teamId: string;
  positions: number[]; // e.g., [1, 2, 4] for positions 1st, 2nd, 4th
  totalScore: number; // Sum of positions
  isWinner: boolean;
}

export interface TeamRaceHeat {
  heatNumber: number;
  totalHeats?: number;
  roundName?: string; // e.g., "Group Stage", "Quarter-final"
}

export interface TeamRaceScoring {
  teamSize: 3 | 4; // 3v3 or 4v4
  winningThreshold: number; // 10 for 3v3, 15 for 4v4
  // Common winning combinations for reference
  winningCombinations: string[]; // e.g., ["1-2-3 (6)", "1-2-4 (7)", "1-3-4 (8)", "2-3-4 (9)", "1-2-5 (8)"]
}

export interface TeamRaceCardProps {
  id: string;
  // Event info
  eventName?: string;
  venue: string;
  date: string;
  startTime: string;
  vhfChannel?: string;

  // Team specifics
  yourTeam: RacingTeam;
  opponentTeam: RacingTeam;
  heat?: TeamRaceHeat;
  scoring: TeamRaceScoring;

  // Conditions
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack';
  };

  // Result (for completed races)
  result?: {
    yourTeam: TeamRaceResult;
    opponentTeam: TeamRaceResult;
  };

  // UI state
  raceStatus: 'upcoming' | 'completed';
  isSelected?: boolean;
  onSelect?: () => void;
  cardWidth?: number;
  cardHeight?: number;
}

// Color constants for team racing
export const TEAM_RACING_COLORS = {
  primary: '#0D9488', // Teal
  accent: '#14B8A6',
  shadow: 'rgba(13, 148, 136, 0.15)',
  badgeBg: '#F0FDFA',
  badgeText: '#0F766E',
} as const;

// Scoring helpers
export const TEAM_RACING_SCORING = {
  '3v3': {
    teamSize: 3 as const,
    winningThreshold: 10,
    bestScore: 6, // 1+2+3
    worstScore: 15, // 4+5+6
    winningCombinations: [
      '1-2-3 (6)',
      '1-2-4 (7)',
      '1-2-5 (8)',
      '1-3-4 (8)',
      '1-2-6 (9)',
      '1-3-5 (9)',
      '2-3-4 (9)',
      '1-4-5 (10)',
      '2-3-5 (10)',
    ],
  },
  '4v4': {
    teamSize: 4 as const,
    winningThreshold: 17, // Total positions 1-8 = 36, win if < 18
    bestScore: 10, // 1+2+3+4
    worstScore: 26, // 5+6+7+8
    winningCombinations: [
      '1-2-3-4 (10)',
      '1-2-3-5 (11)',
      '1-2-3-6 (12)',
      '1-2-4-5 (12)',
      // ... more combinations
    ],
  },
} as const;

/**
 * Calculate if a team's positions result in a win
 */
export function calculateTeamScore(positions: number[]): number {
  return positions.reduce((sum, pos) => sum + pos, 0);
}

/**
 * Determine winner based on team scores
 */
export function determineWinner(
  yourPositions: number[],
  opponentPositions: number[],
  teamSize: 3 | 4
): 'you' | 'opponent' | 'tie' {
  const yourScore = calculateTeamScore(yourPositions);
  const opponentScore = calculateTeamScore(opponentPositions);

  if (yourScore < opponentScore) return 'you';
  if (opponentScore < yourScore) return 'opponent';
  return 'tie';
}
