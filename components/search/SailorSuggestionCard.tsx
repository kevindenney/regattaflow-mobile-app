/**
 * SailorSuggestionCard - Individual sailor suggestion row
 *
 * Displays:
 * - Avatar (emoji or initials)
 * - Name and similarity reason
 * - Follow/Following button
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { UserPlus, UserCheck } from 'lucide-react-native';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_TOUCH,
} from '@/lib/design-tokens-ios';

const AVATAR_COLORS = [
  IOS_COLORS.systemBlue,
  IOS_COLORS.systemGreen,
  IOS_COLORS.systemOrange,
  IOS_COLORS.systemRed,
  IOS_COLORS.systemPurple,
  IOS_COLORS.systemPink,
  IOS_COLORS.systemTeal,
  IOS_COLORS.systemIndigo,
] as const;

function getAvatarColor(userId: string): string {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length];
}

export interface SailorSuggestion {
  userId: string;
  fullName: string;
  avatarEmoji?: string;
  avatarColor?: string;
  avatarUrl?: string;
  similarityReason?: string;
  followerCount?: number;
  mutualConnections?: number;
}

interface SailorSuggestionCardProps {
  sailor: SailorSuggestion;
  isFollowing: boolean;
  onPress: () => void;
  onToggleFollow: () => void;
  showSeparator?: boolean;
}

export function SailorSuggestionCard({
  sailor,
  isFollowing,
  onPress,
  onToggleFollow,
  showSeparator = true,
}: SailorSuggestionCardProps) {
  const showEmoji =
    sailor.avatarEmoji && sailor.avatarEmoji !== '\u26F5';
  const avatarBg = showEmoji
    ? sailor.avatarColor || IOS_COLORS.systemGray5
    : getAvatarColor(sailor.userId);
  const initials = getInitials(sailor.fullName);

  // Build subtitle
  const subtitleParts: string[] = [];
  if (sailor.mutualConnections && sailor.mutualConnections > 0) {
    subtitleParts.push(
      `${sailor.mutualConnections} mutual connection${
        sailor.mutualConnections > 1 ? 's' : ''
      }`
    );
  } else if (sailor.similarityReason) {
    subtitleParts.push(sailor.similarityReason);
  }
  if (sailor.followerCount && sailor.followerCount > 0) {
    subtitleParts.push(
      `${sailor.followerCount} follower${sailor.followerCount > 1 ? 's' : ''}`
    );
  }
  const subtitle = subtitleParts.join(' \u00B7 ');

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
        {showEmoji ? (
          <Text style={styles.avatarEmoji}>{sailor.avatarEmoji}</Text>
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {sailor.fullName}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Follow Button */}
      <Pressable
        style={({ pressed }) => [
          styles.followButton,
          isFollowing ? styles.followingButton : styles.notFollowingButton,
          pressed && styles.followButtonPressed,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          onToggleFollow();
        }}
        hitSlop={8}
      >
        {isFollowing ? (
          <>
            <UserCheck size={14} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.followingText}>Following</Text>
          </>
        ) : (
          <>
            <UserPlus size={14} color={IOS_COLORS.systemBlue} />
            <Text style={styles.followText}>Follow</Text>
          </>
        )}
      </Pressable>

      {/* Separator */}
      {showSeparator && <View style={styles.separator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    minHeight: IOS_TOUCH.listItemHeight,
  },
  pressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.md,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginRight: IOS_SPACING.md,
  },
  name: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  subtitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs + 2,
    borderRadius: IOS_RADIUS.sm,
    gap: 4,
  },
  notFollowingButton: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  followingButton: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  followButtonPressed: {
    opacity: 0.7,
  },
  followText: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingText: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  separator: {
    position: 'absolute',
    left: IOS_SPACING.lg + 44 + IOS_SPACING.md,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
});
