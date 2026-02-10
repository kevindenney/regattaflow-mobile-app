/**
 * CommunitiesBrowser
 *
 * Self-contained component for the Watch tab's Communities segment.
 * Shows joined communities, discover popular communities, type-based
 * filtering, and search.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';
import {
  useUserCommunities,
  usePopularCommunities,
  useCommunitiesByType,
  useCommunitySearch,
  useToggleCommunityMembership,
} from '@/hooks/useCommunities';
import { CommunityCard, CommunityCardCompact } from '@/components/community/CommunityCard';
import { COMMUNITY_TYPE_CONFIG } from '@/types/community';
import type { Community, CommunityType } from '@/types/community';

// =============================================================================
// TYPES
// =============================================================================

interface CommunitiesBrowserProps {
  toolbarOffset: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  searchQuery: string;
}

type TypeFilter = 'all' | CommunityType;

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'boat_class', label: 'Boat Class' },
  { key: 'venue', label: 'Venue' },
  { key: 'tactics', label: 'Tactics' },
  { key: 'rules', label: 'Rules' },
  { key: 'tuning', label: 'Tuning' },
  { key: 'sailmaker', label: 'Sailmaker' },
  { key: 'gear', label: 'Gear' },
];

// =============================================================================
// TYPE FILTER TABS
// =============================================================================

function TypeFilterTabs({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: TypeFilter;
  onFilterChange: (filter: TypeFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={filterStyles.container}
    >
      {TYPE_FILTERS.map((filter) => (
        <Pressable
          key={filter.key}
          style={[
            filterStyles.tab,
            activeFilter === filter.key && filterStyles.tabActive,
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onFilterChange(filter.key);
          }}
        >
          <Text
            style={[
              filterStyles.tabText,
              activeFilter === filter.key && filterStyles.tabTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconCircle}>
        <Ionicons name="chatbubbles-outline" size={48} color={IOS_COLORS.systemBlue} />
      </View>
      <Text style={emptyStyles.title}>No Communities Yet</Text>
      <Text style={emptyStyles.subtitle}>
        Join communities to discuss boat classes, venues, tactics, gear, and more with fellow sailors.
      </Text>
      <Pressable style={emptyStyles.browseButton} onPress={onBrowse}>
        <Text style={emptyStyles.browseButtonText}>Browse Communities</Text>
      </Pressable>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CommunitiesBrowser({
  toolbarOffset,
  onScroll,
  searchQuery,
}: CommunitiesBrowserProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hooks
  const {
    data: userCommunities,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useUserCommunities();
  const {
    data: popularCommunities,
    isLoading: popularLoading,
    refetch: refetchPopular,
  } = usePopularCommunities(15);
  const {
    data: typeCommunities,
    isLoading: typeLoading,
  } = useCommunitiesByType(typeFilter !== 'all' ? (typeFilter as CommunityType) : undefined);
  const isSearchMode = searchQuery.length >= 2;
  const {
    data: searchResults,
    isLoading: searchLoading,
  } = useCommunitySearch(
    searchQuery,
    typeFilter !== 'all' ? { community_type: typeFilter as CommunityType } : undefined,
    isSearchMode,
  );

  const { mutate: toggleMembership, isPending: membershipPending } =
    useToggleCommunityMembership();

  // Joined communities list
  const joinedCommunities = useMemo(() => {
    if (!userCommunities) return [];
    return userCommunities.joined ?? [];
  }, [userCommunities]);

  // Discover list (type-filtered or popular)
  const discoverCommunities = useMemo(() => {
    if (isSearchMode) return searchResults ?? [];
    if (typeFilter !== 'all') return typeCommunities ?? [];
    return popularCommunities ?? [];
  }, [isSearchMode, searchResults, typeFilter, typeCommunities, popularCommunities]);

  const isLoading = userLoading && popularLoading;
  const isDiscoverLoading = isSearchMode ? searchLoading : typeFilter !== 'all' ? typeLoading : popularLoading;

  // Handlers
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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchUser(), refetchPopular()]);
    setIsRefreshing(false);
  }, [refetchUser, refetchPopular]);

  const scrollToDiscover = useCallback(() => {
    // Just reset filter to "all" so the discover section is visible
    setTypeFilter('all');
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderCommunityRow = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityCard
        community={item}
        onPress={() => handleCommunityPress(item)}
        onJoinToggle={() => handleJoinToggle(item)}
        isJoinPending={membershipPending}
      />
    ),
    [handleCommunityPress, handleJoinToggle, membershipPending],
  );

  const keyExtractor = useCallback((item: Community) => item.id, []);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: toolbarOffset }]}>
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
      </View>
    );
  }

  // Search mode — flat list of search results
  if (isSearchMode) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: toolbarOffset }}>
          <TypeFilterTabs activeFilter={typeFilter} onFilterChange={setTypeFilter} />
        </View>
        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
          </View>
        ) : discoverCommunities.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No communities found</Text>
          </View>
        ) : (
          <FlatList
            data={discoverCommunities}
            renderItem={renderCommunityRow}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          />
        )}
      </View>
    );
  }

  // Browse mode — your communities + discover
  const ListHeader = (
    <>
      {/* Your Communities */}
      {joinedCommunities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Communities</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {joinedCommunities.map((community) => (
              <CommunityCardCompact
                key={community.id}
                community={community}
                onPress={() => handleCommunityPress(community)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Type filters */}
      <TypeFilterTabs activeFilter={typeFilter} onFilterChange={setTypeFilter} />

      {/* Discover header */}
      <View style={styles.discoverHeader}>
        <Text style={styles.sectionTitle}>
          {typeFilter !== 'all'
            ? COMMUNITY_TYPE_CONFIG[typeFilter as CommunityType]?.pluralLabel ?? 'Communities'
            : 'Discover'}
        </Text>
      </View>
    </>
  );

  // Empty state when nothing joined and no popular
  if (joinedCommunities.length === 0 && discoverCommunities.length === 0 && !isDiscoverLoading) {
    return (
      <View style={{ flex: 1, paddingTop: toolbarOffset }}>
        <EmptyState onBrowse={scrollToDiscover} />
      </View>
    );
  }

  return (
    <FlatList
      data={discoverCommunities}
      renderItem={renderCommunityRow}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        isDiscoverLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
          </View>
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No communities in this category yet</Text>
          </View>
        )
      }
      contentContainerStyle={[styles.listContent, { paddingTop: toolbarOffset }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
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

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  section: {
    paddingTop: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.sm,
  },
  sectionTitle: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  horizontalList: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: 0,
  },
  discoverHeader: {
    paddingTop: IOS_SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
  },
});

const filterStyles = StyleSheet.create({
  container: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    gap: IOS_SPACING.sm,
  },
  tab: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.xs,
    borderRadius: IOS_RADIUS.lg,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
  },
  tabActive: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  tabText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

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
    backgroundColor: IOS_COLORS.systemBlue + '15',
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
    marginBottom: IOS_SPACING.lg,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.full,
  },
  browseButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default CommunitiesBrowser;
