/**
 * Match Racing Types
 *
 * Types for one-on-one match racing format
 * Used in America's Cup style competitions
 */

export interface MatchRacingOpponent {
  id: string;
  name: string;
  skipperName: string;
  boatName?: string;
  boatColor?: string; // For visual identification (e.g., '#EF4444' for red)
  clubName?: string;
  // Stats for opponent intel
  seasonRecord?: {
    wins: number;
    losses: number;
    winRate: number; // 0-100
  };
  headToHeadRecord?: {
    yourWins: number;
    theirWins: number;
  };
  tacticalStyle?: string; // e.g., "Aggressive pre-start", "Conservative", "Port-biased"
  notes?: string;
}

export interface MatchRaceSeriesScore {
  yourWins: number;
  opponentWins: number;
  format: 'best_of_3' | 'best_of_5' | 'best_of_7' | 'single';
  isComplete: boolean;
  winner?: 'you' | 'opponent';
}

export interface MatchRaceResult {
  matchId: string;
  winner: 'you' | 'opponent';
  marginSeconds?: number; // Time difference at finish
  penalties?: {
    you: number;
    opponent: number;
  };
  protestNotes?: string;
}

export interface MatchRaceBracket {
  roundNumber: number;
  totalRounds: number;
  bracketPosition?: string; // e.g., "Quarter-final", "Semi-final", "Final"
  advancesTo?: string; // Description of next round
}

export interface MatchRaceUmpireStatus {
  onWaterUmpires: boolean;
  umpireChannel?: string; // VHF channel for umpire calls
  protestDeadlineMinutes?: number; // Usually 90 minutes
}

export interface MatchRaceCardProps {
  id: string;
  // Event info
  eventName?: string;
  venue: string;
  date: string;
  startTime: string;
  vhfChannel?: string;

  // Match specifics
  opponent: MatchRacingOpponent;
  bracket?: MatchRaceBracket;
  seriesScore?: MatchRaceSeriesScore;
  umpireStatus?: MatchRaceUmpireStatus;

  // Your boat info
  yourBoatColor?: string;
  yourSkipperName?: string;

  // Conditions
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack';
  };

  // Result (for completed matches)
  result?: MatchRaceResult;

  // UI state
  raceStatus: 'upcoming' | 'in_progress' | 'completed';
  isSelected?: boolean;
  onSelect?: () => void;
  cardWidth?: number;
  cardHeight?: number;
}

// Color constants for match racing
export const MATCH_RACING_COLORS = {
  primary: '#EA580C', // Orange
  accent: '#F97316',
  shadow: 'rgba(234, 88, 12, 0.15)',
  badgeBg: '#FFF7ED',
  badgeText: '#C2410C',
} as const;
