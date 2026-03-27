/**
 * CoachNudgeBanner — A small, dismissible banner showing a proactive AI coaching insight.
 * Designed to feel like a quiet coach suggestion, not a loud notification.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import type { AIInterestInsight, InsightType } from '@/types/manifesto';

interface CoachNudgeBannerProps {
  insight: AIInterestInsight;
  onDismiss: () => void;
}

const TYPE_ICON: Record<InsightType, string> = {
  strength: 'trending-up',
  weakness: 'trending-down',
  pattern: 'analytics',
  recommendation: 'bulb',
  preference: 'heart',
  deviation_pattern: 'git-branch',
  personal_record: 'trophy',
  plateau: 'pause-circle',
  progressive_overload: 'arrow-up-circle',
  recovery_pattern: 'leaf',
};

export function CoachNudgeBanner({ insight, onDismiss }: CoachNudgeBannerProps) {
  const icon = TYPE_ICON[insight.insight_type] ?? 'sparkles';

  return (
    <View style={styles.container}>
      <Ionicons name="sparkles" size={14} color={IOS_COLORS.systemPurple} style={styles.sparkle} />
      <Ionicons name={icon as any} size={13} color={IOS_COLORS.systemPurple} style={styles.typeIcon} />
      <Text style={styles.text} numberOfLines={2}>
        {insight.content}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={12} style={styles.dismiss}>
        <Ionicons name="close" size={14} color={IOS_COLORS.systemGray3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(175, 82, 222, 0.06)',
    borderRadius: 10,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    marginHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.md,
    gap: 6,
  },
  sparkle: {
    flexShrink: 0,
  },
  typeIcon: {
    flexShrink: 0,
    opacity: 0.7,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: IOS_COLORS.label,
    letterSpacing: -0.1,
  },
  dismiss: {
    flexShrink: 0,
    padding: 2,
  },
});
