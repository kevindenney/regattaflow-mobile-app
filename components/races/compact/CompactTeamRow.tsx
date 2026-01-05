/**
 * CompactTeamRow Component
 *
 * Compact row display for team racing in list views.
 * Teal theme with team size badge.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 🟢 │ Heat 4: RHKYC A vs ABC YC     │ 3v3  │  5d 1h │  > │
 * │    │ 📍 Victoria · Sun, Jan 12     │      │        │    │
 * └──────────────────────────────────────────────────────────┘
 */

import { calculateCountdown } from '@/constants/mockData';
import { TEAM_RACING_COLORS } from '@/types/teamRacing';
import { Users } from 'lucide-react-native';
import React, { useMemo } from 'react';

import { CompactRaceRow } from './CompactRaceRow';

export interface CompactTeamRowProps {
  id: string;
  /** Your team name */
  yourTeamName: string;
  /** Opponent team name */
  opponentTeamName: string;
  /** Heat number */
  heatNumber?: number;
  venue: string;
  date: string;
  startTime: string;
  /** Team size (3v3 or 4v4) */
  teamSize: 3 | 4;
  raceStatus: 'upcoming' | 'completed';
  onPress: () => void;
}

export function CompactTeamRow({
  id,
  yourTeamName,
  opponentTeamName,
  heatNumber,
  venue,
  date,
  startTime,
  teamSize,
  raceStatus,
  onPress,
}: CompactTeamRowProps) {
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
    const matchup = `${yourTeamName} vs ${opponentTeamName}`;
    return heatNumber ? `Heat ${heatNumber}: ${matchup}` : matchup;
  }, [yourTeamName, opponentTeamName, heatNumber]);

  // Badge shows team size
  const badge = `${teamSize}v${teamSize}`;

  return (
    <CompactRaceRow
      accentColor={raceStatus === 'completed' ? '#9CA3AF' : TEAM_RACING_COLORS.primary}
      title={title}
      subtitle={`📍 ${venue} · ${formattedDate}`}
      badge={badge}
      badgeBgColor={TEAM_RACING_COLORS.badgeBg}
      badgeTextColor={TEAM_RACING_COLORS.badgeText}
      countdown={countdown}
      status={raceStatus}
      onPress={onPress}
      icon={<Users size={16} color={TEAM_RACING_COLORS.primary} />}
    />
  );
}

export default CompactTeamRow;
