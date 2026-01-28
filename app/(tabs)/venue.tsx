/**
 * Venue Directory - Reddit-style Venue Browser
 *
 * Landing page for the Venues tab. Shows two sections:
 * - My Venues: venues the user has joined (saved)
 * - Discover Venues: search-driven venue browser (limited, filterable)
 *
 * Tapping a venue pushes to /venue/[id] detail screen.
 */

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { VenueDirectoryCard } from '@/components/venue/VenueDirectoryCard';
import { useVenueDirectory } from '@/hooks/useVenueDirectory';
import { useSavedVenues } from '@/hooks/useSavedVenues';
import { useVenueActivityStats } from '@/hooks/useVenueActivityStats';
import { useGlobalSearch } from '@/providers/GlobalSearchProvider';

const DISCOVER_LIMIT = 25;

export default function VenueDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openGlobalSearch } = useGlobalSearch();

  const { allVenues, isLoading, refetch } = useVenueDirectory();
  const { savedVenueIds, saveVenue, unsaveVenue, refreshSavedVenues } =
    useSavedVenues();
  const { stats: activityStats } = useVenueActivityStats();

  // Refresh saved venues whenever this tab regains focus (e.g. after
  // joining a venue on the detail screen and navigating back).
  useFocusEffect(
    useCallback(() => {
      refreshSavedVenues();
    }, [refreshSavedVenues]),
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Split venues into My Venues and Discover
  const { myVenues, discoverVenues } = useMemo(() => {
    const my = allVenues.filter((v) => savedVenueIds.has(v.id));
    const discover = allVenues.filter((v) => !savedVenueIds.has(v.id));
    return { myVenues: my, discoverVenues: discover };
  }, [allVenues, savedVenueIds]);

  // Filter discover venues by search query.
  // When searching, search ALL venues (including joined) so users can always
  // find any venue. When not searching, only show non-joined venues.
  const filteredDiscover = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return discoverVenues.slice(0, DISCOVER_LIMIT);
    return allVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.country && v.country !== 'Unknown' && v.country.toLowerCase().includes(q)) ||
        (v.region && v.region !== 'Unknown' && v.region.toLowerCase().includes(q)),
    );
  }, [allVenues, discoverVenues, searchQuery]);

  const totalDiscover = discoverVenues.length;
  const isFiltering = searchQuery.trim().length > 0;

  const handleVenuePress = useCallback(
    (venueId: string) => {
      router.push(`/venue/${venueId}`);
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

  return (
    <View style={styles.container}>
      <TabScreenToolbar
        title="Local"
        topInset={insets.top}
        onGlobalSearch={openGlobalSearch}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
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
              <Text style={styles.sectionTitle}>MY WATERS</Text>
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
                placeholder="Search venues..."
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
                        country={venue.country}
                        region={venue.region}
                        venueType={venue.venue_type}
                        isJoined={savedVenueIds.has(venue.id)}
                        onPress={() => handleVenuePress(venue.id)}
                        onJoinToggle={() => handleJoinToggle(venue.id)}
                        postCount={activityStats.get(venue.id)?.postCount}
                        lastActiveAt={activityStats.get(venue.id)?.lastActiveAt}
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
      )}
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
