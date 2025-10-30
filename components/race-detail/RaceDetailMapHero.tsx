/**
 * Race Detail Map Hero Component
 * Apple Weather-inspired map hero section
 * Always visible at top, shows racing area, marks, and overlays
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TacticalRaceMap from '@/components/race-strategy/TacticalRaceMap';
import type { EnvironmentalIntelligence, WeatherForecast } from '@/types/raceEvents';
import { useRaceWeather } from '@/hooks/useRaceWeather';

function detectRegionFromCoordinates(lat: number, lng: number): string {
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
}

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
  onRacingAreaChange?: (polygon: LatLng[]) => void; // Called when racing area is drawn/edited
  onSaveRacingArea?: () => void; // Called when user confirms save
  onMarkAdded?: (mark: Omit<CourseMark, 'id'>) => void; // Called when new mark is placed
  onMarkUpdated?: (mark: CourseMark) => void; // Called when mark is moved
  onMarkDeleted?: (markId: string) => void; // Called when mark is deleted
}

const MARK_TYPES: Array<{
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}> = [
  {
    id: 'committee_boat',
    name: 'Committee Boat',
    icon: 'ferry',
    color: '#f97316',
    description: 'Race committee signal boat - start/finish line end',
  },
  {
    id: 'pin',
    name: 'Pin Buoy',
    icon: 'map-marker',
    color: '#f97316',
    description: 'Start/finish line pin end',
  },
  {
    id: 'windward',
    name: 'Windward Mark',
    icon: 'flag',
    color: '#eab308',
    description: 'Top mark - round to port',
  },
  {
    id: 'leeward',
    name: 'Leeward Mark',
    icon: 'flag-outline',
    color: '#eab308',
    description: 'Bottom mark - downwind turning mark',
  },
  {
    id: 'gate_left',
    name: 'Gate A (Port)',
    icon: 'flag-triangle',
    color: '#8b5cf6',
    description: 'Leeward gate - port side',
  },
  {
    id: 'gate_right',
    name: 'Gate B (Starboard)',
    icon: 'flag-triangle',
    color: '#8b5cf6',
    description: 'Leeward gate - starboard side',
  },
  {
    id: 'offset',
    name: 'Offset Mark',
    icon: 'circle-outline',
    color: '#ec4899',
    description: 'Offset/spreader mark near windward mark',
  },
  {
    id: 'finish',
    name: 'Finish Mark',
    icon: 'flag-checkered',
    color: '#3b82f6',
    description: 'Finish line mark',
  },
];

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

  const tideState =
    weatherData.tide.state === 'flooding'
      ? 'flood'
      : weatherData.tide.state === 'ebbing'
      ? 'ebb'
      : (weatherData.tide.state as 'flood' | 'ebb' | 'slack' | 'high' | 'low');

  const tideCurrentSpeed = weatherData.tide.height > 1.5 ? 0.8 : 0.5;
  const tideCurrentDirection = weatherData.tide.direction
    ? cardinalToDegrees(weatherData.tide.direction)
    : (windDirection + 45) % 360;

  const waveSnapshot = {
    height: 0.5 + Math.random() * 0.8, // TODO: Replace when wave data available
    direction: (windDirection + 20) % 360,
    period: 4 + Math.random() * 3,
  };

  const snapshotTimestamp = race.start_time || new Date().toISOString();

  const forecastEntry: WeatherForecast = {
    time: snapshotTimestamp,
    wind: {
      speed: Math.round(windSpeed),
      direction: windDirection,
      gust: Math.round(gustSpeed),
    },
    tide: {
      height: weatherData.tide.height,
      current_speed: tideCurrentSpeed,
      current_direction: tideCurrentDirection,
      state: tideState,
    },
    wave: waveSnapshot,
    confidence: 'medium',
    provider: weatherData.raw?.sources?.primary || 'regional-weather-service',
  };

  return {
    current: {
      wind: {
        speed: Math.round(windSpeed),
        direction: windDirection,
        gust: Math.round(gustSpeed),
      },
      tide: {
        height: weatherData.tide.height,
        current_speed: tideCurrentSpeed, // Estimate from height
        current_direction: tideCurrentDirection,
        state: tideState,
      },
      wave: {
        ...waveSnapshot,
      },
      timestamp: new Date().toISOString(),
    },
    forecast: [forecastEntry],
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
  onMarkAdded,
  onMarkUpdated,
  onMarkDeleted,
}: RaceDetailMapHeroProps) {
  const [mapView, setMapView] = useState<'2d' | '3d'>('3d');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPointCount, setCurrentPointCount] = useState(0);
  const [currentPoints, setCurrentPoints] = useState<LatLng[]>([]);
  const [mapKey, setMapKey] = useState(0); // Force map reset
  const [toggle2D3DTrigger, setToggle2D3DTrigger] = useState(0); // Trigger for map 2D/3D toggle
  const [orientToWindTrigger, setOrientToWindTrigger] = useState(0); // Trigger for wind orientation

  // Mark management state
  const [isAddingMark, setIsAddingMark] = useState(false);
  const [selectedMarkType, setSelectedMarkType] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showMarkTypeModal, setShowMarkTypeModal] = useState(false);

  // Get racing area from race object or prop
  const racingArea = racingAreaPolygon ||
    (race.racing_area_polygon?.coordinates?.[0] || []).map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0]
    }));

  const hasRacingArea = racingArea.length >= 3;
  const racingAreaCentroid = hasRacingArea
    ? {
        lat: racingArea.reduce((sum, p) => sum + p.lat, 0) / racingArea.length,
        lng: racingArea.reduce((sum, p) => sum + p.lng, 0) / racingArea.length,
      }
    : null;

  // Calculate map center from venue or racing area
  const mapCenter = race.venue?.coordinates_lat && race.venue?.coordinates_lng
    ? {
        lat: race.venue.coordinates_lat,
        lng: race.venue.coordinates_lng
      }
    : racingAreaCentroid
    ? racingAreaCentroid
    : { lat: 22.2650, lng: 114.2620 }; // Default: Clearwater Bay

  const venueForWeather = useMemo(() => {
    if (racingAreaCentroid) {
      const { lat, lng } = racingAreaCentroid;
      return {
        id: `race-area-${race.id}`,
        name: race.venue?.name
          ? `${race.venue.name} Race Area`
          : 'Race Area',
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
        region: detectRegionFromCoordinates(lat, lng),
        country: 'Unknown',
      };
    }

    if (race.venue?.coordinates_lat && race.venue?.coordinates_lng) {
      const lat = race.venue.coordinates_lat;
      const lng = race.venue.coordinates_lng;
      return {
        id: `venue-${lat}-${lng}`,
        name: race.venue.name || 'Race Venue',
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
        region: detectRegionFromCoordinates(lat, lng),
        country: 'Unknown',
      };
    }

    return null;
  }, [
    racingAreaCentroid?.lat,
    racingAreaCentroid?.lng,
    race.id,
    race.venue?.coordinates_lat,
    race.venue?.coordinates_lng,
    race.venue?.name,
  ]);

  const { weather, loading: weatherLoading, error: weatherError } = useRaceWeather(
    venueForWeather as any,
    race.start_time
  );

  // Generate environmental data from real weather or fallback to sample
  const environmental = useMemo(() => {
    if (weather && !weatherError) {
      return transformWeatherToEnvironmental(weather, race);
    }

    const fallbackVenue = racingAreaCentroid
      ? { coordinates_lat: racingAreaCentroid.lat, coordinates_lng: racingAreaCentroid.lng }
      : race.venue;

    return generateSampleEnvironmentalData(fallbackVenue);
  }, [weather, weatherError, racingAreaCentroid, race.venue]);

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

  useEffect(() => {
    if (isDrawingMode && showLayerPanel) {
      setShowLayerPanel(false);
    }
  }, [isDrawingMode, showLayerPanel]);

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

      setCurrentPoints(racingArea);
      setCurrentPointCount(racingArea.length);
      onRacingAreaChange?.(racingArea);
    }
    setShowLayerPanel(false);
    setIsDrawingMode(true);
  };

  // Cancel drawing
  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    // Restore original racing area (clear currentPoints so map loads from racingAreaPolygon prop)
    setCurrentPoints([]);
    setCurrentPointCount(0);
    onRacingAreaChange?.([]); // Clear editing state

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

  // Mark management handlers
  const handleAddMark = (markType: string) => {

    setShowLayerPanel(false);
    setSelectedMarkType(markType);
    setIsAddingMark(true);
  };

  const handleMarkAdded = (mark: Omit<CourseMark, 'id'>) => {

    // Exit mark placement mode
    setIsAddingMark(false);
    setSelectedMarkType(null);
    // Notify parent
    onMarkAdded?.(mark);
  };

  const handleMarkUpdated = (mark: CourseMark) => {

    // Notify parent immediately for real-time updates
    onMarkUpdated?.(mark);
  };

  const handleMarkDeleted = (markId: string) => {

    // Notify parent
    onMarkDeleted?.(markId);
  };

  const handleMarkTypeSelect = (markType: string) => {
    setShowMarkTypeModal(false);
    handleAddMark(markType);
  };

  const handleResetView = () => {
    setShowLayerPanel(false);
    setIsDrawingMode(false);
    setCurrentPoints([]);
    setCurrentPointCount(0);
    setIsEditMode(false);
    setIsAddingMark(false);
    setSelectedMarkType(null);
    setMapView('2d');
    setMapKey(prev => prev + 1);
  };

  const renderToolbarButton = ({
    icon,
    label,
    onPress,
    active = false,
    disabled = false,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    active?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.toolbarButton,
        active && styles.toolbarButtonActive,
        disabled && styles.toolbarButtonDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={
          disabled
            ? 'rgba(255, 255, 255, 0.35)'
            : active
            ? '#1D4ED8'
            : '#F8FAFC'
        }
      />
      <Text
        style={[
          styles.toolbarButtonLabel,
          active && styles.toolbarButtonLabelActive,
          disabled && styles.toolbarButtonLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

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
          showControls={showLayerPanel && !isDrawingMode}
          toggle2D3D={toggle2D3DTrigger}
          orientToWind={orientToWindTrigger}
          isAddingMark={isAddingMark}
          selectedMarkType={selectedMarkType || undefined}
          isEditMode={isEditMode}
          onMarkAdded={handleMarkAdded}
          onMarkUpdated={handleMarkUpdated}
          onMarkDeleted={handleMarkDeleted}
          racingAreaPolygon={racingArea}
        />

        {/* Map Controls Overlay */}
        {!isDrawingMode && (
          <View style={styles.toolbarContainer}>
            {renderToolbarButton({
              icon: mapView === '3d' ? 'rotate-3d-variant' : 'map',
              label: mapView === '3d' ? '3D' : '2D',
              onPress: () => {
                setMapView(mapView === '2d' ? '3d' : '2d');
                setToggle2D3DTrigger(prev => prev + 1);
              },
              active: mapView === '3d',
            })}

            {renderToolbarButton({
              icon: 'layers-triple-outline',
              label: 'Layers',
              onPress: () => setShowLayerPanel(prev => !prev),
              active: showLayerPanel,
            })}

            {renderToolbarButton({
              icon: 'compass',
              label: 'Wind',
              onPress: () => setOrientToWindTrigger(prev => prev + 1),
              disabled: !environmental?.current?.wind,
            })}

            {renderToolbarButton({
              icon: 'pencil-ruler',
              label: racingArea.length > 0 ? 'Redraw' : 'Draw',
              onPress: handleEditCourse,
            })}

            {renderToolbarButton({
              icon: isEditMode ? 'cursor-move' : 'cursor-default-outline',
              label: 'Edit',
              onPress: () => setIsEditMode(prev => !prev),
              active: isEditMode,
            })}

            {renderToolbarButton({
              icon: 'map-marker-plus',
              label: 'Mark',
              onPress: () => {
                setShowLayerPanel(false);
                setShowMarkTypeModal(true);
              },
            })}

            {renderToolbarButton({
              icon: 'target-variant',
              label: 'Reset',
              onPress: handleResetView,
            })}

            {onFullscreen &&
              renderToolbarButton({
                icon: 'fullscreen',
                label: 'Expand',
                onPress: onFullscreen,
              })}
          </View>
        )}

        {isDrawingMode ? (
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

      {/* Mark Manager - Only show when not in drawing mode */}
      <Modal
        visible={showMarkTypeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMarkTypeModal(false)}
      >
        <View style={styles.markModal}>
          <View style={styles.markModalHeader}>
            <TouchableOpacity onPress={() => setShowMarkTypeModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.markModalTitle}>Add Course Mark</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.markModalInstructions}>
            <MaterialCommunityIcons name="information" size={20} color="#0066CC" />
            <Text style={styles.markModalInstructionsText}>
              Choose a mark type, then tap on the map to place it.
            </Text>
          </View>

            <ScrollView style={styles.markList}>
              {MARK_TYPES.map(markType => (
                <TouchableOpacity
                  key={markType.id}
                  style={styles.markCard}
                  onPress={() => handleMarkTypeSelect(markType.id)}
                >
                  <View style={[styles.markIcon, { backgroundColor: `${markType.color}20` }]}>
                    <MaterialCommunityIcons
                      name={markType.icon as any}
                      size={28}
                      color={markType.color}
                    />
                  </View>
                  <View style={styles.markInfo}>
                    <Text style={styles.markName}>{markType.name}</Text>
                    <Text style={styles.markDescription}>{markType.description}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
        </View>
      </Modal>
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
  toolbarContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 10,
    zIndex: 30,
  },
  toolbarButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  toolbarButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  toolbarButtonDisabled: {
    opacity: 0.6,
  },
  toolbarButtonLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  toolbarButtonLabelActive: {
    color: '#1D4ED8',
  },
  toolbarButtonLabelDisabled: {
    color: 'rgba(255, 255, 255, 0.45)',
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
  markModal: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  markModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  markModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  markModalInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  markModalInstructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  markList: {
    flex: 1,
    padding: 16,
  },
  markCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  markInfo: {
    flex: 1,
  },
  markName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  markDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
});
