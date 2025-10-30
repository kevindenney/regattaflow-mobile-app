/**
 * RaceMapCard Component - HERO ELEMENT
 *
 * Interactive map showing race area with course, wind, and current overlays
 * This is the most prominent visual element on the race detail page
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';
import { MapControlButton } from './MapControlButton';
import { LayerToggle } from './LayerToggle';

// Conditional imports for native only
let MapView: any;
let CourseOverlay: any;
let WindOverlay: any;
let CurrentOverlay: any;

if (Platform.OS !== 'web') {
  MapView = require('react-native-maps').default;
  CourseOverlay = require('./CourseOverlay').CourseOverlay;
  WindOverlay = require('./WindOverlay').WindOverlay;
  CurrentOverlay = require('./CurrentOverlay').CurrentOverlay;
}

// Type definition compatible with both web and native
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Course {
  startLine: Array<{ latitude: number; longitude: number }>;
  finishLine?: Array<{ latitude: number; longitude: number }>;
  marks: Array<{
    coordinate: { latitude: number; longitude: number };
    name?: string;
  }>;
  path: Array<{ latitude: number; longitude: number }>;
}

interface WindConditions {
  speed: number;
  direction: number;
  gusts?: number;
}

interface CurrentConditions {
  speed: number;
  direction: number;
  strength: 'slack' | 'moderate' | 'strong';
}

interface RaceMapCardProps {
  mapRegion: Region;
  course?: Course;
  windConditions?: WindConditions;
  currentConditions?: CurrentConditions;
  onCenterPress?: () => void;
  onFullscreenPress?: () => void;
}

export const RaceMapCard: React.FC<RaceMapCardProps> = ({
  mapRegion,
  course,
  windConditions,
  currentConditions,
  onCenterPress,
  onFullscreenPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [mapLayers, setMapLayers] = useState({
    wind: true,
    current: true,
    waves: false,
    depth: false,
    laylines: false,
    strategy: false,
  });

  const mapRef = useRef<any>(null);

  const toggleExpand = () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded(!isExpanded);
  };

  const toggle3D = () => {
    setIs3D(!is3D);
    if (!is3D) {
      mapRef.current?.animateCamera(
        {
          pitch: 45,
          altitude: 1000,
        },
        { duration: 500 }
      );
    } else {
      mapRef.current?.animateCamera(
        {
          pitch: 0,
        },
        { duration: 500 }
      );
    }
  };

  const centerOnVenue = () => {
    mapRef.current?.animateToRegion(mapRegion, 500);
    onCenterPress?.();
  };

  const handleFullscreen = () => {
    onFullscreenPress?.();
  };

  const toggleLayer = (layer: keyof typeof mapLayers) => {
    setMapLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <Card style={styles.container} size="medium">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="map" size={16} color={colors.primary[600]} />
          <Text style={styles.title}>Race Area Map</Text>
        </View>

        <Pressable onPress={toggleExpand} hitSlop={8}>
          <Ionicons
            name={isExpanded ? 'contract' : 'expand'}
            size={16}
            color={colors.text.secondary}
          />
        </Pressable>
      </View>

      {/* Map Container */}
      <View
        style={[
          styles.mapContainer,
          isExpanded && styles.mapContainerExpanded,
        ]}
      >
        {Platform.OS === 'web' ? (
          // Web fallback
          <View style={styles.webPlaceholder}>
            <Ionicons name="map-outline" size={40} color={colors.text.tertiary} />
            <Text style={styles.webPlaceholderText}>
              Interactive map available on mobile app
            </Text>
            <Text style={styles.webPlaceholderSubtext}>
              Download the iOS or Android app to view race area maps with live overlays
            </Text>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              mapType="hybrid"
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass={false}
              rotateEnabled
              pitchEnabled
            >
              {/* Course overlay */}
              {course && <CourseOverlay course={course} />}

              {/* Wind arrows */}
              {mapLayers.wind && windConditions && (
                <WindOverlay conditions={windConditions} region={mapRegion} />
              )}

              {/* Current arrows */}
              {mapLayers.current && currentConditions && (
                <CurrentOverlay conditions={currentConditions} region={mapRegion} />
              )}
            </MapView>

            {/* Map Controls - Top Right */}
            <View style={styles.mapControls}>
              <MapControlButton
                icon="locate"
                onPress={centerOnVenue}
                tooltip="Center on venue"
              />
              <MapControlButton
                icon={is3D ? 'cube' : 'cube-outline'}
                onPress={toggle3D}
                tooltip="3D View"
                isActive={is3D}
              />
              <MapControlButton
                icon="expand"
                onPress={handleFullscreen}
                tooltip="Fullscreen"
              />
            </View>
          </>
        )}
      </View>

      {/* Layer Toggles */}
      <View style={styles.layerToggles}>
        <Text style={styles.layerLabel}>MAP LAYERS</Text>

        <View style={styles.toggleRow}>
          <LayerToggle
            icon="cloudy-outline"
            label="Wind"
            isActive={mapLayers.wind}
            onToggle={() => toggleLayer('wind')}
            color={colors.wind}
          />
          <LayerToggle
            icon="water-outline"
            label="Current"
            isActive={mapLayers.current}
            onToggle={() => toggleLayer('current')}
            color={colors.current}
          />
          <LayerToggle
            icon="boat-outline"
            label="Waves"
            isActive={mapLayers.waves}
            onToggle={() => toggleLayer('waves')}
            color={colors.waves}
          />
          <LayerToggle
            icon="swap-vertical-outline"
            label="Depth"
            isActive={mapLayers.depth}
            onToggle={() => toggleLayer('depth')}
            color={colors.depth}
          />
        </View>
      </View>

      {/* Tactical Layers */}
      <View style={styles.layerToggles}>
        <Text style={styles.layerLabel}>TACTICAL</Text>

        <View style={styles.toggleRow}>
          <LayerToggle
            icon="navigate-outline"
            label="Laylines"
            isActive={mapLayers.laylines}
            onToggle={() => toggleLayer('laylines')}
            color={colors.laylines}
          />
          <LayerToggle
            icon="trending-up-outline"
            label="Strategy"
            isActive={mapLayers.strategy}
            onToggle={() => toggleLayer('strategy')}
            color={colors.strategy}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  title: {
    ...Typography.h3,
    fontSize: 13,
    color: colors.text.primary,
  },
  mapContainer: {
    height: 180,
    borderRadius: BorderRadius.small,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    position: 'relative',
  },
  mapContainerExpanded: {
    height: 380,
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 6,
    right: 6,
    gap: Spacing.xs,
  },
  layerToggles: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  layerLabel: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  webPlaceholderText: {
    ...Typography.h3,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  webPlaceholderSubtext: {
    ...Typography.body,
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 300,
  },
});
