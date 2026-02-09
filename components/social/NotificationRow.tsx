/**
 * NotificationRow - Compact Inline Notification Row
 *
 * Apple-style compact, inline notification with swipe-to-delete.
 * Instagram-style layout: [Avatar+badge] {Name} {action} · {time} [Action]
 * Unread indicated by bold name (not floating dots).
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  UserPlus,
  Heart,
  MessageCircle,
  Flag,
  Bell,
  Trash2,
} from 'lucide-react-native';
import { type SocialNotification } from '@/services/NotificationService';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// TYPES
// =============================================================================

interface NotificationRowProps {
  notification: SocialNotification;
  onPress: () => void;
  onDelete: () => void;
  isFollowingBack?: boolean;
  onToggleFollow?: () => void;
  isTogglingFollow?: boolean;
  isLast?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function getNotificationIcon(type: SocialNotification['type']) {
  const iconSize = 10;
  const iconProps = { size: iconSize, strokeWidth: 2.5 };

  switch (type) {
    case 'new_follower':
      return <UserPlus {...iconProps} color="#FFFFFF" />;
    case 'race_like':
      return <Heart {...iconProps} color="#FFFFFF" />;
    case 'race_comment':
    case 'race_comment_reply':
      return <MessageCircle {...iconProps} color="#FFFFFF" />;
    case 'followed_user_race':
      return <Flag {...iconProps} color="#FFFFFF" />;
    default:
      return <Bell {...iconProps} color="#FFFFFF" />;
  }
}

function getIconBgColor(type: SocialNotification['type']): string {
  switch (type) {
    case 'new_follower':
      return IOS_COLORS.systemBlue;
    case 'race_like':
      return IOS_COLORS.systemPink;
    case 'race_comment':
    case 'race_comment_reply':
      return IOS_COLORS.systemGreen;
    case 'followed_user_race':
      return IOS_COLORS.systemOrange;
    default:
      return IOS_COLORS.systemGray;
  }
}

/** Get notification action text (without actor name) */
function getActionText(notification: SocialNotification): string {
  switch (notification.type) {
    case 'new_follower':
      return 'started following you';
    case 'race_like':
      return notification.regattaName
        ? `liked "${notification.regattaName}"`
        : 'liked your race';
    case 'race_comment':
      return notification.body
        ? `commented: ${notification.body}`
        : 'commented on your race';
    case 'race_comment_reply':
      return 'replied to your comment';
    case 'followed_user_race':
      return notification.regattaName
        ? `added ${notification.regattaName}`
        : 'added a new race';
    default:
      return notification.body || notification.title;
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function NotificationRow({
  notification,
  onPress,
  onDelete,
  isFollowingBack,
  onToggleFollow,
  isTogglingFollow,
  isLast,
}: NotificationRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const isUnread = !notification.isRead;
  const isFollowerNotification = notification.type === 'new_follower' && notification.actorId;
  const actorName = notification.actorName || 'Someone';
  const actionText = getActionText(notification);
  const timeText = formatTime(notification.createdAt);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          onDelete();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 size={20} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
        onPress={onPress}
      >
        {/* Avatar with type icon overlay */}
        <View style={styles.avatarWrapper}>
          {notification.actorAvatarUrl ? (
            <Image
              source={{ uri: notification.actorAvatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: notification.actorAvatarColor || IOS_COLORS.systemGray4 },
              ]}
            >
              {notification.actorAvatarEmoji ? (
                <Text style={styles.avatarEmoji}>{notification.actorAvatarEmoji}</Text>
              ) : (
                <Text style={styles.avatarInitials}>
                  {getInitials(notification.actorName || 'U')}
                </Text>
              )}
            </View>
          )}
          {/* Icon badge - positioned on avatar */}
          <View style={[styles.iconBadge, { backgroundColor: getIconBgColor(notification.type) }]}>
            {getNotificationIcon(notification.type)}
          </View>
        </View>

        {/* Content - Inline layout */}
        <View style={[styles.content, !isLast && styles.contentBorder]}>
          <Text style={styles.textContainer} numberOfLines={2}>
            <Text style={[styles.actorName, isUnread && styles.actorNameUnread]}>
              {actorName}
            </Text>
            <Text style={styles.actionText}> {actionText}</Text>
            <Text style={styles.separator}> · </Text>
            <Text style={styles.time}>{timeText}</Text>
          </Text>

          {/* Follow button for follower notifications */}
          {isFollowerNotification && onToggleFollow && (
            <Pressable
              style={({ pressed }) => [
                styles.followButton,
                isFollowingBack && styles.followButtonFollowing,
                pressed && styles.followButtonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleFollow();
              }}
              disabled={isTogglingFollow}
            >
              {isTogglingFollow ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowingBack ? IOS_COLORS.secondaryLabel : IOS_COLORS.systemBlue}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowingBack && styles.followButtonTextFollowing,
                  ]}
                >
                  {isFollowingBack ? 'Following' : 'Follow'}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingLeft: IOS_SPACING.lg,
    minHeight: 60,
  },
  rowPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },

  // Avatar wrapper - provides positioning context for badge
  avatarWrapper: {
    width: AVATAR_SIZE + 4, // Extra space for badge overflow
    height: AVATAR_SIZE + 4,
    marginRight: IOS_SPACING.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: IOS_COLORS.secondarySystemGroupedBackground,
  },

  // Content
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.sm + 2,
    paddingRight: IOS_SPACING.lg,
    minHeight: 60,
  },
  contentBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  textContainer: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    marginRight: IOS_SPACING.sm,
  },
  actorName: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  actorNameUnread: {
    fontWeight: '700',
  },
  actionText: {
    color: IOS_COLORS.label,
    fontWeight: '400',
  },
  separator: {
    color: IOS_COLORS.tertiaryLabel,
  },
  time: {
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '400',
  },

  // Follow button - Instagram-style text-only
  followButton: {
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: IOS_SPACING.xs,
  },
  followButtonFollowing: {
    // No background change for text-only style
  },
  followButtonPressed: {
    opacity: 0.6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  followButtonTextFollowing: {
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '400',
  },

  // Delete action
  deleteAction: {
    backgroundColor: IOS_COLORS.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});

export default NotificationRow;
