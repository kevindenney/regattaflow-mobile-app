/**
 * Discuss Tab — Feed-First with Segmented Control
 *
 * Aggregated discussion feed from all followed venues.
 * Two segments: "Feed" (discussion posts) and "My Venues" (venue directory).
 * Apple HIG design: iOS Inset Grouped List, system typography & colors.
 */

import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { TabScreenToolbar, ToolbarAction } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { FeedPostCard } from '@/components/venue/feed/FeedPostCard';
import { VenueDirectoryCard } from '@/components/venue/VenueDirectoryCard';
import { useVenueDirectory } from '@/hooks/useVenueDirectory';
import { ClubDiscoveryService } from '@/services/ClubDiscoveryService';
import { useSavedVenues } from '@/hooks/useSavedVenues';
import { useVenueActivityStats } from '@/hooks/useVenueActivityStats';
import { useUserPosts } from '@/hooks/useCommunityFeed';
import { MOCK_DISCUSSION_FEED } from '@/data/mockDiscussionFeed';
import { useAuth } from '@/providers/AuthProvider';
import type { FeedPost, FeedSortType, PostType } from '@/types/community-feed';
import { POST_TYPE_CONFIG } from '@/types/community-feed';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISCOVER_LIMIT = 25;

type SegmentValue = 'feed' | 'my-posts' | 'my-waters';

const SEGMENTS: { value: SegmentValue; label: string }[] = [
  { value: 'feed', label: 'Feed' },
  { value: 'my-posts', label: 'My Posts' },
  { value: 'my-waters', label: 'My Venues' },
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
// Feed Sort/Filter Header
// ---------------------------------------------------------------------------

function FeedFilterBar({
  sort,
  onSortChange,
  selectedPostType,
  onPostTypeChange,
}: {
  sort: FeedSortType;
  onSortChange: (s: FeedSortType) => void;
  selectedPostType: PostType | undefined;
  onPostTypeChange: (t: PostType | undefined) => void;
}) {
  return (
    <View style={filterStyles.container}>
      {/* Sort pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.pillRow}
      >
        {SORT_OPTIONS.map((opt) => {
          const isSelected = sort === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[
                filterStyles.pill,
                isSelected && filterStyles.pillSelected,
              ]}
              onPress={() => {
                triggerHaptic('selection');
                onSortChange(opt.key);
              }}
            >
              <Text
                style={[
                  filterStyles.pillText,
                  isSelected && filterStyles.pillTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Post type pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.pillRow}
      >
        {POST_TYPE_FILTERS.map((type) => {
          const isAll = type === 'all';
          const isSelected = isAll ? !selectedPostType : selectedPostType === type;
          const config = isAll ? null : POST_TYPE_CONFIG[type as PostType];

          return (
            <Pressable
              key={type}
              style={[
                filterStyles.pill,
                filterStyles.pillOutline,
                isSelected && filterStyles.pillOutlineSelected,
              ]}
              onPress={() => {
                triggerHaptic('selection');
                onPostTypeChange(isAll ? undefined : (type as PostType));
              }}
            >
              {config && (
                <Ionicons
                  name={config.icon as any}
                  size={12}
                  color={isSelected ? config.color : IOS_COLORS.tertiaryLabel}
                />
              )}
              <Text
                style={[
                  filterStyles.pillOutlineText,
                  isSelected && {
                    color: isAll ? IOS_COLORS.systemBlue : config?.color,
                    fontWeight: '600',
                  },
                ]}
              >
                {isAll ? 'All' : config?.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const filterStyles = StyleSheet.create({
  container: {
    gap: IOS_SPACING.xs,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  pillRow: {
    flexDirection: 'row',
    gap: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 6,
    borderRadius: IOS_RADIUS.full,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  pillSelected: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  pillText: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pillOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: IOS_COLORS.tertiarySystemFill,
  },
  pillOutlineSelected: {
    borderColor: IOS_COLORS.systemBlue,
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  pillOutlineText: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
  },
});

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function FeedEmptyState({ onBrowseVenues }: { onBrowseVenues: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons
        name="chatbubbles-outline"
        size={48}
        color={IOS_COLORS.systemGray3}
      />
      <Text style={emptyStyles.title}>Join your waters</Text>
      <Text style={emptyStyles.subtitle}>
        Follow venues to see discussions from your sailing community
      </Text>
      <Pressable style={emptyStyles.button} onPress={onBrowseVenues}>
        <Text style={emptyStyles.buttonText}>Browse Venues</Text>
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
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();

  // Segment
  const [segment, setSegment] = useState<SegmentValue>('feed');

  // Feed state
  const [feedSort, setFeedSort] = useState<FeedSortType>('hot');
  const [feedPostType, setFeedPostType] = useState<PostType | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(true);
  const filtersActive = feedSort !== 'hot' || feedPostType !== undefined;

  // Venue directory state
  const { allVenues, isLoading, refetch } = useVenueDirectory();
  const { savedVenueIds, saveVenue, unsaveVenue, refreshSavedVenues } =
    useSavedVenues();
  const { stats: activityStats } = useVenueActivityStats();
  const [searchQuery, setSearchQuery] = useState('');
  const [clubMatchedVenues, setClubMatchedVenues] = useState<
    { id: string; name: string; country?: string; region?: string; matchedClubName: string }[]
  >([]);

  // Debounced club search for Discover
  const debouncedClubSearch = useRef(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setClubMatchedVenues([]);
        return;
      }
      try {
        const clubs = await ClubDiscoveryService.searchYachtClubs(q, 10);
        const results: typeof clubMatchedVenues = [];
        for (const club of clubs) {
          if (club.sailing_venues) {
            results.push({
              id: club.sailing_venues.id,
              name: club.sailing_venues.name,
              country: club.sailing_venues.country,
              region: club.sailing_venues.region,
              matchedClubName: club.name,
            });
          }
        }
        setClubMatchedVenues(results);
      } catch {
        setClubMatchedVenues([]);
      }
    }, 300),
  ).current;

  useEffect(() => {
    debouncedClubSearch(searchQuery.trim());
    return () => debouncedClubSearch.cancel();
  }, [searchQuery, debouncedClubSearch]);

  // Refresh saved venues on focus
  useFocusEffect(
    useCallback(() => {
      refreshSavedVenues();
    }, [refreshSavedVenues]),
  );

  // ---------------------------------------------------------------------------
  // Feed data (mock for now, will integrate with useAggregatedFeed)
  // ---------------------------------------------------------------------------

  const feedPosts = useMemo(() => {
    let posts = [...MOCK_DISCUSSION_FEED];

    // Filter by post type
    if (feedPostType) {
      posts = posts.filter((p) => p.post_type === feedPostType);
    }

    // Sort
    switch (feedSort) {
      case 'new':
        posts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case 'top':
        posts.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'rising':
        posts = posts.filter((p) => {
          const age = Date.now() - new Date(p.created_at).getTime();
          return age < 48 * 60 * 60 * 1000; // last 48h
        });
        posts.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'hot':
      default:
        // Pinned first, then by engagement-weighted recency
        posts.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          const scoreA =
            ((a.upvotes || 0) * 2 + (a.comment_count || 0) * 3) /
            Math.pow(
              (Date.now() - new Date(a.created_at).getTime()) / 3600000 + 2,
              1.5,
            );
          const scoreB =
            ((b.upvotes || 0) * 2 + (b.comment_count || 0) * 3) /
            Math.pow(
              (Date.now() - new Date(b.created_at).getTime()) / 3600000 + 2,
              1.5,
            );
          return scoreB - scoreA;
        });
        break;
    }

    return posts;
  }, [feedSort, feedPostType]);

  // ---------------------------------------------------------------------------
  // My Posts data (live from Supabase)
  // ---------------------------------------------------------------------------

  const {
    data: myPostsData,
    fetchNextPage: fetchNextMyPosts,
    hasNextPage: hasMoreMyPosts,
    isFetchingNextPage: isFetchingMoreMyPosts,
    refetch: refetchMyPosts,
    isLoading: isLoadingMyPosts,
  } = useUserPosts(user?.id);

  const myPosts = useMemo<FeedPost[]>(() => {
    if (!myPostsData?.pages) return [];
    return myPostsData.pages.flatMap((page) => page.data);
  }, [myPostsData]);

  // ---------------------------------------------------------------------------
  // Venue directory data
  // ---------------------------------------------------------------------------

  const { myVenues, discoverVenues } = useMemo(() => {
    const my = allVenues.filter((v) => savedVenueIds.has(v.id));
    const discover = allVenues.filter((v) => !savedVenueIds.has(v.id));
    return { myVenues: my, discoverVenues: discover };
  }, [allVenues, savedVenueIds]);

  const filteredDiscover = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return discoverVenues.slice(0, DISCOVER_LIMIT).map((v) => ({ ...v, matchedClubName: undefined as string | undefined }));
    const directMatches = allVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.country && v.country !== 'Unknown' && v.country.toLowerCase().includes(q)) ||
        (v.region && v.region !== 'Unknown' && v.region.toLowerCase().includes(q)),
    ).map((v) => ({ ...v, matchedClubName: undefined as string | undefined }));
    const directIds = new Set(directMatches.map((v) => v.id));
    const clubExtras = clubMatchedVenues
      .filter((v) => !directIds.has(v.id))
      .map((v) => ({
        ...v,
        venue_type: undefined as string | undefined,
        matchedClubName: v.matchedClubName as string | undefined,
      }));
    return [...directMatches, ...clubExtras];
  }, [allVenues, discoverVenues, searchQuery, clubMatchedVenues]);

  const totalDiscover = discoverVenues.length;
  const isFiltering = searchQuery.trim().length > 0;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleVenuePress = useCallback(
    (venueId: string) => {
      router.push(`/venue/${venueId}`);
    },
    [router],
  );

  const handlePostPress = useCallback(
    (post: FeedPost) => {
      router.push(`/venue/post/${post.id}`);
    },
    [router],
  );

  const handleJoinToggle = useCallback(
    async (venueId: string) => {
      try {
        if (savedVenueIds.has(venueId)) {
          await unsaveVenue(venueId);
        } else {
          await saveVenue(venueId);
        }
        refreshSavedVenues();
      } catch {
        // silent
      }
    },
    [savedVenueIds, saveVenue, unsaveVenue, refreshSavedVenues],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refreshSavedVenues()]);
  }, [refetch, refreshSavedVenues]);

  const handleBrowseVenues = useCallback(() => {
    triggerHaptic('selection');
    setSegment('my-waters');
  }, []);

  // ---------------------------------------------------------------------------
  // Toolbar actions (compose + filter) – only on Feed segment
  // ---------------------------------------------------------------------------

  const toolbarActions = useMemo<ToolbarAction[] | undefined>(() => {
    if (segment === 'my-waters') return undefined;

    const actions: ToolbarAction[] = [
      {
        icon: 'add-circle-outline',
        label: 'New post',
        onPress: () => router.push('/venue/post/create'),
      },
    ];

    if (segment === 'feed') {
      actions.push({
        icon: 'funnel-outline',
        label: 'Toggle filters',
        onPress: () => setShowFilters((prev) => !prev),
        isActive: showFilters || filtersActive,
      });
    }

    return actions;
  }, [segment, showFilters, filtersActive, router]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderFeedItem = useCallback(
    ({ item }: { item: FeedPost }) => (
      <FeedPostCard
        post={item}
        showVenueName
        onPress={() => handlePostPress(item)}
        onVenuePress={handleVenuePress}
      />
    ),
    [handlePostPress, handleVenuePress],
  );

  const feedKeyExtractor = useCallback((item: FeedPost) => item.id, []);

  const feedItemSeparator = useCallback(
    () => <View style={{ height: IOS_SPACING.md }} />,
    [],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Feed list header: includes FeedFilterBar when filters are shown
  const feedListHeader = useMemo(() => {
    if (!showFilters || (feedPosts.length === 0 && !feedPostType)) return null;
    return (
      <FeedFilterBar
        sort={feedSort}
        onSortChange={setFeedSort}
        selectedPostType={feedPostType}
        onPostTypeChange={setFeedPostType}
      />
    );
  }, [showFilters, feedPosts.length, feedPostType, feedSort, setFeedSort, setFeedPostType]);

  return (
    <View style={styles.container}>
      {/* Scroll content first — flows behind absolutely-positioned toolbar */}
      {segment === 'feed' ? (
        /* ================================================================ */
        /* FEED SEGMENT                                                     */
        /* ================================================================ */
        feedPosts.length === 0 && !feedPostType ? (
          <FeedEmptyState onBrowseVenues={handleBrowseVenues} />
        ) : (
          <FlatList
            data={feedPosts}
            renderItem={renderFeedItem}
            keyExtractor={feedKeyExtractor}
            ItemSeparatorComponent={feedItemSeparator}
            contentContainerStyle={[styles.feedContent, { paddingTop: toolbarHeight }]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={feedListHeader}
            onScroll={handleToolbarScroll}
            scrollEventThrottle={16}
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
                  No posts match this filter
                </Text>
              </View>
            }
          />
        )
      ) : segment === 'my-posts' ? (
        /* ================================================================ */
        /* MY POSTS SEGMENT                                                 */
        /* ================================================================ */
        isLoadingMyPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          </View>
        ) : (
          <FlatList
            data={myPosts}
            renderItem={renderFeedItem}
            keyExtractor={feedKeyExtractor}
            ItemSeparatorComponent={feedItemSeparator}
            contentContainerStyle={[styles.feedContent, { paddingTop: toolbarHeight }]}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasMoreMyPosts && !isFetchingMoreMyPosts) {
                fetchNextMyPosts();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => refetchMyPosts()}
                tintColor={IOS_COLORS.systemBlue}
              />
            }
            ListEmptyComponent={
              <View style={emptyStyles.container}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color={IOS_COLORS.systemGray3}
                />
                <Text style={emptyStyles.title}>No posts yet</Text>
                <Text style={emptyStyles.subtitle}>
                  Tap + to share your knowledge with the sailing community
                </Text>
              </View>
            }
          />
        )
      ) : segment === 'my-waters' ? (
        /* ================================================================ */
        /* MY WATERS SEGMENT                                                */
        /* ================================================================ */
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
          </View>
        ) : (
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
            {/* My Venues */}
            {myVenues.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MY VENUES</Text>
                <View style={styles.cardList}>
                  {myVenues.map((venue, index) => (
                    <View key={venue.id}>
                      {index > 0 && <View style={styles.separator} />}
                      <VenueDirectoryCard
                        id={venue.id}
                        name={venue.name}
                        country={venue.country}
                        region={venue.region}
                        venueType={venue.venue_type}
                        isJoined={true}
                        onPress={() => handleVenuePress(venue.id)}
                        onJoinToggle={() => handleJoinToggle(venue.id)}
                        postCount={activityStats.get(venue.id)?.postCount}
                        lastActiveAt={activityStats.get(venue.id)?.lastActiveAt}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Discover Venues */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DISCOVER</Text>

              {/* Inline search bar */}
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={16}
                  color={IOS_COLORS.tertiaryLabel}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search venues or clubs..."
                  placeholderTextColor={IOS_COLORS.tertiaryLabel}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  returnKeyType="search"
                />
              </View>

              {filteredDiscover.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    {isFiltering
                      ? 'No venues match your search'
                      : 'No venues available'}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.cardList}>
                    {filteredDiscover.map((venue, index) => (
                      <View key={venue.id}>
                        {index > 0 && <View style={styles.separator} />}
                        <VenueDirectoryCard
                          id={venue.id}
                          name={venue.name}
                          country={venue.country ?? 'Unknown'}
                          region={venue.region ?? 'Unknown'}
                          venueType={venue.venue_type ?? 'Unknown'}
                          isJoined={savedVenueIds.has(venue.id)}
                          onPress={() => handleVenuePress(venue.id)}
                          onJoinToggle={() => handleJoinToggle(venue.id)}
                          postCount={activityStats.get(venue.id)?.postCount}
                          lastActiveAt={activityStats.get(venue.id)?.lastActiveAt}
                          matchedClubName={venue.matchedClubName}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Count hint when showing partial list */}
                  {!isFiltering && totalDiscover > DISCOVER_LIMIT && (
                    <Text style={styles.countHint}>
                      Showing {DISCOVER_LIMIT} of {totalDiscover} venues —
                      search to find more
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Empty state when no venues at all */}
            {allVenues.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Venues Available</Text>
                <Text style={styles.emptySubtitle}>
                  Venues will appear here once they are added to the platform.
                </Text>
              </View>
            )}
          </ScrollView>
        )
      ) : null}

      {/* Toolbar rendered last — absolutely positioned over content */}
      <TabScreenToolbar
        title="Discuss"
        topInset={insets.top}
        actions={toolbarActions}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
      >
        <View style={styles.segmentContainer}>
          <IOSSegmentedControl
            segments={SEGMENTS}
            selectedValue={segment}
            onValueChange={setSegment}
            filled
          />
        </View>
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

  // Segment control
  segmentContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
  },

  // Feed
  feedContent: {
    paddingBottom: 120,
  },
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.tertiaryLabel,
  },

  // My Waters (venue directory)
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.md,
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

  // Count hint
  countHint: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
    marginTop: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
  },

  // Empty states
  emptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: IOS_COLORS.tertiaryLabel,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
});
