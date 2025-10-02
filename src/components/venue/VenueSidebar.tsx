/**
 * VenueSidebar Component
 * Apple Maps-style collapsible sidebar for venue browsing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/services/supabase';
import { VENUE_ICONS, getCountryFlag as getFlag } from '@/src/constants/sailing-icons';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface VenueSidebarProps {
  currentVenue?: Venue | null;
  onSelectVenue: (venue: Venue) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  showOnlySavedVenues?: boolean;
  savedVenueIds?: Set<string>;
}

export function VenueSidebar({
  currentVenue,
  onSelectVenue,
  isCollapsed,
  onToggleCollapse,
  showOnlySavedVenues = false,
  savedVenueIds = new Set(),
}: VenueSidebarProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [venueTypeFilter, setVenueTypeFilter] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(0));

  // Fetch venues
  useEffect(() => {
    fetchVenues();
  }, []);

  // Animate sidebar collapse/expand
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isCollapsed ? -340 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isCollapsed]);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng')
        .order('name', { ascending: true });

      if (error) throw error;

      setVenues(data || []);
      setFilteredVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter venues
  useEffect(() => {
    let filtered = venues;

    // Filter by saved venues first if that mode is active
    if (showOnlySavedVenues && savedVenueIds.size > 0) {
      filtered = filtered.filter((venue) => savedVenueIds.has(venue.id));
      console.log('🔍 VenueSidebar: Filtering to saved venues only:', filtered.length, 'of', venues.length);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (venue) =>
          venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          venue.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRegion) {
      filtered = filtered.filter((venue) => venue.region === selectedRegion);
    }

    if (venueTypeFilter) {
      filtered = filtered.filter((venue) => venue.venue_type === venueTypeFilter);
    }

    setFilteredVenues(filtered);
  }, [searchQuery, selectedRegion, venueTypeFilter, venues, showOnlySavedVenues, savedVenueIds]);

  const getVenueTypeIcon = (type: string) => {
    return VENUE_ICONS[type as keyof typeof VENUE_ICONS] || VENUE_ICONS.default;
  };

  const regions = [
    { id: 'north-america', name: 'N. America', flag: '🌎' },
    { id: 'europe', name: 'Europe', flag: '🇪🇺' },
    { id: 'asia-pacific', name: 'Asia-Pacific', flag: '🌏' },
    { id: 'oceania', name: 'Oceania', flag: '🇦🇺' },
  ];

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
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Sailing Venues</ThemedText>
          <ThemedText style={styles.count}>{filteredVenues.length} venues</ThemedText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues..."
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

        {/* Region Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.regionScroll}
          contentContainerStyle={styles.regionContainer}
        >
          <TouchableOpacity
            style={[styles.regionPill, !selectedRegion && styles.regionPillActive]}
            onPress={() => setSelectedRegion(null)}
          >
            <ThemedText style={[styles.regionText, !selectedRegion && styles.regionTextActive]}>
              All
            </ThemedText>
          </TouchableOpacity>
          {regions.map((region) => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.regionPill,
                selectedRegion === region.id && styles.regionPillActive
              ]}
              onPress={() => setSelectedRegion(region.id)}
            >
              <ThemedText style={[
                styles.regionText,
                selectedRegion === region.id && styles.regionTextActive
              ]}>
                {region.flag} {region.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Type Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeContainer}
        >
          <TouchableOpacity
            style={[styles.typePill, !venueTypeFilter && styles.typePillActive]}
            onPress={() => setVenueTypeFilter(null)}
          >
            <ThemedText style={[styles.typeText, !venueTypeFilter && styles.typeTextActive]}>
              All Types
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typePill, venueTypeFilter === 'championship' && styles.typePillActive]}
            onPress={() => setVenueTypeFilter('championship')}
          >
            <ThemedText style={[styles.typeText, venueTypeFilter === 'championship' && styles.typeTextActive]}>
              🏆 Championship
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typePill, venueTypeFilter === 'premier' && styles.typePillActive]}
            onPress={() => setVenueTypeFilter('premier')}
          >
            <ThemedText style={[styles.typeText, venueTypeFilter === 'premier' && styles.typeTextActive]}>
              ⭐ Premier
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typePill, venueTypeFilter === 'regional' && styles.typePillActive]}
            onPress={() => setVenueTypeFilter('regional')}
          >
            <ThemedText style={[styles.typeText, venueTypeFilter === 'regional' && styles.typeTextActive]}>
              📍 Regional
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>

        {/* Venue List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView style={styles.venueList} showsVerticalScrollIndicator={true}>
            {filteredVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[
                  styles.venueItem,
                  currentVenue?.id === venue.id && styles.venueItemActive,
                ]}
                onPress={() => onSelectVenue(venue)}
              >
                <View style={styles.venueIcon}>
                  <ThemedText style={styles.venueIconText}>
                    {getVenueTypeIcon(venue.venue_type)}
                  </ThemedText>
                </View>
                <View style={styles.venueInfo}>
                  <ThemedText
                    style={[
                      styles.venueName,
                      currentVenue?.id === venue.id && styles.venueNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {venue.name}
                  </ThemedText>
                  <View style={styles.venueMetaRow}>
                    <ThemedText style={styles.venueFlag}>
                      {getFlag(venue.country)}
                    </ThemedText>
                    <ThemedText style={styles.venueCountry} numberOfLines={1}>
                      {venue.country}
                    </ThemedText>
                  </View>
                </View>
                {currentVenue?.id === venue.id && (
                  <Ionicons name="chevron-forward" size={18} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
            {filteredVenues.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color="#ccc" />
                <ThemedText style={styles.emptyText}>No venues found</ThemedText>
              </View>
            )}
          </ScrollView>
        )}
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
    width: 340,
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

  // Header
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  count: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 12,
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

  // Region Filter
  regionScroll: {
    marginTop: 12,
    maxHeight: 40,
  },
  regionContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  regionPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
  },
  regionPillActive: {
    backgroundColor: '#007AFF',
  },
  regionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  regionTextActive: {
    color: '#fff',
  },

  // Type Filter
  typeScroll: {
    marginTop: 8,
    maxHeight: 40,
  },
  typeContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
  },
  typePillActive: {
    backgroundColor: '#007AFF15',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#007AFF',
  },

  // Venue List
  venueList: {
    flex: 1,
    marginTop: 12,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  venueItemActive: {
    backgroundColor: '#007AFF10',
  },
  venueIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venueIconText: {
    fontSize: 18,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  venueNameActive: {
    color: '#007AFF',
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueFlag: {
    fontSize: 12,
  },
  venueCountry: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },

  // Toggle Button
  toggleButton: {
    position: 'absolute',
    left: 340,
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
