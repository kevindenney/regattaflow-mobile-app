/**
 * SailorSuggestionCard - Individual sailor suggestion row
 *
 * Displays:
 * - Avatar (emoji or initials)
 * - Name and similarity reason
 * - Follow/Following button
 */

import React from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet } from 'react-native';

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
}

export function SailorSuggestionCard({
  sailor,
  isFollowing,
  onPress,
  onToggleFollow,
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
      style={({ pressed }) => [pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.row}>
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
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing ? styles.followingButton : styles.notFollowingButton,
          ]}
          onPress={onToggleFollow}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Text style={isFollowing ? styles.followingText : styles.followText}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.lg,
    minHeight: IOS_TOUCH.listItemHeight,
  },
  pressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.md,
    flexShrink: 0,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    minWidth: 0,
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
    justifyContent: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
    minWidth: 90,
    flexShrink: 0,
  },
  notFollowingButton: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  followingButton: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  followText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
});
