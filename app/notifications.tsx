import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useFleetNotifications } from '@/hooks/useFleetNotifications';
import type { FleetNotification } from '@/services/FleetSocialService';

const fallbackNotifications: FleetNotification[] = [
  {
    id: 'demo-1',
    userId: 'demo',
    fleetId: 'sample',
    notificationType: 'race_result_posted',
    relatedPostId: null,
    relatedCommentId: null,
    actorId: 'demo-actor',
    message: 'Demo race result posted for Kowloon Cup',
    isRead: false,
    createdAt: new Date().toISOString(),
    actor: { id: 'demo-actor', name: 'RegattaFlow Bot' },
    fleet: { id: 'sample', name: 'Harbor Fleet' },
  },
  {
    id: 'demo-2',
    userId: 'demo',
    fleetId: 'sample',
    notificationType: 'event_created',
    relatedPostId: null,
    relatedCommentId: null,
    actorId: null,
    message: 'Skippers meeting added for Saturday 09:00',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    actor: undefined,
    fleet: { id: 'sample', name: 'Harbor Fleet' },
  },
];

const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  post_like: { name: 'heart', color: '#EF4444' },
  post_comment: { name: 'chatbubble', color: '#3B82F6' },
  post_share: { name: 'share-social', color: '#8B5CF6' },
  tuning_guide_posted: { name: 'construct', color: '#F59E0B' },
  race_result_posted: { name: 'trophy', color: '#10B981' },
  event_created: { name: 'calendar', color: '#EC4899' },
  member_check_in: { name: 'location', color: '#14B8A6' },
  mention: { name: 'at', color: '#6366F1' },
  new_post: { name: 'notifications', color: '#6B7280' },
};

function formatText(notification: FleetNotification): string {
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
    case 'mention':
      return `${actorName} mentioned you`;
    case 'new_post':
    default:
      return notification.message || 'New activity in your fleet';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useFleetNotifications(user?.id);

  const data = useMemo<FleetNotification[]>(() => {
    if (user && notifications.length) return notifications;
    if (user && !notifications.length) return [];
    return fallbackNotifications;
  }, [notifications, user]);

  const handlePress = (item: FleetNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    // Future: deep link to the related post/course when available
  };

  const renderItem = ({ item }: { item: FleetNotification }) => {
    const icon = iconMap[item.notificationType] || iconMap.new_post;
    const time = new Date(item.createdAt);

    return (
      <Pressable
        className="flex-row items-center gap-3 bg-white rounded-2xl px-4 py-3 mb-3 border border-gray-100"
        onPress={() => handlePress(item)}
      >
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: `${icon.color}15` }}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View className="flex-1">
          <Text className={`text-sm ${item.isRead ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>
            {formatText(item)}
          </Text>
          <Text className="text-[11px] text-gray-400 mt-1">
            {isNaN(time.getTime()) ? '' : time.toLocaleString()}
          </Text>
        </View>
        {!item.isRead && <View className="w-2 h-2 rounded-full bg-blue-500" />}
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.back()} className="mr-4 p-2 -ml-2">
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <View>
              <Text className="text-xl font-bold text-gray-900">Notifications</Text>
              <Text className="text-xs text-gray-500">
                {user ? 'Fleet and race updates' : 'Demo data shown — sign in for your feed'}
              </Text>
            </View>
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllAsRead}
              className="flex-row items-center gap-1 px-3 py-2 rounded-full bg-blue-50"
            >
              <CheckCircle2 size={16} color="#2563EB" />
              <Text className="text-xs font-medium text-blue-700">Mark all read</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading && user ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-500 mt-2">Loading your notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-24">
              <Bell size={42} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-700 mt-4">No notifications yet</Text>
              <Text className="text-sm text-gray-500 mt-2">
                Updates from your fleets and races will show up here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
