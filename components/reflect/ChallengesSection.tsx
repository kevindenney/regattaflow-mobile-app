/**
 * ChallengesSection - Display active and completed challenges
 *
 * Shows progress on current challenges with progress bars,
 * similar to Strava's challenge tracking feature.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { Challenge } from '@/hooks/useReflectProfile';

interface ChallengesSectionProps {
  challenges: Challenge[];
  onSeeMore?: () => void;
  onChallengePress?: (challenge: Challenge) => void;
  onJoinChallenge?: () => void;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function ChallengeCard({
  challenge,
  onPress,
}: {
  challenge: Challenge;
  onPress?: () => void;
}) {
  const progress = Math.min(1, challenge.currentValue / challenge.targetValue);
  const daysRemaining = getDaysRemaining(challenge.endDate);
  const iconName = challenge.icon as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.challengeCard,
        pressed && onPress && styles.challengeCardPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Completed Badge */}
      {challenge.isCompleted && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={IOS_COLORS.systemGreen} />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.challengeHeader}>
        <View style={styles.challengeIconContainer}>
          <Ionicons
            name={iconName}
            size={20}
            color={challenge.isCompleted ? IOS_COLORS.systemGreen : IOS_COLORS.systemBlue}
          />
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Text style={styles.challengeDescription} numberOfLines={1}>
            {challenge.description}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: challenge.isCompleted
                  ? IOS_COLORS.systemGreen
                  : IOS_COLORS.systemBlue,
              },
            ]}
          />
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.progressText}>
            {challenge.currentValue} / {challenge.targetValue}
          </Text>
          {!challenge.isCompleted && daysRemaining > 0 && (
            <Text style={styles.daysRemaining}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
            </Text>
          )}
          {challenge.isCompleted && challenge.reward && (
            <View style={styles.rewardBadge}>
              <Ionicons name="gift" size={10} color={IOS_COLORS.systemPurple} />
              <Text style={styles.rewardText}>{challenge.reward}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function ChallengesSection({
  challenges,
  onSeeMore,
  onChallengePress,
  onJoinChallenge,
}: ChallengesSectionProps) {
  // Separate active and completed challenges
  const activeChallenges = challenges.filter((c) => !c.isCompleted);
  const completedChallenges = challenges.filter((c) => c.isCompleted);

  // Show active first, then most recent completed
  const displayChallenges = [
    ...activeChallenges,
    ...completedChallenges.slice(0, 2),
  ].slice(0, 3);

  if (challenges.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Challenges</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="fitness-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No active challenges</Text>
          <Text style={styles.emptySubtext}>
            Join challenges to set goals and track your progress
          </Text>
          {onJoinChallenge && (
            <Pressable
              style={({ pressed }) => [
                styles.joinButton,
                pressed && styles.joinButtonPressed,
              ]}
              onPress={onJoinChallenge}
            >
              <Ionicons name="add-circle" size={20} color={IOS_COLORS.systemBlue} />
              <Text style={styles.joinButtonText}>Browse Challenges</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Challenges</Text>
          {activeChallenges.length > 0 && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>
                {activeChallenges.length} active
              </Text>
            </View>
          )}
        </View>
        {onSeeMore && challenges.length > 3 && (
          <Pressable
            onPress={onSeeMore}
            style={({ pressed }) => [
              styles.seeMoreButton,
              pressed && styles.seeMoreButtonPressed,
            ]}
          >
            <Text style={styles.seeMoreText}>See All</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={IOS_COLORS.systemBlue}
            />
          </Pressable>
        )}
      </View>

      {/* Challenge List */}
      <View style={styles.challengeList}>
        {displayChallenges.map((challenge, index) => (
          <React.Fragment key={challenge.id}>
            <ChallengeCard
              challenge={challenge}
              onPress={onChallengePress ? () => onChallengePress(challenge) : undefined}
            />
            {index < displayChallenges.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Join Button */}
      {onJoinChallenge && (
        <Pressable
          style={({ pressed }) => [
            styles.footerButton,
            pressed && styles.footerButtonPressed,
          ]}
          onPress={onJoinChallenge}
        >
          <Ionicons name="add" size={18} color={IOS_COLORS.systemBlue} />
          <Text style={styles.footerButtonText}>Join a Challenge</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  activeBadge: {
    backgroundColor: IOS_COLORS.systemBlue + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreButtonPressed: {
    opacity: 0.6,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  challengeList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  challengeCard: {
    padding: 12,
  },
  challengeCardPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.systemGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  daysRemaining: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: IOS_COLORS.systemPurple + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.systemPurple,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  footerButtonPressed: {
    opacity: 0.6,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginBottom: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    borderRadius: 20,
    marginTop: 8,
  },
  joinButtonPressed: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
});

export default ChallengesSection;
