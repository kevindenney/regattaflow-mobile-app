/**
 * SailorActivityCard
 *
 * Card component for displaying a sailor's race activity in the Follow feed.
 * Shows race name, date, venue, and activity type (upcoming/result).
 * Supports comments on activity.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MessageCircle } from 'lucide-react-native';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { useActivityCommentCount } from '@/hooks/useActivityComments';
import { ActivityCommentSection } from './ActivityCommentSection';
import type { PublicRacePreview } from '@/services/CrewFinderService';
import type { ActivityType } from '@/services/ActivityCommentService';

interface SailorActivityCardProps {
  race: PublicRacePreview;
  onSailorPress?: (userId: string) => void;
  /** Show comments section */
  showComments?: boolean;
}

export function SailorActivityCard({
  race,
  onSailorPress,
  showComments = true,
}: SailorActivityCardProps) {
  const router = useRouter();
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  // Determine activity type for comments
  const activityType: ActivityType = race.isPast ? 'race_result' : 'race_entry';

  // Get comment count for badge
  const { count: commentCount } = useActivityCommentCount(activityType, race.id);

  const handleRacePress = useCallback(() => {
    triggerHaptic('selection');
    // Navigate to the race detail as read-only
    router.push(`/sailor/${race.userId}/race/${race.id}`);
  }, [router, race.id, race.userId]);

  const handleSailorPress = useCallback(() => {
    triggerHaptic('selection');
    if (onSailorPress) {
      onSailorPress(race.userId);
    } else {
      router.push(`/sailor/${race.userId}`);
    }
  }, [onSailorPress, race.userId, router]);

  const handleToggleComments = useCallback(() => {
    triggerHaptic('selection');
    setCommentsExpanded((prev) => !prev);
  }, []);

  // Format the date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Activity type label
  const activityLabel = race.isPast ? 'Raced at' : 'Racing at';
  const activityIcon = race.isPast ? 'checkmark-circle' : 'time-outline';

  return (
    <View style={styles.cardContainer}>
      <Pressable onPress={handleRacePress} style={styles.card}>
        {/* Sailor Header */}
        <Pressable onPress={handleSailorPress} style={styles.sailorRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: race.avatarColor || IOS_COLORS.systemGray5 },
            ]}
          >
            <Text style={styles.avatarEmoji}>{race.avatarEmoji || '⛵'}</Text>
          </View>
          <View style={styles.sailorInfo}>
            <Text style={styles.sailorName} numberOfLines={1}>
              {race.userName}
            </Text>
            <View style={styles.activityRow}>
              <Ionicons
                name={activityIcon as any}
                size={12}
                color={IOS_COLORS.secondaryLabel}
              />
              <Text style={styles.activityLabel}>
                {activityLabel} • {formatDate(race.startDate)}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Race Info */}
        <View style={styles.raceContent}>
          <Text style={styles.raceName} numberOfLines={2}>
            {race.name}
          </Text>

          {race.venue && (
            <View style={styles.venueRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={IOS_COLORS.tertiaryLabel}
              />
              <Text style={styles.venueText} numberOfLines={1}>
                {race.venue}
              </Text>
            </View>
          )}

          {/* Content Indicators */}
          <View style={styles.indicatorsRow}>
            {race.boatClass && (
              <View style={styles.indicator}>
                <Ionicons name="boat-outline" size={12} color={IOS_COLORS.systemBlue} />
                <Text style={styles.indicatorText}>{race.boatClass}</Text>
              </View>
            )}
            {race.hasPrepNotes && (
              <View style={styles.indicator}>
                <Ionicons name="document-text-outline" size={12} color={IOS_COLORS.systemGreen} />
                <Text style={styles.indicatorText}>Prep Notes</Text>
              </View>
            )}
            {race.hasTuning && (
              <View style={styles.indicator}>
                <Ionicons name="settings-outline" size={12} color={IOS_COLORS.systemOrange} />
                <Text style={styles.indicatorText}>Tuning</Text>
              </View>
            )}
            {race.hasLessons && (
              <View style={styles.indicator}>
                <Ionicons name="bulb-outline" size={12} color={IOS_COLORS.systemPurple} />
                <Text style={styles.indicatorText}>Lessons</Text>
              </View>
            )}
          </View>

          {/* Action Row */}
          {showComments && (
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.commentButton,
                  pressed && styles.commentButtonPressed,
                ]}
                onPress={handleToggleComments}
              >
                <MessageCircle
                  size={16}
                  color={
                    commentsExpanded ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel
                  }
                />
                <Text
                  style={[
                    styles.commentButtonText,
                    commentsExpanded && styles.commentButtonTextActive,
                  ]}
                >
                  {commentCount > 0 ? commentCount : 'Comment'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* View Chevron */}
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
        </View>
      </Pressable>

      {/* Comments Section */}
      {showComments && commentsExpanded && (
        <View style={styles.commentsContainer}>
          <ActivityCommentSection
            activityType={activityType}
            activityId={race.id}
            targetUserId={race.userId}
            expanded={commentsExpanded}
            compact
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
  },
  card: {
    padding: IOS_SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sailorRow: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: IOS_SPACING.md,
    width: 56,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  sailorInfo: {
    marginTop: IOS_SPACING.xs,
    alignItems: 'center',
  },
  sailorName: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    maxWidth: 56,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  activityLabel: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  raceContent: {
    flex: 1,
  },
  raceName: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: IOS_SPACING.sm,
  },
  venueText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  indicatorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: IOS_RADIUS.sm,
  },
  indicatorText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: IOS_SPACING.sm,
    alignSelf: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: IOS_SPACING.sm,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: IOS_SPACING.xs,
    paddingHorizontal: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.sm,
  },
  commentButtonPressed: {
    opacity: 0.7,
  },
  commentButtonText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  commentButtonTextActive: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  commentsContainer: {
    paddingHorizontal: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.md,
    marginLeft: 72, // Align with race content (56 avatar + 16 padding)
  },
});

export default SailorActivityCard;
