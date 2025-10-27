import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFleetNotifications } from '@/hooks/useFleetNotifications';
import { FleetNotification } from '@/services/FleetSocialService';

interface FleetNotificationPanelProps {
  userId: string;
  onNotificationPress?: (notification: FleetNotification) => void;
}

export function FleetNotificationPanel({
  userId,
  onNotificationPress,
}: FleetNotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useFleetNotifications(userId);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
        return { name: 'heart' as const, color: '#EF4444' };
      case 'post_comment':
        return { name: 'chatbubble' as const, color: '#3B82F6' };
      case 'post_share':
        return { name: 'share-social' as const, color: '#8B5CF6' };
      case 'tuning_guide_posted':
        return { name: 'construct' as const, color: '#F59E0B' };
      case 'race_result_posted':
        return { name: 'trophy' as const, color: '#10B981' };
      case 'event_created':
        return { name: 'calendar' as const, color: '#EC4899' };
      case 'member_check_in':
        return { name: 'location' as const, color: '#14B8A6' };
      default:
        return { name: 'notifications' as const, color: '#6B7280' };
    }
  };

  const formatNotificationText = (notification: FleetNotification): string => {
    const actorName = notification.actor?.name || 'Someone';
    const fleetName = notification.fleet?.name || 'your fleet';

    switch (notification.notificationType) {
      case 'post_like':
        return `${actorName} liked your post`;
      case 'post_comment':
        return `${actorName} commented on your post`;
      case 'post_share':
        return `${actorName} shared your post to another fleet`;
      case 'tuning_guide_posted':
        return `New tuning guide posted in ${fleetName}`;
      case 'race_result_posted':
        return `${actorName} posted a race result in ${fleetName}`;
      case 'event_created':
        return `New event created in ${fleetName}`;
      case 'member_check_in':
        return `${actorName} checked in at a location`;
      default:
        return notification.message || 'New activity in your fleet';
    }
  };

  const handleNotificationPress = (notification: FleetNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllAsRead}>
            <Text style={styles.markAllButton}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => {
          const icon = getNotificationIcon(item.notificationType);

          return (
            <Pressable
              style={[
                styles.notificationCard,
                !item.isRead && styles.notificationCardUnread,
              ]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                <Ionicons name={icon.name} size={20} color={icon.color} />
              </View>

              <View style={styles.notificationContent}>
                <Text
                  style={[
                    styles.notificationText,
                    !item.isRead && styles.notificationTextUnread,
                  ]}
                >
                  {formatNotificationText(item)}
                </Text>
                <Text style={styles.notificationTime}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>

              {!item.isRead && <View style={styles.unreadDot} />}
            </Pressable>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You'll see updates about your fleets here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  markAllButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  listContent: {
    padding: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationCardUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BFDBFE',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  notificationTextUnread: {
    fontWeight: '500',
    color: '#1F2937',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});
