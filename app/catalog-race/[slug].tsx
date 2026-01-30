/**
 * Catalog Race Detail Screen
 *
 * Shows race info, follow button, and discussions tagged with this race.
 * Follows the same iOS Inset Grouped pattern as venue detail.
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  FlatList,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { useCatalogRaceBySlug, useSavedCatalogRaces } from '@/hooks/useCatalogRaces';
import { useRaceFeed } from '@/hooks/useCommunityFeed';
import { FeedPostCard } from '@/components/venue/feed/FeedPostCard';
import type { FeedPost } from '@/types/community-feed';
import {
  RACE_TYPE_CONFIG,
  RACE_LEVEL_CONFIG,
  RACE_RECURRENCE_CONFIG,
  formatRaceLocation,
  formatTypicalMonth,
} from '@/types/catalog-race';

export default function CatalogRaceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: race, isLoading } = useCatalogRaceBySlug(slug || '');
  const {
    followedRaceIds,
    followRace,
    unfollowRace,
  } = useSavedCatalogRaces();

  const isFollowed = race ? followedRaceIds.has(race.id) : false;

  // Discussion feed for this race
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRaceFeed(race?.id);

  const feedPosts = useMemo<FeedPost[]>(() => {
    if (!feedData?.pages) return [];
    return feedData.pages.flatMap((page) => page.data);
  }, [feedData]);

  const handleFollowToggle = useCallback(async () => {
    if (!race) return;
    triggerHaptic('impactLight');
    try {
      if (isFollowed) {
        await unfollowRace(race.id);
      } else {
        await followRace(race.id);
      }
    } catch {
      // silent
    }
  }, [race, isFollowed, followRace, unfollowRace]);

  const handlePostPress = useCallback(
    (post: FeedPost) => {
      router.push(`/venue/${post.venue_id}`);
    },
    [router],
  );

  const handleVenuePress = useCallback(
    (venueId: string) => {
      router.push(`/venue/${venueId}`);
    },
    [router],
  );

  const handleCompose = useCallback(() => {
    if (!race) return;
    router.push({
      pathname: '/venue/post/create',
      params: { catalogRaceId: race.id, catalogRaceName: race.name },
    });
  }, [race, router]);

  const handleOpenWebsite = useCallback(() => {
    if (race?.website_url) {
      Linking.openURL(race.website_url);
    }
  }, [race]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
        </View>
      </View>
    );
  }

  if (!race) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={IOS_COLORS.systemBlue} />
          </Pressable>
          <Text style={styles.headerTitle}>Race Not Found</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>
    );
  }

  const location = formatRaceLocation(race);
  const typeLabel = race.race_type ? RACE_TYPE_CONFIG[race.race_type]?.label : null;
  const levelLabel = race.level ? RACE_LEVEL_CONFIG[race.level]?.label : null;
  const recurrenceLabel = race.recurrence ? RACE_RECURRENCE_CONFIG[race.recurrence]?.label : null;
  const monthLabel = formatTypicalMonth(race.typical_month);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={IOS_COLORS.systemBlue} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{race.short_name || race.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.raceName}>{race.name}</Text>
          {race.organizing_authority && (
            <Text style={styles.authority}>{race.organizing_authority}</Text>
          )}
          {location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{race.follower_count}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{race.discussion_count}</Text>
              <Text style={styles.statLabel}>discussions</Text>
            </View>
          </View>

          {/* Follow Button */}
          <Pressable
            style={[styles.followButton, isFollowed && styles.followedButton]}
            onPress={handleFollowToggle}
          >
            <Ionicons
              name={isFollowed ? 'checkmark' : 'add'}
              size={18}
              color={isFollowed ? IOS_COLORS.secondaryLabel : '#FFFFFF'}
            />
            <Text style={[styles.followButtonText, isFollowed && styles.followedButtonText]}>
              {isFollowed ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        </View>

        {/* Description */}
        {race.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>{race.description}</Text>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>INFO</Text>
          <View style={styles.infoCard}>
            {typeLabel && (
              <InfoRow label="Type" value={typeLabel} />
            )}
            {levelLabel && (
              <InfoRow label="Level" value={levelLabel} />
            )}
            {recurrenceLabel && (
              <InfoRow label="Frequency" value={recurrenceLabel} />
            )}
            {monthLabel && (
              <InfoRow label="Typical Month" value={monthLabel} />
            )}
            {race.typical_duration_days && (
              <InfoRow
                label="Duration"
                value={`${race.typical_duration_days} day${race.typical_duration_days !== 1 ? 's' : ''}`}
              />
            )}
            {race.boat_classes.length > 0 && (
              <InfoRow label="Boat Classes" value={race.boat_classes.join(', ')} />
            )}
            {race.website_url && (
              <Pressable onPress={handleOpenWebsite} style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website</Text>
                <View style={styles.infoValueRow}>
                  <Text style={[styles.infoValue, { color: IOS_COLORS.systemBlue }]} numberOfLines={1}>
                    Visit website
                  </Text>
                  <Ionicons name="open-outline" size={14} color={IOS_COLORS.systemBlue} />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Discussions Section */}
        <View style={styles.discussionsSection}>
          <View style={styles.discussionsHeader}>
            <Text style={styles.sectionTitle}>DISCUSSIONS</Text>
            <Pressable style={styles.composeChip} onPress={handleCompose}>
              <Ionicons name="add-circle-outline" size={14} color={IOS_COLORS.systemBlue} />
              <Text style={styles.composeChipText}>New Post</Text>
            </Pressable>
          </View>

          {feedPosts.length > 0 ? (
            <View style={styles.feedList}>
              {feedPosts.map((post) => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  showVenueName
                  onPress={() => handlePostPress(post)}
                  onVenuePress={handleVenuePress}
                />
              ))}
              {hasNextPage && (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
                  ) : (
                    <Text style={styles.loadMoreText}>Load more</Text>
                  )}
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.emptyDiscussions}>
              <Ionicons
                name="chatbubbles-outline"
                size={36}
                color={IOS_COLORS.systemGray3}
              />
              <Text style={styles.emptyTitle}>No discussions yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to start a discussion about {race.short_name || race.name}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// InfoRow sub-component
// ---------------------------------------------------------------------------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  headerTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: IOS_SPACING.sm,
  },
  headerSpacer: {
    width: 24,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero
  heroSection: {
    padding: IOS_SPACING.xl,
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  raceName: {
    ...IOS_TYPOGRAPHY.title2,
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  authority: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xl,
    marginTop: IOS_SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...IOS_TYPOGRAPHY.title3,
    color: IOS_COLORS.label,
  },
  statLabel: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: IOS_COLORS.separator,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IOS_SPACING.xl,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.full,
    backgroundColor: IOS_COLORS.systemBlue,
    marginTop: IOS_SPACING.md,
  },
  followedButton: {
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  followButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followedButtonText: {
    color: IOS_COLORS.secondaryLabel,
  },

  // Description
  descriptionSection: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.lg,
  },
  descriptionText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Info
  infoSection: {
    marginTop: IOS_SPACING.sm,
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
  infoCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    minHeight: 44,
  },
  infoLabel: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    marginRight: IOS_SPACING.lg,
  },
  infoValue: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
    textAlign: 'right',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Discussions
  discussionsSection: {
    marginTop: IOS_SPACING.xl,
  },
  discussionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  composeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 4,
    borderRadius: IOS_RADIUS.full,
    backgroundColor: IOS_COLORS.quaternarySystemFill,
  },
  composeChipText: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  feedList: {
    gap: IOS_SPACING.md,
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.lg,
  },
  loadMoreText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  emptyDiscussions: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xl,
    gap: IOS_SPACING.sm,
  },
  emptyTitle: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  emptySubtitle: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    paddingHorizontal: IOS_SPACING.xl,
  },
});
