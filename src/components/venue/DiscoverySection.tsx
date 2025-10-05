/**
 * DiscoverySection Component
 * Discover and save new sailing places in a location
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { NetworkPlace, ServiceType, SailingNetworkService } from '@/src/services/SailingNetworkService';

interface DiscoverySectionProps {
  locationName: string;
  onSavePlace: (place: NetworkPlace) => void;
  onPlacePress: (place: NetworkPlace) => void;
}

const SERVICE_TYPE_FILTERS: { type: ServiceType; label: string; icon: string }[] = [
  { type: 'yacht_club', label: 'Clubs', icon: '⚓' },
  { type: 'sailmaker', label: 'Sailmakers', icon: '⛵' },
  { type: 'chandler', label: 'Chandlers', icon: '🛒' },
  { type: 'rigger', label: 'Riggers', icon: '🔗' },
  { type: 'marina', label: 'Marinas', icon: '🚢' },
];

export function DiscoverySection({
  locationName,
  onSavePlace,
  onPlacePress,
}: DiscoverySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ServiceType[]>([]);
  const [discoveredPlaces, setDiscoveredPlaces] = useState<NetworkPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch discovered places when location or filters change
  useEffect(() => {
    discoverPlaces();
  }, [locationName, selectedTypes, searchQuery]);

  const discoverPlaces = async () => {
    setIsLoading(true);
    try {
      const places = await SailingNetworkService.discoverInLocation(locationName, {
        serviceTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
        searchQuery: searchQuery || undefined,
      });
      setDiscoveredPlaces(places);
    } catch (error) {
      console.error('Failed to discover places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTypeFilter = (type: ServiceType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getServiceIcon = (type: ServiceType) => {
    const filter = SERVICE_TYPE_FILTERS.find((f) => f.type === type);
    return filter?.icon || '📍';
  };

  const getServiceLabel = (type: ServiceType) => {
    const labels: Record<ServiceType, string> = {
      venue: 'Venue',
      yacht_club: 'Yacht Club',
      sailmaker: 'Sailmaker',
      chandler: 'Chandler',
      rigger: 'Rigger',
      coach: 'Coach',
      marina: 'Marina',
      repair: 'Repair',
      engine: 'Engine Service',
      clothing: 'Clothing',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedText style={styles.sectionTitle}>
        🔍 DISCOVER{locationName ? ` IN ${locationName.toUpperCase()}` : ' PLACES'}
      </ThemedText>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for places..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedTypes.length === 0 && styles.filterChipActive]}
          onPress={() => setSelectedTypes([])}
        >
          <ThemedText
            style={[styles.filterText, selectedTypes.length === 0 && styles.filterTextActive]}
          >
            All
          </ThemedText>
        </TouchableOpacity>
        {SERVICE_TYPE_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterChip,
              selectedTypes.includes(filter.type) && styles.filterChipActive,
            ]}
            onPress={() => toggleTypeFilter(filter.type)}
          >
            <ThemedText
              style={[
                styles.filterText,
                selectedTypes.includes(filter.type) && styles.filterTextActive,
              ]}
            >
              {filter.icon} {filter.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : discoveredPlaces.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <ThemedText style={styles.emptyText}>No places found</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Try adjusting your search or filters
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={true}>
          {discoveredPlaces.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeCard}
              onPress={() => onPlacePress(place)}
            >
              <View style={styles.placeIcon}>
                <ThemedText style={styles.placeIconText}>
                  {getServiceIcon(place.type)}
                </ThemedText>
              </View>
              <View style={styles.placeInfo}>
                <ThemedText style={styles.placeName} numberOfLines={1}>
                  {place.name}
                </ThemedText>
                <ThemedText style={styles.placeType}>
                  {getServiceLabel(place.type)}
                </ThemedText>
                {place.country && (
                  <ThemedText style={styles.placeCountry} numberOfLines={1}>
                    {place.country}
                  </ThemedText>
                )}
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onSavePlace(place);
                }}
              >
                <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    outlineStyle: 'none',
  },

  // Filters
  filterScroll: {
    maxHeight: 40,
    marginBottom: 12,
  },
  filterContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },

  // Results
  resultsList: {
    flex: 1,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }
      : { elevation: 1 }),
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeIconText: {
    fontSize: 20,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  placeType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  placeCountry: {
    fontSize: 12,
    color: '#999',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#007AFF15',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
