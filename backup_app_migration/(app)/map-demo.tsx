/**
 * 3D Map Demo Screen
 * Standalone demonstration of the MapLibre 3D mapping system
 * Access via: /(app)/map-demo
 */

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
import { router } from 'expo-router';
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

export default function MapDemoScreen() {
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
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="map" size={32} color="#0ea5e9" />
            <View>
              <ThemedText style={styles.title}>3D Map Demo</ThemedText>
              <ThemedText style={styles.subtitle}>
                MapLibre GL Professional Sailing
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                '🗺️ 3D Map Features',
                '• 3D race course visualization\n• Multiple map styles (Tactical, Racing, Navigation, Satellite)\n• Interactive mark placement\n• Professional marine-grade design\n• Cross-platform compatibility\n• Optimized for sailing environments',
                [{ text: 'Amazing!' }]
              );
            }}
          >
            <Ionicons name="information-circle" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* 3D Map */}
        <View style={styles.mapContainer}>
          <Map3D
            ref={map3DRef}
            center={[37.7749, -122.4194]} // San Francisco Bay
            zoom={14}
            pitch={45}
            bearing={0}
            raceCourse={demoCourse}
            onMapClick={handleMapClick}
            onMapLoad={() => {
              console.log('🗺️ Demo map loaded');
              // Auto-load demo course after a short delay
              setTimeout(loadDemoCourse, 1000);
            }}
            interactive={true}
          />

          {/* Map Controls Overlay */}
          <View style={styles.mapControls}>
            {/* Style Switcher */}
            <View style={styles.styleControls}>
              <ThemedText style={styles.controlLabel}>Map Style:</ThemedText>
              <View style={styles.styleButtons}>
                {(['tactical', 'racing', 'navigation', 'satellite'] as const).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.styleButton,
                      currentStyle === style && styles.activeStyleButton,
                    ]}
                    onPress={() => switchMapStyle(style)}
                  >
                    <Ionicons
                      name={
                        style === 'tactical' ? 'analytics' :
                        style === 'racing' ? 'boat' :
                        style === 'navigation' ? 'compass' :
                        'satellite'
                      }
                      size={16}
                      color={currentStyle === style ? '#0ea5e9' : '#f8fafc'}
                    />
                    <ThemedText style={[
                      styles.styleButtonText,
                      currentStyle === style && styles.activeStyleButtonText,
                    ]}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={loadDemoCourse}
              >
                <Ionicons name="refresh" size={20} color="#f8fafc" />
                <ThemedText style={styles.controlButtonText}>Reload Course</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={fitToCourse}
              >
                <Ionicons name="scan" size={20} color="#f8fafc" />
                <ThemedText style={styles.controlButtonText}>Fit to Course</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.primaryButton]}
                onPress={() => router.push('/(app)/club/race-builder')}
              >
                <Ionicons name="hammer" size={20} color="#fff" />
                <ThemedText style={styles.primaryButtonText}>Open Race Builder</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <ThemedText style={styles.instructionsTitle}>🌊 Try the 3D Map:</ThemedText>
          <ThemedText style={styles.instructionsText}>
            • Tap different style buttons to see tactical, racing, navigation, and satellite views{'\n'}
            • Click anywhere on the map to see coordinates{'\n'}
            • Use pinch/zoom and drag to navigate in 3D{'\n'}
            • This same map powers the Race Builder for creating professional sailing courses
          </ThemedText>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  actionButton: {
    padding: 8,
  },

  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },

  mapControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    gap: 16,
  },

  styleControls: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  styleButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  styleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeStyleButton: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderColor: '#0ea5e9',
  },
  styleButtonText: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '500',
  },
  activeStyleButtonText: {
    color: '#0ea5e9',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#475569',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  controlButtonText: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '500',
  },
  primaryButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },

  instructions: {
    margin: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
});