/**
 * ClassExpertsSection Component
 *
 * Discovers and displays high-performing sailors by boat class.
 * Shows experts who share their race prep and analysis openly.
 *
 * "Learn from top Dragon sailors" - filtered by user's boat class
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
  Award,
  BookOpen,
  ChevronRight,
  Eye,
  Star,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY } from '@/lib/design-tokens-ios';
import { useClassExperts, useUserBoatClass, ClassExpert, ExpertRacePreview } from '@/hooks/useClassExperts';

/**
 * Props for ClassExpertsSection
 */
interface ClassExpertsSectionProps {
  /** Override boat class ID (defaults to user's primary class) */
  classId?: string;
  /** Class name for display */
  className?: string;
  /** Maximum experts to show */
  limit?: number;
  /** Callback when expert is selected */
  onExpertSelect?: (expert: ClassExpert) => void;
  /** Callback when "See All" is pressed */
  onSeeAll?: () => void;
}

/**
 * Expert card component
 */
function ExpertCard({
  expert,
  onPress,
  onFollow,
  onLoadRaces,
  isLoadingRaces,
}: {
  expert: ClassExpert;
  onPress?: () => void;
  onFollow?: () => void;
  onLoadRaces?: () => void;
  isLoadingRaces?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.expertCard,
        pressed && styles.expertCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Avatar with badge */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          { backgroundColor: expert.avatarColor || IOS_COLORS.systemBlue },
        ]}>
          <Text style={styles.avatarEmoji}>{expert.avatarEmoji || '⛵'}</Text>
        </View>
        {expert.podiumCount > 0 && (
          <View style={styles.podiumBadge}>
            <Trophy size={10} color="#FFD700" />
            <Text style={styles.podiumBadgeText}>{expert.podiumCount}</Text>
          </View>
        )}
      </View>

      {/* Expert info */}
      <View style={styles.expertInfo}>
        <Text style={styles.expertName} numberOfLines={1}>
          {expert.userName}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {expert.podiumCount > 0 && (
            <View style={styles.statItem}>
              <Trophy size={11} color={IOS_COLORS.systemYellow} />
              <Text style={styles.statText}>{expert.podiumCount} podiums</Text>
            </View>
          )}
          {expert.publicRaceCount > 0 && (
            <View style={styles.statItem}>
              <BookOpen size={11} color={IOS_COLORS.systemGreen} />
              <Text style={styles.statText}>{expert.publicRaceCount} shared</Text>
            </View>
          )}
          {expert.recentActivity && (
            <View style={styles.recentBadge}>
              <View style={styles.recentDot} />
              <Text style={styles.recentText}>Active</Text>
            </View>
          )}
        </View>

        {/* Race previews */}
        {expert.recentRaces && expert.recentRaces.length > 0 && (
          <View style={styles.racePreviews}>
            {expert.recentRaces.slice(0, 2).map((race) => (
              <View key={race.id} style={styles.racePreviewItem}>
                <Text style={styles.racePreviewText} numberOfLines={1}>
                  {race.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onFollow && (
          <Pressable
            style={[
              styles.followButton,
              expert.isFollowing && styles.followButtonActive,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onFollow();
            }}
          >
            {expert.isFollowing ? (
              <Eye size={14} color={IOS_COLORS.systemBackground} />
            ) : (
              <UserPlus size={14} color={IOS_COLORS.systemBlue} />
            )}
          </Pressable>
        )}
        {!expert.recentRaces && onLoadRaces && (
          <Pressable
            style={styles.loadButton}
            onPress={(e) => {
              e.stopPropagation();
              onLoadRaces();
            }}
            disabled={isLoadingRaces}
          >
            {isLoadingRaces ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
            ) : (
              <ChevronRight size={16} color={IOS_COLORS.systemBlue} />
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Class Experts Section component
 */
export function ClassExpertsSection({
  classId: overrideClassId,
  className: overrideClassName,
  limit = 5,
  onExpertSelect,
  onSeeAll,
}: ClassExpertsSectionProps) {
  // Get user's boat class if not provided
  const { classId: userClassId, className: userClassName, isLoading: classLoading } = useUserBoatClass();

  const effectiveClassId = overrideClassId || userClassId;
  const effectiveClassName = overrideClassName || userClassName;

  const {
    experts,
    isLoading,
    error,
    loadExpertRaces,
    toggleFollow,
  } = useClassExperts({
    classId: effectiveClassId || undefined,
    limit,
    enabled: !!effectiveClassId,
  });

  const [loadingRacesFor, setLoadingRacesFor] = useState<string | null>(null);

  const handleLoadRaces = useCallback(async (expertUserId: string) => {
    setLoadingRacesFor(expertUserId);
    await loadExpertRaces(expertUserId);
    setLoadingRacesFor(null);
  }, [loadExpertRaces]);

  // Don't show if no class or loading
  if (classLoading || (!effectiveClassId && !isLoading)) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Award size={18} color={IOS_COLORS.systemPurple} />
          <Text style={styles.headerTitle}>Class Experts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={IOS_COLORS.systemPurple} />
          <Text style={styles.loadingText}>Finding top sailors...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (experts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Award size={18} color={IOS_COLORS.systemGray} />
          <Text style={styles.headerTitle}>
            {effectiveClassName ? `Top ${effectiveClassName} Sailors` : 'Class Experts'}
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Star size={32} color={IOS_COLORS.systemGray3} />
          <Text style={styles.emptyText}>
            No experts found sharing publicly yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Award size={18} color={IOS_COLORS.systemPurple} />
        <Text style={styles.headerTitle}>
          {effectiveClassName ? `Learn from Top ${effectiveClassName} Sailors` : 'Class Experts'}
        </Text>
        {onSeeAll && experts.length >= limit && (
          <Pressable onPress={onSeeAll} style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        )}
      </View>

      {/* Experts list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={240} // card width + gap
      >
        {experts.map((expert) => (
          <ExpertCard
            key={expert.userId}
            expert={expert}
            onPress={() => onExpertSelect?.(expert)}
            onFollow={() => toggleFollow(expert.userId)}
            onLoadRaces={() => handleLoadRaces(expert.userId)}
            isLoadingRaces={loadingRacesFor === expert.userId}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: IOS_SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.md,
    gap: IOS_SPACING.sm,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    flex: 1,
  },
  seeAllButton: {
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
  },
  seeAllText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemPurple,
  },
  scrollContent: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  expertCard: {
    width: 220,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  expertCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: IOS_SPACING.sm,
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  podiumBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: IOS_COLORS.systemBackground,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: IOS_RADIUS.xs,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  podiumBadgeText: {
    ...IOS_TYPOGRAPHY.caption2,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  recentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: IOS_RADIUS.xs,
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.systemGreen,
  },
  recentText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.systemGreen,
    fontWeight: '600',
  },
  racePreviews: {
    marginTop: IOS_SPACING.xs,
    gap: IOS_SPACING.xs,
  },
  racePreviewItem: {
    backgroundColor: IOS_COLORS.systemGray6,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 4,
    borderRadius: IOS_RADIUS.xs,
  },
  racePreviewText: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginTop: IOS_SPACING.sm,
  },
  followButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  loadButton: {
    padding: IOS_SPACING.xs,
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
    padding: IOS_SPACING.xl,
    gap: IOS_SPACING.sm,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default ClassExpertsSection;
