/**
 * Unified Activity Screen
 *
 * Apple-style activity feed with large title, vertical messages preview,
 * and time-grouped notifications with improved visual hierarchy.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SectionList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MessagesPreviewList } from '@/components/activity/MessagesPreviewList';
import { NotificationRow } from '@/components/social/NotificationRow';
import { useNotifications } from '@/hooks/useNotifications';
import { useCrewThreads } from '@/hooks/useCrewThreads';
import { useAuth } from '@/providers/AuthProvider';
import { CrewFinderService } from '@/services/CrewFinderService';
import { supabase } from '@/services/supabase';
import { type SocialNotification } from '@/services/NotificationService';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

// =============================================================================
// CONSTANTS
// =============================================================================

const SWIPE_HINT_KEY = 'activity_swipe_hint_shown';

// =============================================================================
// TYPES
// =============================================================================

interface NotificationSection {
  title: string;
  data: SocialNotification[];
  unreadCount: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function groupNotificationsByTime(notifications: SocialNotification[]): NotificationSection[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const today: SocialNotification[] = [];
  const yesterday: SocialNotification[] = [];
  const thisWeek: SocialNotification[] = [];
  const earlier: SocialNotification[] = [];

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (date >= todayStart) {
      today.push(n);
    } else if (date >= yesterdayStart) {
      yesterday.push(n);
    } else if (date >= weekStart) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  });

  const sections: NotificationSection[] = [];

  if (today.length > 0) {
    sections.push({
      title: 'Today',
      data: today,
      unreadCount: today.filter((n) => !n.isRead).length,
    });
  }
  if (yesterday.length > 0) {
    sections.push({
      title: 'Yesterday',
      data: yesterday,
      unreadCount: yesterday.filter((n) => !n.isRead).length,
    });
  }
  if (thisWeek.length > 0) {
    sections.push({
      title: 'This Week',
      data: thisWeek,
      unreadCount: thisWeek.filter((n) => !n.isRead).length,
    });
  }
  if (earlier.length > 0) {
    sections.push({
      title: 'Earlier',
      data: earlier,
      unreadCount: earlier.filter((n) => !n.isRead).length,
    });
  }

  return sections;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SocialNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { threads } = useCrewThreads();
  const {
    notifications,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);

  // Check if swipe hint should be shown
  useEffect(() => {
    const checkSwipeHint = async () => {
      try {
        const hasShown = await AsyncStorage.getItem(SWIPE_HINT_KEY);
        if (!hasShown) {
          setShowSwipeHint(true);
        }
      } catch {
        // Ignore errors
      }
    };
    checkSwipeHint();
  }, []);

  // Find first unread notification for swipe hint
  useEffect(() => {
    if (showSwipeHint && notifications.length > 0) {
      const firstUnread = notifications.find((n) => !n.isRead);
      setFirstUnreadId(firstUnread?.id || null);
    }
  }, [showSwipeHint, notifications]);

  // Dismiss swipe hint after first swipe
  const handleFirstSwipe = useCallback(async () => {
    if (showSwipeHint) {
      setShowSwipeHint(false);
      setFirstUnreadId(null);
      try {
        await AsyncStorage.setItem(SWIPE_HINT_KEY, 'true');
      } catch {
        // Ignore errors
      }
    }
  }, [showSwipeHint]);

  // Group notifications by time
  const sections = useMemo(
    () => groupNotificationsByTime(notifications),
    [notifications]
  );

  // Get unique actor IDs from new_follower notifications
  const actorIds = useMemo(() => {
    const ids = notifications
      .filter((n) => n.type === 'new_follower' && n.actorId)
      .map((n) => n.actorId as string);
    return [...new Set(ids)];
  }, [notifications]);

  // Fetch which actors the current user is following
  const { data: followingData } = useQuery({
    queryKey: ['following-status', user?.id, actorIds],
    queryFn: async () => {
      if (!user?.id || actorIds.length === 0) return new Map<string, boolean>();

      const { data } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', actorIds);

      const followingSet = new Set((data || []).map((f: any) => f.following_id));
      const map = new Map<string, boolean>();
      actorIds.forEach((id) => map.set(id, followingSet.has(id)));
      return map;
    },
    enabled: !!user?.id && actorIds.length > 0,
    staleTime: 30 * 1000,
  });

  const followingMap = followingData || new Map<string, boolean>();

  // Follow/unfollow mutation
  const toggleFollowMutation = useMutation({
    mutationFn: async ({
      actorId,
      currentlyFollowing,
    }: {
      actorId: string;
      currentlyFollowing: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (currentlyFollowing) {
        await CrewFinderService.unfollowUser(user.id, actorId);
      } else {
        await CrewFinderService.followUser(user.id, actorId);
      }
      return { actorId, newFollowingState: !currentlyFollowing };
    },
    onSuccess: ({ actorId, newFollowingState }) => {
      queryClient.setQueryData(
        ['following-status', user?.id, actorIds],
        (old: Map<string, boolean> | undefined) => {
          const newMap = new Map(old || []);
          newMap.set(actorId, newFollowingState);
          return newMap;
        }
      );
      queryClient.invalidateQueries({ queryKey: ['following-status'] });
      queryClient.invalidateQueries({ queryKey: ['sailor-suggestions'] });
    },
  });

  const handleToggleFollow = useCallback(
    async (actorId: string, currentlyFollowing: boolean) => {
      await toggleFollowMutation.mutateAsync({ actorId, currentlyFollowing });
    },
    [toggleFollowMutation]
  );

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleSeeAllMessages = useCallback(() => {
    router.push('/messages');
  }, [router]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalUnreadMessages = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  // Render notification row with rounded section container
  const renderNotification = useCallback(
    ({ item, index, section }: { item: SocialNotification; index: number; section: NotificationSection }) => {
      const isFollowingBack = item.actorId ? followingMap.get(item.actorId) : false;
      const isFirst = index === 0;
      const isLast = index === section.data.length - 1;
      const shouldShowSwipeHint = showSwipeHint && item.id === firstUnreadId;

      return (
        <View
          style={[
            styles.notificationRowWrapper,
            isFirst && styles.notificationRowFirst,
            isLast && styles.notificationRowLast,
          ]}
        >
          <NotificationRow
            notification={item}
            onPress={() => {
              if (!item.isRead) markAsRead(item.id);
              // Navigate based on type
              if (item.type === 'new_follower' && item.actorId) {
                router.push(`/sailor/${item.actorId}`);
              } else if (item.regattaId) {
                router.push(`/race/${item.regattaId}`);
              }
            }}
            onDelete={() => {
              handleFirstSwipe();
              deleteNotification(item.id);
            }}
            isFollowingBack={isFollowingBack}
            onToggleFollow={
              item.type === 'new_follower' && item.actorId
                ? () => handleToggleFollow(item.actorId!, isFollowingBack || false)
                : undefined
            }
            isLast={isLast}
            showSwipeHint={shouldShowSwipeHint}
          />
        </View>
      );
    },
    [followingMap, markAsRead, deleteNotification, handleToggleFollow, handleFirstSwipe, router, showSwipeHint, firstUnreadId]
  );

  // Section header with unread count
  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationSection }) => (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.unreadCount > 0 && (
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{section.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    ),
    []
  );

  // List header with large title and messages
  const ListHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        {/* Large Title */}
        <View style={styles.largeTitleRow}>
          <Text style={styles.largeTitle}>Activity</Text>
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllAsRead}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Text style={styles.markAllText}>Mark All Read</Text>
            </Pressable>
          )}
        </View>

        {/* Messages Section */}
        {threads.length > 0 && (
          <View style={styles.messagesSection}>
            <Pressable
              style={styles.messagesSectionHeader}
              onPress={handleSeeAllMessages}
            >
              <View style={styles.messagesTitleRow}>
                <Text style={styles.messagesTitle}>Messages</Text>
                {totalUnreadMessages > 0 && (
                  <View style={styles.messageBadge}>
                    <Text style={styles.messageBadgeText}>
                      {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.seeAllRow}>
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={16} color={IOS_COLORS.tertiaryLabel} />
              </View>
            </Pressable>
            <MessagesPreviewList threads={threads} maxItems={3} />
          </View>
        )}

        {/* Notifications section label */}
        {sections.length > 0 && threads.length > 0 && (
          <View style={styles.notificationsSectionLabel}>
            <Text style={styles.notificationsSectionTitle}>Notifications</Text>
          </View>
        )}
      </View>
    ),
    [threads, totalUnreadMessages, unreadCount, markAllAsRead, handleSeeAllMessages, sections.length]
  );

  // Empty state
  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemGray3} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Activity Yet</Text>
        <Text style={styles.emptyText}>
          When sailors follow you, comment on your races, or interact with your content, you'll see it here.
        </Text>
      </View>
    );
  }, [isLoading]);

  // Footer loader
  const ListFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemGray3} />
      </View>
    );
  }, [isLoadingMore]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <GestureHandlerRootView style={styles.container}>
        {/* Minimal Nav Bar */}
        <View style={[styles.navBar, { paddingTop: insets.top }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <ChevronLeft size={28} color={IOS_COLORS.systemBlue} />
          </Pressable>
        </View>

        {/* Main List */}
        <SectionList
          sections={sections}
          renderItem={renderNotification}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={IOS_COLORS.systemGray3}
            />
          }
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + IOS_SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </GestureHandlerRootView>
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },

  // Nav Bar (minimal)
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.xs,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  backButton: {
    padding: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.sm,
  },
  backButtonPressed: {
    opacity: 0.6,
  },

  // List content
  listContent: {
    flexGrow: 1,
    paddingHorizontal: IOS_SPACING.lg,
  },

  // List Header
  listHeader: {
    // No horizontal padding - handled by listContent
  },
  largeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.lg,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: 0.4,
  },
  markAllText: {
    fontSize: 15,
    color: IOS_COLORS.systemBlue,
  },

  // Messages Section
  messagesSection: {
    marginBottom: IOS_SPACING.xl,
  },
  messagesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: IOS_SPACING.sm,
  },
  messagesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },
  messageBadge: {
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  messageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 15,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Notifications section label
  notificationsSectionLabel: {
    paddingTop: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.xs,
  },
  notificationsSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },

  // Notification row wrapper for rounded corners
  notificationRowWrapper: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    overflow: 'hidden',
  },
  notificationRowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  notificationRowLast: {
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },

  // Section headers
  sectionHeader: {
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.4,
  },
  sectionBadge: {
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 8,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxl,
    paddingHorizontal: IOS_SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Footer
  footerLoader: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
  },
});
