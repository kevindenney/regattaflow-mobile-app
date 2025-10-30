/**
 * RaceMapCard Component - WEB VERSION
 *
 * Interactive map showing race area with course, wind, and current overlays
 * Uses TacticalRaceMap (existing working implementation)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';
import { LayerToggle } from './LayerToggle';
import TacticalRaceMap from '@/components/race-strategy/TacticalRaceMap';
import { createLogger } from '@/lib/utils/logger';

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

// Convert course to format expected by TacticalRaceMap

const logger = createLogger('RaceMapCard.web');
const convertCourseToMarks = (course?: Course): any[] => {
  if (!course) return [];

  const marks: any[] = [];

  // Add course marks
  course.marks.forEach((mark, index) => {
    marks.push({
      id: `mark-${index}`,
      mark_name: mark.name || `Mark ${index + 1}`,
      mark_type: 'mark',
      latitude: mark.coordinate.latitude,
      longitude: mark.coordinate.longitude,
      sequence_order: index,
    });
  });

  return marks;
};

// Helper function to fetch environmental data based on coordinates
const fetchEnvironmentalData = async (lat: number, lng: number) => {
  // TODO: Replace with actual weather API call
  // Examples: OpenWeatherMap, NOAA, Windy API, Visual Crossing

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data - In production, this would come from weather API
  // You can integrate with services like:
  // - OpenWeatherMap: https://openweathermap.org/api/marine-weather
  // - NOAA: https://www.weather.gov/documentation/services-web-api
  // - Windy: https://api.windy.com/
  const mockData = {
    wind: {
      speed: 12 + Math.random() * 8, // Vary between 12-20 kts
      direction: 170 + Math.random() * 20, // Vary around 180°
      gust: 15 + Math.random() * 10,
    },
    tide: {
      current_speed: 0.3 + Math.random() * 0.4, // 0.3-0.7 kts
      current_direction: 220 + Math.random() * 20,
      state: Math.random() > 0.5 ? 'flood' : 'ebb',
    },
    wave: {
      height: 0.4 + Math.random() * 0.3, // 0.4-0.7m
      period: 3 + Math.random() * 2,
      direction: 175 + Math.random() * 15,
    },
  };

  return mockData;
};

export const RaceMapCard: React.FC<RaceMapCardProps> = ({
  mapRegion,
  course,
  windConditions,
  currentConditions,
  onCenterPress,
  onFullscreenPress,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Layer state - controls what layers are shown on the map
  const [mapLayers, setMapLayers] = useState({
    wind: true,
    current: true,
    waves: false,
    depth: false,
    laylines: false,
    strategy: false,
  });

  // Environmental data state - fetched based on racing area or map region
  const [liveEnvironmentalData, setLiveEnvironmentalData] = useState<any>(null);

  const handleLayerToggle = (layer: keyof typeof mapLayers) => {
    setMapLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const handleLayersChange = (layers: { [key: string]: boolean }) => {
    // Sync back from TacticalRaceMap if needed
    logger.debug('Layers changed from map:', layers);
  };

  // Racing area state with localStorage persistence
  const [racingArea, setRacingArea] = useState<Array<{ lat: number; lng: number }>>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo-racing-area');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved racing area:', e);
        }
      }
    }
    return [];
  });

  // Fetch environmental data when racing area or map region changes
  useEffect(() => {
    const fetchData = async () => {
      let lat, lng;

      if (racingArea.length > 0) {
        // Use center of racing area
        lat = racingArea.reduce((sum, p) => sum + p.lat, 0) / racingArea.length;
        lng = racingArea.reduce((sum, p) => sum + p.lng, 0) / racingArea.length;

      } else {
        // Fall back to map region center
        lat = mapRegion.latitude;
        lng = mapRegion.longitude;

      }

      try {
        const data = await fetchEnvironmentalData(lat, lng);
        setLiveEnvironmentalData(data);
      } catch (error) {

      }
    };

    fetchData();
  }, [racingArea, mapRegion]);

  const handleRacingAreaSelected = (coordinates: [number, number][]) => {
    // Convert to format expected by component
    const area = coordinates.map(([lng, lat]) => ({ lat, lng }));
    setRacingArea(area);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo-racing-area', JSON.stringify(area));

    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const centerOnVenue = () => {
    onCenterPress?.();
  };

  const handleFullscreen = () => {
    onFullscreenPress?.();
  };

  // Convert course to marks format
  const marks = convertCourseToMarks(course);

  // Prepare environmental data - uses live data from racing area or falls back to props
  const environmentalData: any = liveEnvironmentalData ? {
    current: {
      wind: {
        speed: liveEnvironmentalData.wind.speed,
        direction: liveEnvironmentalData.wind.direction,
        gust: liveEnvironmentalData.wind.gust,
      },
      tide: {
        current_speed: liveEnvironmentalData.tide.current_speed,
        current_direction: liveEnvironmentalData.tide.current_direction,
        state: liveEnvironmentalData.tide.state,
      },
      wave: {
        height: liveEnvironmentalData.wave.height,
        period: liveEnvironmentalData.wave.period,
        direction: liveEnvironmentalData.wave.direction,
      },
    },
  } : (windConditions || currentConditions ? {
    // Fallback to props if live data not yet loaded
    current: {
      wind: {
        speed: windConditions?.speed || 0,
        direction: windConditions?.direction || 0,
        gust: windConditions?.gusts || 0,
      },
      tide: {
        current_speed: currentConditions?.speed || 0,
        current_direction: currentConditions?.direction || 0,
        state: 'flood',
      },
      wave: {
        height: 0.5,
        period: 4,
        direction: windConditions?.direction || 0,
      },
    },
  } : undefined);

  // Create minimal raceEvent for TacticalRaceMap
  const raceEvent: any = {
    id: 'demo-race',
    name: 'Race Area',
    venue: {
      coordinates_lat: mapRegion.latitude,
      coordinates_lng: mapRegion.longitude,
    },
    racing_area_bounds: course?.path,
  };

  return (
    <Card style={styles.container} size="medium">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="map" size={24} color={colors.primary[600]} />
          <Text style={styles.title}>Race Area Map</Text>
        </View>

        <Pressable onPress={toggleExpand} hitSlop={8}>
          <Ionicons
            name={isExpanded ? 'contract' : 'expand'}
            size={20}
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
        <TacticalRaceMap
          raceEvent={raceEvent}
          marks={marks}
          environmental={environmentalData}
          showControls={false}
          allowAreaSelection={true}
          onRacingAreaSelected={handleRacingAreaSelected}
          initialRacingArea={racingArea}
          externalLayers={mapLayers}
          onLayersChange={handleLayersChange}
        />
      </View>

      {/* Map Layers Section */}
      <View style={styles.layersSection}>
        <Text style={styles.sectionTitle}>MAP LAYERS</Text>

        <View style={styles.layerRow}>
          <LayerToggle
            icon="cloudy-outline"
            label="Wind"
            isActive={mapLayers.wind}
            onToggle={() => handleLayerToggle('wind')}
            color={colors.wind}
          />
          <LayerToggle
            icon="water-outline"
            label="Current"
            isActive={mapLayers.current}
            onToggle={() => handleLayerToggle('current')}
            color={colors.current}
          />
          <LayerToggle
            icon="boat-outline"
            label="Waves"
            isActive={mapLayers.waves}
            onToggle={() => handleLayerToggle('waves')}
            color={colors.waves}
          />
          <LayerToggle
            icon="swap-vertical-outline"
            label="Depth"
            isActive={mapLayers.depth}
            onToggle={() => handleLayerToggle('depth')}
            color={colors.depth}
          />
        </View>
      </View>

      {/* Tactical Section */}
      <View style={styles.layersSection}>
        <Text style={styles.sectionTitle}>TACTICAL</Text>

        <View style={styles.layerRow}>
          <LayerToggle
            icon="navigate-outline"
            label="Laylines"
            isActive={mapLayers.laylines}
            onToggle={() => handleLayerToggle('laylines')}
            color={colors.laylines}
          />
          <LayerToggle
            icon="trending-up-outline"
            label="Strategy"
            isActive={mapLayers.strategy}
            onToggle={() => handleLayerToggle('strategy')}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: colors.text.primary,
  },
  mapContainer: {
    height: 300,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  mapContainerExpanded: {
    height: 600,
  },
  layersSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  layerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
