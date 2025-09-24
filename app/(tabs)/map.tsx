import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Map3DView } from '@/src/components/map/Map3DView';
import type { RaceMark, WeatherConditions } from '@/src/lib/types/map';

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

  const handleMarkPress = (mark: RaceMark) => {
    setSelectedMark(mark);
    Alert.alert(
      `Race Mark: ${mark.name}`,
      `Type: ${mark.type}\nRounding: ${mark.rounding}`,
      [{ text: 'OK' }]
    );
  };

  const handleMapPress = (coordinates: { latitude: number; longitude: number }) => {
    console.log('Map pressed at:', coordinates);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Nautical Map</ThemedText>
        <ThemedText type="subtitle">3D Racing Environment</ThemedText>
      </View>

      <Map3DView
        marks={sampleMarks}
        weather={sampleWeather}
        onMarkPress={handleMarkPress}
        onMapPress={handleMapPress}
      />

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
  info: {
    marginTop: 16,
    gap: 8,
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