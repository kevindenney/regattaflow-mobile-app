/**
 * SailorTrophyCase - Achievement badges display
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  Trophy,
  Medal,
  Star,
  Flame,
  Award,
  Target,
} from 'lucide-react-native';
import type { SailorAchievement, AchievementType } from '@/services/SailorProfileService';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
  IOS_SHADOWS,
} from '@/lib/design-tokens-ios';

interface SailorTrophyCaseProps {
  achievements: SailorAchievement[];
}

const ACHIEVEMENT_CONFIG: Record<
  AchievementType,
  { icon: any; color: string; bgColor: string }
> = {
  first_race: {
    icon: Target,
    color: IOS_COLORS.systemGreen,
    bgColor: IOS_COLORS.systemGreen + '20',
  },
  first_win: {
    icon: Trophy,
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  first_podium: {
    icon: Medal,
    color: IOS_COLORS.systemOrange,
    bgColor: IOS_COLORS.systemOrange + '20',
  },
  race_milestone_10: {
    icon: Star,
    color: IOS_COLORS.systemBlue,
    bgColor: IOS_COLORS.systemBlue + '20',
  },
  race_milestone_50: {
    icon: Star,
    color: IOS_COLORS.systemPurple,
    bgColor: IOS_COLORS.systemPurple + '20',
  },
  race_milestone_100: {
    icon: Star,
    color: IOS_COLORS.systemIndigo,
    bgColor: IOS_COLORS.systemIndigo + '20',
  },
  win_streak_3: {
    icon: Flame,
    color: IOS_COLORS.systemOrange,
    bgColor: IOS_COLORS.systemOrange + '20',
  },
  win_streak_5: {
    icon: Flame,
    color: IOS_COLORS.systemRed,
    bgColor: IOS_COLORS.systemRed + '20',
  },
  series_champion: {
    icon: Trophy,
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  regatta_champion: {
    icon: Trophy,
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  year_end_champion: {
    icon: Award,
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  perfect_season: {
    icon: Star,
    color: IOS_COLORS.systemYellow,
    bgColor: IOS_COLORS.systemYellow + '20',
  },
  comeback_victory: {
    icon: Award,
    color: IOS_COLORS.systemTeal,
    bgColor: IOS_COLORS.systemTeal + '20',
  },
  most_improved: {
    icon: Award,
    color: IOS_COLORS.systemGreen,
    bgColor: IOS_COLORS.systemGreen + '20',
  },
};

export function SailorTrophyCase({ achievements }: SailorTrophyCaseProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Achievements</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {achievements.map((achievement) => {
          const config =
            ACHIEVEMENT_CONFIG[achievement.achievementType] ||
            ACHIEVEMENT_CONFIG.first_race;
          const IconComponent = config.icon;

          return (
            <View key={achievement.id} style={styles.achievementItem}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: config.bgColor },
                ]}
              >
                <IconComponent size={24} color={config.color} />
              </View>
              <Text style={styles.achievementTitle} numberOfLines={2}>
                {achievement.title}
              </Text>
              {achievement.relatedRegattaName && (
                <Text style={styles.achievementSubtitle} numberOfLines={1}>
                  {achievement.relatedRegattaName}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.md,
  },
  scrollContent: {
    gap: IOS_SPACING.md,
    paddingRight: IOS_SPACING.md,
  },
  achievementItem: {
    width: 100,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  achievementTitle: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  achievementSubtitle: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 2,
  },
});
