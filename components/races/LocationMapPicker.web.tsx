/**
 * LocationMapPicker - Web Implementation
 *
 * Full-screen modal for selecting race location on a map.
 * Uses Leaflet for web platform.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  FlatList,
  Pressable,
} from 'react-native';
import { X, MapPin, Search, Navigation, Check } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { IOS_COLORS } from '@/components/cards/constants';
import type { RaceType } from './RaceTypeSelector';

const logger = createLogger('LocationMapPicker.web');

// =============================================================================
// TYPES
// =============================================================================

export interface LocationMapPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: { name: string; lat: number; lng: number }) => void;
  raceType?: RaceType;
  initialLocation?: { lat: number; lng: number } | null;
  initialName?: string;
}

interface VenueLocation {
  name: string;
  lat: number;
  lng: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CENTER = { lat: 22.3193, lng: 114.1694 }; // Hong Kong
const RECENT_VENUES_KEY = 'regattaflow_recent_venues';

const FALLBACK_VENUES: VenueLocation[] = [
  { name: 'Victoria Harbour, Hong Kong', lat: 22.3193, lng: 114.1694 },
  { name: 'Sydney Harbour, Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'San Francisco Bay, USA', lat: 37.7749, lng: -122.4194 },
  { name: 'Solent, UK', lat: 50.7772, lng: -1.2924 },
  { name: 'Mediterranean, France', lat: 43.2965, lng: 5.3698 },
];

// =============================================================================
// LEAFLET MAP COMPONENT
// =============================================================================

function LeafletMap({
  center,
  selectedLocation,
  onMapClick,
}: {
  center: { lat: number; lng: number };
  selectedLocation: VenueLocation | null;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!isMounted || !mapContainerRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        // Initialize map
        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerRef.current).setView(
            [center.lat, center.lng],
            13
          );

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(mapRef.current);

          // Add initial marker if exists
          if (selectedLocation) {
            markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(
              mapRef.current
            );
          }

          // Handle map clicks
          mapRef.current.on('click', (e: any) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
            }

            onMapClick(lat, lng);
          });
        }
      } catch (error) {
        logger.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    if (selectedLocation) {
      if (markerRef.current) {
        markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      } else {
        markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(
          mapRef.current
        );
      }
      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13);
    }
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  return (
    <View
      ref={mapContainerRef as any}
      style={styles.map}
    />
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LocationMapPicker({
  visible,
  onClose,
  onSelectLocation,
  raceType = 'fleet',
  initialLocation,
  initialName = '',
}: LocationMapPickerProps) {
  // State
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation | null>(
    initialLocation ? { name: initialName, lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<VenueLocation[]>([]);
  const [recentVenues, setRecentVenues] = useState<VenueLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Load recent venues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(RECENT_VENUES_KEY);
        if (stored) {
          const venues = JSON.parse(stored) as VenueLocation[];
          setRecentVenues(venues.slice(0, 5));
        } else {
          setRecentVenues(FALLBACK_VENUES.slice(0, 3));
        }
      } catch (e) {
        setRecentVenues(FALLBACK_VENUES.slice(0, 3));
      }
    }
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedLocation(
        initialLocation ? { name: initialName, lat: initialLocation.lat, lng: initialLocation.lng } : null
      );
      setSearchText(initialName);
      setShowSearchResults(false);
    }
  }, [visible, initialLocation, initialName]);

  // =============================================================================
  // SEARCH
  // =============================================================================

  const searchVenues = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearching(true);
    setShowSearchResults(true);

    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, coordinates_lat, coordinates_lng')
        .ilike('name', `%${query}%`)
        .limit(8);

      if (error) throw error;

      const dbResults: VenueLocation[] = (data || [])
        .filter((v: any) => v.coordinates_lat && v.coordinates_lng)
        .map((v: any) => ({
          name: v.name,
          lat: v.coordinates_lat,
          lng: v.coordinates_lng,
        }));

      const queryLower = query.toLowerCase();
      const fallbackMatches = FALLBACK_VENUES.filter(
        (v) =>
          v.name.toLowerCase().includes(queryLower) &&
          !dbResults.some((db) => db.name.toLowerCase() === v.name.toLowerCase())
      );

      setSearchResults([...dbResults, ...fallbackMatches].slice(0, 8));
    } catch (e) {
      const queryLower = query.toLowerCase();
      const matches = FALLBACK_VENUES.filter((v) =>
        v.name.toLowerCase().includes(queryLower)
      );
      setSearchResults(matches);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchText.length >= 2) {
        searchVenues(searchText);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText, searchVenues]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const newLocation: VenueLocation = {
      name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    };
    setSelectedLocation(newLocation);
    setSearchText('');
    setShowSearchResults(false);
  }, []);

  const handleSelectVenue = useCallback((venue: VenueLocation) => {
    setSelectedLocation(venue);
    setSearchText(venue.name);
    setShowSearchResults(false);
  }, []);

  const saveToRecentVenues = useCallback((venue: VenueLocation) => {
    if (typeof window === 'undefined') return;

    try {
      const current = [...recentVenues];
      const filtered = current.filter(
        (v) => v.name.toLowerCase() !== venue.name.toLowerCase()
      );
      const updated = [venue, ...filtered].slice(0, 5);
      setRecentVenues(updated);
      window.localStorage.setItem(RECENT_VENUES_KEY, JSON.stringify(updated));
    } catch (e) {
      logger.warn('Failed to save recent venue:', e);
    }
  }, [recentVenues]);

  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      saveToRecentVenues(selectedLocation);
      onSelectLocation(selectedLocation);
    }
    onClose();
  }, [selectedLocation, saveToRecentVenues, onSelectLocation, onClose]);

  // =============================================================================
  // RENDER
  // =============================================================================

  const center = useMemo(() => ({
    lat: initialLocation?.lat || DEFAULT_CENTER.lat,
    lng: initialLocation?.lng || DEFAULT_CENTER.lng,
  }), [initialLocation]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={IOS_COLORS.label} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.doneButton, !selectedLocation && styles.doneButtonDisabled]}
            disabled={!selectedLocation}
          >
            <Text style={[styles.doneButtonText, !selectedLocation && styles.doneButtonTextDisabled]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={18} color={IOS_COLORS.gray} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search venues..."
              placeholderTextColor={IOS_COLORS.gray}
              onFocus={() => searchText.length >= 2 && setShowSearchResults(true)}
            />
            {searching && <ActivityIndicator size="small" color={IOS_COLORS.blue} />}
          </View>
        </View>

        {/* Search Results */}
        {showSearchResults && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            {searchResults.map((item, index) => (
              <Pressable
                key={`${item.name}-${index}`}
                style={styles.searchResultItem}
                onPress={() => handleSelectVenue(item)}
              >
                <MapPin size={16} color={IOS_COLORS.blue} />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultCoords}>
                    {item.lat.toFixed(3)}°, {item.lng.toFixed(3)}°
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
          <LeafletMap
            center={center}
            selectedLocation={selectedLocation}
            onMapClick={handleMapClick}
          />

          {/* Selected Location Badge */}
          {selectedLocation && (
            <View style={styles.selectedBadge}>
              <Check size={14} color={IOS_COLORS.green} />
              <Text style={styles.selectedBadgeText} numberOfLines={1}>
                {selectedLocation.name}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Select */}
        {!showSearchResults && (
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectTitle}>QUICK SELECT</Text>
            <View style={styles.quickSelectList}>
              {recentVenues.map((item, index) => (
                <Pressable
                  key={`recent-${item.name}-${index}`}
                  style={[
                    styles.quickSelectItem,
                    selectedLocation?.name === item.name && styles.quickSelectItemSelected,
                  ]}
                  onPress={() => handleSelectVenue(item)}
                >
                  <MapPin
                    size={14}
                    color={selectedLocation?.name === item.name ? IOS_COLORS.blue : IOS_COLORS.gray}
                  />
                  <Text
                    style={[
                      styles.quickSelectItemText,
                      selectedLocation?.name === item.name && styles.quickSelectItemTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Click on the map to select a racing area center
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  doneButtonTextDisabled: {
    color: IOS_COLORS.gray,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    maxHeight: 200,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  searchResultCoords: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedBadgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  quickSelectContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  quickSelectTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickSelectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  quickSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickSelectItemSelected: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  quickSelectItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
    maxWidth: 150,
  },
  quickSelectItemTextSelected: {
    color: IOS_COLORS.blue,
  },
  hintContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
  },
  hintText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default LocationMapPicker;
