/**
 * NetworkSidebar Component
 * Google Maps-style search sidebar for sailing network
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { SavedNetworkSection } from './SavedNetworkSection';
import { SailingNetworkService, NetworkPlace, ServiceType } from '@/services/SailingNetworkService';
import { supabase } from '@/services/supabase';

interface NetworkSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onPlacePress: (place: NetworkPlace) => void;
}

export function NetworkSidebar({
  isCollapsed,
  onToggleCollapse,
  onPlacePress,
}: NetworkSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetworkPlace[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<NetworkPlace[]>([]);
  const [savedVenueIds, setSavedVenueIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [slideAnim] = useState(new Animated.Value(0));

  // Animate sidebar collapse/expand
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isCollapsed ? -380 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isCollapsed]);

  // Fetch saved places on mount
  useEffect(() => {
    fetchSavedPlaces();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchSavedPlaces = async () => {
    setIsLoadingSaved(true);
    try {
      const places = await SailingNetworkService.getMyNetwork();
      setSavedPlaces(places);
      setSavedVenueIds(new Set(places.map(p => p.id)));
    } catch (error) {
      console.error('Failed to fetch saved places:', error);
      setSavedPlaces([]);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const performSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Search sailing_venues table
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      // Convert to NetworkPlace format
      const results: NetworkPlace[] = (data || []).map(venue => ({
        id: venue.id,
        type: 'venue' as ServiceType,
        name: venue.name,
        country: venue.country,
        location: {
          name: venue.name,
          region: venue.region,
        },
        coordinates: {
          lat: venue.coordinates_lat,
          lng: venue.coordinates_lng,
        },
        isSaved: savedVenueIds.has(venue.id),
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async (place: NetworkPlace) => {
    try {
      await SailingNetworkService.saveToNetwork(
        place.id,
        place.type,
        place.location
      );
      await fetchSavedPlaces();
      // Update search results to reflect saved status
      setSearchResults(prev => prev.map(p =>
        p.id === place.id ? { ...p, isSaved: true } : p
      ));
    } catch (error: any) {
      console.error('Failed to save:', error);
    }
  };

  const handleUnsave = async (place: NetworkPlace) => {
    try {
      await SailingNetworkService.removeFromNetwork(place.id);
      await fetchSavedPlaces();
      // Update search results to reflect unsaved status
      setSearchResults(prev => prev.map(p =>
        p.id === place.id ? { ...p, isSaved: false } : p
      ));
    } catch (error: any) {
      console.error('Failed to unsave:', error);
    }
  };

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

  const renderPlace = (place: NetworkPlace) => (
    <View key={place.id} style={styles.placeCard}>
      <View style={styles.placeIcon}>
        <ThemedText style={styles.placeIconText}>{getServiceIcon(place.type)}</ThemedText>
      </View>
      <View style={styles.placeInfo}>
        <ThemedText style={styles.placeName} numberOfLines={1}>{place.name}</ThemedText>
        <ThemedText style={styles.placeCountry} numberOfLines={1}>{place.country}</ThemedText>
      </View>
      <View style={styles.placeActions}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => onPlacePress(place)}
        >
          <Ionicons name="information-circle-outline" size={20} color="#666" />
        </TouchableOpacity>
        {place.isSaved ? (
          <TouchableOpacity
            style={styles.savedButton}
            onPress={() => handleUnsave(place)}
          >
            <Ionicons name="bookmark" size={20} color="#007AFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSave(place)}
          >
            <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Search Bar (Google Maps style) */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIconLeft} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Hong Kong, RHKYC, North Sails..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {searchQuery.trim().length > 0 ? (
            // Search Results
            <>
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#ccc" />
                  <ThemedText style={styles.emptyText}>No results found</ThemedText>
                  <ThemedText style={styles.emptySubtext}>Try searching for a location or venue</ThemedText>
                </View>
              ) : (
                <>
                  <ThemedText style={styles.sectionTitle}>
                    SEARCH RESULTS ({searchResults.length})
                  </ThemedText>
                  {searchResults.map(renderPlace)}
                </>
              )}
            </>
          ) : (
            // Saved Places (shown when not searching)
            <>
              {isLoadingSaved ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : savedPlaces.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="bookmark-outline" size={48} color="#ccc" />
                  <ThemedText style={styles.emptyText}>No saved places</ThemedText>
                  <ThemedText style={styles.emptySubtext}>Search and save your sailing network</ThemedText>
                </View>
              ) : (
                <>
                  <ThemedText style={styles.sectionTitle}>
                    SAVED ({savedPlaces.length})
                  </ThemedText>
                  {savedPlaces.map(renderPlace)}
                </>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>

      {/* Collapse/Expand Toggle Button */}
      <TouchableOpacity
        style={[styles.toggleButton, isCollapsed && styles.toggleButtonCollapsed]}
        onPress={onToggleCollapse}
      >
        <Ionicons
          name={isCollapsed ? 'chevron-forward' : 'chevron-back'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    zIndex: 100,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '2px 0 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 8,
        }),
  },

  // Search Container (Google Maps style)
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: Platform.OS === 'web' ? 20 : 60,
    paddingHorizontal: 12,
    height: 48,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }
      : { elevation: 3 }),
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    outlineStyle: 'none',
  },
  clearButton: {
    padding: 4,
  },

  // Section Title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },

  // Place Card (Google Maps style)
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    backgroundColor: '#fff',
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  placeCountry: {
    fontSize: 13,
    color: '#666',
  },
  placeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  savedButton: {
    padding: 8,
  },

  // Content
  content: {
    flex: 1,
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

  // Toggle Button
  toggleButton: {
    position: 'absolute',
    left: 380,
    top: '50%',
    marginTop: -24,
    width: 32,
    height: 48,
    backgroundColor: '#007AFF',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
    ...(Platform.OS === 'web'
      ? { boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.2)' }
      : { elevation: 5 }),
  },
  toggleButtonCollapsed: {
    left: 0,
  },
});
