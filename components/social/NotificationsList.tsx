/**
 * NotificationsList - List of social notifications
 *
 * Features:
 * - Notification list with avatars and icons
 * - Follow-back inline actions for new follower notifications
 * - Mark as read/delete actions
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  UserPlus,
  Heart,
  MessageCircle,
  Flag,
  Bell,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';
import { type SocialNotification } from '@/services/NotificationService';
import { getInitials } from '@/components/account/accountStyles';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface NotificationsListProps {
  notifications: SocialNotification[];
  isLoading: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  onRefresh: () => Promise<any>;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  /** Map of actor IDs to whether current user is following them */
  followingMap?: Map<string, boolean>;
  /** Callback to toggle follow status for an actor */
  onToggleFollow?: (actorId: string, currentlyFollowing: boolean) => Promise<void>;
}

const NotificationIcon = ({
  type,
}: {
  type: SocialNotification['type'];
}) => {
  const iconSize = 16;

  switch (type) {
    case 'new_follower':
      return <UserPlus size={iconSize} color={IOS_COLORS.systemBlue} />;
    case 'race_like':
      return <Heart size={iconSize} color={IOS_COLORS.systemRed} />;
    case 'race_comment':
    case 'race_comment_reply':
      return <MessageCircle size={iconSize} color={IOS_COLORS.systemGreen} />;
    case 'followed_user_race':
      return <Flag size={iconSize} color={IOS_COLORS.systemOrange} />;
    default:
      return <Bell size={iconSize} color={IOS_COLORS.systemGray} />;
  }
};

const getNotificationText = (notification: SocialNotification): string => {
  const actorName = notification.actorName || 'Someone';

  switch (notification.type) {
    case 'new_follower':
      return `${actorName} started following you`;
    case 'race_like':
      return `${actorName} liked your race${
        notification.regattaName ? `: ${notification.regattaName}` : ''
      }`;
    case 'race_comment':
      return `${actorName} commented on your race${
        notification.regattaName ? `: ${notification.regattaName}` : ''
      }`;
    case 'race_comment_reply':
      return `${actorName} replied to your comment`;
    case 'followed_user_race':
      return `${actorName} added a new race${
        notification.regattaName ? `: ${notification.regattaName}` : ''
      }`;
    default:
      return 'New notification';
  }
};

const formatTime = (dateString: string): string => {
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
  return date.toLocaleDateString();
};

export function NotificationsList({
  notifications,
  isLoading,
  onLoadMore,
  isLoadingMore,
  hasMore,
  onRefresh,
  onMarkRead,
  onDelete,
  followingMap = new Map(),
  onToggleFollow,
}: NotificationsListProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [togglingFollow, setTogglingFollow] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const handleFollowBack = useCallback(
    async (actorId: string, currentlyFollowing: boolean, e: any) => {
      e.stopPropagation();
      if (!onToggleFollow || togglingFollow) return;

      triggerHaptic('selection');
      setTogglingFollow(actorId);

      try {
        await onToggleFollow(actorId, currentlyFollowing);
        triggerHaptic('notificationSuccess');
      } catch {
        triggerHaptic('notificationError');
      } finally {
        setTogglingFollow(null);
      }
    },
    [onToggleFollow, togglingFollow]
  );

  const handlePress = useCallback(
    (notification: SocialNotification) => {
      // Mark as read
      if (!notification.isRead) {
        onMarkRead(notification.id);
      }

      // Navigate based on type
      switch (notification.type) {
        case 'new_follower':
          if (notification.actorId) {
            router.push(`/sailor/${notification.actorId}`);
          }
          break;
        case 'race_like':
        case 'race_comment':
        case 'race_comment_reply':
        case 'followed_user_race':
          if (notification.regattaId) {
            // Navigate to race detail
            router.push(`/race/${notification.regattaId}`);
          }
          break;
      }
    },
    [router, onMarkRead]
  );

  const renderNotification = useCallback(
    ({ item, index }: { item: SocialNotification; index: number }) => {
      // Check if this is a follow notification and if we can show follow-back
      const isFollowerNotification = item.type === 'new_follower' && item.actorId;
      const isFollowingBack = item.actorId ? followingMap.get(item.actorId) : false;
      const isTogglingThis = togglingFollow === item.actorId;

      return (
        <Pressable
          style={({ pressed }) => [
            styles.notificationRow,
            !item.isRead && styles.notificationUnread,
            pressed && styles.notificationPressed,
            index < notifications.length - 1 && styles.notificationBorder,
          ]}
          onPress={() => handlePress(item)}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: item.actorAvatarColor || IOS_COLORS.systemBlue }]}>
              {item.actorAvatarEmoji ? (
                <Text style={styles.avatarEmoji}>{item.actorAvatarEmoji}</Text>
              ) : (
                <Text style={styles.avatarInitials}>
                  {getInitials(item.actorName || 'U')}
                </Text>
              )}
            </View>
            <View style={styles.iconBadge}>
              <NotificationIcon type={item.type} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.text} numberOfLines={2}>
              {getNotificationText(item)}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          </View>

          {/* Follow-back button for new follower notifications */}
          {isFollowerNotification && onToggleFollow && (
            <Pressable
              style={({ pressed }) => [
                styles.followButton,
                isFollowingBack && styles.followButtonFollowing,
                pressed && styles.followButtonPressed,
              ]}
              onPress={(e) => handleFollowBack(item.actorId!, isFollowingBack || false, e)}
              disabled={isTogglingThis}
            >
              {isTogglingThis ? (
                <ActivityIndicator size="small" color={isFollowingBack ? IOS_COLORS.label : '#FFFFFF'} />
              ) : (
                <>
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowingBack && styles.followButtonTextFollowing,
                    ]}
                  >
                    {isFollowingBack ? 'Following' : 'Follow'}
                  </Text>
                  {isFollowingBack && (
                    <ChevronDown size={12} color={IOS_COLORS.label} style={{ marginLeft: 2 }} />
                  )}
                </>
              )}
            </Pressable>
          )}

          {!item.isRead && <View style={styles.unreadDot} />}

          <Pressable
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            hitSlop={8}
          >
            <Trash2 size={16} color={IOS_COLORS.tertiaryLabel} />
          </Pressable>
        </Pressable>
      );
    },
    [notifications.length, handlePress, onDelete, followingMap, togglingFollow, onToggleFollow, handleFollowBack]
  );

  const keyExtractor = useCallback(
    (item: SocialNotification) => item.id,
    []
  );

  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Bell size={48} color={IOS_COLORS.tertiaryLabel} />
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptyText}>
          When someone follows you or interacts with your races, you'll see it
          here.
        </Text>
      </View>
    );
  };

  const ListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemGray} />
      </View>
    );
  };

  return (
    <FlatList
      data={notifications}
      renderItem={renderNotification}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={true}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  notificationUnread: {
    backgroundColor: IOS_COLORS.systemBlue + '10',
  },
  notificationPressed: {
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  notificationBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.full,
    padding: 4,
    borderWidth: 2,
    borderColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  content: {
    flex: 1,
    marginLeft: IOS_SPACING.md,
    marginRight: IOS_SPACING.sm,
  },
  text: {
    ...IOS_TYPOGRAPHY.subheadline,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  time: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: IOS_COLORS.systemBlue,
    marginRight: IOS_SPACING.sm,
  },
  deleteButton: {
    padding: IOS_SPACING.xs,
  },
  followButton: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs + 2,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.md,
    marginRight: IOS_SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
    justifyContent: 'center',
  },
  followButtonFollowing: {
    backgroundColor: IOS_COLORS.systemGray6,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
  },
  followButtonPressed: {
    opacity: 0.8,
  },
  followButtonText: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followButtonTextFollowing: {
    color: IOS_COLORS.label,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: IOS_SPACING.xxl,
    marginTop: IOS_SPACING.xxxxl,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.md,
    marginBottom: IOS_SPACING.sm,
  },
  emptyText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  footerLoading: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
  },
});
