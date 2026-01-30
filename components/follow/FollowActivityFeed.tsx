/**
 * FollowActivityFeed
 *
 * Main feed component for the Follow tab.
 * Shows activity from followed sailors and clubs in a scrollable list.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { useFollowActivityFeed, ActivityItem } from '@/hooks/useFollowActivityFeed';
import { SailorActivityCard } from './SailorActivityCard';

interface FollowActivityFeedProps {
  /** Extra top padding to clear an absolutely-positioned toolbar */
  toolbarOffset?: number;
  /** Scroll handler forwarded from parent for toolbar hide/show */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

/**
 * Empty state shown when user doesn't follow anyone
 */
function EmptyFollowingState() {
  const router = useRouter();

  const handleDiscoverSailors = useCallback(() => {
    triggerHaptic('selection');
    router.push('/(tabs)/search');
  }, [router]);

  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Ionicons name="heart-outline" size={48} color={IOS_COLORS.systemGray3} />
      </View>
      <Text style={emptyStyles.title}>Follow sailors to see their activity</Text>
      <Text style={emptyStyles.subtitle}>
        When you follow sailors, their race schedules and insights will appear here
      </Text>
      <Pressable style={emptyStyles.button} onPress={handleDiscoverSailors}>
        <Ionicons name="search" size={18} color="#FFFFFF" />
        <Text style={emptyStyles.buttonText}>Discover Sailors</Text>
      </Pressable>
    </View>
  );
}

/**
 * Empty state shown when following users but no activity yet
 */
function NoActivityState({ followingCount }: { followingCount: number }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Ionicons name="boat-outline" size={48} color={IOS_COLORS.systemGray3} />
      </View>
      <Text style={emptyStyles.title}>No recent activity</Text>
      <Text style={emptyStyles.subtitle}>
        You&apos;re following {followingCount} sailor{followingCount !== 1 ? 's' : ''}.
        Their race activity will appear here.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.lg,
  },
  title: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  subtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: IOS_SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: IOS_RADIUS.full,
  },
  buttonText: {
    ...IOS_TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

/**
 * Main feed component
 */
export function FollowActivityFeed({ toolbarOffset = 0, onScroll }: FollowActivityFeedProps) {
  const router = useRouter();
  const {
    items,
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
    error,
    followingCount,
    hasFollowing,
  } = useFollowActivityFeed();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleSailorPress = useCallback(
    (userId: string) => {
      router.push(`/sailor/${userId}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ActivityItem }) => {
      if (item.type === 'race_upcoming' || item.type === 'race_result') {
        if (!item.race) return null;
        return <SailorActivityCard race={item.race} onSailorPress={handleSailorPress} />;
      }
      // Club posts can be added here in the future
      return null;
    },
    [handleSailorPress]
  );

  const keyExtractor = useCallback((item: ActivityItem) => item.id, []);

  const itemSeparator = useCallback(() => <View style={styles.separator} />, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const listFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }, [isLoadingMore]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: toolbarOffset }]}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.errorContainer, { paddingTop: toolbarOffset }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={IOS_COLORS.systemGray3} />
        <Text style={styles.errorText}>Unable to load activity</Text>
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Empty states
  if (!hasFollowing) {
    return (
      <View style={{ paddingTop: toolbarOffset }}>
        <EmptyFollowingState />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={{ paddingTop: toolbarOffset }}>
        <NoActivityState followingCount={followingCount} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={itemSeparator}
      contentContainerStyle={[styles.listContent, { paddingTop: toolbarOffset }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={listFooter}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={IOS_COLORS.systemBlue}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: IOS_SPACING.md,
    paddingBottom: 120,
  },
  separator: {
    height: IOS_SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.md,
    marginBottom: IOS_SPACING.lg,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.full,
  },
  retryText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
  },
});

export default FollowActivityFeed;
