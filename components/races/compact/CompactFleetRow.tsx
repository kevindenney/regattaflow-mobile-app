/**
 * CompactFleetRow Component
 *
 * Compact row display for fleet racing in list views.
 * Blue/green theme with fleet count badge.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 🔵 │ Wednesday Night Series Race 4 │ 32   │  2d 5h │  > │
 * │    │ 📍 Victoria · Wed, Jan 15     │boats │        │    │
 * └──────────────────────────────────────────────────────────┘
 */

import { calculateCountdown } from '@/constants/mockData';
import { Flag } from 'lucide-react-native';
import React, { useMemo } from 'react';

import { CompactRaceRow } from './CompactRaceRow';

// Fleet racing blue theme
const FLEET_COLORS = {
  primary: '#0369A1',
  accent: '#10B981',
  badgeBg: '#E0F2FE',
  badgeText: '#0369A1',
};

export interface CompactFleetRowProps {
  id: string;
  raceName: string;
  venue: string;
  date: string;
  startTime: string;
  /** Expected fleet size */
  fleetSize?: number;
  raceStatus: 'upcoming' | 'completed';
  onPress: () => void;
}

export function CompactFleetRow({
  id,
  raceName,
  venue,
  date,
  startTime,
  fleetSize,
  raceStatus,
  onPress,
}: CompactFleetRowProps) {
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
  const badge = fleetSize ? `${fleetSize} boats` : undefined;

  return (
    <CompactRaceRow
      accentColor={raceStatus === 'completed' ? '#9CA3AF' : FLEET_COLORS.primary}
      title={raceName}
      subtitle={`📍 ${venue} · ${formattedDate}`}
      badge={badge}
      badgeBgColor={FLEET_COLORS.badgeBg}
      badgeTextColor={FLEET_COLORS.badgeText}
      countdown={countdown}
      status={raceStatus}
      onPress={onPress}
      icon={<Flag size={16} color={FLEET_COLORS.primary} />}
    />
  );
}

export default CompactFleetRow;
