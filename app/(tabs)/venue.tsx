/**
 * Discuss Tab — Reddit-Inspired Communities
 *
 * Two segments: "Feed" (aggregated from joined communities) and "Communities" (discovery).
 * Apple HIG design: iOS Inset Grouped List, system typography & colors.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { TabScreenToolbar, ToolbarAction } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { FeedPostCard } from '@/components/venue/feed/FeedPostCard';
import { CommunityCard } from '@/components/community/CommunityCard';
import { CategoryChips } from '@/components/community/CategoryChips';
import {
  useUserCommunities,
  useCommunityCategories,
  useCommunitiesByCategory,
  usePopularCommunities,
  useCommunitySearch,
  useToggleCommunityMembership,
} from '@/hooks/useCommunities';
import { communityFeedKeys, useJoinedCommunitiesFeed } from '@/hooks/useCommunityFeed';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import type { FeedPost, FeedSortType, PostType } from '@/types/community-feed';
import type { Community } from '@/types/community';
import { POST_TYPE_CONFIG } from '@/types/community-feed';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type SegmentValue = 'feed' | 'communities';

const SEGMENTS: { value: SegmentValue; label: string }[] = [
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

// ---------------------------------------------------------------------------
// Empty States
// ---------------------------------------------------------------------------

function FeedEmptyState({ onBrowseCommunities }: { onBrowseCommunities: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons
        name="chatbubbles-outline"
        size={48}
        color={IOS_COLORS.systemGray3}
      />
      <Text style={emptyStyles.title}>Join communities</Text>
      <Text style={emptyStyles.subtitle}>
        Join communities to see discussions from your sailing network
      </Text>
      <Pressable style={emptyStyles.button} onPress={onBrowseCommunities}>
        <Text style={emptyStyles.buttonText}>Browse Communities</Text>
      </Pressable>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
    gap: IOS_SPACING.sm,
  },
  title: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.md,
  },
  subtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.xl,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.full,
  },
  buttonText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DiscussScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();

  // Segment
  const [segment, setSegment] = useState<SegmentValue>('feed');

  // Feed state
  const [feedSort, setFeedSort] = useState<FeedSortType>('hot');
  const [feedPostType, setFeedPostType] = useState<PostType | undefined>(undefined);
  const filtersActive = feedSort !== 'hot' || feedPostType !== undefined;

  // Communities state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Data hooks
  const { data: userCommunities, isLoading: isLoadingUserCommunities, refetch: refetchUserCommunities } = useUserCommunities();
  const { data: categories, isLoading: isLoadingCategories } = useCommunityCategories();
  const { data: categoryCommunities } = useCommunitiesByCategory(selectedCategoryId || undefined, 15);
  const { data: popularCommunities, isLoading: isLoadingPopular } = usePopularCommunities(15);
  const { data: searchResults, isLoading: isSearching } = useCommunitySearch(searchQuery, {}, searchQuery.length >= 2);
  const { mutate: toggleMembership, isPending: isMembershipPending } = useToggleCommunityMembership();

  const isFiltering = searchQuery.trim().length >= 2;

  // ---------------------------------------------------------------------------
  // Feed data from joined communities
  // ---------------------------------------------------------------------------

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

  // Flatten paginated feed data
  const feedPosts = useMemo(() => {
    if (!feedData?.pages) return [];
    return feedData.pages.flatMap((page) => page.posts);
  }, [feedData?.pages]);

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

  const handleCommunityPress = useCallback(
    (community: Community) => {
      router.push(`/community/${community.slug}`);
    },
    [router],
  );

  const handlePostPress = useCallback(
    (post: FeedPost) => {
      queryClient.setQueryData(communityFeedKeys.post(post.id), post);
      router.push(`/venue/post/${post.id}`);
    },
    [router, queryClient],
  );

  const handleJoinToggle = useCallback(
    (community: Community) => {
      toggleMembership(community.id, community.is_member ?? false);
    },
    [toggleMembership],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchUserCommunities(), refetchFeed()]);
  }, [refetchUserCommunities, refetchFeed]);

  const handleBrowseCommunities = useCallback(() => {
    triggerHaptic('selection');
    setSegment('communities');
  }, []);

  const openSortPicker = useCallback(() => {
    if (Platform.OS === 'ios') {
      const labels = SORT_OPTIONS.map((o) => o.label);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, 'Cancel'],
          cancelButtonIndex: labels.length,
          title: 'Sort by',
        },
        (index) => {
          if (index < SORT_OPTIONS.length) {
            triggerHaptic('selection');
            setFeedSort(SORT_OPTIONS[index].key);
          }
        },
      );
    }
  }, []);

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

  // ---------------------------------------------------------------------------
  // Toolbar actions
  // ---------------------------------------------------------------------------

  const toolbarActions = useMemo<ToolbarAction[] | undefined>(() => {
    const actions: ToolbarAction[] = [
      {
        icon: 'add-circle-outline',
        label: 'New post',
        onPress: () => router.push('/venue/post/create'),
      },
    ];

    if (segment === 'feed') {
      actions.push({
        icon: 'swap-vertical-outline',
        label: SORT_OPTIONS.find((o) => o.key === feedSort)?.label ?? 'Hot',
        onPress: openSortPicker,
        isActive: feedSort !== 'hot',
      });
      actions.push({
        icon: 'funnel-outline',
        label: feedPostType ? POST_TYPE_CONFIG[feedPostType].label : 'Filter',
        onPress: openPostTypePicker,
        isActive: feedPostType !== undefined,
      });
    }

    return actions;
  }, [segment, feedSort, feedPostType, router, openSortPicker, openPostTypePicker]);

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

  const renderCommunityItem = useCallback(
    ({ item }: { item: Community }) => (
      <View style={styles.communityCardWrapper}>
        <CommunityCard
          community={item}
          onPress={() => handleCommunityPress(item)}
          onJoinToggle={() => handleJoinToggle(item)}
          isJoinPending={isMembershipPending}
        />
      </View>
    ),
    [handleCommunityPress, handleJoinToggle, isMembershipPending],
  );

  const feedKeyExtractor = useCallback((item: FeedPost) => item.id, []);
  const communityKeyExtractor = useCallback((item: Community) => item.id, []);

  const itemSeparator = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Fixed status bar background */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Scroll content */}
      {segment === 'feed' ? (
        /* ================================================================ */
        /* FEED SEGMENT                                                     */
        /* ================================================================ */
        isLoadingUserCommunities || (isLoadingFeed && feedPosts.length === 0) ? (
          <View style={[styles.loadingContainer, { paddingTop: toolbarHeight }]}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          </View>
        ) : joinedCommunityIds.length === 0 ? (
          <FeedEmptyState onBrowseCommunities={handleBrowseCommunities} />
        ) : (
          <FlatList
            data={feedPosts}
            renderItem={renderFeedItem}
            keyExtractor={feedKeyExtractor}
            ItemSeparatorComponent={itemSeparator}
            contentContainerStyle={[styles.feedContent, { paddingTop: toolbarHeight }]}
            showsVerticalScrollIndicator={false}
            onScroll={handleToolbarScroll}
            scrollEventThrottle={16}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={handleRefresh}
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
        /* COMMUNITIES SEGMENT                                              */
        /* ================================================================ */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onScroll={handleToolbarScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={handleRefresh}
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
              value={searchQuery}
              onChangeText={setSearchQuery}
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
        title="Discuss"
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
            filled
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
      </TabScreenToolbar>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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

  // Active filter hint
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

  // Feed
  feedContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
  },

  // Communities scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: IOS_SPACING.lg,
    alignItems: 'center',
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
  separator: {
    height: 12,
  },
  listSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg + 44 + IOS_SPACING.md, // icon + margin
  },
  communityCardWrapper: {
    marginBottom: 8,
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
