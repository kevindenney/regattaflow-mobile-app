/**
 * RaceParticipantsView Component
 *
 * Shows other sailors preparing for the same race.
 * Displays prep notes, tuning settings, and post-race analysis.
 *
 * Used in:
 * - Race card expansion ("8 others prepping for Mid-Winters")
 * - Race detail view participant section
 */

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChevronRight,
  FileText,
  Lightbulb,
  Settings2,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY } from '@/lib/design-tokens-ios';
import { useRaceParticipants, RaceParticipant } from '@/hooks/useRaceParticipants';

/**
 * Props for RaceParticipantsView
 */
interface RaceParticipantsViewProps {
  /** Race name for fuzzy matching */
  raceName: string;
  /** Race date (YYYY-MM-DD) */
  raceDate: string;
  /** Optional venue for stricter matching */
  venue?: string;
  /** Display mode */
  variant?: 'compact' | 'expanded';
  /** Callback when participant is selected */
  onParticipantSelect?: (participant: RaceParticipant) => void;
}

/**
 * Compact count badge for race card
 */
export function ParticipantCountBadge({
  count,
  onPress,
}: {
  count: number;
  onPress?: () => void;
}) {
  if (count === 0) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.countBadge,
        pressed && styles.countBadgePressed,
      ]}
      onPress={onPress}
    >
      <Users size={12} color={IOS_COLORS.systemBlue} />
      <Text style={styles.countBadgeText}>
        {count} {count === 1 ? 'other' : 'others'} prepping
      </Text>
    </Pressable>
  );
}

/**
 * Individual participant card
 */
function ParticipantCard({
  participant,
  onPress,
  onLoadContent,
  isLoadingContent,
}: {
  participant: RaceParticipant;
  onPress?: () => void;
  onLoadContent?: () => void;
  isLoadingContent?: boolean;
}) {
  const hasLoadedContent = participant.prepNotes || participant.postRaceNotes;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.participantCard,
        pressed && styles.participantCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={[
        styles.avatar,
        { backgroundColor: participant.avatarColor || IOS_COLORS.systemBlue },
      ]}>
        <Text style={styles.avatarEmoji}>{participant.avatarEmoji || '⛵'}</Text>
      </View>

      {/* Info */}
      <View style={styles.participantInfo}>
        <Text style={styles.participantName} numberOfLines={1}>
          {participant.userName}
        </Text>

        {/* Content indicators */}
        <View style={styles.contentIndicators}>
          {participant.hasPrepNotes && (
            <View style={styles.indicatorPill}>
              <FileText size={10} color={IOS_COLORS.systemGreen} />
              <Text style={styles.indicatorPillText}>Prep Notes</Text>
            </View>
          )}
          {participant.hasPostRaceNotes && (
            <View style={styles.indicatorPill}>
              <Lightbulb size={10} color={IOS_COLORS.systemYellow} />
              <Text style={styles.indicatorPillText}>Analysis</Text>
            </View>
          )}
        </View>

        {/* Loaded content preview */}
        {hasLoadedContent && (
          <View style={styles.contentPreview}>
            {participant.prepNotes && (
              <Text style={styles.previewText} numberOfLines={2}>
                {participant.prepNotes}
              </Text>
            )}
            {participant.lessonsLearned && participant.lessonsLearned.length > 0 && (
              <View style={styles.lessonsList}>
                {participant.lessonsLearned.slice(0, 2).map((lesson, idx) => (
                  <View key={idx} style={styles.lessonItem}>
                    <Lightbulb size={12} color={IOS_COLORS.systemYellow} />
                    <Text style={styles.lessonText} numberOfLines={1}>
                      {lesson}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action */}
      {!hasLoadedContent && onLoadContent && (
        <Pressable
          style={styles.loadButton}
          onPress={(e) => {
            e.stopPropagation();
            onLoadContent();
          }}
          disabled={isLoadingContent}
        >
          {isLoadingContent ? (
            <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
          ) : (
            <ChevronRight size={16} color={IOS_COLORS.systemBlue} />
          )}
        </Pressable>
      )}
    </Pressable>
  );
}

/**
 * Race Participants View component
 */
export function RaceParticipantsView({
  raceName,
  raceDate,
  venue,
  variant = 'expanded',
  onParticipantSelect,
}: RaceParticipantsViewProps) {
  const {
    participants,
    participantCount,
    isLoading,
    error,
    loadParticipantContent,
  } = useRaceParticipants({
    raceName,
    raceDate,
    venue,
    enabled: true,
  });

  const [loadingContentFor, setLoadingContentFor] = useState<string | null>(null);

  const handleLoadContent = useCallback(async (regattaId: string) => {
    setLoadingContentFor(regattaId);
    await loadParticipantContent(regattaId);
    setLoadingContentFor(null);
  }, [loadParticipantContent]);

  // Compact mode - just show count badge
  if (variant === 'compact') {
    return (
      <ParticipantCountBadge
        count={participantCount}
        onPress={() => {
          // Could expand to show full view
        }}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.headerTitle}>Others Preparing</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={IOS_COLORS.systemBlue} />
          <Text style={styles.loadingText}>Finding other sailors...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={18} color={IOS_COLORS.systemGray} />
          <Text style={[styles.headerTitle, { color: IOS_COLORS.systemGray }]}>
            Others Preparing
          </Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Empty state
  if (participantCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Users size={18} color={IOS_COLORS.systemGray} />
          <Text style={styles.headerTitle}>Others Preparing</Text>
        </View>
        <View style={styles.emptyState}>
          <UserCheck size={32} color={IOS_COLORS.systemGray3} />
          <Text style={styles.emptyText}>
            Be the first to share your prep for this race
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Users size={18} color={IOS_COLORS.systemBlue} />
        <Text style={styles.headerTitle}>
          {participantCount} {participantCount === 1 ? 'Other' : 'Others'} Preparing
        </Text>
      </View>

      {/* Participants list */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {participants.map((participant) => (
          <ParticipantCard
            key={participant.regattaId}
            participant={participant}
            onPress={() => onParticipantSelect?.(participant)}
            onLoadContent={() => handleLoadContent(participant.regattaId)}
            isLoadingContent={loadingContentFor === participant.regattaId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.md,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  list: {
    maxHeight: 300,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    marginBottom: IOS_SPACING.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  participantCardPressed: {
    opacity: 0.8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.md,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  contentIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.xs,
    marginBottom: IOS_SPACING.xs,
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemGray6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: IOS_RADIUS.xs,
  },
  indicatorPillText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  contentPreview: {
    marginTop: IOS_SPACING.xs,
  },
  previewText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.xs,
  },
  lessonsList: {
    gap: IOS_SPACING.xs,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  lessonText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.label,
    flex: 1,
  },
  loadButton: {
    padding: IOS_SPACING.sm,
    marginLeft: IOS_SPACING.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.lg,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  emptyState: {
    alignItems: 'center',
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.sm,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  errorText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemRed,
    textAlign: 'center',
    padding: IOS_SPACING.md,
  },
  // Count badge styles
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    backgroundColor: `${IOS_COLORS.systemBlue}12`,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.sm,
  },
  countBadgePressed: {
    opacity: 0.7,
  },
  countBadgeText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});

export default RaceParticipantsView;
