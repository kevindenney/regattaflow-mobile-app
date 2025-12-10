/**
 * QuickAccessPanel Component
 * Persistent bottom-right panel for venue quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
}

interface QuickAccessPanelProps {
  savedVenueIds: Set<string>;
  currentVenueId?: string;
  onVenueSelect: (venueId: string) => void;
}

export function QuickAccessPanel({
  savedVenueIds,
  currentVenueId,
  onVenueSelect,
}: QuickAccessPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Venue[]>([]);
  const [savedVenues, setSavedVenues] = useState<Venue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // Fetch saved venues
  useEffect(() => {
    fetchSavedVenues();
  }, [savedVenueIds]);

  // Search when query changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchSavedVenues = async () => {
    if (savedVenueIds.size === 0) {
      setSavedVenues([]);
      setIsLoadingSaved(false);
      return;
    }

    setIsLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region')
        .in('id', Array.from(savedVenueIds))
        .order('name', { ascending: true });

      if (error) throw error;
      setSavedVenues(data || []);
    } catch (error) {
      console.error('Failed to fetch saved venues:', error);
      setSavedVenues([]);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region')
        .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`)
        .order('name', { ascending: true })
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVenueSelect = (venue: Venue) => {
    onVenueSelect(venue.id);
    setIsExpanded(false);
    setSearchQuery('');
  };

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={[
        styles.venueItem,
        item.id === currentVenueId && styles.venueItemActive,
      ]}
      onPress={() => handleVenueSelect(item)}
    >
      <View style={styles.venueIcon}>
        <Ionicons
          name={savedVenueIds.has(item.id) ? 'bookmark' : 'location-outline'}
          size={16}
          color={item.id === currentVenueId ? '#2563eb' : '#666'}
        />
      </View>
      <View style={styles.venueInfo}>
        <ThemedText
          style={[
            styles.venueName,
            item.id === currentVenueId && styles.venueNameActive,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </ThemedText>
        <ThemedText style={styles.venueLocation} numberOfLines={1}>
          {item.country} • {item.region}
        </ThemedText>
      </View>
      {item.id === currentVenueId && (
        <Ionicons name="checkmark-circle" size={18} color="#2563eb" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Collapsed State - Small Pill */}
      {!isExpanded && (
        <TouchableOpacity
          style={styles.collapsedPill}
          onPress={() => setIsExpanded(true)}
        >
          <Ionicons name="compass-outline" size={18} color="#2563eb" />
          <ThemedText style={styles.pillText}>
            {savedVenueIds.size > 0
              ? `${savedVenueIds.size} saved`
              : 'Find venues'}
          </ThemedText>
          <Ionicons name="chevron-up" size={16} color="#666" />
        </TouchableOpacity>
      )}

      {/* Expanded Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsExpanded(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsExpanded(false)}
        >
          <View style={styles.panelContainer} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={styles.headerTitle}>Switch Venue</ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsExpanded(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
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
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Results */}
            {searchQuery.trim().length >= 2 ? (
              // Search Results
              isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyText}>No venues found</ThemedText>
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderVenueItem}
                  keyExtractor={(item) => item.id}
                  style={styles.venueList}
                  showsVerticalScrollIndicator={false}
                />
              )
            ) : (
              // Saved Venues
              <>
                {savedVenueIds.size > 0 && (
                  <ThemedText style={styles.sectionTitle}>SAVED VENUES</ThemedText>
                )}
                {isLoadingSaved ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2563eb" />
                  </View>
                ) : savedVenues.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={32} color="#ccc" />
                    <ThemedText style={styles.emptyText}>No saved venues</ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      Search and tap the bookmark to save venues
                    </ThemedText>
                  </View>
                ) : (
                  <FlatList
                    data={savedVenues}
                    renderItem={renderVenueItem}
                    keyExtractor={(item) => item.id}
                    style={styles.venueList}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Collapsed Pill
  collapsedPill: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 80,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
        }
      : {
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }),
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  panelContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },

  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  // Venue List
  venueList: {
    paddingHorizontal: 16,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  venueItemActive: {
    backgroundColor: '#eff6ff',
  },
  venueIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  venueNameActive: {
    color: '#2563eb',
  },
  venueLocation: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
});

