/**
 * Location Geocoder Component
 * Admin tool for geocoding yacht clubs and venues using OpenStreetMap/Nominatim
 */

import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { nominatimService, NominatimResult } from '@/services/location/NominatimService';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';

interface LocationGeocoderProps {
  locationId: string;
  locationType: 'yacht_club' | 'sailing_venue';
  locationName: string;
  currentLat: number;
  currentLng: number;
  country?: string;
  onUpdate?: () => void;
}

export function LocationGeocoder({
  locationId,
  locationType,
  locationName,
  currentLat,
  currentLng,
  country,
  onUpdate,
}: LocationGeocoderProps) {
  const [searchQuery, setSearchQuery] = useState(locationName);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<NominatimResult | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setResults([]);
    setSelectedResult(null);

    try {
      const searchResults = await nominatimService.search(searchQuery, {
        limit: 5,
        countrycodes: country ? getCountryCode(country) : undefined,
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: NominatimResult) => {
    setSelectedResult(result);
  };

  const handleUpdate = async () => {
    if (!selectedResult) return;

    setUpdating(true);

    try {
      const tableName = locationType === 'yacht_club' ? 'yacht_clubs' : 'sailing_venues';

      const { error } = await supabase
        .from(tableName)
        .update({
          coordinates_lat: selectedResult.lat,
          coordinates_lng: selectedResult.lng,
          osm_id: selectedResult.osmId,
          osm_type: selectedResult.osmType,
          osm_display_name: selectedResult.displayName,
          geocoded_at: new Date().toISOString(),
        })
        .eq('id', locationId);

      if (error) throw error;

      onUpdate?.();
      setResults([]);
      setSelectedResult(null);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  const calculateDistance = (lat: number, lng: number) => {
    const latDiff = Math.abs(lat - currentLat);
    const lngDiff = Math.abs(lng - currentLng);
    const distanceKm = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111;
    return distanceKm;
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Geocode Location</ThemedText>

      {/* Current Location */}
      <View style={styles.currentSection}>
        <ThemedText style={styles.sectionTitle}>Current Coordinates</ThemedText>
        <ThemedText style={styles.coordinates}>
          📍 {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
        </ThemedText>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Enter location name or address"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.searchButton, searching && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {results.length > 0 && (
        <ScrollView style={styles.resultsSection}>
          <ThemedText style={styles.sectionTitle}>Search Results</ThemedText>
          {results.map((result, index) => {
            const distance = calculateDistance(result.lat, result.lng);
            const isSelected = selectedResult?.osmId === result.osmId;

            return (
              <TouchableOpacity
                key={`${result.osmType}-${result.osmId}`}
                style={[styles.resultCard, isSelected && styles.resultCardSelected]}
                onPress={() => handleSelectResult(result)}
              >
                <View style={styles.resultHeader}>
                  <ThemedText style={styles.resultIndex}>#{index + 1}</ThemedText>
                  <View style={styles.distanceBadge}>
                    <ThemedText style={styles.distanceText}>
                      {distance < 1
                        ? `${(distance * 1000).toFixed(0)}m away`
                        : `${distance.toFixed(2)}km away`}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.resultName}>{result.displayName}</ThemedText>

                <View style={styles.resultCoordinates}>
                  <Ionicons name="location" size={14} color="#666" />
                  <ThemedText style={styles.coordinatesText}>
                    {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                  </ThemedText>
                </View>

                <View style={styles.resultMeta}>
                  <ThemedText style={styles.metaText}>
                    OSM: {result.osmType}/{result.osmId}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    Type: {result.addressType}
                  </ThemedText>
                </View>

                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#34c759" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Update Button */}
      {selectedResult && (
        <TouchableOpacity
          style={[styles.updateButton, updating && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <ThemedText style={styles.updateButtonText}>Update Location</ThemedText>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// Helper function to map country names to ISO codes
function getCountryCode(country: string): string {
  const countryCodeMap: Record<string, string> = {
    'Hong Kong SAR': 'hk',
    'United States': 'us',
    'United Kingdom': 'gb',
    'Australia': 'au',
    'New Zealand': 'nz',
    'China': 'cn',
    'Japan': 'jp',
    'Singapore': 'sg',
    'France': 'fr',
    'Italy': 'it',
    'Spain': 'es',
    'Germany': 'de',
  };

  return countryCodeMap[country] || '';
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  currentSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  searchSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  resultsSection: {
    maxHeight: 400,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resultCardSelected: {
    borderColor: '#34c759',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  distanceBadge: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  resultName: {
    fontSize: 14,
    marginBottom: 6,
  },
  resultCoordinates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  coordinatesText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginLeft: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 11,
    color: '#999',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  updateButton: {
    backgroundColor: '#34c759',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
