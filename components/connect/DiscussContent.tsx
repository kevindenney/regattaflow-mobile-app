/**
 * DiscussContent — Discuss segment for the Connect tab
 *
 * Two sub-segments:
 * - Feed (default): Community posts feed (reddit-style) with sort pills, type filters, compose
 * - Communities: Browse communities, categories, search, join/leave
 *
 * Extracted from app/(tabs)/community.tsx to be composed inside Connect tab.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

import { CommunityCard } from '@/components/community/CommunityCard';
import { CategoryChips } from '@/components/community/CategoryChips';
import { CommunityPostComposer } from '@/components/community/CommunityPostComposer';
import { FeedPostCard } from '@/components/venue/feed/FeedPostCard';
import { PostDetailScreen } from '@/components/venue/post/PostDetailScreen';
import { WelcomeBanner } from '@/components/venue/WelcomeBanner';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';

import {
  useUserCommunities,
  useCommunityCategories,
  useCommunitiesByCategory,
  usePopularCommunities,
  useCommunitySearch,
  useToggleCommunityMembership,
} from '@/hooks/useCommunities';
import { communityFeedKeys, useJoinedCommunitiesFeed } from '@/hooks/useCommunityFeed';
import { usePopularCommunitiesFeed } from '@/hooks/usePopularCommunitiesFeed';
import { triggerHaptic } from '@/lib/haptics';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

import type { Community } from '@/types/community';
import type { FeedPost, FeedSortType, PostType } from '@/types/community-feed';
import { POST_TYPE_CONFIG } from '@/types/community-feed';

// =============================================================================
// TYPES & CONSTANTS
// =============================================================================

type CommunitySegment = 'feed' | 'communities';

const SEGMENTS: { value: CommunitySegment; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'communities', label: 'Communities' },
];

const SORT_OPTIONS: { key: FeedSortType; label: string }[] = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'rising', label: 'Rising' },
  { key: 'top', label: 'Top' },
];

const POST_TYPE_FILTERS: (PostType | 'all')[] = [
  'all',
  'tip',
  'question',
  'report',
  'discussion',
  'safety_alert',
];

// =============================================================================
// PROPS
// =============================================================================

interface DiscussContentProps {
  toolbarOffset: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DiscussContent({ toolbarOffset, onScroll }: DiscussContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Segment state
  const [segment, setSegment] = useState<CommunitySegment>('feed');

  // Feed state
  const [feedSort, setFeedSort] = useState<FeedSortType>('hot');
  const [feedPostType, setFeedPostType] = useState<PostType | undefined>(undefined);
  const filtersActive = feedSort !== 'hot' || feedPostType !== undefined;
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showComposePost, setShowComposePost] = useState(false);

  // Communities state
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Data hooks
  const { data: userCommunities, isLoading: isLoadingUserCommunities, refetch: refetchUserCommunities } = useUserCommunities();
  const { data: categories, isLoading: isLoadingCategories } = useCommunityCategories();
  const { data: categoryCommunities } = useCommunitiesByCategory(selectedCategoryId || undefined, 15);
  const { data: popularCommunities, isLoading: isLoadingPopular } = usePopularCommunities(15);
  const { data: searchResults, isLoading: isSearching } = useCommunitySearch(groupSearchQuery, {}, groupSearchQuery.length >= 2);
  const { mutate: toggleMembership, isPending: isMembershipPending } = useToggleCommunityMembership();

  const joinedCommunityIds = useMemo(
    () => userCommunities?.joined.map((c) => c.id) || [],
    [userCommunities?.joined]
  );

  const {
    data: feedData,
    isLoading: isLoadingFeed,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchFeed,
  } = useJoinedCommunitiesFeed(joinedCommunityIds, {
    sort: feedSort,
    postType: feedPostType,
    enabled: segment === 'feed' && joinedCommunityIds.length > 0,
  });

  // Discovery feed for users who haven't joined any communities
  const {
    posts: discoveryPosts,
    isLoading: isLoadingDiscovery,
    isFetchingNextPage: isFetchingNextDiscoveryPage,
    hasNextPage: hasNextDiscoveryPage,
    fetchNextPage: fetchNextDiscoveryPage,
    refetch: refetchDiscovery,
  } = usePopularCommunitiesFeed({
    sort: feedSort,
    postType: feedPostType,
    enabled: segment === 'feed' && joinedCommunityIds.length === 0,
  });

  const feedPosts = useMemo(() => {
    if (!feedData?.pages) return [];
    return feedData.pages.flatMap((page) => page.data);
  }, [feedData?.pages]);

  const isFiltering = groupSearchQuery.trim().length >= 2;

  // ---------------------------------------------------------------------------
  // Communities data
  // ---------------------------------------------------------------------------

  const displayCommunities = useMemo(() => {
    if (isFiltering && searchResults) {
      return searchResults.data;
    }
    if (selectedCategoryId && categoryCommunities) {
      return categoryCommunities;
    }
    return popularCommunities || [];
  }, [isFiltering, searchResults, selectedCategoryId, categoryCommunities, popularCommunities]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handlePostPress = useCallback(
    (post: FeedPost) => {
      queryClient.setQueryData(communityFeedKeys.post(post.id), post);
      setSelectedPostId(post.id);
    },
    [queryClient],
  );

  const handleFeedRefresh = useCallback(async () => {
    await refetchFeed();
  }, [refetchFeed]);

  const handleCommunitiesRefresh = useCallback(async () => {
    await refetchUserCommunities();
  }, [refetchUserCommunities]);

  const openPostTypePicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      const labels = POST_TYPE_FILTERS.map((t) =>
        t === 'all' ? 'All Types' : POST_TYPE_CONFIG[t as PostType].label
      );
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Cancel'],
          cancelButtonIndex: labels.length,
          title: 'Filter by type',
        },
        (index) => {
          if (index < POST_TYPE_FILTERS.length) {
            triggerHaptic('selection');
            const selected = POST_TYPE_FILTERS[index];
            setFeedPostType(selected === 'all' ? undefined : (selected as PostType));
          }
        },
      );
    }
  }, []);

  const handleCommunityPress = useCallback(
    (community: Community) => {
      router.push(`/community/${community.slug}`);
    },
    [router],
  );

  const handleJoinToggle = useCallback(
    (community: Community) => {
      toggleMembership(community.id, community.is_member ?? false);
    },
    [toggleMembership],
  );

  const handleCreateCommunity = useCallback(() => {
    router.push('/community/create');
  }, [router]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderFeedItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <FeedPostCard
        post={item}
        showVenueName
        onPress={() => handlePostPress(item)}
        onVenuePress={(venueId) => router.push(`/venue/${venueId}`)}
      />
    ),
    [handlePostPress, router],
  );

  const feedKeyExtractor = useCallback((item: FeedPost) => item.id, []);
  const feedItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Segment + sort controls */}
      <View style={{ marginTop: toolbarOffset }}>
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl
            segments={SEGMENTS}
            selectedValue={segment}
            onValueChange={setSegment}
          />
        </View>
        {segment === 'feed' && filtersActive && (
          <View style={styles.activeFilterHint}>
            <Text style={styles.activeFilterHintText}>
              {feedSort !== 'hot' ? `Sorted by ${SORT_OPTIONS.find(o => o.key === feedSort)?.label}` : ''}
              {feedSort !== 'hot' && feedPostType ? ' · ' : ''}
              {feedPostType ? `${POST_TYPE_CONFIG[feedPostType].label} only` : ''}
            </Text>
            <Pressable onPress={() => { setFeedSort('hot'); setFeedPostType(undefined); }}>
              <Text style={styles.activeFilterClearText}>Clear</Text>
            </Pressable>
          </View>
        )}
        {segment === 'feed' && (
          <View style={styles.sortPillRow}>
            {SORT_OPTIONS.map(opt => {
              const isActive = feedSort === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.sortPill, isActive && styles.sortPillActive]}
                  onPress={() => {
                    triggerHaptic('selection');
                    setFeedSort(opt.key);
                  }}
                >
                  <Text style={[styles.sortPillText, isActive && styles.sortPillTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Toolbar actions rendered as floating buttons */}
      {segment === 'feed' && (
        <View style={styles.floatingActions}>
          <Pressable style={styles.floatingButton} onPress={() => setShowComposePost(true)}>
            <Ionicons name="add-circle-outline" size={20} color={IOS_COLORS.systemBlue} />
          </Pressable>
          <Pressable style={styles.floatingButton} onPress={openPostTypePicker}>
            <Ionicons
              name="funnel-outline"
              size={18}
              color={feedPostType !== undefined ? IOS_COLORS.systemBlue : IOS_COLORS.secondaryLabel}
            />
          </Pressable>
        </View>
      )}
      {segment === 'communities' && (
        <View style={styles.floatingActions}>
          <Pressable style={styles.floatingButton} onPress={handleCreateCommunity}>
            <Ionicons name="add-circle-outline" size={20} color={IOS_COLORS.systemBlue} />
          </Pressable>
        </View>
      )}

      {/* Content based on segment */}
      {segment === 'feed' ? (
        /* FEED SEGMENT */
        isLoadingUserCommunities || (joinedCommunityIds.length > 0 && isLoadingFeed && feedPosts.length === 0) || (joinedCommunityIds.length === 0 && isLoadingDiscovery && discoveryPosts.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          </View>
        ) : joinedCommunityIds.length === 0 ? (
          <FlatList
            data={discoveryPosts}
            renderItem={renderFeedItem}
            keyExtractor={feedKeyExtractor}
            ItemSeparatorComponent={feedItemSeparator}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={
              <View style={styles.discoveryBanner}>
                <Ionicons name="flame-outline" size={24} color={IOS_COLORS.systemOrange} />
                <Text style={styles.discoveryBannerTitle}>Trending in the Community</Text>
                <Text style={styles.discoveryBannerSubtitle}>
                  Popular posts from communities you might enjoy
                </Text>
                <Pressable
                  style={styles.discoveryBannerCta}
                  onPress={() => setSegment('communities')}
                >
                  <Text style={styles.discoveryBannerCtaText}>Browse & Join Communities</Text>
                </Pressable>
              </View>
            }
            onEndReached={() => {
              if (hasNextDiscoveryPage && !isFetchingNextDiscoveryPage) {
                fetchNextDiscoveryPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetchDiscovery()}
                tintColor={IOS_COLORS.systemBlue}
              />
            }
            ListEmptyComponent={
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No community posts yet</Text>
                <Pressable
                  style={styles.noResultsCta}
                  onPress={() => setSegment('communities')}
                >
                  <Text style={styles.noResultsCtaText}>Browse communities to join</Text>
                </Pressable>
              </View>
            }
            ListFooterComponent={
              isFetchingNextDiscoveryPage ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={feedPosts}
            renderItem={renderFeedItem}
            keyExtractor={feedKeyExtractor}
            ItemSeparatorComponent={feedItemSeparator}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            ListHeaderComponent={<WelcomeBanner />}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={handleFeedRefresh}
                tintColor={IOS_COLORS.systemBlue}
              />
            }
            ListEmptyComponent={
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  {feedPostType ? 'No posts match this filter' : 'No posts yet in your communities'}
                </Text>
                {!feedPostType && (
                  <Pressable
                    style={styles.noResultsCta}
                    onPress={() => setSegment('communities')}
                  >
                    <Text style={styles.noResultsCtaText}>Find communities to join</Text>
                  </Pressable>
                )}
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
                </View>
              ) : null
            }
          />
        )
      ) : (
        /* COMMUNITIES SEGMENT */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleCommunitiesRefresh}
              tintColor={IOS_COLORS.systemBlue}
            />
          }
        >
          {/* Category Chips */}
          <CategoryChips
            categories={categories || []}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            isLoading={isLoadingCategories}
          />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color={IOS_COLORS.tertiaryLabel}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search communities..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
              value={groupSearchQuery}
              onChangeText={setGroupSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {/* Your Communities */}
          {!isFiltering && userCommunities && userCommunities.joined.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>YOUR COMMUNITIES</Text>
              <View style={styles.cardList}>
                {userCommunities.joined.map((community, index) => (
                  <View key={community.id}>
                    {index > 0 && <View style={styles.listSeparator} />}
                    <CommunityCard
                      community={community}
                      onPress={() => handleCommunityPress(community)}
                      onJoinToggle={() => handleJoinToggle(community)}
                      isJoinPending={isMembershipPending}
                      compact
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Discover / Search Results */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isFiltering
                ? 'SEARCH RESULTS'
                : selectedCategoryId
                ? categories?.find((c) => c.id === selectedCategoryId)?.display_name?.toUpperCase() || 'BROWSE'
                : 'DISCOVER'}
            </Text>

            {isLoadingPopular || isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={IOS_COLORS.systemGray3} />
              </View>
            ) : displayCommunities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isFiltering ? 'No communities found' : 'No communities available'}
                </Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {displayCommunities.map((community, index) => (
                  <View key={community.id}>
                    {index > 0 && <View style={styles.listSeparator} />}
                    <CommunityCard
                      community={community}
                      onPress={() => handleCommunityPress(community)}
                      onJoinToggle={() => handleJoinToggle(community)}
                      isJoinPending={isMembershipPending}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Community Post Composer */}
      <CommunityPostComposer
        isOpen={showComposePost}
        onClose={() => setShowComposePost(false)}
      />

      {/* Post Detail Modal */}
      <Modal
        visible={!!selectedPostId}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPostId(null)}
      >
        {selectedPostId && (
          <PostDetailScreen
            postId={selectedPostId}
            onBack={() => setSelectedPostId(null)}
          />
        )}
      </Modal>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Segment control
  segmentContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
  },

  // Floating action buttons
  floatingActions: {
    position: 'absolute',
    top: 8,
    right: IOS_SPACING.lg,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  floatingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Feed content
  feedContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  separator: {
    height: 12,
  },
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
  },
  noResultsCta: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noResultsCtaText: {
    ...IOS_TYPOGRAPHY.callout,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingFooter: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
  },

  // Discovery banner for users without communities
  discoveryBanner: {
    marginBottom: IOS_SPACING.md,
    padding: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    alignItems: 'center',
  },
  discoveryBannerTitle: {
    ...IOS_TYPOGRAPHY.title3,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.xs,
  },
  discoveryBannerSubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: IOS_SPACING.md,
  },
  discoveryBannerCta: {
    backgroundColor: '#2563EB',
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: 10,
  },
  discoveryBannerCtaText: {
    ...IOS_TYPOGRAPHY.callout,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sort pills & filter hints
  activeFilterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
  },
  activeFilterHintText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  activeFilterClearText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  sortPillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  sortPillActive: {
    backgroundColor: IOS_COLORS.label,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  sortPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Communities scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Sections
  section: {
    marginTop: IOS_SPACING.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  cardList: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  listSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg + 44 + IOS_SPACING.md,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.sm,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: IOS_RADIUS.sm,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: IOS_COLORS.label,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },

  // Empty states
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.tertiaryLabel,
  },
});
