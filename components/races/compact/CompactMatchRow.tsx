/**
 * CompactMatchRow Component
 *
 * Compact row display for match racing in list views.
 * Orange theme with series score badge.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 🟠 │ Round 3: Jones vs Smith       │ 2-1  │  3d 2h │  > │
 * │    │ 📍 Victoria · Sun, Jan 12     │ (Bo5)│        │    │
 * └──────────────────────────────────────────────────────────┘
 */

import { calculateCountdown } from '@/constants/mockData';
import { MATCH_RACING_COLORS } from '@/types/matchRacing';
import { Target } from 'lucide-react-native';
import React, { useMemo } from 'react';

import { CompactRaceRow } from './CompactRaceRow';

export interface CompactMatchRowProps {
  id: string;
  /** Your skipper name or "You" */
  yourName: string;
  /** Opponent skipper name */
  opponentName: string;
  /** Round number in bracket */
  roundNumber?: number;
  venue: string;
  date: string;
  startTime: string;
  /** Series score */
  seriesScore?: {
    yourWins: number;
    opponentWins: number;
    format: 'best_of_3' | 'best_of_5' | 'best_of_7' | 'single';
  };
  raceStatus: 'upcoming' | 'in_progress' | 'completed';
  onPress: () => void;
}

export function CompactMatchRow({
  id,
  yourName,
  opponentName,
  roundNumber,
  venue,
  date,
  startTime,
  seriesScore,
  raceStatus,
  onPress,
}: CompactMatchRowProps) {
  // Calculate countdown
  const countdown = useMemo(() => {
    return calculateCountdown(date, startTime);
  }, [date, startTime]);

  // Format date
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [date]);

  // Build title
  const title = useMemo(() => {
    const matchup = `${yourName} vs ${opponentName}`;
    return roundNumber ? `Round ${roundNumber}: ${matchup}` : matchup;
  }, [yourName, opponentName, roundNumber]);

  // Format badge (series score)
  const badge = useMemo(() => {
    if (!seriesScore) return undefined;
    const format =
      seriesScore.format === 'best_of_3'
        ? 'Bo3'
        : seriesScore.format === 'best_of_5'
          ? 'Bo5'
          : seriesScore.format === 'best_of_7'
            ? 'Bo7'
            : '';
    return `${seriesScore.yourWins}-${seriesScore.opponentWins}${format ? ` ${format}` : ''}`;
  }, [seriesScore]);

  return (
    <CompactRaceRow
      accentColor={raceStatus === 'completed' ? '#9CA3AF' : MATCH_RACING_COLORS.primary}
      title={title}
      subtitle={`📍 ${venue} · ${formattedDate}`}
      badge={badge}
      badgeBgColor={MATCH_RACING_COLORS.badgeBg}
      badgeTextColor={MATCH_RACING_COLORS.badgeText}
      countdown={countdown}
      status={raceStatus}
      onPress={onPress}
      icon={<Target size={16} color={MATCH_RACING_COLORS.primary} />}
    />
  );
}

export default CompactMatchRow;
