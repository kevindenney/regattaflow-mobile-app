/**
 * VenueHeatmap - Visual map of venues raced
 *
 * Shows a visual representation of racing venues with
 * intensity indicators based on race frequency.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { VenueWithCoordinates } from '@/hooks/useReflectProfile';

interface VenueHeatmapProps {
  venues: VenueWithCoordinates[];
  onVenuePress?: (venueId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32;

function getIntensityColor(intensity: number): string {
  // Gradient from light to dark blue based on intensity
  if (intensity >= 0.8) return IOS_COLORS.systemBlue;
  if (intensity >= 0.5) return '#4A9BFF';
  if (intensity >= 0.3) return '#7AB8FF';
  return '#A8D4FF';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function VenueMarker({
  venue,
  isSelected,
  onPress,
}: {
  venue: VenueWithCoordinates;
  isSelected: boolean;
  onPress: () => void;
}) {
  const markerSize = 16 + venue.intensity * 24; // 16-40px based on intensity
  const color = getIntensityColor(venue.intensity);

  return (
    <Pressable
      style={[
        styles.markerContainer,
        isSelected && styles.markerContainerSelected,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.marker,
          {
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
            backgroundColor: color + '30',
            borderColor: color,
          },
        ]}
      >
        <View
          style={[
            styles.markerDot,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.markerLabel} numberOfLines={1}>
        {venue.name.split(' ').slice(0, 2).join(' ')}
      </Text>
    </Pressable>
  );
}

function VenueDetailCard({
  venue,
  onClose,
}: {
  venue: VenueWithCoordinates;
  onClose: () => void;
}) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTitleRow}>
          <Text style={styles.detailTitle}>{venue.name}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.closeDetailButton,
              pressed && styles.closeDetailButtonPressed,
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={16} color={IOS_COLORS.secondaryLabel} />
          </Pressable>
        </View>
        {venue.location && (
          <Text style={styles.detailLocation}>{venue.location}</Text>
        )}
      </View>

      <View style={styles.detailStats}>
        <View style={styles.detailStat}>
          <Text style={styles.detailStatValue}>{venue.raceCount}</Text>
          <Text style={styles.detailStatLabel}>Races</Text>
        </View>
        {venue.bestFinish && (
          <View style={styles.detailStat}>
            <Text style={styles.detailStatValue}>{venue.bestFinish}</Text>
            <Text style={styles.detailStatLabel}>Best</Text>
          </View>
        )}
        {venue.averageFinish && (
          <View style={styles.detailStat}>
            <Text style={styles.detailStatValue}>
              {venue.averageFinish.toFixed(1)}
            </Text>
            <Text style={styles.detailStatLabel}>Avg</Text>
          </View>
        )}
      </View>

      <Text style={styles.detailLastRace}>
        Last raced: {formatDate(venue.lastRaceDate)}
      </Text>
    </View>
  );
}

export function VenueHeatmap({ venues, onVenuePress }: VenueHeatmapProps) {
  const [selectedVenue, setSelectedVenue] = useState<VenueWithCoordinates | null>(
    null
  );

  const handleVenuePress = (venue: VenueWithCoordinates) => {
    setSelectedVenue(venue.id === selectedVenue?.id ? null : venue);
    onVenuePress?.(venue.id);
  };

  const totalRaces = venues.reduce((sum, v) => sum + v.raceCount, 0);
  const uniqueVenues = venues.length;

  if (venues.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Venues Raced</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="location-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No Venues Yet</Text>
          <Text style={styles.emptySubtext}>
            Complete races at different venues to see your racing map
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Venues Raced</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerStatText}>
            {uniqueVenues} venues • {totalRaces} races
          </Text>
        </View>
      </View>

      {/* Visual Heatmap */}
      <View style={styles.heatmapCard}>
        {/* Background gradient effect */}
        <View style={styles.heatmapBackground}>
          <View style={[styles.gradientCircle, styles.gradientCircle1]} />
          <View style={[styles.gradientCircle, styles.gradientCircle2]} />
          <View style={[styles.gradientCircle, styles.gradientCircle3]} />
        </View>

        {/* Venue markers in a responsive grid */}
        <View style={styles.markersContainer}>
          {venues.slice(0, 6).map((venue, index) => (
            <VenueMarker
              key={venue.id}
              venue={venue}
              isSelected={selectedVenue?.id === venue.id}
              onPress={() => handleVenuePress(venue)}
            />
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#A8D4FF' }]} />
            <Text style={styles.legendText}>Few races</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: IOS_COLORS.systemBlue }]}
            />
            <Text style={styles.legendText}>Many races</Text>
          </View>
        </View>
      </View>

      {/* Selected venue detail */}
      {selectedVenue && (
        <VenueDetailCard
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}

      {/* Full venue list */}
      <View style={styles.venueList}>
        <Text style={styles.listHeader}>All Venues</Text>
        {venues.map((venue) => (
          <Pressable
            key={venue.id}
            style={({ pressed }) => [
              styles.venueRow,
              pressed && styles.venueRowPressed,
            ]}
            onPress={() => handleVenuePress(venue)}
          >
            <View
              style={[
                styles.venueIntensityDot,
                { backgroundColor: getIntensityColor(venue.intensity) },
              ]}
            />
            <View style={styles.venueInfo}>
              <Text style={styles.venueName} numberOfLines={1}>
                {venue.name}
              </Text>
              <Text style={styles.venueLocation}>{venue.location}</Text>
            </View>
            <View style={styles.venueStats}>
              <Text style={styles.venueStatMain}>{venue.raceCount} races</Text>
              {venue.bestFinish && (
                <Text style={styles.venueStatSub}>
                  Best: {venue.bestFinish}
                  {venue.bestFinish === 1 ? 'st' : venue.bestFinish === 2 ? 'nd' : venue.bestFinish === 3 ? 'rd' : 'th'}
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={IOS_COLORS.tertiaryLabel}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  heatmapCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    minHeight: 200,
    overflow: 'hidden',
    ...IOS_SHADOWS.sm,
  },
  heatmapBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gradientCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  gradientCircle1: {
    width: 120,
    height: 120,
    backgroundColor: IOS_COLORS.systemBlue,
    top: 20,
    left: 30,
    opacity: 0.4,
  },
  gradientCircle2: {
    width: 80,
    height: 80,
    backgroundColor: '#4A9BFF',
    top: 80,
    right: 50,
    opacity: 0.3,
  },
  gradientCircle3: {
    width: 60,
    height: 60,
    backgroundColor: '#7AB8FF',
    bottom: 30,
    left: 100,
    opacity: 0.25,
  },
  markersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  markerContainer: {
    alignItems: 'center',
    gap: 4,
  },
  markerContainerSelected: {
    transform: [{ scale: 1.1 }],
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
    maxWidth: 80,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  detailCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    ...IOS_SHADOWS.sm,
  },
  detailHeader: {
    marginBottom: 10,
  },
  detailTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  closeDetailButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailButtonPressed: {
    opacity: 0.7,
  },
  detailLocation: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  detailStats: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  detailLastRace: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  venueList: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  venueRowPressed: {
    opacity: 0.7,
  },
  venueIntensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  venueLocation: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  venueStats: {
    alignItems: 'flex-end',
  },
  venueStatMain: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  venueStatSub: {
    fontSize: 11,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  emptyState: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
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

export default VenueHeatmap;
