/**
 * CompactRaceRow Component
 *
 * Shared base component for compact race row displays in list views.
 * Features:
 * - 4px left accent line (color indicates race type)
 * - Two-line layout: Title + Subtitle
 * - Optional badge (distance, team size, series score)
 * - Countdown display
 * - Chevron for navigation
 *
 * Used by: CompactDistanceRow, CompactMatchRow, CompactTeamRow
 */

import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export interface CompactRaceRowProps {
  /** Left accent color (indicates race type) */
  accentColor: string;
  /** Primary text (race name or matchup) */
  title: string;
  /** Secondary text (venue, date) */
  subtitle: string;
  /** Optional badge text (e.g., "26nm", "3v3", "2-1 Bo5") */
  badge?: string;
  /** Badge background color */
  badgeBgColor?: string;
  /** Badge text color */
  badgeTextColor?: string;
  /** Countdown values */
  countdown: {
    days: number;
    hours: number;
    minutes: number;
  };
  /** Status for styling */
  status: 'upcoming' | 'completed' | 'in_progress';
  /** Press handler */
  onPress: () => void;
  /** Optional icon component to show before title */
  icon?: React.ReactNode;
}

export function CompactRaceRow({
  accentColor,
  title,
  subtitle,
  badge,
  badgeBgColor = '#F1F5F9',
  badgeTextColor = '#475569',
  countdown,
  status,
  onPress,
  icon,
}: CompactRaceRowProps) {
  // Format countdown display
  const countdownDisplay =
    status === 'completed'
      ? 'Completed'
      : countdown.days > 0
        ? `${countdown.days}d ${countdown.hours}h`
        : `${countdown.hours}h ${countdown.minutes}m`;

  // Countdown colors based on urgency
  const getCountdownColors = () => {
    if (status === 'completed') return { text: '#9CA3AF' };
    if (countdown.days <= 1) return { text: '#DC2626' };
    if (countdown.days <= 3) return { text: '#F59E0B' };
    return { text: '#475569' };
  };
  const countdownColors = getCountdownColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        styles.containerApple,
        pressed && styles.containerPressed,
        status === 'completed' && styles.containerCompleted,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {/* Left Accent Line */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.titleRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Badge */}
      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badge}</Text>
        </View>
      )}

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <Text style={[styles.countdownText, { color: countdownColors.text }]}>{countdownDisplay}</Text>
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <ChevronRight size={20} color="#94A3B8" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 64,
  },
  containerApple: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  containerPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  containerCompleted: {
    opacity: 0.7,
  },
  accentLine: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconContainer: {
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countdownContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
    marginRight: 8,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chevronContainer: {
    paddingRight: 12,
  },
});

export default CompactRaceRow;
