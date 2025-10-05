/**
 * SavedNetworkSection Component
 * Displays user's saved places in their sailing network for a location
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { NetworkPlace, ServiceType } from '@/src/services/SailingNetworkService';

interface SavedNetworkSectionProps {
  locationName: string;
  savedPlaces: NetworkPlace[];
  onPlacePress: (place: NetworkPlace) => void;
  onRemovePlace?: (place: NetworkPlace) => void;
}

export function SavedNetworkSection({
  locationName,
  savedPlaces,
  onPlacePress,
  onRemovePlace,
}: SavedNetworkSectionProps) {
  const [showOtherLocations, setShowOtherLocations] = useState(false);

  // Group places by location
  const placesInCurrentLocation = locationName
    ? savedPlaces.filter((p) => p.location.name === locationName)
    : savedPlaces; // Show all if no location specified
  const placesInOtherLocations = locationName
    ? savedPlaces.filter((p) => p.location.name !== locationName)
    : [];

  // Get icon for service type
  const getServiceIcon = (type: ServiceType) => {
    const icons: Record<ServiceType, string> = {
      venue: '🏁',
      yacht_club: '⚓',
      sailmaker: '⛵',
      chandler: '🛒',
      rigger: '🔗',
      coach: '👨‍🏫',
      marina: '🚢',
      repair: '🔧',
      engine: '⚙️',
      clothing: '🧥',
      other: '📍',
    };
    return icons[type] || icons.other;
  };

  // Get service type label
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

  // Group places in other locations by location name
  const groupedOtherLocations = placesInOtherLocations.reduce((acc, place) => {
    const key = place.location.name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(place);
    return acc;
  }, {} as Record<string, NetworkPlace[]>);

  if (savedPlaces.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="bookmark-outline" size={48} color="#ccc" />
        <ThemedText style={styles.emptyText}>No saved places yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Discover and save places to your sailing network
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Location Section */}
      {placesInCurrentLocation.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            🌟 MY NETWORK{locationName ? ` IN ${locationName.toUpperCase()}` : ''}
          </ThemedText>
          {placesInCurrentLocation.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.placeCard,
                place.isHomeVenue && styles.homeVenueCard,
              ]}
              onPress={() => onPlacePress(place)}
            >
              <View style={styles.placeIcon}>
                <ThemedText style={styles.placeIconText}>
                  {getServiceIcon(place.type)}
                </ThemedText>
              </View>
              <View style={styles.placeInfo}>
                <View style={styles.placeHeader}>
                  <ThemedText style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </ThemedText>
                  {place.isHomeVenue && (
                    <View style={styles.homeBadge}>
                      <Ionicons name="home" size={12} color="#007AFF" />
                    </View>
                  )}
                </View>
                <ThemedText style={styles.placeType}>
                  {getServiceLabel(place.type)}
                </ThemedText>
                {place.notes && (
                  <ThemedText style={styles.placeNotes} numberOfLines={1}>
                    {place.notes}
                  </ThemedText>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Other Locations Section */}
      {Object.keys(groupedOtherLocations).length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.otherLocationsHeader}
            onPress={() => setShowOtherLocations(!showOtherLocations)}
          >
            <ThemedText style={styles.otherLocationsTitle}>
              Other Locations ({Object.keys(groupedOtherLocations).length})
            </ThemedText>
            <Ionicons
              name={showOtherLocations ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#666"
            />
          </TouchableOpacity>

          {showOtherLocations && (
            <View style={styles.otherLocationsList}>
              {Object.entries(groupedOtherLocations).map(([locationName, places]) => (
                <View key={locationName} style={styles.otherLocationGroup}>
                  <ThemedText style={styles.otherLocationName}>
                    📍 {locationName} ({places.length} saved)
                  </ThemedText>
                  {places.slice(0, 2).map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.compactPlaceCard}
                      onPress={() => onPlacePress(place)}
                    >
                      <ThemedText style={styles.compactPlaceIcon}>
                        {getServiceIcon(place.type)}
                      </ThemedText>
                      <ThemedText style={styles.compactPlaceName} numberOfLines={1}>
                        {place.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                  {places.length > 2 && (
                    <ThemedText style={styles.moreCount}>
                      +{places.length - 2} more
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },

  // Place Card
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
  homeVenueCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#007AFF05',
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeIconText: {
    fontSize: 22,
  },
  placeInfo: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  homeBadge: {
    backgroundColor: '#007AFF15',
    borderRadius: 10,
    padding: 4,
  },
  placeType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  placeNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

  // Other Locations
  otherLocationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  otherLocationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  otherLocationsList: {
    gap: 12,
  },
  otherLocationGroup: {
    paddingHorizontal: 12,
  },
  otherLocationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  compactPlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  compactPlaceIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  compactPlaceName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  moreCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    paddingLeft: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
