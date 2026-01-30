/**
 * Catalog Race Directory
 *
 * Browse and search the catalog of major regattas worldwide.
 * Features:
 * - Search by name
 * - Filter by race type and level
 * - Follow/unfollow races
 * - Navigate to race detail
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_TYPOGRAPHY,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import {
  useCatalogRaces,
  useSavedCatalogRaces,
} from '@/hooks/useCatalogRaces';
import { CatalogRaceDirectoryCard } from '@/components/races/CatalogRaceDirectoryCard';
import type { CatalogRace, CatalogRaceType, RaceLevel } from '@/types/catalog-race';
import { RACE_TYPE_CONFIG, RACE_LEVEL_CONFIG } from '@/types/catalog-race';

// =============================================================================
// FILTER CHIP COMPONENT
// =============================================================================

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function FilterChip({ label, isSelected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      style={[styles.filterChip, isSelected && styles.filterChipSelected]}
    >
      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

export default function CatalogRaceDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Data
  const { data: races, isLoading, error, refetch, isRefetching } = useCatalogRaces();
  const {
    followedRaceIds,
    followRace,
    unfollowRace,
    isRaceFollowed,
  } = useSavedCatalogRaces();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<CatalogRaceType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<RaceLevel | null>(null);

  // Filter races
  const filteredRaces = useMemo(() => {
    if (!races) return [];

    let result = [...races];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (race) =>
          race.name.toLowerCase().includes(query) ||
          race.short_name?.toLowerCase().includes(query) ||
          race.organizing_authority?.toLowerCase().includes(query) ||
          race.country?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType) {
      result = result.filter((race) => race.race_type === selectedType);
    }

    // Level filter
    if (selectedLevel) {
      result = result.filter((race) => race.level === selectedLevel);
    }

    // Sort: featured first, then by follower count
    result.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return b.follower_count - a.follower_count;
    });

    return result;
  }, [races, searchQuery, selectedType, selectedLevel]);

  // Handlers
  const handleRacePress = useCallback((race: CatalogRace) => {
    router.push(`/catalog-race/${race.slug}`);
  }, [router]);

  const handleFollowToggle = useCallback(async (race: CatalogRace) => {
    triggerHaptic('impactLight');
    if (isRaceFollowed(race.id)) {
      await unfollowRace(race.id);
    } else {
      await followRace(race.id);
    }
  }, [isRaceFollowed, followRace, unfollowRace]);

  const handleTypeFilter = useCallback((type: CatalogRaceType) => {
    setSelectedType((prev) => (prev === type ? null : type));
  }, []);

  const handleLevelFilter = useCallback((level: RaceLevel) => {
    setSelectedLevel((prev) => (prev === level ? null : level));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedLevel(null);
  }, []);

  // Render item
  const renderRace = useCallback(({ item }: { item: CatalogRace }) => (
    <CatalogRaceDirectoryCard
      name={item.name}
      country={item.country}
      organizingAuthority={item.organizing_authority}
      raceType={item.race_type}
      level={item.level}
      isFollowed={isRaceFollowed(item.id)}
      onPress={() => handleRacePress(item)}
      onFollowToggle={() => handleFollowToggle(item)}
      discussionCount={item.discussion_count}
      followerCount={item.follower_count}
    />
  ), [isRaceFollowed, handleRacePress, handleFollowToggle]);

  const keyExtractor = useCallback((item: CatalogRace) => item.id, []);

  const hasActiveFilters = searchQuery.trim() || selectedType || selectedLevel;

  // Loading state
  if (isLoading && !races) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Race Catalog' }} />
        <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        <Text style={styles.loadingText}>Loading races...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Race Catalog' }} />
        <Ionicons name="alert-circle-outline" size={48} color={IOS_COLORS.systemRed} />
        <Text style={styles.errorText}>Failed to load races</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Race Catalog',
          headerLargeTitle: true,
          headerSearchBarOptions: undefined, // We use our own search
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={16}
            color={IOS_COLORS.placeholderText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search races..."
            placeholderTextColor={IOS_COLORS.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter Chips - Type */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Type</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.entries(RACE_TYPE_CONFIG)}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.filterChipsContainer}
          renderItem={({ item: [key, config] }) => (
            <FilterChip
              label={config.label}
              isSelected={selectedType === key}
              onPress={() => handleTypeFilter(key as CatalogRaceType)}
            />
          )}
        />
      </View>

      {/* Filter Chips - Level */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Level</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={Object.entries(RACE_LEVEL_CONFIG)}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.filterChipsContainer}
          renderItem={({ item: [key, config] }) => (
            <FilterChip
              label={config.shortLabel}
              isSelected={selectedLevel === key}
              onPress={() => handleLevelFilter(key as RaceLevel)}
            />
          )}
        />
      </View>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
          <Ionicons name="close-circle" size={16} color={IOS_COLORS.systemBlue} />
          <Text style={styles.clearFiltersText}>Clear filters</Text>
        </Pressable>
      )}

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredRaces.length} {filteredRaces.length === 1 ? 'race' : 'races'}
        </Text>
      </View>

      {/* Race List */}
      <FlatList
        data={filteredRaces}
        renderItem={renderRace}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={IOS_COLORS.systemBlue}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="flag-outline"
              size={48}
              color={IOS_COLORS.tertiaryLabel}
            />
            <Text style={styles.emptyTitle}>No races found</Text>
            <Text style={styles.emptySubtitle}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Check back later for new races'}
            </Text>
          </View>
        }
      />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    padding: IOS_SPACING.xl,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.md,
  },
  errorText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.xl,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemBlue,
    borderRadius: IOS_RADIUS.md,
  },
  retryButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.sm,
  },
  searchIcon: {
    marginRight: IOS_SPACING.xs,
  },
  searchInput: {
    flex: 1,
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    paddingVertical: IOS_SPACING.sm,
  },
  filterSection: {
    paddingTop: IOS_SPACING.xs,
  },
  filterLabel: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.xs,
  },
  filterChipsContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: IOS_COLORS.tertiarySystemFill,
    marginRight: IOS_SPACING.xs,
  },
  filterChipSelected: {
    backgroundColor: IOS_COLORS.systemBlue,
  },
  filterChipText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.label,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.sm,
    gap: 4,
  },
  clearFiltersText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
  },
  resultsCount: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  listContent: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IOS_SPACING.xxl,
    paddingHorizontal: IOS_SPACING.xl,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.md,
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.xs,
    textAlign: 'center',
  },
});
