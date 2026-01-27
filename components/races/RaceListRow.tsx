/**
 * RaceListRow - Compact race row for the vertical grouped list
 *
 * Layout:
 * - Left: Countdown badge (large for today/tomorrow, compact for later)
 * - Center: Race name (headline), venue + date (subhead), boat class (footnote)
 * - Right: Circular prep progress ring
 *
 * Uses IOS_TYPOGRAPHY, IOS_COLORS, IOS_SPACING from design-tokens-ios.ts.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_SHADOWS,
  IOS_TOUCH,
  REGATTA_SEMANTIC_COLORS,
} from '@/lib/design-tokens-ios';
import { useRaceCountdown } from '@/hooks/useRaceCountdown';
import { PrepProgressRing } from './PrepProgressRing';
import type { CardRaceData } from '@/components/cards/types';

// =============================================================================
// TYPES
// =============================================================================

export type RaceRowVariant = 'hero' | 'standard' | 'compact';

interface RaceListRowProps {
  /** Race data */
  race: CardRaceData;
  /** Row display variant */
  variant?: RaceRowVariant;
  /** Prep progress (0-1). Null = no ring shown */
  prepProgress?: number | null;
  /** Called when row is tapped */
  onPress?: (raceId: string) => void;
  /** Whether to dim the row (for past races) */
  dimmed?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceListRow({
  race,
  variant = 'standard',
  prepProgress = null,
  onPress,
  dimmed = false,
}: RaceListRowProps) {
  const countdown = useRaceCountdown(race.date, race.startTime);

  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  const timeStr = race.startTime ? formatTime(race.startTime) : '';
  const dateStr = formatDate(race.date);
  const subtitle = [race.venue, dateStr, timeStr].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => onPress?.(race.id)}
      style={({ pressed }) => [
        styles.row,
        isHero && styles.rowHero,
        isCompact && styles.rowCompact,
        dimmed && styles.rowDimmed,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${race.name}, ${countdown?.label || ''}`}
    >
      {/* Left: Countdown badge */}
      <View style={[styles.countdownContainer, isHero && styles.countdownHero]}>
        <Text
          style={[
            isHero ? styles.countdownLarge : isCompact ? styles.countdownCompact : styles.countdownStandard,
            { color: dimmed ? IOS_COLORS.systemGray : (countdown?.urgencyColor || IOS_COLORS.systemBlue) },
          ]}
          numberOfLines={1}
        >
          {countdown?.label || '—'}
        </Text>
        {isHero && countdown && !countdown.isPast && countdown.days > 0 && (
          <Text style={styles.countdownUnit}>days</Text>
        )}
      </View>

      {/* Center: Race info */}
      <View style={styles.infoContainer}>
        <Text
          style={[
            isHero ? styles.nameHero : styles.name,
            dimmed && styles.textDimmed,
          ]}
          numberOfLines={isCompact ? 1 : 2}
        >
          {race.name}
        </Text>
        {!isCompact && (
          <Text
            style={[styles.subtitle, dimmed && styles.textDimmed]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
        {isHero && race.boatClass && (
          <Text style={styles.boatClass} numberOfLines={1}>
            {race.boatClass}
          </Text>
        )}
      </View>

      {/* Right: Progress ring + chevron */}
      <View style={styles.rightContainer}>
        {prepProgress != null && (
          <PrepProgressRing
            progress={prepProgress}
            size={isHero ? 40 : 32}
            strokeWidth={isHero ? 3.5 : 3}
            showLabel={!isCompact}
          />
        )}
        <ChevronRight
          size={16}
          color={IOS_COLORS.systemGray3}
        />
      </View>
    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Row variants
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    minHeight: IOS_TOUCH.largeListItemHeight,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    gap: IOS_SPACING.md,
  },
  rowHero: {
    paddingVertical: IOS_SPACING.lg,
    minHeight: 80,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  rowCompact: {
    minHeight: IOS_TOUCH.listItemHeight,
    paddingVertical: IOS_SPACING.sm,
  },
  rowDimmed: {
    opacity: 0.55,
  },
  rowPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },

  // Countdown
  countdownContainer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownHero: {
    width: 56,
  },
  countdownLarge: {
    ...IOS_TYPOGRAPHY.title1,
    textAlign: 'center',
  },
  countdownStandard: {
    ...IOS_TYPOGRAPHY.title3,
    textAlign: 'center',
  },
  countdownCompact: {
    ...IOS_TYPOGRAPHY.headline,
    textAlign: 'center',
  },
  countdownUnit: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: -2,
  },

  // Info
  infoContainer: {
    flex: 1,
    gap: 2,
  },
  nameHero: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  name: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  subtitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  boatClass: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
  },
  textDimmed: {
    color: IOS_COLORS.systemGray,
  },

  // Right
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
});
