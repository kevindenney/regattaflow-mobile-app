/**
 * CompactDistanceRow Component
 *
 * Compact row display for distance races in list views.
 * Purple theme with distance badge.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 🟣 │ Sun Hung Kai Around Island    │ 26nm │ 12d 4h │  > │
 * │    │ 📍 HK Island · Sat, Dec 13    │      │        │    │
 * └──────────────────────────────────────────────────────────┘
 */

import { calculateCountdown } from '@/constants/mockData';
import { Sailboat } from 'lucide-react-native';
import React, { useMemo } from 'react';

import { CompactRaceRow } from './CompactRaceRow';

// Distance racing purple theme
const DISTANCE_COLORS = {
  primary: '#7C3AED',
  badgeBg: '#F5F3FF',
  badgeText: '#6D28D9',
};

export interface CompactDistanceRowProps {
  id: string;
  raceName: string;
  venue: string;
  date: string;
  startTime: string;
  totalDistance?: number;
  raceStatus: 'upcoming' | 'completed';
  onPress: () => void;
}

export function CompactDistanceRow({
  id,
  raceName,
  venue,
  date,
  startTime,
  totalDistance,
  raceStatus,
  onPress,
}: CompactDistanceRowProps) {
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

  // Format badge
  const badge = totalDistance ? `${totalDistance}nm` : undefined;

  return (
    <CompactRaceRow
      accentColor={raceStatus === 'completed' ? '#9CA3AF' : DISTANCE_COLORS.primary}
      title={raceName}
      subtitle={`📍 ${venue} · ${formattedDate}`}
      badge={badge}
      badgeBgColor={DISTANCE_COLORS.badgeBg}
      badgeTextColor={DISTANCE_COLORS.badgeText}
      countdown={countdown}
      status={raceStatus}
      onPress={onPress}
      icon={<Sailboat size={16} color={DISTANCE_COLORS.primary} />}
    />
  );
}

export default CompactDistanceRow;
