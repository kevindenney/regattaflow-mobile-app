import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, SectionList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Calendar, FileText, Settings, Sailboat } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useFleetNotifications } from '@/hooks/useFleetNotifications';
import { useDashboardData } from '@/hooks/useData';
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

// Helper to group notifications by time period
function getTimeGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= weekAgo) return 'This Week';
  return 'Earlier';
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Helper to calculate days until race
function getDaysUntil(dateStr: string): number {
  const raceDate = new Date(dateStr);
  const now = new Date();
  return Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

  // Get upcoming races for contextual empty state
  const { recentRaces } = useDashboardData(user?.id);

  const upcomingRaces = useMemo(() => {
    if (!recentRaces) return [];
    return recentRaces
      .filter((race: any) => {
        const raceDate = new Date(race.date || race.start_date);
        return raceDate > new Date();
      })
      .slice(0, 3);
  }, [recentRaces]);

  const data = useMemo<FleetNotification[]>(() => {
    if (user && notifications.length) return notifications;
    if (user && !notifications.length) return [];
    return fallbackNotifications;
  }, [notifications, user]);

  // Group notifications by time period
  const sections = useMemo(() => {
    if (!data.length) return [];

    const groups: Record<string, FleetNotification[]> = {};
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];

    data.forEach(notification => {
      const date = new Date(notification.createdAt);
      const group = getTimeGroup(date);
      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
    });

    return order
      .filter(key => groups[key]?.length > 0)
      .map(key => ({ title: key, data: groups[key] }));
  }, [data]);

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
        style={styles.notificationRow}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${icon.color}12` }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationText, !item.isRead && styles.notificationTextUnread]}>
            {formatText(item)}
          </Text>
          <Text style={styles.notificationTime}>
            {isNaN(time.getTime()) ? '' : formatRelativeTime(time)}
          </Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  // Contextual empty state component
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      {/* All caught up message */}
      <View style={styles.caughtUpSection}>
        <Text style={styles.caughtUpTitle}>All caught up</Text>
        <Text style={styles.caughtUpSubtitle}>No new updates</Text>
      </View>

      {/* Upcoming - what will generate notifications */}
      {upcomingRaces.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionLabel}>Upcoming</Text>
          {upcomingRaces.map((race: any) => {
            const daysUntil = getDaysUntil(race.date || race.start_date);
            return (
              <View key={race.id} style={styles.upcomingRow}>
                <View style={styles.upcomingIcon}>
                  <Sailboat size={16} color="#3B82F6" />
                </View>
                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingTitle}>{race.name}</Text>
                  <Text style={styles.upcomingMeta}>
                    {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                    {' · '}Sailing instructions usually post 2-3 days before
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* What you'll be notified about */}
      <View style={styles.notifiedSection}>
        <Text style={styles.sectionLabel}>You'll be notified about</Text>
        <View style={styles.pillsContainer}>
          {['Race documents', 'Start changes', 'Weather alerts', 'Fleet messages', 'Results'].map(item => (
            <View key={item} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Preferences link */}
      <Pressable
        style={styles.preferencesLink}
        onPress={() => router.push('/settings/notifications')}
      >
        <Settings size={16} color="#6B7280" />
        <Text style={styles.preferencesText}>Manage notification preferences</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Minimal header - Tufte style */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
              style={styles.backButton}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={styles.headerTitle}>Updates</Text>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} style={styles.markAllButton}>
              <CheckCircle2 size={14} color="#2563EB" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>
      </View>

      {loading && user ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  caughtUpSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  caughtUpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  caughtUpSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  upcomingSection: {
    marginTop: 16,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  upcomingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  upcomingMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notifiedSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    color: '#4B5563',
  },
  preferencesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 12,
    gap: 8,
  },
  preferencesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Notification list styles
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  notificationIcon: {
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
    color: '#4B5563',
  },
  notificationTextUnread: {
    color: '#111827',
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
