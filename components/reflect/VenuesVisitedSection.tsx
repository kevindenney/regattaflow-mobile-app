/**
 * VenuesVisitedSection - List of venues where user has raced
 *
 * Similar to Strava's segments list, shows venues with race counts,
 * last race date, and best/average finish positions.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { VenueVisited } from '@/hooks/useReflectProfile';

interface VenuesVisitedSectionProps {
  venues: VenueVisited[];
  onSeeMore?: () => void;
  maxItems?: number;
}

function formatLastRace(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function getPositionOrdinal(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  return position + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function VenueRow({
  venue,
  onPress,
}: {
  venue: VenueVisited;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.venueRow,
        pressed && styles.venueRowPressed,
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={styles.venueIcon}>
        <Ionicons name="location" size={18} color={IOS_COLORS.systemBlue} />
      </View>

      {/* Content */}
      <View style={styles.venueContent}>
        <Text style={styles.venueName} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.venueDetails}>
          <Text style={styles.venueRaceCount}>
            {venue.raceCount} {venue.raceCount === 1 ? 'race' : 'races'}
          </Text>
          {venue.location && (
            <>
              <Text style={styles.venueDot}>·</Text>
              <Text style={styles.venueLocation} numberOfLines={1}>
                {venue.location}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Stats & Arrow */}
      <View style={styles.venueStats}>
        {venue.bestFinish !== null && (
          <View style={styles.venueBestFinish}>
            <Text style={styles.venueBestLabel}>Best</Text>
            <Text style={styles.venueBestValue}>
              {getPositionOrdinal(venue.bestFinish)}
            </Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={IOS_COLORS.tertiaryLabel}
        />
      </View>
    </Pressable>
  );
}

export function VenuesVisitedSection({
  venues,
  onSeeMore,
  maxItems = 4,
}: VenuesVisitedSectionProps) {
  const displayVenues = venues.slice(0, maxItems);
  const hasMore = venues.length > maxItems;

  const handleVenuePress = (venue: VenueVisited) => {
    // Navigate to venue detail or filter races by venue
    router.push({
      pathname: '/(tabs)/reflect',
      params: { venueFilter: venue.name },
    });
  };

  if (venues.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Venues</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="location-outline"
            size={32}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No venues yet</Text>
          <Text style={styles.emptySubtext}>
            Race at different clubs to see them here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Venues</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{venues.length}</Text>
          </View>
        </View>
        {onSeeMore && hasMore && (
          <Pressable
            onPress={onSeeMore}
            style={({ pressed }) => [
              styles.seeMoreButton,
              pressed && styles.seeMoreButtonPressed,
            ]}
          >
            <Text style={styles.seeMoreText}>See All</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={IOS_COLORS.systemBlue}
            />
          </Pressable>
        )}
      </View>

      {/* Venue List */}
      <View style={styles.venueList}>
        {displayVenues.map((venue, index) => (
          <React.Fragment key={venue.id}>
            <VenueRow venue={venue} onPress={() => handleVenuePress(venue)} />
            {index < displayVenues.length - 1 && (
              <View style={styles.separator} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Show More Indicator */}
      {hasMore && !onSeeMore && (
        <Text style={styles.moreIndicator}>
          +{venues.length - maxItems} more venues
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...IOS_SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  countBadge: {
    backgroundColor: IOS_COLORS.systemGray5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMoreButtonPressed: {
    opacity: 0.6,
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  venueList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    overflow: 'hidden',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  venueRowPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  venueIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venueContent: {
    flex: 1,
    marginRight: 8,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    letterSpacing: -0.24,
    marginBottom: 2,
  },
  venueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueRaceCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  venueDot: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginHorizontal: 4,
  },
  venueLocation: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    maxWidth: 100,
  },
  venueStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  venueBestFinish: {
    alignItems: 'center',
  },
  venueBestLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  venueBestValue: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.systemOrange,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 60,
  },
  moreIndicator: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
});

export default VenuesVisitedSection;
