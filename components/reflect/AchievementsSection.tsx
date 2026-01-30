/**
 * AchievementsSection - Trophy case displaying earned achievements
 *
 * Horizontal scrolling carousel of achievement badges with icons,
 * similar to Strava's trophy case in the "You" tab.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { Achievement, AchievementType } from '@/hooks/useReflectProfile';

interface AchievementsSectionProps {
  achievements: Achievement[];
  onSeeMore?: () => void;
  onAchievementPress?: (achievement: Achievement) => void;
}

// Achievement configuration with colors and icons
const ACHIEVEMENT_CONFIG: Record<
  AchievementType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
  first_race: {
    icon: 'flag',
    color: IOS_COLORS.systemGreen,
    bgColor: IOS_COLORS.systemGreen + '20',
  },
  first_win: {
    icon: 'trophy',
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  first_podium: {
    icon: 'medal',
    color: IOS_COLORS.systemOrange,
    bgColor: IOS_COLORS.systemOrange + '20',
  },
  race_milestone_10: {
    icon: 'star',
    color: IOS_COLORS.systemBlue,
    bgColor: IOS_COLORS.systemBlue + '20',
  },
  race_milestone_50: {
    icon: 'star',
    color: IOS_COLORS.systemIndigo,
    bgColor: IOS_COLORS.systemIndigo + '20',
  },
  race_milestone_100: {
    icon: 'star',
    color: IOS_COLORS.systemPurple,
    bgColor: IOS_COLORS.systemPurple + '20',
  },
  win_streak_3: {
    icon: 'flame',
    color: IOS_COLORS.systemOrange,
    bgColor: IOS_COLORS.systemOrange + '20',
  },
  win_streak_5: {
    icon: 'flame',
    color: IOS_COLORS.systemRed,
    bgColor: IOS_COLORS.systemRed + '20',
  },
  series_champion: {
    icon: 'ribbon',
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  regatta_champion: {
    icon: 'ribbon',
    color: '#FFD700', // Gold
    bgColor: 'rgba(255, 215, 0, 0.2)',
  },
  year_end_champion: {
    icon: 'trophy',
    color: '#FFD700', // Gold
    bgColor: 'rgba(255, 215, 0, 0.2)',
  },
  perfect_season: {
    icon: 'sparkles',
    color: IOS_COLORS.systemPurple,
    bgColor: IOS_COLORS.systemPurple + '20',
  },
  comeback_victory: {
    icon: 'trending-up',
    color: IOS_COLORS.systemGreen,
    bgColor: IOS_COLORS.systemGreen + '20',
  },
  most_improved: {
    icon: 'trending-up',
    color: IOS_COLORS.systemTeal,
    bgColor: IOS_COLORS.systemTeal + '20',
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function AchievementBadge({
  achievement,
  onPress,
}: {
  achievement: Achievement;
  onPress?: () => void;
}) {
  const config = ACHIEVEMENT_CONFIG[achievement.type] || {
    icon: 'star' as const,
    color: IOS_COLORS.systemGray,
    bgColor: IOS_COLORS.systemGray + '20',
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.badge,
        pressed && styles.badgePressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.badgeIcon, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={24} color={config.color} />
      </View>
      <Text style={styles.badgeTitle} numberOfLines={2}>
        {achievement.title}
      </Text>
      <Text style={styles.badgeDate}>
        {formatDate(achievement.earnedAt)}
      </Text>
    </Pressable>
  );
}

export function AchievementsSection({
  achievements,
  onSeeMore,
  onAchievementPress,
}: AchievementsSectionProps) {
  if (achievements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Achievements</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="trophy-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No achievements yet</Text>
          <Text style={styles.emptySubtext}>
            Keep racing to earn trophies and badges
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Achievements</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{achievements.length}</Text>
          </View>
        </View>
        {onSeeMore && achievements.length > 4 && (
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

      {/* Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            onPress={() => onAchievementPress?.(achievement)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
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
  countBadge: {
    backgroundColor: IOS_COLORS.systemGray5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
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
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  badge: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  badgePressed: {
    opacity: 0.7,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 2,
  },
  badgeDate: {
    fontSize: 10,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
  },
});

export default AchievementsSection;
