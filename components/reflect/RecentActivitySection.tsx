/**
 * RecentActivitySection - Display recent social activity feed
 *
 * Shows recent interactions like follows, race results shared,
 * comments, and achievements earned by the user.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';

export type ActivityType =
  | 'race_completed'
  | 'achievement_earned'
  | 'new_follower'
  | 'followed_user'
  | 'comment_received'
  | 'liked_post'
  | 'shared_result';

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  relatedUserId?: string;
  relatedUserName?: string;
  relatedUserAvatar?: string;
  relatedRegattaId?: string;
  relatedRegattaName?: string;
  metadata?: Record<string, unknown>;
}

interface RecentActivitySectionProps {
  activities: RecentActivity[];
  onSeeMore?: () => void;
  onActivityPress?: (activity: RecentActivity) => void;
}

// Activity configuration with icons and colors
const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  race_completed: { icon: 'flag', color: IOS_COLORS.systemGreen },
  achievement_earned: { icon: 'trophy', color: IOS_COLORS.systemYellow },
  new_follower: { icon: 'person-add', color: IOS_COLORS.systemBlue },
  followed_user: { icon: 'person-add-outline', color: IOS_COLORS.systemBlue },
  comment_received: { icon: 'chatbubble', color: IOS_COLORS.systemPurple },
  liked_post: { icon: 'heart', color: IOS_COLORS.systemRed },
  shared_result: { icon: 'share', color: IOS_COLORS.systemOrange },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActivityItem({
  activity,
  onPress,
}: {
  activity: RecentActivity;
  onPress?: () => void;
}) {
  const config = ACTIVITY_CONFIG[activity.type] || {
    icon: 'ellipse' as const,
    color: IOS_COLORS.systemGray,
  };

  const showAvatar = activity.relatedUserAvatar && (
    activity.type === 'new_follower' ||
    activity.type === 'followed_user' ||
    activity.type === 'comment_received' ||
    activity.type === 'liked_post'
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.activityItem,
        pressed && onPress && styles.activityItemPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {showAvatar ? (
        <Image
          source={{ uri: activity.relatedUserAvatar }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
          <Ionicons name={config.icon} size={18} color={config.color} />
        </View>
      )}

      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={2}>
          {activity.title}
        </Text>
        {activity.description && (
          <Text style={styles.activityDescription} numberOfLines={1}>
            {activity.description}
          </Text>
        )}
      </View>

      <Text style={styles.activityTime}>
        {formatRelativeTime(activity.timestamp)}
      </Text>
    </Pressable>
  );
}

export function RecentActivitySection({
  activities,
  onSeeMore,
  onActivityPress,
}: RecentActivitySectionProps) {
  const router = useRouter();

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="pulse-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>
            Your racing activity and social interactions will appear here
          </Text>
        </View>
      </View>
    );
  }

  // Show up to 5 recent activities
  const displayActivities = activities.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recent Activity</Text>
        {onSeeMore && activities.length > 5 && (
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

      {/* Activity List */}
      <View style={styles.activityList}>
        {displayActivities.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <ActivityItem
              activity={activity}
              onPress={onActivityPress ? () => onActivityPress(activity) : undefined}
            />
            {index < displayActivities.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* View Notifications Button */}
      <Pressable
        style={({ pressed }) => [
          styles.footerButton,
          pressed && styles.footerButtonPressed,
        ]}
        onPress={() => router.push('/social-notifications')}
      >
        <Ionicons name="notifications-outline" size={18} color={IOS_COLORS.systemBlue} />
        <Text style={styles.footerButtonText}>View All Notifications</Text>
      </Pressable>
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
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
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
  activityList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  activityItemPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemGray5,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 18,
  },
  activityDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 60,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 12,
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
  },
});

export default RecentActivitySection;
