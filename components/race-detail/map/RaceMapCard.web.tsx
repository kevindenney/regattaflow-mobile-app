/**
 * RaceMapCard Component - WEB VERSION
 *
 * Interactive map showing race area with course, wind, and current overlays
 * Uses TacticalRaceMap (existing working implementation)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { Typography, Spacing, BorderRadius, colors } from '@/constants/designSystem';
import { LayerToggle } from './LayerToggle';
import TacticalRaceMap from '@/components/race-strategy/TacticalRaceMap';
import { createLogger } from '@/lib/utils/logger';
import { useUnderwaterAnalysis } from '@/hooks/useUnderwaterAnalysis';
import type { SailingVenue } from '@/lib/types/global-venues';
import type { Polygon as GeoJSONPolygon } from 'geojson';

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

const inferRegionFromCoordinates = (lat: number, lng: number): string => {
  if (lat >= 22 && lat <= 23 && lng >= 113.5 && lng <= 114.5) {
    return 'asia-pacific';
  }
  if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -65) {
    return 'north-america';
  }
  if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
    return 'europe';
  }
  if (lat >= 30 && lat <= 46 && lng >= 129 && lng <= 146) {
    return 'asia-pacific';
  }
  if (lat >= -45 && lat <= -10 && lng >= 110 && lng <= 180) {
    return 'asia-pacific';
  }
  return 'global';
};

const buildPlaceholderVenue = (lat: number, lng: number, name: string): SailingVenue => {
  const now = new Date();
  return {
    id: `synthetic-${lat.toFixed(3)}-${lng.toFixed(3)}`,
    name,
    coordinates: [lng, lat],
    country: 'Unknown',
    region: inferRegionFromCoordinates(lat, lng),
    venueType: 'regional',
    timeZone: 'UTC',
    primaryClubs: [{
      id: 'synthetic-club',
      name: `${name} YC`,
      facilities: [],
      prestigeLevel: 'regional',
      membershipType: 'private'
    }],
    sailingConditions: {
      windPatterns: [],
      currentData: [],
      tidalInformation: undefined,
      typicalConditions: {
        windSpeed: { min: 5, max: 25, average: 12 },
        windDirection: { primary: 180 },
        waveHeight: { typical: 0.5, maximum: 2 },
        visibility: { typical: 10, minimum: 1 }
      },
      seasonalVariations: [],
      hazards: [],
      racingAreas: []
    },
    culturalContext: {
      primaryLanguages: [],
      sailingCulture: {
        tradition: 'modern',
        competitiveness: 'regional',
        formality: 'semi_formal',
        inclusivity: 'open',
        characteristics: []
      },
      racingCustoms: [],
      socialProtocols: [],
      economicFactors: {
        currency: 'USD',
        costLevel: 'high',
        entryFees: { typical: 0, range: { min: 0, max: 0 } },
        accommodation: { budget: 0, moderate: 0, luxury: 0 },
        dining: { budget: 0, moderate: 0, upscale: 0 },
        services: { rigger: 0, sail_repair: 0, chandlery: 'moderate' },
        tipping: { expected: false, contexts: [] }
      },
      regulatoryEnvironment: {
        racingRules: { authority: 'World Sailing', variations: [] },
        safetyRequirements: [],
        environmentalRestrictions: [],
        entryRequirements: []
      }
    },
    weatherSources: {
      primary: {
        name: 'Local Forecast',
        type: 'regional_model',
        region: 'local',
        accuracy: 'moderate',
        forecastHorizon: 48,
        updateFrequency: 6,
        specialties: []
      },
      updateFrequency: 6,
      reliability: 0.6
    },
    localServices: [],
    createdAt: now,
    updatedAt: now,
    dataQuality: 'estimated'
  };
};

const toRacingAreaPolygon = (
  areaPoints: Array<{ lat: number; lng: number }>,
  mapRegion: Region
): GeoJSONPolygon | null => {
  if (areaPoints.length >= 3) {
    const coordinates = areaPoints.map((point) => [point.lng, point.lat]);
    const first = coordinates[0];
    const closed = [...coordinates, first];
    return {
      type: 'Polygon',
      coordinates: [closed]
    };
  }

  const latDelta = mapRegion.latitudeDelta || 0.02;
  const lngDelta = mapRegion.longitudeDelta || 0.02;

  const halfLat = latDelta / 2;
  const halfLng = lngDelta / 2;

  const north = mapRegion.latitude + halfLat;
  const south = mapRegion.latitude - halfLat;
  const east = mapRegion.longitude + halfLng;
  const west = mapRegion.longitude - halfLng;

  return {
    type: 'Polygon',
    coordinates: [[
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south]
    ]]
  };
};

const bearingToCardinal = (direction?: number): string => {
  if (direction == null || Number.isNaN(direction)) {
    return 'variable';
  }
  const normalized = ((direction % 360) + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return dirs[(index + 8) % 8];
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

  const raceAreaPolygon = useMemo(
    () => toRacingAreaPolygon(racingArea, mapRegion),
    [racingArea, mapRegion]
  );

  const venueContext = useMemo(
    () => buildPlaceholderVenue(mapRegion.latitude, mapRegion.longitude, 'Race Venue'),
    [mapRegion.latitude, mapRegion.longitude]
  );

  const {
    analysis: waterAnalysis,
    loading: waterAnalysisLoading,
    error: waterAnalysisError
  } = useUnderwaterAnalysis({
    racingArea: raceAreaPolygon,
    venue: venueContext,
    raceTime: new Date(),
    raceDurationMinutes: 90,
    enabled: Boolean(raceAreaPolygon && venueContext)
  });

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

  const handleRacingAreaSelected = useCallback((coordinates: [number, number][]) => {
    // Convert to format expected by component
    const area = coordinates.map(([lng, lat]) => ({ lat, lng }));
    setRacingArea(area);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo-racing-area', JSON.stringify(area));

    }
  }, []);

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

  const currentSnapshot = waterAnalysis?.tidal.currentSnapshot;
  const accelerationHighlights = useMemo(() => {
    if (!waterAnalysis?.strategicFeatures?.accelerationZones) return [] as string[];
    return waterAnalysis.strategicFeatures.accelerationZones
      .map((zone) => zone.estimatedCurrent)
      .filter((speed): speed is number => typeof speed === 'number')
      .map((speed) => speed.toFixed(1))
      .slice(0, 3)
      .map((speed) => `Current seam ~${speed}kt`);
  }, [waterAnalysis?.strategicFeatures?.accelerationZones]);

  const analysisBullets = useMemo(() => {
    if (!waterAnalysis?.analysis) {
      return [] as string[];
    }
    return waterAnalysis.analysis
      .split('\n')
      .map((line) => line.replace(/^[-•]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);
  }, [waterAnalysis?.analysis]);

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
          waterAnalysis={waterAnalysis ?? undefined}
        />
      </View>

      <View style={styles.intelSection}>
        <Text style={styles.sectionTitle}>CURRENT STRATEGY</Text>
        {waterAnalysisLoading ? (
          <View style={styles.intelLoading}>
            <ActivityIndicator size="small" color={colors.current} />
            <Text style={styles.intelLoadingText}>Analyzing depth and tidal flow…</Text>
          </View>
        ) : waterAnalysisError ? (
          <Text style={styles.intelError}>Unable to generate water analysis: {waterAnalysisError.message}</Text>
        ) : waterAnalysis ? (
          <View style={styles.intelContent}>
            <Text style={styles.intelLine}>
              <Text style={styles.intelLabel}>Prevailing:</Text>{' '}
              {currentSnapshot?.speed?.toFixed(1) ?? '—'} kt {bearingToCardinal(currentSnapshot?.direction)} ({currentSnapshot?.phase ?? 'slack'})
            </Text>
            {accelerationHighlights.map((line, index) => (
              <Text key={`acc-${index}`} style={styles.intelLine}>• {line}</Text>
            ))}
            {analysisBullets.map((line, index) => (
              <Text key={`analysis-${index}`} style={styles.intelLine}>• {line}</Text>
            ))}
            <Text style={styles.intelCue}>{waterAnalysis.recommendations.startStrategy}</Text>
          </View>
        ) : (
          <Text style={styles.intelEmpty}>Enable the depth layer and define a race area to surface current insights.</Text>
        )}
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
  intelSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  intelLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  intelLoadingText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  intelError: {
    ...Typography.bodySmall,
    color: colors.danger[600],
  },
  intelContent: {
    gap: 4,
  },
  intelLine: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  intelLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  intelCue: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    color: colors.primary[600],
  },
  intelEmpty: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
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
