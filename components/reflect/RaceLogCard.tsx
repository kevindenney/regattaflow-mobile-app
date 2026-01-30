/**
 * RaceLogCard - Individual race entry in the race log list
 *
 * Similar to Strava's activity card, shows race details with
 * position, venue, conditions, and a preview map thumbnail.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import type { RaceLogEntry } from '@/hooks/useReflectData';

interface RaceLogCardProps {
  race: RaceLogEntry;
  onPress?: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPositionOrdinal(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  return position + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function getPositionColor(position: number | null): string {
  if (position === null) return IOS_COLORS.secondaryLabel;
  if (position === 1) return IOS_COLORS.systemOrange;
  if (position === 2) return IOS_COLORS.systemGray;
  if (position === 3) return '#CD7F32'; // Bronze
  return IOS_COLORS.secondaryLabel;
}

function WindIndicator({
  speed,
  direction,
}: {
  speed?: number;
  direction?: string;
}) {
  if (!speed && !direction) return null;

  return (
    <View style={styles.windIndicator}>
      <Ionicons
        name="navigate"
        size={12}
        color={IOS_COLORS.systemTeal}
        style={direction ? { transform: [{ rotate: getWindRotation(direction) }] } : undefined}
      />
      {speed && <Text style={styles.windText}>{speed} kts</Text>}
    </View>
  );
}

function getWindRotation(direction: string): string {
  const directions: Record<string, number> = {
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315,
  };
  return `${directions[direction] || 0}deg`;
}

export function RaceLogCard({ race, onPress }: RaceLogCardProps) {
  const isUpcoming = race.status === 'upcoming';
  const isPodium = race.position !== null && race.position <= 3;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      {/* Left: Position or Status */}
      <View style={styles.leftSection}>
        {isUpcoming ? (
          <View style={styles.upcomingBadge}>
            <Ionicons name="calendar-outline" size={18} color={IOS_COLORS.systemBlue} />
          </View>
        ) : race.position !== null ? (
          <View
            style={[
              styles.positionBadge,
              isPodium && styles.positionBadgePodium,
              { borderColor: getPositionColor(race.position) },
            ]}
          >
            <Text
              style={[
                styles.positionText,
                { color: getPositionColor(race.position) },
              ]}
            >
              {race.position}
            </Text>
          </View>
        ) : (
          <View style={styles.noPositionBadge}>
            <Ionicons name="flag-outline" size={18} color={IOS_COLORS.systemGray3} />
          </View>
        )}
      </View>

      {/* Center: Race Details */}
      <View style={styles.centerSection}>
        <Text style={styles.raceName} numberOfLines={1}>
          {race.name}
        </Text>

        <View style={styles.metaRow}>
          {race.venueName && (
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={12}
                color={IOS_COLORS.secondaryLabel}
              />
              <Text style={styles.metaText} numberOfLines={1}>
                {race.venueName}
              </Text>
            </View>
          )}
          {race.boatClass && (
            <View style={styles.metaItem}>
              <Ionicons
                name="boat-outline"
                size={12}
                color={IOS_COLORS.secondaryLabel}
              />
              <Text style={styles.metaText}>{race.boatClass}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.dateText}>
            {formatDate(race.date)} at {formatTime(race.date)}
          </Text>
          {!isUpcoming && race.fleetSize > 0 && (
            <Text style={styles.fleetText}>
              {race.position !== null
                ? `${getPositionOrdinal(race.position)} of ${race.fleetSize}`
                : `${race.fleetSize} boats`}
            </Text>
          )}
        </View>
      </View>

      {/* Right: Conditions & Arrow */}
      <View style={styles.rightSection}>
        {race.conditions && (
          <WindIndicator
            speed={race.conditions.windSpeed}
            direction={race.conditions.windDirection}
          />
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={IOS_COLORS.tertiaryLabel}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  containerPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  leftSection: {
    marginRight: 12,
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: IOS_COLORS.systemBackground,
  },
  positionBadgePodium: {
    backgroundColor: IOS_COLORS.systemOrange + '15',
  },
  positionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  upcomingBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPositionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    marginRight: 8,
  },
  raceName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    maxWidth: 120,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  fleetText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  windIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: IOS_COLORS.systemTeal + '15',
    borderRadius: 8,
  },
  windText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemTeal,
  },
});

export default RaceLogCard;
