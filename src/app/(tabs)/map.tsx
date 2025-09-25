import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Map3DView } from '@/src/components/map/Map3DView';
import { ProfessionalMapScreen } from '@/src/components/map/ProfessionalMapScreen';
import type { RaceMark, WeatherConditions, AdvancedWeatherConditions, NavigationResult } from '@/src/lib/types/map';
import type { GeoLocation } from '@/src/lib/types/advanced-map';

const sampleMarks: RaceMark[] = [
  {
    id: '1',
    name: 'Start',
    position: { latitude: 37.8, longitude: -122.4 },
    type: 'start',
    rounding: 'port',
  },
  {
    id: '2',
    name: 'Mark 1',
    position: { latitude: 37.81, longitude: -122.39 },
    type: 'windward',
    rounding: 'port',
  },
  {
    id: '3',
    name: 'Finish',
    position: { latitude: 37.79, longitude: -122.41 },
    type: 'finish',
    rounding: 'port',
  },
];

const sampleWeather: WeatherConditions = {
  wind: {
    speed: 12,
    direction: 225,
    gusts: 15,
  },
  tide: {
    height: 2.1,
    direction: 'flood',
    speed: 0.8,
  },
  waves: {
    height: 1.2,
    period: 6,
    direction: 210,
  },
  timestamp: new Date(),
};

export default function MapScreen() {
  const [selectedMark, setSelectedMark] = useState<RaceMark | null>(null);
  const [professionalMode, setProfessionalMode] = useState(true);
  const [currentVenue, setCurrentVenue] = useState('san-francisco-bay');
  const [currentWeather, setCurrentWeather] = useState<AdvancedWeatherConditions | null>(null);

  // Professional API keys (these would come from secure storage)
  const apiKeys = {
    // MapLibre is open source - no API key needed for mapping
    'weatherapi-pro': '2d09ab7694e3475cbd080025252409',
    'predictwind-pro': 'demo-key',
    'worldtides-pro': 'demo-key',
    'aisstream-api': '01037d15e391c289c1d106479d8870e1df107f65',
    'meteomatics': 'demo-key',
    'meteomatics-user': 'demo-user'
  };

  const handleMarkPress = (mark: RaceMark) => {
    setSelectedMark(mark);
    Alert.alert(
      `Race Mark: ${mark.name}`,
      `Type: ${mark.type}\nRounding: ${mark.rounding}`,
      [{ text: 'OK' }]
    );
  };

  const handleMapPress = (coordinates: GeoLocation) => {
    console.log('Map pressed at:', coordinates);
  };

  const handleWeatherUpdate = (weather: AdvancedWeatherConditions) => {
    setCurrentWeather(weather);
    console.log('🌤️ Weather updated:', {
      wind: `${weather.wind.speed}kts @ ${weather.wind.direction}°`,
      pressure: `${weather.pressure.sealevel}mb`,
      confidence: `${Math.round(weather.forecast.confidence * 100)}%`
    });
  };

  const handleNavigationCalculated = (result: NavigationResult) => {
    console.log('🧭 Navigation calculated:', result);
    Alert.alert(
      'Tactical Analysis',
      `Distance: ${result.distance.nauticalMiles} nm\n` +
      `Bearing: ${result.bearing.true}°T\n` +
      `ETA: ${result.time.estimatedDuration * 60} minutes\n` +
      `Recommendation: ${result.time.courseRecommendation}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Professional Mode Toggle */}
      <View style={styles.header}>
        <ThemedText type="title">
          {professionalMode ? 'RegattaFlow Professional' : 'RegattaFlow Standard'}
        </ThemedText>
        <View style={styles.modeToggle}>
          <ThemedText
            type="subtitle"
            style={[
              styles.modeButton,
              !professionalMode && styles.activeModeButton
            ]}
            onPress={() => setProfessionalMode(false)}
          >
            Standard
          </ThemedText>
          <ThemedText
            type="subtitle"
            style={[
              styles.modeButton,
              professionalMode && styles.activeModeButton
            ]}
            onPress={() => setProfessionalMode(true)}
          >
            Professional
          </ThemedText>
        </View>
      </View>

      {/* Venue Selection */}
      <View style={styles.venueSelector}>
        <ThemedText style={styles.venueLabel}>Venue:</ThemedText>
        {['san-francisco-bay', 'newport-rhode-island', 'cowes-isle-of-wight', 'sydney-harbour'].map(venue => (
          <ThemedText
            key={venue}
            style={[
              styles.venueOption,
              currentVenue === venue && styles.activeVenueOption
            ]}
            onPress={() => setCurrentVenue(venue)}
          >
            {venue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </ThemedText>
        ))}
      </View>

      {/* Render appropriate map component */}
      {professionalMode ? (
        <ProfessionalMapScreen
          venue={currentVenue}
          marks={sampleMarks}
          initialWeather={currentWeather}
          onMarkPress={handleMarkPress}
          onMapPress={handleMapPress}
          onWeatherUpdate={handleWeatherUpdate}
          onNavigationCalculated={handleNavigationCalculated}
          professionalMode={true}
        />
      ) : (
        <Map3DView
          marks={sampleMarks}
          weather={sampleWeather}
          onMarkPress={handleMarkPress}
          onMapPress={handleMapPress}
        />
      )}

      {/* Professional Info Panel */}
      {professionalMode && currentWeather && (
        <View style={styles.professionalInfo}>
          <View style={styles.infoRow}>
            <ThemedText type="default">
              📍 {currentVenue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </ThemedText>
            <ThemedText type="default">
              🌬️ {currentWeather.wind.speed.toFixed(1)}kts @ {currentWeather.wind.direction}° •
              📊 {Math.round(currentWeather.forecast.confidence * 100)}% confidence
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="default">
              🌊 Pressure: {currentWeather.pressure.sealevel.toFixed(1)}mb ({currentWeather.pressure.trend})
            </ThemedText>
            <ThemedText type="default">
              📡 {currentWeather.forecast.source}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Standard Info Panel */}
      {!professionalMode && (
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <ThemedText type="default">📍 Race Area: San Francisco Bay</ThemedText>
            <ThemedText type="default">
              🌬️ {sampleWeather.wind.speed}kts SW • 🌊 {sampleWeather.tide.speed}kt flood
            </ThemedText>
          </View>
          {selectedMark && (
            <View style={styles.selectedInfo}>
              <ThemedText type="subtitle">Selected: {selectedMark.name}</ThemedText>
              <ThemedText type="default">Type: {selectedMark.type}</ThemedText>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 80,
  },
  activeModeButton: {
    backgroundColor: '#0066CC',
    color: '#FFFFFF',
  },
  venueSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  venueLabel: {
    fontWeight: '600',
    color: '#666666',
  },
  venueOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  activeVenueOption: {
    backgroundColor: '#0066CC',
    color: '#FFFFFF',
  },
  info: {
    marginTop: 16,
    gap: 8,
  },
  professionalInfo: {
    marginTop: 16,
    gap: 8,
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00FF88',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedInfo: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
});