/**
 * Post Create Route
 *
 * Standalone post creation screen (for deep linking).
 * When venueId is provided, opens PostComposer directly.
 * Otherwise, shows a venue picker with search so the user can choose where to post.
 * Saved venues appear first, then venues grouped by country.
 * Search also matches yacht club names via ClubDiscoveryService.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash/debounce';
import { PostComposer } from '@/components/venue/post/PostComposer';
import { useSavedVenues } from '@/hooks/useSavedVenues';
import { useVenueDirectory } from '@/hooks/useVenueDirectory';
import { ClubDiscoveryService } from '@/services/ClubDiscoveryService';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
} from '@/lib/design-tokens-ios';

type VenueItem = {
  id: string;
  name: string;
  country?: string | null;
  region?: string | null;
  venue_type?: string | null;
  matchedClubName?: string | null;
};

export default function PostCreateRoute() {
  const { venueId: paramVenueId, racingAreaId, catalogRaceId, catalogRaceName } = useLocalSearchParams<{
    venueId: string;
    racingAreaId?: string;
    catalogRaceId?: string;
    catalogRaceName?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(
    paramVenueId,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [clubMatchedVenues, setClubMatchedVenues] = useState<VenueItem[]>([]);

  // Venue data for picker
  const { savedVenueIds } = useSavedVenues();
  const { allVenues, isLoading } = useVenueDirectory();

  // Debounced club search
  const debouncedClubSearch = useRef(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setClubMatchedVenues([]);
        return;
      }
      try {
        const clubs = await ClubDiscoveryService.searchYachtClubs(q, 10);
        const results: VenueItem[] = [];
        for (const club of clubs) {
          if (club.sailing_venues) {
            results.push({
              id: club.sailing_venues.id,
              name: club.sailing_venues.name,
              country: club.sailing_venues.country ?? null,
              region: club.sailing_venues.region ?? null,
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

  // Build sections: browse mode vs search mode
  const sections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const isSearching = q.length > 0;

    const matchesQuery = (v: VenueItem) => {
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        (v.country && v.country !== 'Unknown' && v.country.toLowerCase().includes(q)) ||
        (v.region && v.region !== 'Unknown' && v.region.toLowerCase().includes(q))
      );
    };

    const result: { title: string; data: VenueItem[] }[] = [];

    if (isSearching) {
      // --- Search mode ---
      const savedMatches = allVenues.filter(
        (v) => savedVenueIds.has(v.id) && matchesQuery(v),
      );
      if (savedMatches.length > 0) {
        result.push({ title: 'MY VENUES', data: savedMatches });
      }

      // Direct venue name matches (non-saved)
      const directMatches = allVenues.filter(
        (v) => !savedVenueIds.has(v.id) && matchesQuery(v),
      );
      const directIdSet = new Set(directMatches.map((v) => v.id));
      // Also include saved IDs so we don't duplicate
      const allMatchedIds = new Set([
        ...directIdSet,
        ...savedMatches.map((v) => v.id),
      ]);

      // Add club-matched venues not already in direct results
      const clubExtras = clubMatchedVenues.filter(
        (v) => !allMatchedIds.has(v.id),
      );

      const searchResults: VenueItem[] = [
        ...directMatches,
        ...clubExtras,
      ];
      if (searchResults.length > 0) {
        result.push({ title: 'SEARCH RESULTS', data: searchResults });
      }
    } else {
      // --- Browse mode: saved + country-grouped ---
      const saved = allVenues.filter((v) => savedVenueIds.has(v.id));
      if (saved.length > 0) {
        result.push({ title: 'MY VENUES', data: saved });
      }

      const others = allVenues.filter((v) => !savedVenueIds.has(v.id));
      const countryMap = new Map<string, VenueItem[]>();
      for (const v of others) {
        const key =
          v.country && v.country !== 'Unknown' ? v.country : '__other__';
        if (!countryMap.has(key)) countryMap.set(key, []);
        countryMap.get(key)!.push(v);
      }

      // Sort country keys alphabetically, "Other" last
      const sortedKeys = Array.from(countryMap.keys()).sort((a, b) => {
        if (a === '__other__') return 1;
        if (b === '__other__') return -1;
        return a.localeCompare(b);
      });

      for (const key of sortedKeys) {
        const venues = countryMap.get(key)!;
        venues.sort((a, b) => a.name.localeCompare(b.name));
        result.push({
          title: key === '__other__' ? 'OTHER' : key.toUpperCase(),
          data: venues,
        });
      }
    }

    return result;
  }, [allVenues, savedVenueIds, searchQuery, clubMatchedVenues]);

  const handleDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const handleSuccess = useCallback(() => {
    router.replace('/(tabs)/venue');
  }, [router]);

  const handleSuggestVenue = useCallback(async () => {
    const url = 'mailto:support@regattaflow.com?subject=Venue%20Suggestion';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        'No Mail App',
        'Please email support@regattaflow.com with your venue suggestion.',
      );
    }
  }, []);

  // If we have a venue selected, show the composer
  if (selectedVenueId) {
    return (
      <View style={styles.container}>
        <PostComposer
          visible={true}
          venueId={selectedVenueId}
          racingAreaId={racingAreaId}
          catalogRaceId={catalogRaceId}
          catalogRaceName={catalogRaceName}
          onDismiss={handleDismiss}
          onSuccess={handleSuccess}
        />
      </View>
    );
  }

  const hasResults = sections.some((s) => s.data.length > 0);

  // Otherwise show venue picker
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleDismiss} hitSlop={8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Choose Venue</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search bar */}
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
          autoFocus
        />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      ) : !hasResults ? (
        <View style={styles.empty}>
          <Ionicons
            name="location-outline"
            size={48}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() ? 'No venues found' : 'No venues available'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? 'Try a different search term'
              : 'Venues will appear here once added to the platform'}
          </Text>
          {/* Suggest venue CTA in empty state */}
          <Pressable style={styles.suggestButton} onPress={handleSuggestVenue}>
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={IOS_COLORS.systemBlue}
            />
            <View>
              <Text style={styles.suggestTitle}>Can't find your venue?</Text>
              <Text style={styles.suggestSubtitle}>
                Suggest it and we'll add it
              </Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) =>
            item.matchedClubName
              ? `${item.id}-club-${index}`
              : item.id
          }
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionTitle}>{title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              style={styles.venueRow}
              onPress={() => setSelectedVenueId(item.id)}
            >
              <View style={styles.venueInfo}>
                <Text style={styles.venueName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.matchedClubName ? (
                  <Text style={styles.venueClubMatch} numberOfLines={1}>
                    via {item.matchedClubName}
                  </Text>
                ) : (
                  item.country &&
                  item.country !== 'Unknown' && (
                    <Text style={styles.venueLocation} numberOfLines={1}>
                      {[item.region, item.country]
                        .filter((s) => s && s !== 'Unknown')
                        .join(', ')}
                    </Text>
                  )
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={IOS_COLORS.tertiaryLabel}
              />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderSectionFooter={() => <View style={styles.sectionFooter} />}
          ListFooterComponent={() => (
            <Pressable
              style={styles.listFooter}
              onPress={handleSuggestVenue}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={IOS_COLORS.systemBlue}
              />
              <View>
                <Text style={styles.suggestTitle}>
                  Can't find your venue?
                </Text>
                <Text style={styles.suggestSubtitle}>
                  Suggest it and we'll add it
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
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
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  cancelText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  headerSpacer: {
    width: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.md,
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.sm,
  },
  sectionFooter: {
    height: IOS_SPACING.xs,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    padding: 32,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.md,
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
  },
  venueInfo: {
    flex: 1,
    gap: 2,
  },
  venueName: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
  },
  venueLocation: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  venueClubMatch: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.systemBlue,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: IOS_SPACING.lg,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.xl,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginTop: IOS_SPACING.lg,
  },
  suggestTitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  suggestSubtitle: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
});
