import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import Map3D, { Map3DRef } from '@/components/mapping/Map3D';

interface RaceMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
  lat: number;
  lng: number;
}

interface RaceCourse {
  id: string;
  name: string;
  type: 'windward_leeward' | 'triangle' | 'olympic' | 'custom';
  marks: RaceMark[];
  instructions: string;
  safety_notes: string[];
}

export default function MapScreen() {
  const map3DRef = useRef<Map3DRef>(null);
  const [currentStyle, setCurrentStyle] = useState<'tactical' | 'racing' | 'navigation' | 'satellite'>('tactical');

  // Demo race course - Windward-Leeward in San Francisco Bay
  const demoCourse: RaceCourse = {
    id: 'demo_course',
    name: 'San Francisco Bay Demo Course',
    type: 'windward_leeward',
    marks: [
      {
        id: 'start',
        name: 'Start Line',
        type: 'start',
        lat: 37.7749,
        lng: -122.4194,
      },
      {
        id: 'windward',
        name: 'Windward Mark',
        type: 'windward',
        lat: 37.7769,
        lng: -122.4194,
      },
      {
        id: 'leeward',
        name: 'Leeward Mark',
        type: 'leeward',
        lat: 37.7729,
        lng: -122.4194,
      },
      {
        id: 'finish',
        name: 'Finish Line',
        type: 'finish',
        lat: 37.7749,
        lng: -122.4194,
      },
    ],
    instructions: 'Windward-leeward course in San Francisco Bay. Start between committee boat and pin. Round windward mark to port, leeward mark to port, finish between committee boat and pin.',
    safety_notes: [
      'Monitor VHF channel 72 for race committee communications',
      'Be aware of commercial traffic in shipping lanes',
      'All competitors must wear life jackets',
    ],
  };

  const switchMapStyle = async (style: typeof currentStyle) => {
    setCurrentStyle(style);
    if (map3DRef.current) {
      await map3DRef.current.switchStyle(style);
    }
  };

  const loadDemoCourse = async () => {
    if (map3DRef.current) {
      await map3DRef.current.displayRaceCourse(demoCourse);
      Alert.alert(
        '🏁 Demo Course Loaded',
        'This is a sample windward-leeward course in San Francisco Bay. Tap the map to add more marks or use the style buttons to see different map views.',
        [{ text: 'Got it!' }]
      );
    }
  };

  const handleMapClick = async (coordinates: [number, number]) => {
    Alert.alert(
      '📍 Map Clicked',
      `Coordinates: ${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}\n\nIn the Race Builder, this would add a new race mark at this location.`,
      [{ text: 'OK' }]
    );
  };

  const fitToCourse = () => {
    if (map3DRef.current) {
      map3DRef.current.fitToCourse();
    }
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