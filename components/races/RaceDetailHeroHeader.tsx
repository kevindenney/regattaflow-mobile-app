/**
 * RaceDetailHeroHeader - Hero header for the race detail screen
 *
 * Layout:
 * 1. Large countdown as dominant visual anchor (largeTitle bold)
 * 2. Race name (title2)
 * 3. Venue, date/time, boat class metadata row
 * 4. Optional prep progress ring
 *
 * The countdown is the undisputed visual anchor per the design plan.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MapPin, Clock, Sailboat } from 'lucide-react-native';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
} from '@/lib/design-tokens-ios';
import { useRaceCountdown } from '@/hooks/useRaceCountdown';
import { useRaceCollaborators } from '@/hooks/useRaceCollaborators';
import { FEATURE_FLAGS } from '@/lib/featureFlags';
import { PrepProgressRing } from './PrepProgressRing';
import { CrewAvatarStack } from './CrewAvatarStack';
import type { CardRaceData } from '@/components/cards/types';

// =============================================================================
// TYPES
// =============================================================================

interface RaceDetailHeroHeaderProps {
  /** Race data */
  race: CardRaceData;
  /** Overall prep progress (0-1) */
  prepProgress?: number | null;
  /** Set of user IDs currently present on this race (green dot) */
  presentUserIds?: Set<string>;
  /** Callback when collaborator avatars are tapped */
  onCollaboratorPress?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatFullDate(date: string, startTime?: string): string {
  const d = new Date(date);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();

  if (!startTime) return `${weekday}, ${month} ${day}`;

  const [hours, minutes] = startTime.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${weekday}, ${month} ${day} at ${h12}:${minutes} ${ampm}`;
}

function getCountdownDisplay(countdown: {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  label: string;
}): { primary: string; secondary: string } {
  if (countdown.isPast) {
    return { primary: countdown.label, secondary: 'Completed' };
  }
  if (countdown.isToday) {
    if (countdown.hours < 2) {
      return {
        primary: countdown.minutes < 60 ? `${countdown.minutes}m` : `${countdown.hours}h`,
        secondary: 'Starting soon',
      };
    }
    return { primary: 'Today', secondary: `In ${countdown.hours}h` };
  }
  if (countdown.isTomorrow) {
    return { primary: 'Tomorrow', secondary: '' };
  }
  if (countdown.days <= 7) {
    return { primary: `${countdown.days}`, secondary: `day${countdown.days !== 1 ? 's' : ''} to go` };
  }
  return { primary: `${countdown.days}`, secondary: 'days to go' };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RaceDetailHeroHeader({
  race,
  prepProgress,
  presentUserIds,
  onCollaboratorPress,
}: RaceDetailHeroHeaderProps) {
  const countdown = useRaceCountdown(race.date, race.startTime);
  const { collaborators } = useRaceCollaborators(race.id);
  const showAvatars = FEATURE_FLAGS.ENABLE_CREW_AVATARS_HEADER && collaborators.length > 0;

  const countdownDisplay = countdown
    ? getCountdownDisplay(countdown)
    : { primary: '—', secondary: '' };

  const dateStr = formatFullDate(race.date, race.startTime);
  const urgencyColor = countdown?.urgencyColor || IOS_COLORS.systemBlue;

  return (
    <View style={styles.container}>
      {/* Countdown as dominant visual anchor */}
      <View style={styles.countdownRow}>
        <View style={styles.countdownContent}>
          <Text style={[styles.countdownPrimary, { color: urgencyColor }]}>
            {countdownDisplay.primary}
          </Text>
          {countdownDisplay.secondary ? (
            <Text style={styles.countdownSecondary}>
              {countdownDisplay.secondary}
            </Text>
          ) : null}
        </View>
        {prepProgress != null && (
          <PrepProgressRing progress={prepProgress} size={48} strokeWidth={4} />
        )}
      </View>

      {/* Race name */}
      <Text style={styles.raceName} numberOfLines={2}>
        {race.name}
      </Text>

      {/* Metadata row */}
      <View style={styles.metadataRow}>
        {race.venue && (
          <View style={styles.metadataItem}>
            <MapPin size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.metadataText} numberOfLines={1}>
              {race.venue}
            </Text>
          </View>
        )}
        <View style={styles.metadataItem}>
          <Clock size={14} color={IOS_COLORS.secondaryLabel} />
          <Text style={styles.metadataText} numberOfLines={1}>
            {dateStr}
          </Text>
        </View>
        {race.boatClass && (
          <View style={styles.metadataItem}>
            <Sailboat size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.metadataText} numberOfLines={1}>
              {race.boatClass}
            </Text>
          </View>
        )}
      </View>

      {/* Collaborator avatar row */}
      {showAvatars && (
        <View style={styles.crewRow}>
          <CrewAvatarStack
            collaborators={collaborators}
            maxVisible={6}
            size="sm"
            onPress={onCollaboratorPress}
            showPendingBadge
          />
          {presentUserIds && presentUserIds.size > 0 && (
            <Text style={styles.presenceLabel}>
              {presentUserIds.size} online
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xl,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    gap: IOS_SPACING.sm,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownContent: {
    flex: 1,
  },
  countdownPrimary: {
    ...IOS_TYPOGRAPHY.largeTitle,
    fontWeight: '700',
  },
  countdownSecondary: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: -2,
  },
  raceName: {
    ...IOS_TYPOGRAPHY.title2,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.xs,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.lg,
    marginTop: IOS_SPACING.xs,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginTop: IOS_SPACING.sm,
  },
  presenceLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemGreen,
    fontWeight: '500',
  },
});
