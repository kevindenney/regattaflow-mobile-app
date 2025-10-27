/**
 * VenueSelector Component
 * Dynamic venue selection with database integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { VenueMapView } from './VenueMapView';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface VenueSelectorProps {
  currentVenue?: Venue | null;
  onSelectVenue: (venueId: string) => void;
}

export function VenueSelector({ currentVenue, onSelectVenue }: VenueSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [recentVenues, setRecentVenues] = useState<Venue[]>([]);
  const [venueTypeFilter, setVenueTypeFilter] = useState<string | null>(null);

  // Fetch venues from database
  useEffect(() => {
    fetchVenues();
    loadRecentVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);

    try {
      // Add a timeout to prevent hanging forever
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });

      const simpleQueryPromise = supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng')
        .order('name', { ascending: true });

      const simpleResult = await Promise.race([simpleQueryPromise, timeoutPromise]) as any;

      // Use the simple query result
      const { data, error } = simpleResult;

      if (error) {
        throw error;
      }

      setVenues(data || []);
      setFilteredVenues(data || []);

    } catch (error: any) {
      // Silent error - venues will be empty
    } finally {
      setLoading(false);
    }
  };

  const loadRecentVenues = async () => {
    try {
      // Load recent venues from venue_visits table
      const { data, error } = await supabase
        .from('venue_visits')
        .select(`
          venue_id,
          sailing_venues(id, name, country, region, venue_type, coordinates_lat, coordinates_lng)
        `)
        .order('last_visit', { ascending: false })
        .limit(3);

      if (error) {
        // Table might not exist yet - that's okay, just skip recent venues
        return;
      }

      const recentVenueData = data
        ?.map(v => v.sailing_venues)
        .filter(Boolean) as Venue[];
      setRecentVenues(recentVenueData || []);
    } catch (error) {
      // Don't fail the whole component if recent venues can't load
    }
  };

  // Filter venues by search query, region, and type
  useEffect(() => {
    let filtered = venues;

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
  }, [searchQuery, selectedRegion, venueTypeFilter, venues]);

  const handleSelectVenue = (venueId: string) => {
    onSelectVenue(venueId);
    setModalVisible(false);
    setSearchQuery('');
    setSelectedRegion(null);
  };

  const regions = [
    { id: 'north-america', name: 'North America', flag: '🌎' },
    { id: 'europe', name: 'Europe', flag: '🇪🇺' },
    { id: 'asia-pacific', name: 'Asia-Pacific', flag: '🌏' },
    { id: 'oceania', name: 'Oceania', flag: '🇦🇺' },
    { id: 'south-america', name: 'South America', flag: '🌎' },
    { id: 'middle-east', name: 'Middle East', flag: '🌍' },
    { id: 'africa', name: 'Africa', flag: '🌍' },
  ];

  const getVenueTypeIcon = (type: string) => {
    switch (type) {
      case 'championship': return '🏆';
      case 'premier': return '⭐';
      case 'regional': return '📍';
      default: return '⚓';
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'Hong Kong SAR': '🇭🇰',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'France': '🇫🇷',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'Japan': '🇯🇵',
      'Bermuda': '🇧🇲',
      'United Arab Emirates': '🇦🇪',
      'South Africa': '🇿🇦',
      'Brazil': '🇧🇷',
      'Turkey': '🇹🇷',
    };
    return flags[country] || '🌍';
  };

  const getVenueTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'championship':
        return { backgroundColor: '#ffc10715' };
      case 'premier':
        return { backgroundColor: '#007AFF15' };
      case 'regional':
        return { backgroundColor: '#66666615' };
      default:
        return { backgroundColor: '#f1f3f4' };
    }
  };

  return (
    <>
      {/* Venue Selector Button */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <View style={styles.venueInfo}>
            <ThemedText style={styles.venueLabel}>Venue</ThemedText>
            <ThemedText style={styles.venueName}>
              {currentVenue ? `${getCountryFlag(currentVenue.country)} ${currentVenue.name}` : 'Select venue...'}
            </ThemedText>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {/* Venue Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              style={styles.modalScrollContainer}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Sailing Venue</ThemedText>
              <View style={styles.headerActions}>
                <View style={styles.viewToggle}>
                  <TouchableOpacity
                    style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
                    onPress={() => setViewMode('list')}
                  >
                    <Ionicons name="list" size={20} color={viewMode === 'list' ? '#007AFF' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewToggleButton, viewMode === 'map' && styles.viewToggleButtonActive]}
                    onPress={() => setViewMode('map')}
                  >
                    <Ionicons name="map" size={20} color={viewMode === 'map' ? '#007AFF' : '#666'} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search venues..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Region Filter */}
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Region</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.regionFilter}
                contentContainerStyle={styles.regionFilterContent}
              >
                <TouchableOpacity
                  style={[styles.regionChip, !selectedRegion && styles.regionChipActive]}
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
                      styles.regionChip,
                      selectedRegion === region.id && styles.regionChipActive
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
            </View>

            {/* Venue Type Filter */}
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterLabel}>Venue Type</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.regionFilterContent}
              >
                <TouchableOpacity
                  style={[styles.typeChip, !venueTypeFilter && styles.typeChipActive]}
                  onPress={() => setVenueTypeFilter(null)}
                >
                  <ThemedText style={[styles.typeText, !venueTypeFilter && styles.typeTextActive]}>
                    All
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeChip, venueTypeFilter === 'championship' && styles.typeChipActive]}
                  onPress={() => setVenueTypeFilter('championship')}
                >
                  <ThemedText style={[styles.typeText, venueTypeFilter === 'championship' && styles.typeTextActive]}>
                    🏆 Championship
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeChip, venueTypeFilter === 'premier' && styles.typeChipActive]}
                  onPress={() => setVenueTypeFilter('premier')}
                >
                  <ThemedText style={[styles.typeText, venueTypeFilter === 'premier' && styles.typeTextActive]}>
                    ⭐ Premier
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeChip, venueTypeFilter === 'regional' && styles.typeChipActive]}
                  onPress={() => setVenueTypeFilter('regional')}
                >
                  <ThemedText style={[styles.typeText, venueTypeFilter === 'regional' && styles.typeTextActive]}>
                    📍 Regional
                  </ThemedText>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Venues List or Map View */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            ) : viewMode === 'map' ? (
              <View style={styles.mapViewContainer}>
                <VenueMapView
                  currentVenue={currentVenue}
                  onVenueSelect={handleSelectVenue}
                  showAllVenues={true}
                />
              </View>
            ) : (
              <View style={styles.venuesList}>
                {/* Recent Venues */}
                {recentVenues.length > 0 && !searchQuery && !selectedRegion && !venueTypeFilter && (
                  <View style={styles.recentSection}>
                    <ThemedText style={styles.recentTitle}>Recently Visited</ThemedText>
                    {recentVenues.map((venue) => (
                      <TouchableOpacity
                        key={venue.id}
                        style={[styles.recentVenueCard, currentVenue?.id === venue.id && styles.venueItemActive]}
                        onPress={() => handleSelectVenue(venue.id)}
                      >
                        <View style={styles.recentVenueContent}>
                          <View style={styles.recentVenueIcon}>
                            <ThemedText style={styles.recentIconText}>
                              {getVenueTypeIcon(venue.venue_type)}
                            </ThemedText>
                          </View>
                          <View style={styles.recentVenueInfo}>
                            <ThemedText style={styles.recentVenueName}>
                              {getCountryFlag(venue.country)} {venue.name}
                            </ThemedText>
                            <ThemedText style={styles.recentVenueCountry}>
                              {venue.country}
                            </ThemedText>
                          </View>
                          {currentVenue?.id === venue.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* All Venues */}
                <View style={styles.allVenuesSection}>
                  {recentVenues.length > 0 && !searchQuery && !selectedRegion && !venueTypeFilter && (
                    <ThemedText style={styles.allVenuesTitle}>All Venues</ThemedText>
                  )}
                  {filteredVenues.length === 0 && (
                    <View style={styles.emptyState}>
                      <ThemedText style={styles.emptyText}>No venues match your filters</ThemedText>
                    </View>
                  )}
                  {filteredVenues.map((venue) => (
                    <TouchableOpacity
                      key={venue.id}
                      style={[
                        styles.venueCard,
                        currentVenue?.id === venue.id && styles.venueCardActive
                      ]}
                      onPress={() => handleSelectVenue(venue.id)}
                    >
                      <View style={styles.venueCardContent}>
                        <View style={styles.venueIconBadge}>
                          <ThemedText style={styles.venueIconText}>
                            {getVenueTypeIcon(venue.venue_type)}
                          </ThemedText>
                        </View>
                        <View style={styles.venueInfo}>
                          <ThemedText style={styles.venueName}>
                            {venue.name}
                          </ThemedText>
                          <View style={styles.venueMetaRow}>
                            <ThemedText style={styles.countryFlag}>
                              {getCountryFlag(venue.country)}
                            </ThemedText>
                            <ThemedText style={styles.venueCountry}>
                              {venue.country}
                            </ThemedText>
                            <View style={[styles.venueTypeBadge, getVenueTypeBadgeStyle(venue.venue_type)]}>
                              <ThemedText style={styles.venueTypeBadgeText}>
                                {venue.venue_type}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                        {currentVenue?.id === venue.id && (
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Results Count */}
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>
                {filteredVenues.length} venues {selectedRegion && `in ${regions.find(r => r.id === selectedRegion)?.name}`}
              </ThemedText>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Selector Button
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 4,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueInfo: {
    gap: 2,
  },
  venueLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 20,
    overflow: 'hidden',
  },
  modalScrollContainer: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: '#fff',
    boxShadow: '0px 1px',
    elevation: 1,
  },
  closeButton: {
    padding: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  // Filters
  filterSection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  regionFilter: {
    marginTop: 8,
  },
  regionFilterContent: {
    gap: 8,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    marginRight: 8,
  },
  regionChipActive: {
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
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
  },

  // Venues List
  venuesList: {
    marginTop: 16,
  },

  // Recent Venues Section
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentVenueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#007AFF30',
    boxShadow: '0px 2px',
    elevation: 2,
  },
  recentVenueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  recentVenueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentIconText: {
    fontSize: 24,
  },
  recentVenueInfo: {
    flex: 1,
  },
  recentVenueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  recentVenueCountry: {
    fontSize: 13,
    color: '#666',
  },

  // All Venues Section
  allVenuesSection: {
    paddingHorizontal: 20,
  },
  allVenuesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  venueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  venueCardActive: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#007AFF05',
  },
  venueCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  venueIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueIconText: {
    fontSize: 22,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  venueMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryFlag: {
    fontSize: 14,
  },
  venueCountry: {
    fontSize: 13,
    color: '#666',
  },
  venueTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  venueTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Map View
  mapViewContainer: {
    height: 400,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
});
