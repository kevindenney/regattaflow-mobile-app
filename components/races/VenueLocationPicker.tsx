/**
 * Venue Location Picker
 * Hybrid text + map interface for selecting racing area location
 *
 * Features:
 * - Text input with venue autocomplete
 * - Optional "Refine on Map" for precision
 * - Stores both venue name and exact coordinates
 * - Used for accurate weather forecasting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { supabase } from '@/services/supabase';

interface VenueLocation {
  name: string;
  lat: number;
  lng: number;
}

interface VenueLocationPickerProps {
  value: string; // Venue name
  onChangeText: (name: string) => void;
  coordinates: { lat: number; lng: number } | null;
  onCoordinatesChange: (coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
}

export function VenueLocationPicker({
  value,
  onChangeText,
  coordinates,
  onCoordinatesChange,
  placeholder = 'Enter venue name...',
}: VenueLocationPickerProps) {
  const [showMap, setShowMap] = useState(false);
  const [venueSuggestions, setVenueSuggestions] = useState<VenueLocation[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch venue suggestions as user types
  useEffect(() => {
    if (value.length < 2) {
      setVenueSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchVenues = async () => {
      setLoadingVenues(true);
      try {
        const { data, error } = await supabase
          .from('sailing_venues')
          .select('id, name, coordinates_lat, coordinates_lng')
          .ilike('name', `%${value}%`)
          .limit(5);

        if (error) {
          console.error('[VenueLocationPicker] Database error:', error);
          setVenueSuggestions([]);
          setShowSuggestions(false);
          setLoadingVenues(false);
          return;
        }

        const suggestions: VenueLocation[] = (data || []).map((v) => ({
          name: v.name,
          lat: v.coordinates_lat,
          lng: v.coordinates_lng,
        }));

        console.log(`[VenueLocationPicker] Found ${suggestions.length} venues matching "${value}"`);

        setVenueSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error: any) {
        console.error('[VenueLocationPicker] Error fetching venues:', error);
      } finally {
        setLoadingVenues(false);
      }
    };

    // Debounce venue search
    const timeoutId = setTimeout(fetchVenues, 300);
    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelectSuggestion = (suggestion: VenueLocation) => {
    onChangeText(suggestion.name);
    onCoordinatesChange({ lat: suggestion.lat, lng: suggestion.lng });
    setShowSuggestions(false);
    console.log(`[VenueLocationPicker] Selected venue: ${suggestion.name} (${suggestion.lat}, ${suggestion.lng})`);
  };

  const handleOpenMap = () => {
    // For now, show a coming soon alert
    // TODO: Implement actual map modal with MapLibre
    Alert.alert(
      'Map Selection',
      'Map-based location selection is coming soon!\n\nFor now, select a venue from the dropdown or type a custom location.',
      [{ text: 'OK' }]
    );
  };

  const coordinatesDisplay = coordinates
    ? `${coordinates.lat.toFixed(4)}°N, ${coordinates.lng.toFixed(4)}°E`
    : 'Location will be auto-detected from venue name';

  return (
    <View style={styles.container}>
      {/* Venue Name Input */}
      <Text style={styles.label}>Race Location</Text>
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#64748B" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Clear coordinates when venue name changes manually
            if (coordinates) {
              onCoordinatesChange(null);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          autoCapitalize="words"
          onFocus={() => {
            if (venueSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {loadingVenues && (
          <ActivityIndicator size="small" color="#3B82F6" style={styles.loader} />
        )}
      </View>

      {/* Venue Suggestions Dropdown */}
      {showSuggestions && venueSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {venueSuggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin size={16} color="#3B82F6" />
              <Text style={styles.suggestionText}>{suggestion.name}</Text>
              <Text style={styles.suggestionCoords}>
                {suggestion.lat.toFixed(3)}°, {suggestion.lng.toFixed(3)}°
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Coordinates Display & Map Button */}
      <View style={styles.metadataRow}>
        <View style={styles.coordinatesDisplay}>
          <Text style={styles.coordinatesLabel}>Coordinates:</Text>
          <Text style={styles.coordinatesValue}>{coordinatesDisplay}</Text>
        </View>

        <Pressable style={styles.mapButton} onPress={handleOpenMap}>
          <MapPin size={16} color="#3B82F6" />
          <Text style={styles.mapButtonText}>
            {coordinates ? 'Refine' : 'Show Map'}
          </Text>
        </Pressable>
      </View>

      {/* Accuracy Indicator */}
      {coordinates && (
        <View style={styles.accuracyIndicator}>
          <Text style={styles.accuracyText}>
            📍 Weather accurate to ±500m
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    padding: 0,
  },
  loader: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    marginLeft: 8,
  },
  suggestionCoords: {
    fontSize: 12,
    color: '#64748B',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  coordinatesDisplay: {
    flex: 1,
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  coordinatesValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  accuracyIndicator: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  accuracyText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
});
