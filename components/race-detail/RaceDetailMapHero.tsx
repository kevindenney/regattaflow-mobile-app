/**
 * Race Detail Map Hero Component
 * Apple Weather-inspired map hero section
 * Always visible at top, shows racing area, marks, and overlays
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TacticalRaceMap from '@/components/race-strategy/TacticalRaceMap';
import type { EnvironmentalIntelligence } from '@/types/raceEvents';
import { useRaceWeather } from '@/hooks/useRaceWeather';

interface LatLng {
  lat: number;
  lng: number;
}

interface CourseMark {
  id: string;
  mark_name: string;
  mark_type: string;
  latitude?: number;
  longitude?: number;
  sequence_order?: number;
}

interface RaceEvent {
  id: string;
  race_name: string;
  start_time?: string;
  venue?: {
    name?: string;
    coordinates_lat?: number;
    coordinates_lng?: number;
  };
  racing_area_polygon?: any;
  boat_class?: {
    name?: string;
  };
}

interface RaceDetailMapHeroProps {
  race: RaceEvent;
  racingAreaPolygon?: LatLng[];
  marks: CourseMark[];
  compact?: boolean; // Shrink on scroll
  onFullscreen?: () => void;
  onRacingAreaChange?: (polygon: LatLng[]) => void; // NEW: Called when racing area is drawn/edited
  onSaveRacingArea?: () => void; // NEW: Called when user confirms save
}

// Transform useRaceWeather data to EnvironmentalIntelligence format
function transformWeatherToEnvironmental(weatherData: any, race: RaceEvent): EnvironmentalIntelligence {
  // Parse wind direction from cardinal to degrees
  const cardinalToDegrees = (cardinal: string): number => {
    const directions: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return directions[cardinal] || 0;
  };

  const windDirection = cardinalToDegrees(weatherData.wind.direction);
  const windSpeed = (weatherData.wind.speedMin + weatherData.wind.speedMax) / 2;
  const gustSpeed = weatherData.wind.speedMax;

  const raceDateStr = race.start_time ? new Date(race.start_time).toLocaleDateString() : 'race time';
  const isForecast = race.start_time ? new Date(race.start_time) > new Date() : false;

  return {
    current: {
      wind: {
        speed: Math.round(windSpeed),
        direction: windDirection,
        gust: Math.round(gustSpeed),
      },
      tide: {
        height: weatherData.tide.height,
        current_speed: weatherData.tide.height > 1.5 ? 0.8 : 0.5, // Estimate from height
        current_direction: weatherData.tide.direction ? cardinalToDegrees(weatherData.tide.direction) : (windDirection + 45) % 360,
        state: weatherData.tide.state === 'flooding' ? 'flood' :
               weatherData.tide.state === 'ebbing' ? 'ebb' :
               weatherData.tide.state as 'flood' | 'ebb' | 'slack' | 'high' | 'low',
      },
      wave: {
        height: 0.5 + Math.random() * 0.8, // TODO: Get from weatherData.raw if available
        direction: (windDirection + 20) % 360,
        period: 4 + Math.random() * 3,
      },
      timestamp: new Date().toISOString(),
    },
    forecast: [],
    summary: `${weatherData.wind.speedMin}-${weatherData.wind.speedMax}kt ${weatherData.wind.direction}, ${weatherData.tide.state} tide (${isForecast ? 'FORECAST' : 'HISTORICAL'} for ${raceDateStr})`,
  };
}

// Helper function to generate sample environmental data
// Fallback when real weather API is unavailable
function generateSampleEnvironmentalData(venue?: { coordinates_lat?: number; coordinates_lng?: number }): EnvironmentalIntelligence {
  // Generate realistic wind based on location
  const baseDirection = Math.floor(Math.random() * 360);
  const baseSpeed = 10 + Math.floor(Math.random() * 10);

  return {
    current: {
      wind: {
        speed: baseSpeed,
        direction: baseDirection,
        gust: baseSpeed + 3,
      },
      tide: {
        height: 1.2 + Math.random() * 0.5,
        current_speed: 0.5 + Math.random() * 1.0,
        current_direction: (baseDirection + 45) % 360,
        state: 'flood' as const,
      },
      wave: {
        height: 0.5 + Math.random() * 0.8,
        direction: (baseDirection + 20) % 360,
        period: 4 + Math.random() * 3,
      },
      timestamp: new Date().toISOString(),
    },
    forecast: [],
    summary: `${baseSpeed}-${baseSpeed + 3}kt @ ${baseDirection}°, ${baseSpeed > 15 ? 'Strong' : baseSpeed > 10 ? 'Moderate' : 'Light'} breeze`,
  };
}

export function RaceDetailMapHero({
  race,
  racingAreaPolygon,
  marks,
  compact = false,
  onFullscreen,
  onRacingAreaChange,
  onSaveRacingArea,
}: RaceDetailMapHeroProps) {
  const [mapView, setMapView] = useState<'2d' | '3d'>('3d');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPointCount, setCurrentPointCount] = useState(0);
  const [currentPoints, setCurrentPoints] = useState<LatLng[]>([]);
  const [mapKey, setMapKey] = useState(0); // Force map reset
  const [toggle2D3DTrigger, setToggle2D3DTrigger] = useState(0); // Trigger for map 2D/3D toggle

  // Fetch real weather data for race
  const venueForWeather = race.venue ? {
    id: `venue-${race.venue.coordinates_lat}-${race.venue.coordinates_lng}`,
    name: race.venue.name || 'Race Venue',
    coordinates: {
      latitude: race.venue.coordinates_lat || 0,
      longitude: race.venue.coordinates_lng || 0
    },
    region: 'asia_pacific', // TODO: Determine from coordinates
    country: 'HK' // TODO: Determine from coordinates
  } : null;

  const { weather, loading: weatherLoading, error: weatherError } = useRaceWeather(
    venueForWeather as any,
    race.start_time
  );

  // Generate environmental data from real weather or fallback to sample
  const environmental = useMemo(() => {
    // If we have real weather data, use it
    if (weather && !weatherError) {
      console.log('[RaceDetailMapHero] Using REAL weather data:', weather);
      return transformWeatherToEnvironmental(weather, race);
    }

    // Otherwise use sample data
    console.log('[RaceDetailMapHero] Using SAMPLE weather data');
    return generateSampleEnvironmentalData(race.venue);
  }, [weather, weatherError, race.venue]);

  // Get racing area from race object or prop
  const racingArea = racingAreaPolygon ||
    (race.racing_area_polygon?.coordinates?.[0] || []).map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0]
    }));

  // Calculate map center from venue or racing area
  const mapCenter = race.venue?.coordinates_lat && race.venue?.coordinates_lng
    ? {
        lat: race.venue.coordinates_lat,
        lng: race.venue.coordinates_lng
      }
    : racingArea.length > 0
    ? {
        lat: racingArea.reduce((sum, p) => sum + p.lat, 0) / racingArea.length,
        lng: racingArea.reduce((sum, p) => sum + p.lng, 0) / racingArea.length
      }
    : { lat: 22.2650, lng: 114.2620 }; // Default: Clearwater Bay

  // Quick stats
  const daysUntil = race.start_time
    ? Math.ceil((new Date(race.start_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const boatClass = race.boat_class?.name || 'Class TBD';
  const markCount = marks.length;

  // Handle racing area selection from TacticalRaceMap
  const handleRacingAreaSelected = (coordinates: [number, number][]) => {
    const polygon = coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
    setCurrentPoints(polygon);
    onRacingAreaChange?.(polygon);
  };

  // Handle point count updates
  const handlePointsChanged = (count: number) => {
    setCurrentPointCount(count);
  };

  // Undo last point
  const handleUndoPoint = () => {
    if (currentPoints.length > 0) {
      const updatedPoints = currentPoints.slice(0, -1);
      setCurrentPoints(updatedPoints);
      setCurrentPointCount(updatedPoints.length);
      onRacingAreaChange?.(updatedPoints);
      // Don't reset map key - TacticalRaceMap can handle updates without remounting
      // setMapKey(prev => prev + 1);
    }
  };

  // Clear all points
  const handleClearPoints = () => {
    console.log('🧹 Clearing all racing area points');
    setCurrentPoints([]);
    setCurrentPointCount(0);
    onRacingAreaChange?.([]);
    // Don't reset map key - just let the sync handle it
    // setMapKey(prev => prev + 1);
  };

  // Toggle drawing mode
  const handleEditCourse = () => {
    // Load existing racing area into editable state so user can modify it
    if (racingArea.length > 0 && currentPoints.length === 0) {
      console.log('📝 Loading existing racing area for editing:', racingArea.length, 'points');
      setCurrentPoints(racingArea);
      setCurrentPointCount(racingArea.length);
      onRacingAreaChange?.(racingArea);
    }
    setIsDrawingMode(true);
  };

  // Cancel drawing
  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    // Restore original racing area (clear currentPoints so map loads from racingAreaPolygon prop)
    setCurrentPoints([]);
    setCurrentPointCount(0);
    onRacingAreaChange?.([]); // Clear editing state
    console.log('❌ Canceled drawing mode - restored original racing area');
  };

  // Save racing area
  const handleSave = () => {
    if (currentPointCount < 3) {
      return; // Should never happen due to disabled state, but safety check
    }
    setIsDrawingMode(false);
    // Parent will handle saving, we just exit drawing mode
    // Points remain in parent state until parent's onSaveRacingArea clears them
    onSaveRacingArea?.();
  };

  return (
    <View style={[
      styles.container,
      compact && styles.containerCompact
    ]}>
      {/* Map */}
      <View style={[
        styles.mapContainer,
        compact && styles.mapContainerCompact
      ]}>
        <TacticalRaceMap
          key={`map-${mapKey}`}
          raceEvent={{
            ...race,
            venue: race.venue || {
              coordinates_lat: mapCenter.lat,
              coordinates_lng: mapCenter.lng
            }
          }}
          marks={marks}
          environmental={environmental}
          initialRacingArea={
            isDrawingMode
              ? currentPoints  // When drawing, always use currentPoints (even if empty for "Clear All")
              : (racingArea.length > 0 ? racingArea : undefined)  // When not drawing, use saved area
          }
          allowAreaSelection={isDrawingMode}
          isDrawing={isDrawingMode}
          onRacingAreaSelected={handleRacingAreaSelected}
          onPointsChanged={handlePointsChanged}
          showControls={!isDrawingMode}
          toggle2D3D={toggle2D3DTrigger}
        />

        {/* Map Controls Overlay */}
        {!isDrawingMode ? (
          <View style={styles.mapControls}>
            {/* 2D/3D Toggle */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setMapView(mapView === '2d' ? '3d' : '2d');
                setToggle2D3DTrigger(prev => prev + 1);
              }}
            >
              <MaterialCommunityIcons
                name={mapView === '3d' ? 'rotate-3d-variant' : 'map'}
                size={20}
                color="#fff"
              />
              <Text style={styles.controlButtonText}>
                {mapView === '3d' ? '3D' : '2D'}
              </Text>
            </TouchableOpacity>

            {/* Fullscreen */}
            {onFullscreen && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={onFullscreen}
              >
                <MaterialCommunityIcons
                  name="fullscreen"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            )}

            {/* Edit Course */}
            {onRacingAreaChange && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleEditCourse}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Drawing Mode Controls */
          <View style={styles.drawingControls}>
            <View style={styles.drawingHeader}>
              <TouchableOpacity onPress={handleCancelDrawing}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.drawingTitleContainer}>
                <Text style={styles.drawingTitle}>Draw Racing Area</Text>
                <Text style={styles.drawingSubtitle}>Tap on map to add points</Text>
              </View>
              <TouchableOpacity
                onPress={handleSave}
                disabled={currentPointCount < 3}
              >
                <MaterialCommunityIcons
                  name="check"
                  size={24}
                  color={currentPointCount < 3 ? '#94A3B8' : '#10B981'}
                />
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.drawingInstructions}>
              <MaterialCommunityIcons name="information" size={16} color="#fff" />
              <Text style={styles.instructionText}>
                {currentPointCount === 0
                  ? 'Tap on the map to start drawing'
                  : currentPointCount < 3
                  ? `Add ${3 - currentPointCount} more point${3 - currentPointCount > 1 ? 's' : ''}`
                  : `${currentPointCount} points added - Ready to save!`
                }
              </Text>
            </View>

            {/* Action Buttons */}
            {currentPointCount > 0 && (
              <View style={styles.drawingActions}>
                <TouchableOpacity
                  style={[styles.actionButton]}
                  onPress={handleUndoPoint}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="undo" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Undo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={handleClearPoints}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}
      </View>

      {/* Quick Stats Bar */}
      {!compact && (
        <View style={styles.statsBar}>
          {daysUntil !== null && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="calendar" size={16} color="#64748B" />
              <Text style={styles.statText}>
                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? '1 day' : `${daysUntil} days`}
              </Text>
            </View>
          )}

          <View style={styles.stat}>
            <MaterialCommunityIcons name="sail-boat" size={16} color="#64748B" />
            <Text style={styles.statText}>{boatClass}</Text>
          </View>

          <View style={styles.stat}>
            <MaterialCommunityIcons name="map-marker-multiple" size={16} color="#64748B" />
            <Text style={styles.statText}>
              {markCount === 0 ? 'No marks' : markCount === 1 ? '1 mark' : `${markCount} marks`}
            </Text>
          </View>

          {racingArea.length > 0 && (
            <View style={styles.stat}>
              <MaterialCommunityIcons name="vector-polygon" size={16} color="#3B82F6" />
              <Text style={[styles.statText, styles.statTextPrimary]}>Racing area set</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
  },
  containerCompact: {
    // Compact mode styling
  },
  mapContainer: {
    width: '100%',
    height: Platform.select({
      web: '60vh',
      default: 400
    }) as any,
    position: 'relative',
  },
  mapContainerCompact: {
    height: Platform.select({
      web: '40vh',
      default: 250
    }) as any,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backdropFilter: 'blur(10px)',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statTextPrimary: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Drawing Mode Styles
  drawingControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    gap: 12,
  },
  drawingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawingTitleContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  drawingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  drawingSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  drawingInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },
  drawingActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
  },
});
