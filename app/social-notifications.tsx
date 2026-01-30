/**
 * Social Notifications Screen
 *
 * Displays social notifications (follows, likes, comments, etc.)
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCheck } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationsList } from '@/components/social/NotificationsList';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { CrewFinderService } from '@/services/CrewFinderService';
import { supabase } from '@/services/supabase';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

export default function SocialNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
      // Optimistically update the local map
      queryClient.setQueryData(
        ['following-status', user?.id, actorIds],
        (old: Map<string, boolean> | undefined) => {
          const newMap = new Map(old || []);
          newMap.set(actorId, newFollowingState);
          return newMap;
        }
      );
      // Invalidate related queries
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

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Custom Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={handleBack}
          >
            <ChevronLeft size={24} color={IOS_COLORS.systemBlue} />
          </Pressable>

          <Text style={styles.title}>Activity</Text>

          {hasUnread ? (
            <Pressable
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && styles.markAllButtonPressed,
              ]}
              onPress={markAllAsRead}
            >
              <CheckCheck size={20} color={IOS_COLORS.systemBlue} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Notifications List */}
        <NotificationsList
          notifications={notifications}
          isLoading={isLoading}
          onLoadMore={loadMore}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onRefresh={refresh}
          onMarkRead={markAsRead}
          onDelete={deleteNotification}
          followingMap={followingMap}
          onToggleFollow={handleToggleFollow}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  backButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  backButtonPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  markAllButton: {
    padding: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
  },
  markAllButtonPressed: {
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  headerSpacer: {
    width: 40,
  },
});
