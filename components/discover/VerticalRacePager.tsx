/**
 * VerticalRacePager Component
 *
 * TikTok-style vertical swipe pager for race cards.
 * Each card fills the entire viewport, users swipe up/down to navigate.
 *
 * Features:
 * - Full viewport height per item
 * - Snap-to-item behavior
 * - Smooth spring animation on swipe release
 * - Preload adjacent cards for performance
 * - Infinite scroll with pagination
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sailboat } from 'lucide-react-native';
import { FullScreenRaceCard, FullScreenRaceCardData } from './FullScreenRaceCard';
import { TUFTE_BACKGROUND } from '@/components/cards';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

// Tab bar height (matches _layout.tsx)
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 + 34 : 52;

interface VerticalRacePagerProps {
  races: FullScreenRaceCardData[];
  onViewJourney: (sailorId: string, raceId: string) => void;
  onUseTemplate: (sailorId: string, raceId: string) => void;
  onToggleFollow: (userId: string) => void;
  onRefresh: () => Promise<void>;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
}

/**
 * Empty state when no races available
 */
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Sailboat size={48} color={IOS_COLORS.systemGray3} />
      </View>
      <Text style={styles.emptyTitle}>No Races Found</Text>
      <Text style={styles.emptySubtitle}>
        No public races available yet.{'\n'}Check back soon!
      </Text>
    </View>
  );
}

/**
 * Loading footer for infinite scroll
 */
function LoadingFooter({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
      <Text style={styles.loadingFooterText}>Loading more...</Text>
    </View>
  );
}

export function VerticalRacePager({
  races,
  onViewJourney,
  onUseTemplate,
  onToggleFollow,
  onRefresh,
  onLoadMore,
  isLoading = false,
  isRefreshing = false,
  isLoadingMore = false,
  hasMore = false,
}: VerticalRacePagerProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Calculate card height (full viewport minus safe areas and tab bar)
  const cardHeight = screenHeight - insets.top - TAB_BAR_HEIGHT;

  // Key extractor
  const keyExtractor = useCallback(
    (item: FullScreenRaceCardData) => `race_${item.id}`,
    []
  );

  // Get item layout for performance (required for pagingEnabled)
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: cardHeight,
      offset: cardHeight * index,
      index,
    }),
    [cardHeight]
  );

  // Render individual race card
  const renderItem = useCallback(
    ({ item }: { item: FullScreenRaceCardData }) => (
      <FullScreenRaceCard
        race={item}
        cardHeight={cardHeight}
        onViewJourney={onViewJourney}
        onUseTemplate={onUseTemplate}
        onToggleFollow={onToggleFollow}
      />
    ),
    [cardHeight, onViewJourney, onUseTemplate, onToggleFollow]
  );

  // Handle end reached for pagination
  const handleEndReached = useCallback(() => {
    if (hasMore && onLoadMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isLoadingMore]);

  // Render empty component
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return <EmptyState />;
  }, [isLoading]);

  // Render footer
  const renderFooter = useCallback(() => {
    return <LoadingFooter isVisible={isLoadingMore} />;
  }, [isLoadingMore]);

  // Memoize snap to offsets for better performance
  const snapToOffsets = useMemo(
    () => races.map((_, index) => index * cardHeight),
    [races, cardHeight]
  );

  // Show loading state
  if (isLoading && races.length === 0) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        <Text style={styles.loadingText}>Finding race journeys...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        ref={flatListRef}
        data={races}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        // Vertical paging behavior
        pagingEnabled
        snapToAlignment="start"
        snapToOffsets={snapToOffsets}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        // Performance optimizations
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        // Pagination
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // Empty and footer
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        // Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={IOS_COLORS.systemBlue}
          />
        }
        // Accessibility
        accessibilityLabel="Race journey feed"
        accessibilityHint="Swipe up or down to see more race journeys"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TUFTE_BACKGROUND,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: IOS_COLORS.systemGray6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingFooterText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
});

export default VerticalRacePager;
