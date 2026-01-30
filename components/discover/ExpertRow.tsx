/**
 * ExpertRow - Compact list row for class expert display
 *
 * Apple iOS HIG list row variant:
 * [Avatar]  Name             [🏆 3] [📄 12]  [+] [>]
 *           Top Dragon Class sailor
 *
 * Avatar shows initials on deterministic color circle (like Contacts.app).
 * Stats use vector icons with pill backgrounds.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, UserPlus, UserCheck, Trophy, FileText } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { getInitials } from '@/components/account/accountStyles';
import type { ClassExpert } from '@/hooks/useClassExperts';

// =============================================================================
// CONSTANTS
// =============================================================================

/** 12 iOS system colors for deterministic avatar backgrounds */
const AVATAR_COLORS = [
  IOS_COLORS.systemBlue,
  IOS_COLORS.systemGreen,
  IOS_COLORS.systemOrange,
  IOS_COLORS.systemRed,
  IOS_COLORS.systemPurple,
  IOS_COLORS.systemPink,
  IOS_COLORS.systemTeal,
  IOS_COLORS.systemIndigo,
  IOS_COLORS.systemMint,
  IOS_COLORS.systemCyan,
  IOS_COLORS.systemBrown,
  IOS_COLORS.systemYellow,
] as const;

const DEFAULT_EMOJI = '\u26F5';

function getAvatarColor(userId: string): string {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length];
}

// =============================================================================
// TYPES
// =============================================================================

interface ExpertRowProps {
  expert: ClassExpert;
  className?: string;
  onPress: (expert: ClassExpert) => void;
  onAvatarPress?: (userId: string) => void;
  onToggleFollow: (expertUserId: string) => void;
  showSeparator?: boolean;
  isLast?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ExpertRow({
  expert,
  className,
  onPress,
  onAvatarPress,
  onToggleFollow,
  showSeparator = true,
  isLast = false,
}: ExpertRowProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(expert);
  }, [onPress, expert]);

  const handleFollowPress = useCallback(() => {
    onToggleFollow(expert.userId);
  }, [onToggleFollow, expert.userId]);

  const handleAvatarPress = useCallback(() => {
    onAvatarPress?.(expert.userId);
  }, [onAvatarPress, expert.userId]);

  const subtitle = className
    ? `Top ${className} sailor`
    : 'Class expert';

  const FollowIcon = expert.isFollowing ? UserCheck : UserPlus;
  const followColor = expert.isFollowing
    ? IOS_COLORS.systemGreen
    : IOS_COLORS.systemBlue;
  const followLabel = expert.isFollowing
    ? `Unfollow ${expert.userName}`
    : `Follow ${expert.userName}`;

  // Avatar: show custom emoji if set; otherwise show initials on colored circle
  const showEmoji = expert.avatarEmoji && expert.avatarEmoji !== DEFAULT_EMOJI;
  const avatarBg = showEmoji
    ? (expert.avatarColor || IOS_COLORS.systemGray5)
    : getAvatarColor(expert.userId);
  const initials = getInitials(expert.userName);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.container,
        isLast && styles.containerLast,
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${expert.userName}, ${subtitle}`}
    >
      {/* Avatar - tappable to view profile */}
      <Pressable
        onPress={onAvatarPress ? handleAvatarPress : undefined}
        disabled={!onAvatarPress}
        hitSlop={4}
        accessibilityRole={onAvatarPress ? 'button' : undefined}
        accessibilityLabel={onAvatarPress ? `View ${expert.userName}'s profile` : undefined}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          {showEmoji ? (
            <Text style={styles.avatarEmoji} maxFontSizeMultiplier={1.5}>
              {expert.avatarEmoji}
            </Text>
          ) : (
            <Text style={styles.avatarInitials} maxFontSizeMultiplier={1.5}>
              {initials}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Center content */}
      <View style={styles.content}>
        <Text style={styles.headline} numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {expert.userName}
        </Text>
        <Text style={styles.subhead} numberOfLines={1} maxFontSizeMultiplier={1.5}>
          {subtitle}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {expert.podiumCount > 0 && (
          <View style={styles.statPill}>
            <Trophy size={12} color={IOS_COLORS.systemOrange} />
            <Text style={styles.statValue} maxFontSizeMultiplier={1.5}>
              {expert.podiumCount}
            </Text>
          </View>
        )}
        {expert.publicRaceCount > 0 && (
          <View style={styles.statPill}>
            <FileText size={12} color={IOS_COLORS.systemBlue} />
            <Text style={styles.statValue} maxFontSizeMultiplier={1.5}>
              {expert.publicRaceCount}
            </Text>
          </View>
        )}
      </View>

      {/* Follow button */}
      <Pressable
        onPress={handleFollowPress}
        hitSlop={8}
        style={styles.followButton}
        accessibilityRole="button"
        accessibilityLabel={followLabel}
      >
        <FollowIcon size={18} color={followColor} />
      </Pressable>

      {/* Chevron */}
      <ChevronRight
        size={16}
        color={IOS_COLORS.systemGray3}
        style={styles.chevron}
      />

      {/* Separator */}
      {showSeparator && <View style={styles.separator} />}
    </AnimatedPressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    marginHorizontal: 16,
    minHeight: 56,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  containerLast: {
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
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
    fontSize: 18,
  },
  avatarInitials: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginRight: IOS_SPACING.sm,
  },
  headline: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  subhead: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginRight: IOS_SPACING.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: IOS_COLORS.quaternarySystemFill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statValue: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  followButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.xs,
  },
  chevron: {
    marginLeft: IOS_SPACING.xs,
  },
  separator: {
    position: 'absolute',
    left: IOS_SPACING.lg + 40 + IOS_SPACING.md,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
});
