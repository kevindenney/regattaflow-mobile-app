/**
 * Discuss Tab — Community hub
 *
 * Two segments:
 * - Feed (default): Community posts feed (reddit-style) with sort pills, type filters, compose
 * - Communities: Browse communities, categories, search, join/leave
 *
 * Messages removed — accessible via bell icon → /social-notifications.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { CommunityCard } from '@/components/community/CommunityCard';
import { CategoryChips } from '@/components/community/CategoryChips';
import { CommunityPostComposer } from '@/components/community/CommunityPostComposer';
import { FeedPostCard } from '@/components/venue/feed/FeedPostCard';
import { PostDetailScreen } from '@/components/venue/post/PostDetailScreen';
import { WelcomeBanner } from '@/components/venue/WelcomeBanner';
import { TabScreenToolbar, type ToolbarAction } from '@/components/ui/TabScreenToolbar';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';

import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import {
  useUserCommunities,
  useCommunityCategories,
  useCommunitiesByCategory,
  usePopularCommunities,
  useCommunitySearch,
  useToggleCommunityMembership,
} from '@/hooks/useCommunities';
import { communityFeedKeys, useJoinedCommunitiesFeed } from '@/hooks/useCommunityFeed';
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
// TYPES
// =============================================================================

type CommunitySegment = 'feed' | 'communities';

// =============================================================================
// CONSTANTS
// =============================================================================

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
// MAIN COMPONENT
// =============================================================================

export default function CommunityTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll } = useScrollToolbarHide();

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

  const clearGroupSearch = useCallback(() => {
    setGroupSearchQuery('');
  }, []);

  // ---------------------------------------------------------------------------
  // Toolbar actions (swap based on segment)
  // ---------------------------------------------------------------------------

  const toolbarActions: ToolbarAction[] = useMemo(() => {
    if (segment === 'feed') {
      const actions: ToolbarAction[] = [
        {
          icon: 'add-circle-outline',
          sfSymbol: 'plus.circle',
          label: 'New post',
          onPress: () => setShowComposePost(true),
        },
      ];

      if (feedPostType !== undefined) {
        actions.push({
          icon: 'funnel-outline',
          label: POST_TYPE_CONFIG[feedPostType].label,
          onPress: openPostTypePicker,
          isActive: true,
        });
      } else {
        actions.push({
          icon: 'funnel-outline',
          label: 'Filter',
          onPress: openPostTypePicker,
        });
      }

      return actions;
    }

    return [
      {
        icon: 'add-circle-outline',
        sfSymbol: 'plus.circle',
        label: 'Create community',
        onPress: handleCreateCommunity,
      },
    ];
  }, [segment, feedPostType, openPostTypePicker, handleCreateCommunity]);

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
      {/* Fixed status bar background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Content based on segment */}
      {segment === 'feed' ? (
        /* ================================================================ */
        /* FEED SEGMENT - Community posts                                   */
        /* ================================================================ */
        isLoadingUserCommunities || (isLoadingFeed && feedPosts.length === 0) ? (
          <View style={[styles.loadingContainer, { paddingTop: toolbarHeight }]}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          </View>
        ) : joinedCommunityIds.length === 0 ? (
          <View style={[styles.feedEmptyContainer, { paddingTop: toolbarHeight }]}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={IOS_COLORS.systemGray3}
            />
            <Text style={styles.feedEmptyTitle}>Join communities</Text>
            <Text style={styles.feedEmptySubtitle}>
              Join communities from the Communities tab to see posts here
            </Text>
          </View>
        ) : (
          <FlatList
            data={feedPosts}
            renderItem={renderFeedItem}
            keyExtractor={feedKeyExtractor}
            ItemSeparatorComponent={feedItemSeparator}
            contentContainerStyle={[styles.feedContent, { paddingTop: toolbarHeight }]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
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
        /* ================================================================ */
        /* COMMUNITIES SEGMENT - Communities browser                        */
        /* ================================================================ */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onScroll={handleScroll}
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

      {/* Toolbar */}
      <TabScreenToolbar
        title="Community"
        topInset={insets.top}
        actions={toolbarActions}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
        backgroundColor="rgba(242, 242, 247, 0.94)"
      >
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
        {segment === 'feed' && joinedCommunityIds.length > 0 && (
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
      </TabScreenToolbar>

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
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'rgba(242, 242, 247, 0.94)',
  },

  // Segment control
  segmentContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
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

  // Feed empty state
  feedEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: IOS_SPACING.sm,
  },
  feedEmptyTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.md,
  },
  feedEmptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
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
