/**
 * VenueComparisonModal Component
 * Side-by-side comparison of multiple sailing venues
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useSavedVenues } from '@/hooks/useSavedVenues';
import { useVenueLiveWeather, LiveWeatherData } from '@/hooks/useVenueLiveWeather';
import { useVenueRaces } from '@/hooks/useVenueRaces';

interface Venue {
  id: string;
  name: string;
  country: string;
  region?: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface VenueComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  venues: Venue[];
  currentVenueId?: string;
  onSelectVenue?: (venue: Venue) => void;
}

interface ComparisonMetric {
  label: string;
  icon: string;
  getValue: (venue: Venue, weather: LiveWeatherData | null, raceCount: number) => string | number;
  unit?: string;
  isBetter?: (a: any, b: any) => boolean; // Returns true if a is better than b
  format?: 'number' | 'text' | 'rating';
}

/**
 * Individual venue comparison column
 */
function VenueColumn({
  venue,
  metrics,
  isSelected,
  onSelect,
}: {
  venue: Venue;
  metrics: ComparisonMetric[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { weather, isLoading: weatherLoading } = useVenueLiveWeather(
    venue.coordinates_lat,
    venue.coordinates_lng,
    venue.id,
    venue.name
  );
  const { races, isLoading: racesLoading } = useVenueRaces(venue.id, 5);

  const isLoading = weatherLoading || racesLoading;

  return (
    <View style={[styles.venueColumn, isSelected && styles.venueColumnSelected]}>
      {/* Header */}
      <TouchableOpacity onPress={onSelect} style={styles.columnHeader}>
        <ThemedText style={styles.venueName} numberOfLines={2}>
          {venue.name}
        </ThemedText>
        <ThemedText style={styles.venueCountry}>
          {venue.region ? `${venue.country}, ${venue.region}` : venue.country}
        </ThemedText>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <ThemedText style={styles.selectedText}>CURRENT</ThemedText>
          </View>
        )}
      </TouchableOpacity>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        {isLoading ? (
          <View style={styles.loadingMetrics}>
            <ActivityIndicator size="small" color="#6b7280" />
          </View>
        ) : (
          metrics.map((metric, index) => {
            const value = metric.getValue(venue, weather, races.length);
            return (
              <View key={index} style={styles.metricRow}>
                <ThemedText style={styles.metricValue}>
                  {value}
                  {metric.unit && <ThemedText style={styles.metricUnit}>{metric.unit}</ThemedText>}
                </ThemedText>
              </View>
            );
          })
        )}
      </View>

      {/* Select Button */}
      <TouchableOpacity
        style={[styles.selectButton, isSelected && styles.selectButtonActive]}
        onPress={onSelect}
        disabled={isSelected}
      >
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'navigate-outline'}
          size={18}
          color={isSelected ? '#fff' : '#0284c7'}
        />
        <ThemedText style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>
          {isSelected ? 'Selected' : 'Select'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export function VenueComparisonModal({
  visible,
  onClose,
  venues,
  currentVenueId,
  onSelectVenue,
}: VenueComparisonModalProps) {
  // Define comparison metrics
  const metrics: ComparisonMetric[] = [
    {
      label: 'Wind',
      icon: 'flag',
      getValue: (v, weather) => weather?.windSpeed ?? '--',
      unit: 'kt',
    },
    {
      label: 'Race Readiness',
      icon: 'checkmark-circle',
      getValue: (v, weather) => weather?.raceReadiness ?? '--',
      format: 'text',
    },
    {
      label: 'Wave Height',
      icon: 'water',
      getValue: (v, weather) => weather?.waveHeight?.toFixed(1) ?? '--',
      unit: 'm',
    },
    {
      label: 'Water Temp',
      icon: 'thermometer',
      getValue: (v, weather) => weather?.waterTemperature ? Math.round(weather.waterTemperature) : '--',
      unit: '°C',
    },
    {
      label: 'Visibility',
      icon: 'eye',
      getValue: (v, weather) => weather?.visibility ? Math.round(weather.visibility) : '--',
      unit: 'km',
    },
    {
      label: 'Upcoming Races',
      icon: 'calendar',
      getValue: (v, weather, races) => races,
    },
  ];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="git-compare-outline" size={24} color="#0284c7" />
            <ThemedText style={styles.headerTitle}>Compare Venues</ThemedText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Metric Labels Column */}
        <View style={styles.comparisonContainer}>
          {/* Labels */}
          <View style={styles.labelsColumn}>
            <View style={styles.labelHeader}>
              <ThemedText style={styles.labelHeaderText}>Metric</ThemedText>
            </View>
            <View style={styles.labelsContainer}>
              {metrics.map((metric, index) => (
                <View key={index} style={styles.labelRow}>
                  <Ionicons name={metric.icon as any} size={16} color="#6b7280" />
                  <ThemedText style={styles.labelText}>{metric.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Venue Columns */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.venuesScroll}
            contentContainerStyle={styles.venuesScrollContent}
          >
            {venues.map(venue => (
              <VenueColumn
                key={venue.id}
                venue={venue}
                metrics={metrics}
                isSelected={venue.id === currentVenueId}
                onSelect={() => onSelectVenue?.(venue)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Empty State */}
        {venues.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color="#d1d5db" />
            <ThemedText style={styles.emptyTitle}>No Venues to Compare</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Save some venues first to compare them side by side
            </ThemedText>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <ThemedText style={styles.legendText}>
            Compare conditions across your saved venues to find the best sailing spot
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Comparison trigger button to use in venue screen
 */
export function CompareVenuesButton({
  onPress,
  savedCount,
}: {
  onPress: () => void;
  savedCount: number;
}) {
  if (savedCount < 2) return null;

  return (
    <TouchableOpacity style={styles.compareButton} onPress={onPress}>
      <Ionicons name="git-compare-outline" size={18} color="#0284c7" />
      <ThemedText style={styles.compareButtonText}>
        Compare {savedCount} Venues
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },

  // Comparison Container
  comparisonContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  // Labels Column
  labelsColumn: {
    width: 100,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  labelHeader: {
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  labelHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  labelsContainer: {
    paddingVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
  },
  labelText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },

  // Venues Scroll
  venuesScroll: {
    flex: 1,
  },
  venuesScrollContent: {
    paddingHorizontal: 8,
  },

  // Venue Column
  venueColumn: {
    width: 160,
    marginHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  venueColumnSelected: {
    borderColor: '#0284c7',
    borderWidth: 2,
  },
  columnHeader: {
    height: 100,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  venueName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  venueCountry: {
    fontSize: 11,
    color: '#6b7280',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },

  // Metrics
  metricsContainer: {
    paddingVertical: 8,
  },
  metricRow: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6b7280',
  },
  loadingMetrics: {
    height: 264,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Select Button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
  },
  selectButtonActive: {
    backgroundColor: '#0284c7',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  selectButtonTextActive: {
    color: '#fff',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Legend
  legend: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Compare Button (for external use)
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
});

export default VenueComparisonModal;

