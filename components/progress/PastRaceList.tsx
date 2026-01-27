/**
 * PastRaceList Component (Tufte-Style)
 *
 * Compact list of completed races with results.
 * Tabular-nums for positions, weight hierarchy for wins.
 *
 * Tufte principles:
 * - High data-ink ratio
 * - Tabular numbers for alignment
 * - Weight hierarchy (bold for 1st place)
 * - No decorative elements
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { ordinal } from '@/lib/tufte';
import type { RaceResult } from '@/types/excellenceFramework';

// =============================================================================
// TYPES
// =============================================================================

interface PastRaceListProps {
  /** Recent race results */
  races: RaceResult[];
  /** Max number to display */
  limit?: number;
  /** Callback when a race row is pressed */
  onRacePress?: (raceId: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PastRaceList({
  races,
  limit = 8,
  onRacePress,
}: PastRaceListProps) {
  const displayRaces = races.slice(0, limit);

  if (displayRaces.length === 0) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Past Races</Text>
        <Text style={styles.emptyText}>
          Complete races to see your results here.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Past Races</Text>

      {displayRaces.map((race, index) => {
        const isWin = race.position === 1;
        const isPodium = race.position <= 3;
        const dateStr = formatRaceDate(race.date);
        const fleetStr = race.fleetSize ? `/${race.fleetSize}` : '';

        return (
          <TouchableOpacity
            key={race.raceId}
            style={[
              styles.raceRow,
              index < displayRaces.length - 1 && styles.raceRowBorder,
            ]}
            onPress={() => onRacePress?.(race.raceId)}
            activeOpacity={0.6}
            disabled={!onRacePress}
          >
            {/* Position */}
            <View style={styles.positionContainer}>
              <Text
                style={[
                  styles.position,
                  isWin && styles.positionWin,
                  isPodium && !isWin && styles.positionPodium,
                ]}
              >
                {ordinal(race.position)}
              </Text>
              {fleetStr && (
                <Text style={styles.fleetSize}>{fleetStr}</Text>
              )}
            </View>

            {/* Race info */}
            <View style={styles.raceInfo}>
              {race.venueName && (
                <Text style={styles.venueName} numberOfLines={1}>
                  {race.venueName}
                </Text>
              )}
              <Text style={styles.raceDate}>{dateStr}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRaceDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  raceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  raceRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 52,
    marginRight: 12,
  },
  position: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    fontVariant: ['tabular-nums'],
  },
  positionWin: {
    fontWeight: '700',
    color: '#059669', // Green for wins
  },
  positionPodium: {
    fontWeight: '600',
  },
  fleetSize: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
    fontVariant: ['tabular-nums'],
  },
  raceInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 1,
  },
  raceDate: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9ca3af',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
