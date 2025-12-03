/**
 * TacticalRaceMap - Comprehensive 3D Race Visualization
 * "OnX Maps for Sailing" - Combines race course with environmental intelligence
 *
 * Features:
 * - 3D race course visualization with marks and lines
 * - Wind overlay with directional arrows and speed gradients
 * - Tide/current flow visualization
 * - Wave height gradient overlay
 * - Bathymetry/depth contours
 * - Strategic layers (laylines, favored side analysis)
 * - Real-time weather integration via WeatherAggregationService
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createLogger } from '@/lib/utils/logger';
import type {
  CourseMark,
  RaceEventWithDetails,
  EnvironmentalIntelligence,
  WindData,
  TideData,
  WaveData
} from '@/types/raceEvents';
import type { ParticleData, VisualizationLayers, OverlayPolygon } from '@/services/visualization/EnvironmentalVisualizationService';
import type { UnderwaterAnalysis, StrategicZone, BathymetricData } from '@/types/bathymetry';
import { buildEnvironmentalDeckLayers } from '@/components/map/layers/buildEnvironmentalDeckLayers';
import { BathymetryTileService, getBathymetryColorScale } from '@/services/BathymetryTileService';
import type { WeatherData } from '@/services/weather/RegionalWeatherService';
import {
  generateWaveDataPoints,
  getWaveHeightHeatmapLayerSpec,
  getSeaTemperatureGradientLayerSpec,
  getPredictiveCurrentsLayerSpec,
  type CurrentPrediction,
  type TemperatureDataPoint,
} from '@/components/map/overlays';
const isWeb = Platform.OS === 'web';
const logger = createLogger('TacticalRaceMap');
const BATHYMETRY_LAYER_IDS = ['bathymetry-raster', 'bathymetry-fill', 'bathymetry-contours', 'bathymetry-labels'];
const CURRENT_ACCELERATION_COLOR = '#0284c7';
const CURRENT_EDDY_COLOR = '#0ea5e9';

function inferRegionFromCoordinates(lat: number, lng: number): string {
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

// ============================================================================
// TYPES
// ============================================================================

interface TacticalRaceMapProps {
  raceEvent: RaceEventWithDetails;
  marks: CourseMark[];
  environmental?: EnvironmentalIntelligence;
  onMarkSelected?: (mark: CourseMark) => void;
  onRacingAreaSelected?: (coordinates: [number, number][]) => void;
  onPointsChanged?: (count: number) => void; // Real-time point count updates
  showControls?: boolean;
  allowAreaSelection?: boolean;
  isDrawing?: boolean; // External control of drawing state
  initialRacingArea?: Array<{ lat: number; lng: number }>; // Existing prop for initial area
  onUndoPoint?: () => void; // Callback to undo last point
  onClearPoints?: () => void; // Callback to clear all points
  toggle2D3D?: number; // Trigger value that changes to toggle 2D/3D mode
  orientToWind?: number; // Trigger value that changes to orient map to wind direction
  // External layer control
  externalLayers?: {
    wind?: boolean;
    current?: boolean;
    waves?: boolean;
    depth?: boolean;
    laylines?: boolean;
    strategy?: boolean;
  };
  onLayersChange?: (layers: { [key: string]: boolean }) => void;
  // Mark placement and editing
  isAddingMark?: boolean; // True when user is in mark placement mode
  selectedMarkType?: string; // Type of mark to place (e.g., 'windward', 'leeward')
  isEditMode?: boolean; // True when marks can be dragged
  onMarkAdded?: (mark: Omit<CourseMark, 'id'>) => void; // Callback when new mark is placed
  onMarkUpdated?: (mark: CourseMark) => void; // Callback when mark position changes
  onMarkDeleted?: (markId: string) => void; // Callback when mark is deleted
  racingAreaPolygon?: Array<{ lat: number; lng: number }>; // Current racing area for auto-regeneration
  waterAnalysis?: UnderwaterAnalysis;
  stormGlassWeather?: WeatherData | null;
}

interface MapLayer {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  category: 'environmental' | 'tactical' | 'professional' | 'base';
  description: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TacticalRaceMap({
  raceEvent,
  marks,
  environmental,
  onMarkSelected,
  onRacingAreaSelected,
  onPointsChanged,
  showControls = true,
  allowAreaSelection = false,
  isDrawing = false,
  initialRacingArea,
  toggle2D3D: toggle2D3DTrigger,
  orientToWind: orientToWindTrigger,
  externalLayers,
  onLayersChange,
  isAddingMark = false,
  selectedMarkType,
  isEditMode = false,
  onMarkAdded,
  onMarkUpdated,
  onMarkDeleted,
  racingAreaPolygon,
  waterAnalysis,
  stormGlassWeather
}: TacticalRaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const lastCenterRef = useRef<[number, number] | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const hasAutoGeneratedRef = useRef(false); // Prevent infinite loop in auto-course generation
  const overlayRegistryRef = useRef<Record<string, { layers: string[]; sources: string[] }>>({});
  const overlaySignatureRef = useRef<Record<string, string>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false); // Default to 2D
  const [showGlobalBathymetry, setShowGlobalBathymetry] = useState(false);

  const bathymetryService = useMemo(() => new BathymetryTileService(), []);
  const bathymetryColorExpression = useMemo(() => {
    const scale = getBathymetryColorScale();
    const expression: any[] = [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'depth'], ['get', 'DEPTH'], ['get', 'Depth'], ['get', 'depth_m'], 0],
    ];

    scale.forEach(({ depth, color }) => {
      expression.push(depth);
      expression.push(color);
    });

    return expression;
  }, []);

  const depthLegendItems = useMemo(() => {
    const getColor = (depth: number, fallback: string) => {
      try {
        return bathymetryService.getDepthColor(depth);
      } catch {
        return fallback;
      }
    };

    return [
      {
        label: 'Shoal relief (≤10 m)',
        description: 'Leverage for near-shore eddy relief and slack holds.',
        color: getColor(-6, '#ace0f0')
      },
      {
        label: 'Channel jet (10–25 m)',
        description: 'Acceleration lane for flood-driven punches.',
        color: getColor(-18, '#6ec3d8')
      },
      {
        label: 'Mid-harbour flow (25–40 m)',
        description: 'Primary set felt across the racing box.',
        color: getColor(-32, '#3da5c0')
      }
    ];
  }, [bathymetryService]);

  const getMarkCoordinate = useCallback((mark: CourseMark) => {
    const lat =
      (mark as any).coordinates_lat ??
      (mark as any).latitude ??
      0;
    const lng =
      (mark as any).coordinates_lng ??
      (mark as any).longitude ??
      0;

    return { lat, lng };
  }, []);

  const courseHeading = useMemo(() => {
    if (!marks || marks.length < 2) {
      return 0;
    }
    const start = getMarkCoordinate(marks[0]);
    const target = getMarkCoordinate(marks[1]);
    return calculateBearingDegrees(start.lat, start.lng, target.lat, target.lng);
  }, [marks, getMarkCoordinate]);

  const predictiveCurrentSet = useMemo(
    () => buildPredictiveCurrentSet(stormGlassWeather, courseHeading),
    [stormGlassWeather, courseHeading]
  );

  const bathymetryVenue = useMemo(() => {
    const venue = raceEvent?.venue;
    const lat =
      venue?.coordinates_lat ??
      (venue as any)?.latitude ??
      (Array.isArray((venue as any)?.coordinates) ? (venue as any).coordinates[1] : null);
    const lng =
      venue?.coordinates_lng ??
      (venue as any)?.longitude ??
      (Array.isArray((venue as any)?.coordinates) ? (venue as any).coordinates[0] : null);

    if (lat == null || lng == null) {
      return null;
    }

    const region =
      (venue as any)?.region ??
      inferRegionFromCoordinates(lat, lng);

    return {
      id: (venue as any)?.id ?? `venue-${raceEvent?.id ?? 'unknown'}`,
      name: venue?.name ?? 'Race Venue',
      country: (venue as any)?.country ?? 'Unknown',
      region,
      coordinates: [lng, lat],
    } as any;
  }, [
    raceEvent?.id,
    raceEvent?.venue?.name,
    raceEvent?.venue?.coordinates_lat,
    raceEvent?.venue?.coordinates_lng,
    (raceEvent?.venue as any)?.latitude,
    (raceEvent?.venue as any)?.longitude,
    (raceEvent?.venue as any)?.region,
    (raceEvent?.venue as any)?.country,
  ]);

  const bathymetrySources = useMemo(() => {
    if (!bathymetryVenue) {
      return null;
    }

    try {
      const sources = bathymetryService.getBathymetrySources(bathymetryVenue);
      return sources;
    } catch (error) {
      return null;
    }
  }, [bathymetryService, bathymetryVenue]);

  const addBathymetryLayers = useCallback(async (map: any) => {
    if (!bathymetrySources) {
      return;
    }

    const { raster, contours, recommendation } = bathymetrySources;
    const shouldShowRaster = showGlobalBathymetry && recommendation.showRaster;

    // Find the first land/landcover layer to insert bathymetry below it
    // This ensures bathymetry only shows over water areas
    const mapLayers = map.getStyle()?.layers || [];
    const landLayer = mapLayers.find((l: any) =>
      l.id?.includes('land') ||
      l.id?.includes('landcover') ||
      l.id?.includes('landuse') ||
      l.source === 'composite' && l['source-layer']?.includes('land')
    );
    const beforeLayer = landLayer?.id || (map.getLayer('course-lines') ? 'course-lines' : undefined);

    if (shouldShowRaster) {
      if (!map.getSource('bathymetry-raster')) {
        map.addSource('bathymetry-raster', {
          type: 'raster',
          tiles: raster.tiles,
          tileSize: raster.tileSize,
          maxzoom: raster.maxzoom,
          attribution: raster.attribution,
        });
      }

      if (!map.getLayer('bathymetry-raster')) {
        map.addLayer(
          {
            id: 'bathymetry-raster',
            type: 'raster',
            source: 'bathymetry-raster',
            paint: {
              'raster-opacity': recommendation.rasterOpacity ?? 0.55,
            },
            layout: {
              visibility: 'visible',
            },
          },
          beforeLayer
        );
      } else {
        map.setLayoutProperty('bathymetry-raster', 'visibility', 'visible');
        map.setPaintProperty('bathymetry-raster', 'raster-opacity', recommendation.rasterOpacity ?? 0.55);
      }
    } else if (map.getLayer('bathymetry-raster')) {
      map.setLayoutProperty('bathymetry-raster', 'visibility', 'none');
    }

    if (recommendation.showContours) {
      if (!map.getSource('bathymetry-contours')) {
        map.addSource('bathymetry-contours', {
          type: 'geojson',
          data: contours.data,
        });
      }

      if (!map.getLayer('bathymetry-fill')) {
        map.addLayer(
          {
            id: 'bathymetry-fill',
            type: 'fill',
            source: 'bathymetry-contours',
            paint: {
              'fill-color': bathymetryColorExpression,
              'fill-opacity': 0.28,
            },
            layout: {
              visibility: 'visible',
            },
          },
          beforeLayer
        );
      } else {
        map.setLayoutProperty('bathymetry-fill', 'visibility', 'visible');
        map.setPaintProperty('bathymetry-fill', 'fill-opacity', 0.28);
      }

      if (!map.getLayer('bathymetry-contours')) {
        map.addLayer(
          {
            id: 'bathymetry-contours',
            type: 'line',
            source: 'bathymetry-contours',
            paint: {
              'line-color': bathymetryColorExpression,
              'line-width': 1,
              'line-opacity': recommendation.contourOpacity ?? 0.45,
            },
            layout: {
              visibility: 'visible',
            },
          },
          beforeLayer
        );
      } else {
        map.setLayoutProperty('bathymetry-contours', 'visibility', 'visible');
        map.setPaintProperty('bathymetry-contours', 'line-opacity', recommendation.contourOpacity ?? 0.45);
      }
    } else if (map.getLayer('bathymetry-contours')) {
      map.setLayoutProperty('bathymetry-contours', 'visibility', 'none');
    }

    if (!recommendation.showContours && map.getLayer('bathymetry-fill')) {
      map.setLayoutProperty('bathymetry-fill', 'visibility', 'none');
    }

    if (recommendation.showLabels) {
      const depthLabelExpression: any = [
        'case',
        ['has', 'label'],
        ['get', 'label'],
        ['concat', ['to-string', ['round', ['abs', ['get', 'depth']]]], ' m']
      ];

      if (!map.getLayer('bathymetry-labels')) {
        map.addLayer(
          {
            id: 'bathymetry-labels',
            type: 'symbol',
            source: 'bathymetry-contours',
            layout: {
              visibility: 'visible',
              'text-field': depthLabelExpression,
              'text-size': recommendation.labelSize ?? 12,
              'symbol-placement': 'point',
              'text-anchor': 'center',
              'text-justify': 'center',
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': recommendation.labelColor ?? '#f8fafc',
              'text-halo-color': recommendation.labelHaloColor ?? 'rgba(15, 23, 42, 0.75)',
              'text-halo-width': recommendation.labelHaloWidth ?? 1.2,
            },
          },
          beforeLayer
        );
      } else {
        map.setLayoutProperty('bathymetry-labels', 'visibility', 'visible');
        map.setLayoutProperty('bathymetry-labels', 'text-size', recommendation.labelSize ?? 12);
        map.setPaintProperty('bathymetry-labels', 'text-color', recommendation.labelColor ?? '#f8fafc');
        map.setPaintProperty('bathymetry-labels', 'text-halo-color', recommendation.labelHaloColor ?? 'rgba(15, 23, 42, 0.75)');
        map.setPaintProperty('bathymetry-labels', 'text-halo-width', recommendation.labelHaloWidth ?? 1.2);
        map.setLayoutProperty('bathymetry-labels', 'text-field', depthLabelExpression);
      }
    } else if (map.getLayer('bathymetry-labels')) {
      map.setLayoutProperty('bathymetry-labels', 'visibility', 'none');
    }
  }, [bathymetrySources, bathymetryColorExpression, showGlobalBathymetry]);

  const raceStartDate = useMemo(() => {
    if (!raceEvent?.start_time) return null;
    const date = new Date(raceEvent.start_time);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [raceEvent?.start_time]);

  const displayConditions = useMemo(() => {
    if (!environmental) return null;
    const now = new Date();

    if (
      raceStartDate &&
      environmental.forecast &&
      environmental.forecast.length > 0 &&
      raceStartDate.getTime() > now.getTime()
    ) {
      const target = environmental.forecast.reduce((closest, entry) => {
        const entryTime = new Date(entry.time);
        const diff = Math.abs(entryTime.getTime() - raceStartDate.getTime());

        if (!closest) {
          return { entry, diff };
        }

        return diff < closest.diff ? { entry, diff } : closest;
      }, null as { entry: any; diff: number } | null);

      return {
        snapshot: (target?.entry ?? environmental.forecast[0]) as any,
        isForecast: true,
      };
    }

    return {
      snapshot: environmental.current as any,
      isForecast: false,
    };
  }, [environmental, raceStartDate]);

  // Component mount/unmount tracking
  useEffect(() => {
    return () => {
    };
  }, []);

  // Track previous marks to prevent unnecessary re-renders
  const prevMarksRef = useRef<string>('');
  const marksSignature = useMemo(() => {
    return JSON.stringify(marks.map(m => ({
      id: m.id,
      lat: (m as any).coordinates_lat || (m as any).latitude,
      lng: (m as any).coordinates_lng || (m as any).longitude,
      name: (m as any).mark_name || (m as any).name,
      type: (m as any).mark_type || (m as any).type,
    })));
  }, [marks]);

  // Racing area selection state
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  // INTERNAL state management - this is what makes it work!
  const [racingAreaPoints, setRacingAreaPoints] = useState<[number, number][]>([]);

  // Draggable points state (for racing area)
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);

  const lastRacingAreaSignatureRef = useRef<string | null>(null);
  const lastDrawingModeRef = useRef<boolean>(false);
  const lastMapLoadedRef = useRef<boolean>(false);
  const lastRecenterTsRef = useRef<number>(0);

  // Draggable marks state
  const [isDraggingMark, setIsDraggingMark] = useState(false);
  const [draggedMarkId, setDraggedMarkId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Sync external isDrawing prop with internal isDrawingArea state
  useEffect(() => {
    if (isDrawing !== isDrawingArea) {
      setIsDrawingArea(isDrawing);
    }
  }, [isDrawing]);

  // Handle external 2D/3D toggle trigger
  useEffect(() => {
    if (toggle2D3DTrigger && toggle2D3DTrigger > 0) {
      toggle2D3D();
    }
  }, [toggle2D3DTrigger]);

  // Handle wind orientation trigger
  useEffect(() => {
    if (!orientToWindTrigger || orientToWindTrigger === 0) return;
    if (!mapRef.current || !environmental?.current?.wind) return;

    const map = mapRef.current;
    const windDirection = environmental.current.wind.direction;

    // Rotate map bearing to align with wind direction
    // Wind comes FROM the direction specified, so we rotate to face downwind
    map.easeTo({
      bearing: windDirection, // Set bearing to wind direction
      duration: 1000,
      pitch: is3D ? 45 : 0, // Maintain current pitch
    });
  }, [orientToWindTrigger, environmental, is3D]);

  // Track the last applied initial racing area to prevent repeated state churn
  const lastInitialAreaKeyRef = useRef<string | null>(null);
  const racingAreaPointsSignature = useMemo(() => {
    return racingAreaPoints.map(([lng, lat]) => `${lng.toFixed(6)}:${lat.toFixed(6)}`).join('|');
  }, [racingAreaPoints]);

  // Normalize incoming racing area for comparison
  const normalizedInitialArea = useMemo(() => {
    if (!initialRacingArea || initialRacingArea.length === 0) {
      return { key: null, coordinates: [] as [number, number][] };
    }
    const coordinates = initialRacingArea.map((point) => [
      typeof point.lng === 'number' ? point.lng : Number(point.lng),
      typeof point.lat === 'number' ? point.lat : Number(point.lat),
    ]) as [number, number][];

    // Build a stable signature so identical polygons don't retrigger updates
    const key = coordinates.map(([lng, lat]) => `${lng.toFixed(6)}:${lat.toFixed(6)}`).join('|');
    return { key, coordinates };
  }, [initialRacingArea]);

  // Initialize racing area from prop on mount or when prop changes meaningfully
  useEffect(() => {
    const { key, coordinates } = normalizedInitialArea;

    if (!key) {
      // Only clear when we previously synced from an initial polygon prop.
      // This prevents wipes while the user is actively drawing a new area.
      if (lastInitialAreaKeyRef.current) {
        lastInitialAreaKeyRef.current = null;
        setRacingAreaPoints([]);
      }
      return;
    }

    if (lastInitialAreaKeyRef.current === key) {
      return;
    }

    lastInitialAreaKeyRef.current = key;

    // Only update when the polygon actually changed
    const isDifferent =
      coordinates.length !== racingAreaPoints.length ||
      coordinates.some((coord, index) => {
        const existing = racingAreaPoints[index];
        if (!existing) {
          return true;
        }
        const [lng, lat] = coord;
        const [existingLng, existingLat] = existing;
        return Math.abs(existingLng - lng) > 0.000001 || Math.abs(existingLat - lat) > 0.000001;
      });

    if (isDifferent) {
      setRacingAreaPoints(coordinates);
    }
  }, [normalizedInitialArea, racingAreaPointsSignature]);

  // Notify parent of point count changes
  useEffect(() => {
    onPointsChanged?.(racingAreaPoints.length);
  }, [racingAreaPoints.length, racingAreaPoints]);
  // Note: Intentionally omitting onPointsChanged from deps to avoid infinite loops
  // The callback reference may change on every render, but we only care about point changes

  // Layer state - initialize from externalLayers if provided
  const [layers, setLayers] = useState<MapLayer[]>(() => {
    const initialLayers = [
      { id: 'wind', name: 'Wind', icon: 'flag-outline', enabled: externalLayers?.wind ?? true, category: 'environmental', description: 'Wind direction and speed' },
      { id: 'current', name: 'Current', icon: 'water-outline', enabled: externalLayers?.current ?? true, category: 'environmental', description: 'Tidal current flow' },
      { id: 'waves', name: 'Waves', icon: 'trending-up-outline', enabled: externalLayers?.waves ?? false, category: 'environmental', description: 'Wave height gradient' },
      { id: 'depth', name: 'Depth', icon: 'layers-outline', enabled: externalLayers?.depth ?? false, category: 'environmental', description: 'Bathymetry contours' },
      { id: 'laylines', name: 'Laylines', icon: 'git-branch-outline', enabled: externalLayers?.laylines ?? false, category: 'tactical', description: 'Upwind laylines' },
      { id: 'strategy', name: 'Strategy', icon: 'analytics-outline', enabled: externalLayers?.strategy ?? false, category: 'tactical', description: 'Tactical analysis' },
      { id: 'waveHeatmap', name: 'Wave Heatmap', icon: 'color-filter-outline', enabled: false, category: 'professional', description: 'Storm-driven wave height heatmap' },
      { id: 'seaTemperature', name: 'Sea Temp', icon: 'thermometer-outline', enabled: false, category: 'professional', description: 'Sea surface temperature gradient' },
      { id: 'predictiveCurrents', name: 'Currents Forecast', icon: 'refresh-circle-outline', enabled: false, category: 'professional', description: '6-hour current forecast vectors' },
    ];
    return initialLayers;
  });

  const depthLayerEnabled = useMemo(() => {
    const enabled = layers.find((layer) => layer.id === 'depth')?.enabled ?? false;
    return enabled;
  }, [layers]);

  useEffect(() => {
    if (!depthLayerEnabled && showGlobalBathymetry) {
      setShowGlobalBathymetry(false);
    }
  }, [depthLayerEnabled, showGlobalBathymetry]);

  const updateDeckOverlay = useCallback(() => {
    if (!isWeb || !mapLoaded || !mapRef.current) {
      return;
    }

    const overlay = deckOverlayRef.current;
    if (!overlay) {
      return;
    }

    const map = mapRef.current;
    const transform = map?.transform || map?._tr;

    if (!transform || !transform.width || !transform.height) {
      try {
        overlay.setProps({ layers: [] });
      } catch (err) {
        console.warn('Failed to clear deck.gl layers:', err);
      }
      return;
    }

    if (!environmental || !environmental.current) {
      try {
        overlay.setProps({ layers: [] });
      } catch (err) {
        console.warn('Failed to clear deck.gl layers:', err);
      }
      return;
    }

    const bounds = map.getBounds?.();
    if (!bounds) {
      try {
        overlay.setProps({ layers: [] });
      } catch (err) {
        console.warn('Failed to clear deck.gl layers:', err);
      }
      return;
    }

    const windEnabled = layers.find((layer) => layer.id === 'wind')?.enabled ?? true;
    const currentEnabled = layers.find((layer) => layer.id === 'current')?.enabled ?? true;

    const windParticles = windEnabled
      ? createWindParticles(bounds, environmental.current.wind)
      : [];

    const currentParticles = currentEnabled
      ? (waterAnalysis?.current?.samples?.length
        ? createParticlesFromSamples(waterAnalysis.current.samples)
        : createCurrentParticles(bounds, environmental.current.tide))
      : [];

    const accelerationOverlays = currentEnabled
      ? convertStrategicZonesToOverlay(
          waterAnalysis?.strategicFeatures?.accelerationZones,
          'current-acceleration',
          CURRENT_ACCELERATION_COLOR
        )
      : [];

    const eddyOverlays = currentEnabled
      ? convertStrategicZonesToOverlay(
          waterAnalysis?.strategicFeatures?.eddyZones,
          'current-eddy',
          CURRENT_EDDY_COLOR
        )
      : [];

    const vizLayers: VisualizationLayers = {
      windParticles,
      currentParticles,
      windShadowZones: [],
      windAccelerationZones: [],
      currentAccelerationZones: accelerationOverlays,
      currentEddyZones: eddyOverlays,
      buildings: { type: 'FeatureCollection', features: [] },
    };

    const deckLayers = buildEnvironmentalDeckLayers(vizLayers, {
      wind: windEnabled,
      windZones: windEnabled,
      current: currentEnabled,
      currentZones: currentEnabled,
    });

    try {
      overlay.setProps({ layers: deckLayers });
    } catch (err) {
      console.warn('Failed to update deck.gl layers:', err);
    }
  }, [environmental, layers, mapLoaded, waterAnalysis]);

  const getLayerInsertionReference = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const preferredOrder = ['course-lines', 'race-marks-circle', 'bathymetry-contours'];
    return preferredOrder.find(layerId => map.getLayer(layerId)) ?? undefined;
  }, []);

  const addLayerWithSource = useCallback(
    (layerSpec: any, beforeId?: string) => {
      if (!isWeb || !mapLoaded || !layerSpec?.id || !layerSpec?.source) {
        return null;
      }
      const map = mapRef.current;
      if (!map) {
        return null;
      }

      const sourceId = `${layerSpec.id}-source`;
      try {
        if (map.getLayer(layerSpec.id)) {
          map.removeLayer(layerSpec.id);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }

        map.addSource(sourceId, layerSpec.source);
        const layerConfig = { ...layerSpec, source: sourceId };
        if (beforeId && map.getLayer(beforeId)) {
          map.addLayer(layerConfig, beforeId);
        } else {
          map.addLayer(layerConfig);
        }

        return { layerId: layerSpec.id, sourceId };
      } catch (error) {
        console.warn('[TacticalRaceMap] Failed to add layer', layerSpec.id, error);
        return null;
      }
    },
    [mapLoaded]
  );

  const removeOverlay = useCallback((overlayId: string) => {
    const entry = overlayRegistryRef.current[overlayId];
    if (!entry) {
      return;
    }
    const map = mapRef.current;
    if (!map) {
      return;
    }

    entry.layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    entry.sources.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    delete overlayRegistryRef.current[overlayId];
    delete overlaySignatureRef.current[overlayId];
  }, []);

  const addWaveHeatmapOverlay = useCallback(
    (force = false) => {
      if (!isWeb || !mapLoaded || !stormGlassWeather) {
        return false;
      }

      const map = mapRef.current;
      if (!map || !Array.isArray(stormGlassWeather.coordinates)) {
        return false;
      }

      const forecast = stormGlassWeather.forecast?.[0];
      if (!forecast?.waveHeight) {
        removeOverlay('waveHeatmap');
        return false;
      }

      const signature = `${forecast.timestamp?.toISOString?.() ?? ''}-${forecast.waveHeight}-${forecast.waveDirection ?? 'na'}`;
      if (!force && overlayRegistryRef.current.waveHeatmap && overlaySignatureRef.current.waveHeatmap === signature) {
        return true;
      }

      if (force || overlayRegistryRef.current.waveHeatmap) {
        removeOverlay('waveHeatmap');
      }

      const [lng, lat] = stormGlassWeather.coordinates as [number, number];
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false;
      }

      const bounds = map.getBounds?.();
      if (!bounds) {
        return false;
      }

      const region = {
        latitude: (bounds.getNorth() + bounds.getSouth()) / 2,
        longitude: (bounds.getEast() + bounds.getWest()) / 2,
        latitudeDelta: Math.max(0.02, bounds.getNorth() - bounds.getSouth()),
        longitudeDelta: Math.max(0.02, bounds.getEast() - bounds.getWest()),
      };

      const dataPoints = generateWaveDataPoints(
        lat,
        lng,
        forecast.waveHeight ?? 0.5,
        0.4,
        6
      );

      const specs = getWaveHeightHeatmapLayerSpec(dataPoints, region, 0.55);
      const specsArray = Array.isArray(specs) ? specs : [specs];
      const beforeId = getLayerInsertionReference();

      const entry = { layers: [] as string[], sources: [] as string[] };
      specsArray.forEach(spec => {
        const added = addLayerWithSource(spec, beforeId);
        if (added) {
          entry.layers.push(added.layerId);
          entry.sources.push(added.sourceId);
        }
      });

      if (!entry.layers.length) {
        return false;
      }

      overlayRegistryRef.current.waveHeatmap = entry;
      overlaySignatureRef.current.waveHeatmap = signature;
      return true;
    },
    [mapLoaded, stormGlassWeather, addLayerWithSource, getLayerInsertionReference, removeOverlay]
  );

  const addSeaTemperatureOverlay = useCallback(
    (force = false) => {
      if (!isWeb || !mapLoaded || !stormGlassWeather) {
        return false;
      }

      const map = mapRef.current;
      if (!map || !Array.isArray(stormGlassWeather.coordinates)) {
        return false;
      }

      const forecast = stormGlassWeather.forecast?.[0];
      const baseTemperature = forecast?.waterTemperature ?? forecast?.airTemperature;
      if (baseTemperature == null) {
        removeOverlay('seaTemperature');
        return false;
      }

      const signature = `${forecast.timestamp?.toISOString?.() ?? ''}-${baseTemperature}`;
      if (!force && overlayRegistryRef.current.seaTemperature && overlaySignatureRef.current.seaTemperature === signature) {
        return true;
      }

      if (force || overlayRegistryRef.current.seaTemperature) {
        removeOverlay('seaTemperature');
      }

      const [lng, lat] = stormGlassWeather.coordinates as [number, number];
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false;
      }

      const bounds = map.getBounds?.();
      if (!bounds) {
        return false;
      }

      const tempPoints = generateTemperatureDataPoints(lat, lng, baseTemperature, 1.2, 6);
      const gradientSpecs = getSeaTemperatureGradientLayerSpec(
        tempPoints,
        {
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLon: bounds.getWest(),
          maxLon: bounds.getEast(),
        },
        0.45,
        true
      );
      const specsArray = Array.isArray(gradientSpecs) ? gradientSpecs : [gradientSpecs];
      const beforeId = getLayerInsertionReference();

      const entry = { layers: [] as string[], sources: [] as string[] };
      specsArray.forEach(spec => {
        const added = addLayerWithSource(spec, beforeId);
        if (added) {
          entry.layers.push(added.layerId);
          entry.sources.push(added.sourceId);
        }
      });

      if (!entry.layers.length) {
        return false;
      }

      overlayRegistryRef.current.seaTemperature = entry;
      overlaySignatureRef.current.seaTemperature = signature;
      return true;
    },
    [mapLoaded, stormGlassWeather, addLayerWithSource, getLayerInsertionReference, removeOverlay]
  );

  const ensureCurrentArrowImage = useCallback(() => {
    if (!isWeb || !mapLoaded) {
      return;
    }
    const map = mapRef.current;
    if (!map || typeof document === 'undefined') {
      return;
    }
    if (map.hasImage && map.hasImage('current-arrow')) {
      return;
    }

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(size / 2, 6);
    ctx.lineTo(size - 10, size - 10);
    ctx.lineTo(10, size - 10);
    ctx.closePath();
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, size, size);
    map.addImage('current-arrow', imageData, { pixelRatio: 2 });
  }, [mapLoaded]);

  const addPredictiveCurrentsOverlay = useCallback(
    (force = false) => {
      if (!isWeb || !mapLoaded) {
        return false;
      }

      if (!predictiveCurrentSet.length) {
        removeOverlay('predictiveCurrents');
        return false;
      }

      const signature = predictiveCurrentSet
        .map(prediction => {
          const time = prediction.time instanceof Date ? prediction.time.toISOString() : new Date(prediction.time).toISOString();
          return `${time}-${prediction.speed.toFixed(3)}-${prediction.direction.toFixed(1)}-${prediction.confidence.toFixed(2)}`;
        })
        .join('|');

      if (!force && overlayRegistryRef.current.predictiveCurrents && overlaySignatureRef.current.predictiveCurrents === signature) {
        return true;
      }

      if (force || overlayRegistryRef.current.predictiveCurrents) {
        removeOverlay('predictiveCurrents');
      }

      ensureCurrentArrowImage();

      const specs = getPredictiveCurrentsLayerSpec(predictiveCurrentSet, courseHeading);
      const specsArray = Array.isArray(specs) ? specs : [specs];
      const beforeId = getLayerInsertionReference();

      const entry = { layers: [] as string[], sources: [] as string[] };
      specsArray.forEach(spec => {
        const added = addLayerWithSource(spec, beforeId);
        if (added) {
          entry.layers.push(added.layerId);
          entry.sources.push(added.sourceId);
        }
      });

      if (!entry.layers.length) {
        return false;
      }

      overlayRegistryRef.current.predictiveCurrents = entry;
      overlaySignatureRef.current.predictiveCurrents = signature;
      return true;
    },
    [mapLoaded, predictiveCurrentSet, courseHeading, addLayerWithSource, getLayerInsertionReference, ensureCurrentArrowImage, removeOverlay]
  );

  // Sync with external layer changes (avoids triggering on referential changes)
  const externalLayersKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!externalLayers) {
      return;
    }

    const key = JSON.stringify(externalLayers);
    if (externalLayersKeyRef.current === key) {
      return;
    }
    externalLayersKeyRef.current = key;

    setLayers((prev) =>
      prev.map((layer) => {
        const externalValue = externalLayers[layer.id as keyof typeof externalLayers];
        if (typeof externalValue !== 'boolean' || externalValue === layer.enabled) {
          return layer;
        }
        return { ...layer, enabled: externalValue };
      })
    );
  }, [externalLayers]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const initializeMap = async () => {
      try {
        // Prevent duplicate initialization
        if (mapRef.current) {
          return;
        }

        const maplibregl = await import('maplibre-gl');

        // Load CSS dynamically for web
        if (typeof document !== 'undefined' && !document.getElementById('maplibre-gl-css')) {
          const link = document.createElement('link');
          link.id = 'maplibre-gl-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css';
          document.head.appendChild(link);
        }

        if (!mapContainerRef.current) {
          return;
        }
        // Clean up any existing MapLibre elements in the container (from HMR)
        const container = mapContainerRef.current;

        // Log container dimensions before cleanup
        const rect = container.getBoundingClientRect();
        if (container.children.length > 0) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }

        // Calculate course center from marks
      const center = getMapCenter(
        marks,
        raceEvent.venue,
        environmental?.current?.wind
      );

        // Initialize map
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: createNauticalStyle(),
          center,
          zoom: 14,
          pitch: 0, // Start in 2D (0 pitch)
          bearing: 0,
          antialias: true,
        });

        map.scrollZoom.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
        map.dragPan.enable();
        map.keyboard?.enable?.();

        mapRef.current = map;
        // MapLibre compatibility: deck.gl expects map.getProjection (Mapbox GL API)
        if (typeof (map as any).getProjection !== 'function') {
          (map as any).getProjection = () => ({
            project: (lngLat: any) => {
              if (!lngLat) {
                return map.project({ lng: 0, lat: 0 });
              }
              if (Array.isArray(lngLat) && lngLat.length >= 2) {
                return map.project({ lng: lngLat[0], lat: lngLat[1] });
              }
              const lng =
                typeof lngLat.lng === 'number'
                  ? lngLat.lng
                  : typeof lngLat.lon === 'number'
                    ? lngLat.lon
                    : typeof lngLat.longitude === 'number'
                      ? lngLat.longitude
                      : 0;
              const lat =
                typeof lngLat.lat === 'number'
                  ? lngLat.lat
                  : typeof lngLat.latitude === 'number'
                    ? lngLat.latitude
                    : 0;
              return map.project({ lng, lat });
            },
            unproject: (point: any) => map.unproject(point),
          });
        }
        // Verify canvas was created
        setTimeout(() => {
          const canvas = container.querySelector('.maplibregl-canvas');
          if (canvas) {
          } else {
          }
        }, 100);

        // Add controls
        map.addControl(
          new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }),
          'top-left'
        );

        map.addControl(
          new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'nautical',
          }),
          'bottom-left'
        );

        // Map load handler
        map.on('load', async () => {
          if (isWeb) {
            // Wait a bit for the map viewport to fully initialize before adding deck.gl overlay
            // This prevents "Cannot read properties of null (reading 'id')" errors
            await new Promise(resolve => setTimeout(resolve, 100));

            // Use non-interleaved overlay; MapLibre + DeckGL interleaved mode can emit null viewports
            // which causes deck.gl to crash while reading viewport.id. Standard overlay mode keeps
            // rendering stable across browsers and still supports interactive layers.
            const overlay = new MapboxOverlay({ layers: [] });
            overlay.setProps({
              parameters: {
                clearColor: [0, 0, 0, 0]
              }
            });
            deckOverlayRef.current = overlay;
            map.addControl(overlay);
          }

          setMapLoaded(true);

          // Create arrow icon for course direction indicators
          const arrowSVG = `
            <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5 L25 15 L15 25 L15 18 L5 18 L5 12 L15 12 Z"
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    stroke-width="2"/>
            </svg>
          `;
          const arrowImage = new Image(30, 30);
          arrowImage.onload = () => {
            if (!map.hasImage('arrow')) {
              map.addImage('arrow', arrowImage);
            }
          };
          arrowImage.src = 'data:image/svg+xml;base64,' + btoa(arrowSVG);

          // Add all layers
          await addRaceCourse(map, marks);

          if (!isWeb && environmental) {
            await addWindLayer(map, marks, environmental);
            await addCurrentLayer(map, marks, environmental);
          } else if (isWeb) {
            updateDeckOverlay();
          }

          if (depthLayerEnabled) {
            await addBathymetryLayers(map);
          }

          // Fit to course
          fitMapToCourse(map, marks);
        });

        map.on('error', (e: any) => {
          if (e?.error) {
          }
        });
      } catch (error) {
        setMapLoaded(true); // Show error state
      }
    };

    initializeMap();

    return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          lastCenterRef.current = null;
        }

      if (deckOverlayRef.current) {
        try {
          deckOverlayRef.current.setProps({ layers: [] });
        } catch (err) {
        }
        deckOverlayRef.current = null;
      }
    };
  }, []);

  // Recenter map when race venue or marks update (e.g., user selects a location)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const targetCenter = getMapCenter(marks, raceEvent?.venue);
    const previous = lastCenterRef.current;

    const hasChanged =
      !previous ||
      Math.abs(previous[0] - targetCenter[0]) > 0.0001 ||
      Math.abs(previous[1] - targetCenter[1]) > 0.0001;

    if (!hasChanged) {
      return;
    }

    // Throttle recentering to avoid jitter when upstream props bounce between identical values
    const now = Date.now();
    if (now - lastRecenterTsRef.current < 1500) {
      return;
    }
    lastRecenterTsRef.current = now;
    lastCenterRef.current = targetCenter;

    try {
      if (!previous) {
        map.jumpTo({ center: targetCenter });
      } else {
        map.easeTo({
          center: targetCenter,
          duration: 800,
          essential: true,
        });
      }
    } catch (error) {
      logger.warn('[TacticalRaceMap] Failed to recenter map', { error, targetCenter });
    }
  }, [
    mapLoaded,
    marksSignature,
    raceEvent?.venue?.coordinates_lat,
    raceEvent?.venue?.coordinates_lng,
  ]);

  // ============================================================================
  // MARKS UPDATES - Re-render marks when prop changes
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) {
      return;
    }

    // Check if marks have actually changed (deep comparison)
    if (prevMarksRef.current === marksSignature) {
      return;
    }

    prevMarksRef.current = marksSignature;

    const map = mapRef.current;
    // Re-add race course with updated marks
    addRaceCourse(map, marks).then(() => {
      // Re-fit map to new course
      fitMapToCourse(map, marks);
    }).catch((error) => {
    });
  }, [marksSignature, mapLoaded, marks]);

  // ============================================================================
  // ENVIRONMENTAL DATA UPDATES - Add environmental layers when data arrives
  // ============================================================================

  useEffect(() => {
    if (isWeb) {
      updateDeckOverlay();
    }

    if (!mapRef.current || !mapLoaded || !environmental) return;

    const map = mapRef.current;
    // Add environmental layers if they don't exist yet
    const ensureEnvironmentalLayers = async () => {
      const windLayer = layers.find(l => l.id === 'wind');
      const currentLayer = layers.find(l => l.id === 'current');
      const waveLayer = layers.find(l => l.id === 'waves');
      try {
        // Add wind layer if it doesn't exist and is enabled
        if (!isWeb && windLayer?.enabled && !map.getLayer('wind')) {
          await addWindLayer(map, marks, environmental);
        }

        // Add current layer if it doesn't exist and is enabled
        if (!isWeb && currentLayer?.enabled && !map.getLayer('current')) {
          await addCurrentLayer(map, marks, environmental);
        }

        // Add wave layer if it doesn't exist and is enabled
        if (waveLayer?.enabled && !map.getLayer('waves')) {
          await addWaveLayer(map, marks, environmental);
        }

        if (depthLayerEnabled && !map.getLayer('bathymetry-raster') && !map.getLayer('bathymetry-contours')) {
          await addBathymetryLayers(map);
        }
      } catch (error) {
      }
    };

    ensureEnvironmentalLayers();
  }, [environmental, mapLoaded, layers, depthLayerEnabled, updateDeckOverlay]);

  useEffect(() => {
    if (!isWeb || !mapLoaded || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const handler = () => updateDeckOverlay();

    map.on('moveend', handler);
    map.on('zoomend', handler);

    return () => {
      if (map.off) {
        map.off('moveend', handler);
        map.off('zoomend', handler);
      }
    };
  }, [mapLoaded, updateDeckOverlay]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) {
      return;
    }

    const map = mapRef.current;

    BATHYMETRY_LAYER_IDS.forEach((id) => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });

    if (map.getSource('bathymetry-raster')) {
      map.removeSource('bathymetry-raster');
    }
    if (map.getSource('bathymetry-contours')) {
      map.removeSource('bathymetry-contours');
    }

    if (depthLayerEnabled) {
      void addBathymetryLayers(map);
    }
  }, [bathymetrySources, addBathymetryLayers, mapLoaded, depthLayerEnabled]);

  // ============================================================================
  // LAYER UPDATES - Toggle layer visibility
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    layers.forEach(async (layer) => {
      if (isWeb && (layer.id === 'wind' || layer.id === 'current')) {
        updateDeckOverlay();
        return;
      }

      const visibility = layer.enabled ? 'visible' : 'none';

      try {
        if (layer.id === 'depth') {
          if (layer.enabled) {
            await addBathymetryLayers(map);
          } else {
            BATHYMETRY_LAYER_IDS.forEach((id) => {
              if (map.getLayer(id)) {
                map.setLayoutProperty(id, 'visibility', 'none');
              }
            });
          }
          return;
        }

        // For environmental layers, recreate them when toggling on to use current map bounds
        const isEnvironmentalLayer = ['wind', 'current', 'waves', 'depth'].includes(layer.id);

        if (map.getLayer(layer.id)) {
          if (layer.enabled && isEnvironmentalLayer) {
            // Remove and recreate environmental layers to use current map bounds

            // Remove existing layer and source
            map.removeLayer(layer.id);
            if (map.getSource(layer.id)) {
              map.removeSource(layer.id);
            }

            // Recreate with current bounds
            switch (layer.id) {
              case 'wind':
                if (!isWeb) {
                  await addWindLayer(map, marks, environmental);
                }
                break;
              case 'current':
                if (!isWeb) {
                  await addCurrentLayer(map, marks, environmental);
                }
                break;
              case 'waves':
                await addWaveLayer(map, marks, environmental);
                break;
            }
          } else {
            // Just toggle visibility for non-environmental layers or when turning off
            map.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        } else if (layer.enabled) {
          // Create layer if it doesn't exist but should be visible
          switch (layer.id) {
            case 'wind':
              if (!isWeb) {
                await addWindLayer(map, marks, environmental);
              }
              break;
            case 'current':
              if (!isWeb) {
                await addCurrentLayer(map, marks, environmental);
              }
              break;
            case 'waves':
              await addWaveLayer(map, marks, environmental);
              break;
            case 'laylines':
              await addLaylinesLayer(map, marks, environmental);
              break;
            case 'strategy':
              await addStrategyLayer(map, marks, environmental);
              break;
          }
        }
      } catch (error) {
      }
    });
  }, [layers, mapLoaded, environmental, marks, updateDeckOverlay]);

  useEffect(() => {
    if (!isWeb || !mapLoaded) {
      return;
    }

    const overlayHandlers: Record<string, (force?: boolean) => boolean> = {
      waveHeatmap: addWaveHeatmapOverlay,
      seaTemperature: addSeaTemperatureOverlay,
      predictiveCurrents: addPredictiveCurrentsOverlay,
    };

    Object.entries(overlayHandlers).forEach(([id, handler]) => {
      const enabled = layers.find(layer => layer.id === id)?.enabled ?? false;
      const hasOverlay = Boolean(overlayRegistryRef.current[id]);

      if (enabled && !hasOverlay) {
        handler();
      } else if (!enabled && hasOverlay) {
        removeOverlay(id);
      }
    });
  }, [
    layers,
    mapLoaded,
    addWaveHeatmapOverlay,
    addSeaTemperatureOverlay,
    addPredictiveCurrentsOverlay,
    removeOverlay
  ]);

  useEffect(() => {
    if (!isWeb || !mapLoaded) {
      return;
    }

    if (layers.find(layer => layer.id === 'waveHeatmap')?.enabled) {
      addWaveHeatmapOverlay(true);
    }
    if (layers.find(layer => layer.id === 'seaTemperature')?.enabled) {
      addSeaTemperatureOverlay(true);
    }
    if (layers.find(layer => layer.id === 'predictiveCurrents')?.enabled) {
      addPredictiveCurrentsOverlay(true);
    }
  }, [
    mapLoaded,
    stormGlassWeather,
    predictiveCurrentSet,
    layers,
    addWaveHeatmapOverlay,
    addSeaTemperatureOverlay,
    addPredictiveCurrentsOverlay
  ]);

  useEffect(() => {
    return () => {
      removeOverlay('waveHeatmap');
      removeOverlay('seaTemperature');
      removeOverlay('predictiveCurrents');
    };
  }, [removeOverlay]);

  // ============================================================================
  // RACING AREA SELECTION
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    const handleMapClick = (e: any) => {
      // Handle mark placement mode
      if (isAddingMark && selectedMarkType) {
        const { lng, lat } = e.lngLat;

        // Create new mark object (without id - parent will assign)
        const newMark: Omit<CourseMark, 'id'> = {
          name: getMarkName(selectedMarkType),
          mark_type: selectedMarkType,
          latitude: lat,
          longitude: lng,
          color: getMarkColor(selectedMarkType),
          shape: getMarkShape(selectedMarkType),
          description: `${getMarkName(selectedMarkType)} - placed by user`
        };

        // Notify parent to add the mark
        onMarkAdded?.(newMark);

        // Exit mark placement mode after placing one mark
        // (parent component should handle this via prop change)
        return;
      }

      // Handle racing area drawing mode
      if (!isDrawingArea) return;

      // Check if clicking on an existing point - if so, don't add a new point
      const canQueryPointsLayer = Boolean(map.getLayer('user-racing-area-points'));
      const features = canQueryPointsLayer
        ? map.queryRenderedFeatures(e.point, { layers: ['user-racing-area-points'] })
        : [];

      if (features.length > 0) {
        // Clicking on existing point - let the drag handler deal with it
        return;
      }

      const { lng, lat } = e.lngLat;
      const newPoint: [number, number] = [lng, lat];

      // Update INTERNAL state - this is the key!
      setRacingAreaPoints(prev => [...prev, newPoint]);
    };

    // Update cursor and click handler based on mode
    if (isDrawingArea || isAddingMark) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getCanvas().style.cursor = '';
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingArea, isAddingMark, selectedMarkType, mapLoaded, onMarkAdded]);

  // Update racing area visualization when points change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) {
      lastMapLoadedRef.current = mapLoaded;
      return;
    }

    const map = mapRef.current;
    const signature = racingAreaPoints.length > 0 ? JSON.stringify(racingAreaPoints) : 'empty';
    const hasDrawingModeChanged = lastDrawingModeRef.current !== isDrawingArea;
    const mapJustBecameReady = mapLoaded && !lastMapLoadedRef.current;
    const isSamePolygon = lastRacingAreaSignatureRef.current === signature;

    lastDrawingModeRef.current = isDrawingArea;
    lastMapLoadedRef.current = mapLoaded;

    if (!mapJustBecameReady && !hasDrawingModeChanged && isSamePolygon) {
      return;
    }

    lastRacingAreaSignatureRef.current = signature;

    // Remove existing user racing area if it exists
    if (map.getLayer('user-racing-area-fill')) {
      map.removeLayer('user-racing-area-fill');
    }
    if (map.getLayer('user-racing-area-boundary')) {
      map.removeLayer('user-racing-area-boundary');
    }
    if (map.getLayer('user-racing-area-points')) {
      map.removeLayer('user-racing-area-points');
    }
    if (map.getSource('user-racing-area')) {
      map.removeSource('user-racing-area');
    }
    if (map.getSource('user-racing-area-points')) {
      map.removeSource('user-racing-area-points');
    }

    // If no points, just cleanup and return
    if (racingAreaPoints.length === 0) {
      return;
    }

    // Add points markers (only in drawing mode for editing)
    if (isDrawingArea) {
      map.addSource('user-racing-area-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: racingAreaPoints.map((point, idx) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: point,
            },
            properties: {
              index: idx,
            },
          })),
        },
      });

      map.addLayer({
        id: 'user-racing-area-points',
        type: 'circle',
        source: 'user-racing-area-points',
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
    }

    // If we have at least 3 points, draw the polygon
    if (racingAreaPoints.length >= 3) {
      const polygonCoords = [...racingAreaPoints, racingAreaPoints[0]]; // Close the polygon

      map.addSource('user-racing-area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygonCoords],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'user-racing-area-fill',
        type: 'fill',
        source: 'user-racing-area',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.15,
        },
      });

      map.addLayer({
        id: 'user-racing-area-boundary',
        type: 'line',
        source: 'user-racing-area',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-dasharray': [2, 2],
          'line-opacity': 0.8,
        },
      });

      // Auto-fit map bounds to racing area (only when NOT drawing)
      if (!isDrawingArea) {
        const lngs = racingAreaPoints.map(p => p[0]);
        const lats = racingAreaPoints.map(p => p[1]);
        const bounds = [
          [Math.min(...lngs), Math.min(...lats)], // Southwest
          [Math.max(...lngs), Math.max(...lats)]  // Northeast
        ];

        map.fitBounds(bounds as any, {
          padding: 80,
          duration: 1000,
          maxZoom: 15
        });
        // Regenerate environmental layers after map moves to new bounds
        // Wait for moveend event to ensure map has finished animating
        map.once('moveend', async () => {
          // Remove old wind layer
          if (map.getLayer('wind')) {
            map.removeLayer('wind');
          }
          if (map.getSource('wind')) {
            map.removeSource('wind');
          }

          // Remove old current layer
          if (map.getLayer('current')) {
            map.removeLayer('current');
          }
          if (map.getSource('current')) {
            map.removeSource('current');
          }

          BATHYMETRY_LAYER_IDS.forEach((id) => {
            if (map.getLayer(id)) {
              map.removeLayer(id);
            }
          });
          if (map.getSource('bathymetry-raster')) {
            map.removeSource('bathymetry-raster');
          }
          if (map.getSource('bathymetry-contours')) {
            map.removeSource('bathymetry-contours');
          }

          // Re-add with new bounds
          if (environmental) {
            await addWindLayer(map, marks, environmental);
            await addCurrentLayer(map, marks, environmental);
          }

          if (depthLayerEnabled) {
            await addBathymetryLayers(map);
          }
        });
      }
    } else if (racingAreaPoints.length === 2) {
      // Draw a line between two points
      map.addSource('user-racing-area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: racingAreaPoints,
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'user-racing-area-boundary',
        type: 'line',
        source: 'user-racing-area',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.8,
        },
      });
    }

  }, [racingAreaPoints, mapLoaded, isDrawingArea, environmental, marks, layers, addBathymetryLayers]);

  // ============================================================================
  // DRAGGABLE RACING AREA POINTS
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Only enable dragging in drawing mode AND when we have points
    if (!isDrawingArea || racingAreaPoints.length === 0) return;

    const map = mapRef.current;
    const canvas = map.getCanvas();

    // Check if layer exists
    if (!map.getLayer('user-racing-area-points')) {
      return;
    }
    let draggedPointIdx: number | null = null;

    // Mouse down on a point (left-click only - right-click handled by onContextMenu)
    const onMouseDown = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['user-racing-area-points']
      });
      if (features.length === 0) return;

      // Ignore right-clicks (handled by contextmenu event)
      if (e.originalEvent.button === 2) return;

      // Prevent map panning while dragging point
      e.preventDefault();

      draggedPointIdx = features[0].properties.index;
      setIsDraggingPoint(true);
      setDraggedPointIndex(draggedPointIdx);
      canvas.style.cursor = 'grab';

      // Disable map dragging
      map.dragPan.disable();
    };

    // Mouse move while dragging
    const onMouseMove = (e: any) => {
      if (draggedPointIdx === null) {
        // Change cursor when hovering over points
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['user-racing-area-points']
        });
        canvas.style.cursor = features.length > 0 ? 'pointer' : '';
        return;
      }

      // Update the point position
      const { lng, lat } = e.lngLat;
      const newPoint: [number, number] = [lng, lat];

      setRacingAreaPoints(prev => {
        const updated = [...prev];
        updated[draggedPointIdx!] = newPoint;
        return updated;
      });

      canvas.style.cursor = 'grabbing';
    };

    // Mouse up - finish dragging
    const onMouseUp = () => {
      if (draggedPointIdx === null) return;
      draggedPointIdx = null;
      setIsDraggingPoint(false);
      setDraggedPointIndex(null);
      canvas.style.cursor = '';

      // Re-enable map dragging
      map.dragPan.enable();

      // Notify parent of changes
      // parent notified via effect
    };

    // Right-click to delete a point
    const onContextMenu = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['user-racing-area-points']
      });

      if (features.length === 0) return;

      e.preventDefault(); // Prevent browser context menu

      const pointIndex = features[0].properties.index;
      // Remove the point
      setRacingAreaPoints(prev => prev.filter((_, idx) => idx !== pointIndex));
    };

    // Add event listeners
    map.on('mousedown', 'user-racing-area-points', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    map.on('mouseleave', 'user-racing-area-points', onMouseUp);
    map.on('contextmenu', 'user-racing-area-points', onContextMenu);

    // Cleanup
    return () => {
      map.off('mousedown', 'user-racing-area-points', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.off('mouseleave', 'user-racing-area-points', onMouseUp);
      map.off('contextmenu', 'user-racing-area-points', onContextMenu);
    };
  }, [mapLoaded, isDrawingArea, racingAreaPoints, onRacingAreaSelected]);

  // ============================================================================
  // DRAGGABLE MARKS
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Only enable dragging in edit mode AND when we have marks
    if (!isEditMode || !marks || marks.length === 0) return;

    const map = mapRef.current;
    const canvas = map.getCanvas();

    // Check if mark layer exists
    if (!map.getLayer('race-marks-circle')) {
      return;
    }
    let draggedMark: CourseMark | null = null;

    // Mouse down on a mark (left-click only - right-click handled by onContextMenu)
    const onMouseDown = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['race-marks-circle']
      });
      if (features.length === 0) return;

      // Ignore right-clicks (handled by contextmenu event)
      if (e.originalEvent.button === 2) return;

      // Prevent map panning while dragging mark
      e.preventDefault();

      const markId = features[0].properties.id;
      draggedMark = marks.find(m => m.id === markId) || null;

      if (draggedMark) {
        setIsDraggingMark(true);
        setDraggedMarkId(markId);
        canvas.style.cursor = 'grab';

        // Disable map dragging
        map.dragPan.disable();
      }
    };

    // Mouse move while dragging
    const onMouseMove = (e: any) => {
      if (!draggedMark) {
        // Change cursor when hovering over marks in edit mode
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['race-marks-circle']
        });
        canvas.style.cursor = features.length > 0 ? 'pointer' : '';
        return;
      }

      // Update the mark position in real-time by updating the source
      const { lng, lat } = e.lngLat;

      // Update mark position
      const updatedMark: CourseMark = {
        ...draggedMark,
        latitude: lat,
        longitude: lng,
        // Support both database schemas
        coordinates_lat: lat,
        coordinates_lng: lng,
      } as any;

      // Notify parent immediately for real-time update
      onMarkUpdated?.(updatedMark);

      canvas.style.cursor = 'grabbing';
    };

    // Mouse up - finish dragging
    const onMouseUp = () => {
      if (!draggedMark) return;
      draggedMark = null;
      setIsDraggingMark(false);
      setDraggedMarkId(null);
      canvas.style.cursor = '';

      // Re-enable map dragging
      map.dragPan.enable();
    };

    // Right-click to delete a mark
    const onContextMenu = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['race-marks-circle']
      });

      if (features.length === 0) return;

      e.preventDefault(); // Prevent browser context menu

      const markId = features[0].properties.id;
      const mark = marks.find(m => m.id === markId);

      if (mark) {
        // Confirm deletion
        if (typeof window !== 'undefined' && window.confirm(`Delete "${mark.name}"?`)) {
          onMarkDeleted?.(markId);
        }
      }
    };

    // Add event listeners
    map.on('mousedown', 'race-marks-circle', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    map.on('mouseleave', 'race-marks-circle', onMouseUp);
    map.on('contextmenu', 'race-marks-circle', onContextMenu);

    // Cleanup
    return () => {
      map.off('mousedown', 'race-marks-circle', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.off('mouseleave', 'race-marks-circle', onMouseUp);
      map.off('contextmenu', 'race-marks-circle', onContextMenu);

      // Re-enable map dragging if it was disabled
      if (draggedMark) {
        map.dragPan.enable();
      }
    };
  }, [mapLoaded, isEditMode, marks, onMarkUpdated, onMarkDeleted]);

  // ============================================================================
  // AUTO-REGENERATION WHEN RACING AREA CHANGES
  // ============================================================================

  useEffect(() => {
    // Only auto-regenerate if we have a racing area and environmental data
    if (!racingAreaPolygon || racingAreaPolygon.length < 3) return;
    if (!environmental?.current?.wind) return;
    if (marks.length > 0) return; // Don't auto-generate if marks already exist

    // Prevent infinite loop: check if we've already auto-generated SYNCHRONOUSLY
    if (hasAutoGeneratedRef.current) {
      if (__DEV__) {
        logger.debug('Skipping auto-generation - already generated for this configuration');
      }
      return;
    }

    // Set flag IMMEDIATELY to prevent race conditions with multiple async imports
    hasAutoGeneratedRef.current = true;

    if (__DEV__) {
      logger.debug('Auto-generation triggered', {
        wind: environmental.current.wind,
        polygonPoints: racingAreaPolygon.length,
        existingMarks: marks.length,
      });
    }

    // Calculate racing area center
    const center = {
      lat: racingAreaPolygon.reduce((sum, p) => sum + p.lat, 0) / racingAreaPolygon.length,
      lng: racingAreaPolygon.reduce((sum, p) => sum + p.lng, 0) / racingAreaPolygon.length,
    };

    // Calculate bounds
    const lats = racingAreaPolygon.map(p => p.lat);
    const lngs = racingAreaPolygon.map(p => p.lng);
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };

    // Import and use AutoCourseGeneratorService
    import('@/services/AutoCourseGeneratorService').then(({ autoCourseGenerator }) => {
      const racingArea = {
        polygon: racingAreaPolygon,
        center,
        bounds,
      };

      // Generate standard course based on wind and racing area
      const generatedMarks = autoCourseGenerator.generateStandardCourse(
        racingArea,
        environmental.current.wind.direction,
        environmental.current.wind.speed,
        raceEvent.boat_class || undefined
      );

      if (__DEV__) {
        logger.debug('Adding auto-generated marks', generatedMarks.length);
      }

      generatedMarks.forEach(mark => {
        onMarkAdded?.(mark);
      });
    });
  }, [racingAreaPolygon, environmental?.current?.wind, raceEvent.boat_class, marks.length]);
  // Including marks.length to prevent generation when marks already exist

  // ============================================================================
  // MAP STYLE
  // ============================================================================

  const createNauticalStyle = () => {
    return {
      version: 8,
      name: 'Nautical Racing Chart',
      // Use MapLibre demo fonts to prevent timeout errors
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#aad3df', // Light blue ocean color
          },
        },
        {
          id: 'terrain-base',
          type: 'raster',
          source: 'osm-tiles',
          paint: {
            'raster-opacity': 1.0,
          },
        },
      ],
    };
  };

  // ============================================================================
  // RACE COURSE LAYER
  // ============================================================================

  const addRaceCourse = async (map: any, marks: CourseMark[]) => {
    if (!marks || marks.length === 0) {
      return;
    }

    // Remove existing course layers and sources if they exist
    const layersToRemove = ['race-marks-glow', 'race-marks-circle', 'course-lines', 'course-arrows'];
    const sourcesToRemove = ['race-marks', 'course-lines'];

    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    sourcesToRemove.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    // Remove existing DOM marker labels
    const existingLabels = document.querySelectorAll('.mark-label');
    existingLabels.forEach(label => label.parentElement?.remove());
    if (existingLabels.length > 0) {
    }

    // Create GeoJSON for marks
    const markFeatures = marks.map((mark) => {
      // Support both database schemas
      const lat = (mark as any).coordinates_lat || (mark as any).latitude || 0;
      const lng = (mark as any).coordinates_lng || (mark as any).longitude || 0;
      const name = (mark as any).mark_name || (mark as any).name || 'Unknown';
      const type = (mark as any).mark_type || (mark as any).type || 'unknown';

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          id: mark.id,
          name: name,
          type: type,
          color: getMarkColor(type),
        },
      };
    });

    map.addSource('race-marks', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: markFeatures,
      },
    });

    // Mark circles (outer glow) - Larger, softer glow like the diagram
    map.addLayer({
      id: 'race-marks-glow',
      type: 'circle',
      source: 'race-marks',
      paint: {
        'circle-radius': 32,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.25,
        'circle-blur': 0.8,
      },
    });

    // Mark circles (main) - Larger circles like the sailing diagram
    map.addLayer({
      id: 'race-marks-circle',
      type: 'circle',
      source: 'race-marks',
      paint: {
        'circle-radius': 20, // Increased from 12 to match sailing course diagram
        'circle-color': ['get', 'color'],
        'circle-opacity': 1.0, // Fully opaque for better visibility
        'circle-stroke-width': 4, // Thicker white border
        'circle-stroke-color': '#ffffff',
      },
    });

    // Mark labels - disabled for now (requires glyphs property in style)
    // TODO: Add glyphs to style or implement with React overlays
    // map.addLayer({
    //   id: 'race-marks-labels',
    //   type: 'symbol',
    //   source: 'race-marks',
    //   layout: {
    //     'text-field': ['get', 'name'],
    //     'text-size': 12,
    //     'text-offset': [0, -2.5],
    //     'text-anchor': 'bottom',
    //   },
    //   paint: {
    //     'text-color': '#ffffff',
    //     'text-halo-color': '#000000',
    //     'text-halo-width': 2,
    //   },
    // });

    // Helper function to generate proper racing course path
    const generateRacingCoursePath = (marks: CourseMark[]): [number, number][] => {
      const path: [number, number][] = [];

      // Extract mark data
      const marksWithCoords = marks.map(m => ({
        id: m.id,
        name: (m as any).mark_name || (m as any).name || '',
        type: (m as any).mark_type || (m as any).type || '',
        lat: (m as any).coordinates_lat || (m as any).latitude || 0,
        lng: (m as any).coordinates_lng || (m as any).longitude || 0,
        sequence: (m as any).sequence_number || 0,
      })).sort((a, b) => a.sequence - b.sequence);

      // Identify mark types
      const committeeBoat = marksWithCoords.find(m =>
        m.type === 'committee_boat' || m.name.toLowerCase().includes('committee')
      );
      const pin = marksWithCoords.find(m =>
        m.type === 'pin' || m.name.toLowerCase().includes('pin')
      );
      const finishMark = marksWithCoords.find(m =>
        m.type === 'finish' || m.name.toLowerCase().includes('finish')
      );

      // Get racing marks (non-start/finish marks)
      const racingMarks = marksWithCoords.filter(m =>
        m.type !== 'committee_boat' &&
        m.type !== 'pin' &&
        m.type !== 'finish' &&
        !m.name.toLowerCase().includes('committee') &&
        !m.name.toLowerCase().includes('pin') &&
        !m.name.toLowerCase().includes('finish')
      );

      // 1. Start from middle of start line
      if (committeeBoat && pin) {
        const startMidpoint: [number, number] = [
          (committeeBoat.lng + pin.lng) / 2,
          (committeeBoat.lat + pin.lat) / 2,
        ];
        path.push(startMidpoint);
      } else if (racingMarks.length > 0) {
        // Fallback if no start line found
        path.push([racingMarks[0].lng, racingMarks[0].lat]);
      }

      // 2. Navigate through racing marks
      // For now, we'll go to each mark in sequence
      // TODO: Add logic to go "around" marks with proper rounding distance
      racingMarks.forEach((mark) => {
        // Check if this is a gate mark (Gate A, Gate B, etc.)
        const isGate = mark.name.toLowerCase().includes('gate');

        if (isGate) {
          // For gates, go through the middle (find the other gate mark)
          const gatePartner = racingMarks.find(m =>
            m.id !== mark.id &&
            m.name.toLowerCase().includes('gate') &&
            Math.abs(m.sequence - mark.sequence) <= 1
          );

          if (gatePartner) {
            const gateMidpoint: [number, number] = [
              (mark.lng + gatePartner.lng) / 2,
              (mark.lat + gatePartner.lat) / 2,
            ];
            // Only add if not already added
            if (path.length === 0 || path[path.length - 1][0] !== gateMidpoint[0]) {
              path.push(gateMidpoint);
            }
          } else {
            path.push([mark.lng, mark.lat]);
          }
        } else {
          // For regular marks, add a point that goes "around" the mark
          // Calculate offset based on previous point to create rounding path
          if (path.length > 0) {
            const prevPoint = path[path.length - 1];
            const dx = mark.lng - prevPoint[0];
            const dy = mark.lat - prevPoint[1];
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Offset distance (about 0.0001 degrees ~= 11 meters)
            const offsetDist = 0.0001;

            // Point before mark (approaching)
            const beforePoint: [number, number] = [
              mark.lng - (dx / distance) * offsetDist,
              mark.lat - (dy / distance) * offsetDist,
            ];
            path.push(beforePoint);

            // Point around mark (perpendicular offset for port rounding)
            const roundingPoint: [number, number] = [
              mark.lng + (dy / distance) * offsetDist,
              mark.lat - (dx / distance) * offsetDist,
            ];
            path.push(roundingPoint);
          } else {
            path.push([mark.lng, mark.lat]);
          }
        }
      });

      // 3. Finish in middle of finish line
      if (committeeBoat && finishMark) {
        const finishMidpoint: [number, number] = [
          (committeeBoat.lng + finishMark.lng) / 2,
          (committeeBoat.lat + finishMark.lat) / 2,
        ];
        path.push(finishMidpoint);
      } else if (finishMark) {
        path.push([finishMark.lng, finishMark.lat]);
      }

      return path;
    };

    // Course lines
    if (marks.length >= 2) {
      // Generate proper racing course path
      const lineCoords = generateRacingCoursePath(marks);

      map.addSource('course-lines', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lineCoords,
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'course-lines',
        type: 'line',
        source: 'course-lines',
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 3,
          'line-opacity': 0.6,
          'line-dasharray': [3, 2],
        },
      });

      // Add directional arrows along the course lines
      map.addLayer({
        id: 'course-arrows',
        type: 'symbol',
        source: 'course-lines',
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 100, // Distance between arrows in pixels
          'icon-image': 'arrow', // Will create this image below
          'icon-size': 0.5,
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
        },
        paint: {
          'icon-opacity': 0.8,
        },
      });
    }

    // Racing area boundary (if available)
    if (raceEvent.racing_area_bounds) {
      addRacingAreaBoundary(map, raceEvent.racing_area_bounds);
    }

    // Add mark labels as DOM overlays
    const maplibregl = require('maplibre-gl');
    marks.forEach((mark) => {
      const lat = (mark as any).coordinates_lat || (mark as any).latitude || 0;
      const lng = (mark as any).coordinates_lng || (mark as any).longitude || 0;
      const name = (mark as any).mark_name || (mark as any).name || 'Unknown';

      // Create label element
      const labelEl = document.createElement('div');
      labelEl.className = 'mark-label';
      labelEl.innerHTML = `
        <div style="
          background: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          transform: translateY(-35px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          ${name}
        </div>
      `;

      // Create marker
      new maplibregl.Marker({
        element: labelEl,
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    // Mark interactivity
    map.on('click', 'race-marks-circle', (e: any) => {
      const feature = e.features[0];
      const mark = marks.find((m) => m.id === feature.properties.id);
      if (mark) {
        setSelectedMarkId(mark.id);
        onMarkSelected?.(mark);

        const lat = (mark as any).coordinates_lat || (mark as any).latitude || 0;
        const lng = (mark as any).coordinates_lng || (mark as any).longitude || 0;

        map.flyTo({
          center: [lng, lat],
          zoom: 16,
          pitch: 60,
          duration: 1500,
        });
      }
    });

    map.on('mouseenter', 'race-marks-circle', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'race-marks-circle', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  const addRacingAreaBoundary = (map: any, bounds: any) => {
    // Parse racing area bounds (format depends on database schema)
    // For now, create a simple polygon around the course
    const markCoords = marks.map((m) => {
      const lat = (m as any).coordinates_lat || (m as any).latitude || 0;
      const lng = (m as any).coordinates_lng || (m as any).longitude || 0;
      return [lng, lat];
    });

    map.addSource('racing-area', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [markCoords],
        },
        properties: {},
      },
    });

    map.addLayer({
      id: 'racing-area-boundary',
      type: 'line',
      source: 'racing-area',
      paint: {
        'line-color': '#ef4444',
        'line-width': 2,
        'line-dasharray': [4, 4],
        'line-opacity': 0.8,
      },
    });

    map.addLayer({
      id: 'racing-area-fill',
      type: 'fill',
      source: 'racing-area',
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.05,
      },
    });
  };

  // ============================================================================
  // WIND LAYER
  // ============================================================================

  const addWindLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    if (isWeb) return;
    if (!env || !env.current.wind) return;

    const wind = env.current.wind;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Create dense grid of wind arrows across entire visible map and beyond
    const gridRows = 20; // Vertical arrows (increased from 8)
    const gridCols = 30; // Horizontal arrows (increased from 12)
    const lngStep = (ne.lng - sw.lng) / (gridCols + 1);
    const latStep = (ne.lat - sw.lat) / (gridRows + 1);
    const arrowLength = Math.min(lngStep, latStep) * 0.6; // Arrow length relative to grid spacing
    const arrows = [];

    for (let i = 1; i <= gridRows; i++) {
      for (let j = 1; j <= gridCols; j++) {
        const startLat = sw.lat + i * latStep;
        const startLng = sw.lng + j * lngStep;

        // Calculate arrow end point based on wind direction
        // Wind direction is "from" direction, so we add 180° to show where it's going
        const arrowDirection = (wind.direction + 180) % 360;
        const radians = (arrowDirection * Math.PI) / 180;

        const endLng = startLng + arrowLength * Math.sin(radians);
        const endLat = startLat + arrowLength * Math.cos(radians);

        // Main arrow shaft
        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[startLng, startLat], [endLng, endLat]],
          },
          properties: {
            speed: wind.speed,
            color: getWindColor(wind.speed),
            type: 'shaft',
          },
        });

        // Arrow head (two lines forming a V)
        const headLength = arrowLength * 0.3;
        const headAngle = 25; // degrees

        const leftRadians = ((arrowDirection + 180 - headAngle) * Math.PI) / 180;
        const rightRadians = ((arrowDirection + 180 + headAngle) * Math.PI) / 180;

        const leftLng = endLng + headLength * Math.sin(leftRadians);
        const leftLat = endLat + headLength * Math.cos(leftRadians);
        const rightLng = endLng + headLength * Math.sin(rightRadians);
        const rightLat = endLat + headLength * Math.cos(rightRadians);

        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[endLng, endLat], [leftLng, leftLat]],
          },
          properties: {
            speed: wind.speed,
            color: getWindColor(wind.speed),
            type: 'head',
          },
        });

        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[endLng, endLat], [rightLng, rightLat]],
          },
          properties: {
            speed: wind.speed,
            color: getWindColor(wind.speed),
            type: 'head',
          },
        });
      }
    }

    map.addSource('wind', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: arrows,
      },
    });

    // Wind arrow lines
    map.addLayer({
      id: 'wind',
      type: 'line',
      source: 'wind',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': 0.7,
      },
    });
  };

  // ============================================================================
  // CURRENT/TIDE LAYER
  // ============================================================================

  const addCurrentLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    if (isWeb) return;
    if (!env || !env.current.tide?.current_speed) return;

    const tide = env.current.tide;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Create current flow arrows across entire visible map
    const gridRows = 15; // Increased density (was 6)
    const gridCols = 22; // Increased density (was 9)
    const lngStep = (ne.lng - sw.lng) / (gridCols + 1);
    const latStep = (ne.lat - sw.lat) / (gridRows + 1);
    const arrowLength = Math.min(lngStep, latStep) * 0.7; // Slightly longer than wind arrows
    const arrows = [];

    for (let i = 1; i <= gridRows; i++) {
      for (let j = 1; j <= gridCols; j++) {
        const startLat = sw.lat + i * latStep;
        const startLng = sw.lng + j * lngStep;

        // Calculate arrow end point based on current direction
        const currentDirection = (tide.current_direction || 0);
        const radians = (currentDirection * Math.PI) / 180;

        const endLng = startLng + arrowLength * Math.sin(radians);
        const endLat = startLat + arrowLength * Math.cos(radians);

        // Main arrow shaft
        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[startLng, startLat], [endLng, endLat]],
          },
          properties: {
            speed: tide.current_speed,
            type: 'shaft',
          },
        });

        // Arrow head (two lines forming a V)
        const headLength = arrowLength * 0.35;
        const headAngle = 30; // degrees (wider than wind arrows)

        const leftRadians = ((currentDirection + 180 - headAngle) * Math.PI) / 180;
        const rightRadians = ((currentDirection + 180 + headAngle) * Math.PI) / 180;

        const leftLng = endLng + headLength * Math.sin(leftRadians);
        const leftLat = endLat + headLength * Math.cos(leftRadians);
        const rightLng = endLng + headLength * Math.sin(rightRadians);
        const rightLat = endLat + headLength * Math.cos(rightRadians);

        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[endLng, endLat], [leftLng, leftLat]],
          },
          properties: {
            speed: tide.current_speed,
            type: 'head',
          },
        });

        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[endLng, endLat], [rightLng, rightLat]],
          },
          properties: {
            speed: tide.current_speed,
            type: 'head',
          },
        });
      }
    }

    map.addSource('current', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: arrows,
      },
    });

    // Current arrow lines (cyan color)
    map.addLayer({
      id: 'current',
      type: 'line',
      source: 'current',
      paint: {
        'line-color': '#06b6d4',
        'line-width': 2,
        'line-opacity': 0.6,
      },
    });
  };

  // ============================================================================
  // WAVE LAYER
  // ============================================================================

  const addWaveLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    if (!env || !env.current.wave) return;

    const wave = env.current.wave;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Create grid of wave arrows to show direction and height
    const gridRows = 6; // Fewer than wind to avoid clutter
    const gridCols = 9;
    const lngStep = (ne.lng - sw.lng) / (gridCols + 1);
    const latStep = (ne.lat - sw.lat) / (gridRows + 1);
    const arrowLength = Math.min(lngStep, latStep) * 0.5; // Slightly smaller than wind arrows
    const arrows = [];

    for (let i = 1; i <= gridRows; i++) {
      for (let j = 1; j <= gridCols; j++) {
        const startLat = sw.lat + i * latStep;
        const startLng = sw.lng + j * lngStep;

        // Wave direction (direction waves are traveling)
        const waveDirection = wave.direction;
        const radians = (waveDirection * Math.PI) / 180;

        const endLng = startLng + arrowLength * Math.sin(radians);
        const endLat = startLat + arrowLength * Math.cos(radians);

        // Main arrow shaft
        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[startLng, startLat], [endLng, endLat]],
          },
          properties: {
            height: wave.height,
            color: getWaveColor(wave.height),
            type: 'shaft',
          },
        });

        // Arrow head (two lines forming a V)
        const headLength = arrowLength * 0.3;
        const headAngle = 25; // degrees

        const leftRadians = ((waveDirection + 180 - headAngle) * Math.PI) / 180;
        const rightRadians = ((waveDirection + 180 + headAngle) * Math.PI) / 180;

        const leftLng = endLng + headLength * Math.sin(leftRadians);
        const leftLat = endLat + headLength * Math.cos(leftRadians);
        const rightLng = endLng + headLength * Math.sin(rightRadians);
        const rightLat = endLat + headLength * Math.cos(rightRadians);

        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[endLng, endLat], [leftLng, leftLat]],
          },
          properties: {
            height: wave.height,
            color: getWaveColor(wave.height),
            type: 'head',
          },
        });

        arrows.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [[endLng, endLat], [rightLng, rightLat]],
          },
          properties: {
            height: wave.height,
            color: getWaveColor(wave.height),
            type: 'head',
          },
        });
      }
    }

    // Add wave arrow source
    map.addSource('waves', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: arrows,
      },
    });

    // Add wave arrow layer
    map.addLayer({
      id: 'waves',
      type: 'line',
      source: 'waves',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2.5,
        'line-opacity': 0.8,
      },
    });
  };

  // ============================================================================
  // DEPTH/BATHYMETRY LAYER
  // ============================================================================

  // ============================================================================
  // TACTICAL LAYERS
  // ============================================================================

  const addLaylinesLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    if (!env || !env.current.wind) return;

    // Find windward mark
    const windwardMark = marks.find((m) => {
      const type = (m as any).mark_type || (m as any).type;
      return type === 'windward';
    });
    if (!windwardMark) return;

    const windDirection = env.current.wind.direction; // Direction wind is FROM
    const pointingAngle = 45; // Typical boat pointing angle (40-45° for most boats)
    const laylinesLength = 0.015; // Length of laylines in degrees (~1.5km)

    // Laylines show the optimal angle to approach the mark
    // Port tack layline: sailing at wind - 45° (left of wind direction)
    // Starboard tack layline: sailing at wind + 45° (right of wind direction)

    // These lines extend DOWNWIND from the mark (add 180° to reverse direction)
    const portTackBearing = (windDirection - pointingAngle + 180) % 360;
    const starboardTackBearing = (windDirection + pointingAngle + 180) % 360;

    const portLayline = calculateLayline(windwardMark, portTackBearing, laylinesLength);
    const starboardLayline = calculateLayline(windwardMark, starboardTackBearing, laylinesLength);

    map.addSource('laylines', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: portLayline,
            },
            properties: { side: 'port', color: '#ef4444' }, // Red for port
          },
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: starboardLayline,
            },
            properties: { side: 'starboard', color: '#22c55e' }, // Green for starboard
          },
        ],
      },
    });

    map.addLayer({
      id: 'laylines',
      type: 'line',
      source: 'laylines',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-dasharray': [4, 3],
        'line-opacity': 0.85,
      },
    });
  };

  const addStrategyLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    // Strategic analysis visualization
    // - Favored side highlighting
    // - Start line bias
    // - Optimal approach zones
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getMapCenter = (marks: CourseMark[], venue?: any): [number, number] => {
    if (venue?.coordinates_lat && venue?.coordinates_lng) {
      return [venue.coordinates_lng, venue.coordinates_lat];
    }

    if (marks && marks.length > 0) {
      const avgLat = marks.reduce((sum, m) => sum + ((m as any).coordinates_lat || (m as any).latitude || 0), 0) / marks.length;
      const avgLng = marks.reduce((sum, m) => sum + ((m as any).coordinates_lng || (m as any).longitude || 0), 0) / marks.length;
      return [avgLng, avgLat];
    }

    return [114.2620, 22.2650]; // Clearwater Bay, Hong Kong default
  };

  const fitMapToCourse = (map: any, marks: CourseMark[]) => {
    if (!marks || marks.length === 0) return;

    const lats = marks.map((m) => (m as any).coordinates_lat || (m as any).latitude || 0);
    const lngs = marks.map((m) => (m as any).coordinates_lng || (m as any).longitude || 0);

    const bounds = [
      Math.min(...lngs) - 0.005,
      Math.min(...lats) - 0.005,
      Math.max(...lngs) + 0.005,
      Math.max(...lats) + 0.005,
    ];

    const maplibregl = require('maplibre-gl');
    const lngLatBounds = new maplibregl.LngLatBounds(
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]]
    );

    map.fitBounds(lngLatBounds, {
      padding: 80,
      duration: 1000,
      pitch: 0, // Keep 2D when fitting bounds
    });
  };

  const calculateLayline = (mark: CourseMark, bearing: number, length: number): [number, number][] => {
    const lat = (mark as any).coordinates_lat || (mark as any).latitude || 0;
    const lng = (mark as any).coordinates_lng || (mark as any).longitude || 0;
    const bearingRad = (bearing * Math.PI) / 180;
    return [
      [lng, lat],
      [
        lng + length * Math.sin(bearingRad),
        lat + length * Math.cos(bearingRad),
      ],
    ];
  };

  const getMarkColor = (type: string): string => {
    const colors: Record<string, string> = {
      start: '#22c55e',
      committee_boat: '#22c55e',
      pin: '#22c55e',
      finish: '#ef4444',
      windward: '#3b82f6',
      leeward: '#f59e0b',
      gate_left: '#8b5cf6',
      gate_right: '#8b5cf6',
      offset: '#ec4899',
    };
    return colors[type] || '#64748b';
  };

  const getMarkName = (type: string): string => {
    const names: Record<string, string> = {
      committee_boat: 'Committee Boat',
      pin: 'Pin',
      windward: 'Windward Mark',
      leeward: 'Leeward Mark',
      gate_left: 'Gate A (Left)',
      gate_right: 'Gate B (Right)',
      offset: 'Offset Mark',
      finish: 'Finish Mark',
    };
    return names[type] || 'Mark';
  };

  const getMarkShape = (type: string): string => {
    const shapes: Record<string, string> = {
      committee_boat: 'boat',
      pin: 'inflatable',
      windward: 'inflatable',
      leeward: 'inflatable',
      gate_left: 'inflatable',
      gate_right: 'inflatable',
      offset: 'inflatable',
      finish: 'inflatable',
    };
    return shapes[type] || 'inflatable';
  };

  const getWindColor = (speed: number): string => {
    if (speed < 8) return '#22d3ee'; // Light breeze
    if (speed < 12) return '#3b82f6'; // Moderate
    if (speed < 18) return '#f59e0b'; // Fresh
    return '#ef4444'; // Strong
  };

const getWaveColor = (height: number): string => {
  if (height < 0.5) return '#22d3ee';
  if (height < 1.0) return '#3b82f6';
  if (height < 2.0) return '#f59e0b';
  return '#ef4444';
};

function createWindParticles(bounds: any, wind?: WindData): ParticleData[] {
  const area = normalizeBounds(bounds);
  if (!area || !wind) {
    return [];
  }

  const rows = 10;
  const cols = 18;
  const direction = ((wind.direction ?? 0) + 180) % 360;
  const speed = Math.max(0, wind.speed ?? 0);
  return createParticleGrid(area, rows, cols, direction, speed);
}

function createCurrentParticles(bounds: any, tide?: TideData): ParticleData[] {
  const area = normalizeBounds(bounds);
  if (!area || !tide || typeof tide.current_direction !== 'number') {
    return [];
  }

  const rows = 8;
  const cols = 14;
  const direction = tide.current_direction ?? 0;
  const speed = Math.max(0, tide.current_speed ?? 0);
  return createParticleGrid(area, rows, cols, direction, speed);
}

function normalizeBounds(bounds: any) {
  const sw = bounds?.getSouthWest?.();
  const ne = bounds?.getNorthEast?.();

  if (!sw || !ne) {
    return null;
  }

  const { lat: south, lng: west } = sw;
  const { lat: north, lng: east } = ne;

  if (
    !Number.isFinite(south) ||
    !Number.isFinite(north) ||
    !Number.isFinite(west) ||
    !Number.isFinite(east) ||
    south === north ||
    west === east
  ) {
    return null;
  }

  return { south, north, west, east };
}

function createParticleGrid(
  bounds: { south: number; north: number; west: number; east: number },
  rows: number,
  cols: number,
  direction: number,
  speed: number
): ParticleData[] {
  const particles: ParticleData[] = [];
  const latStep = (bounds.north - bounds.south) / (rows + 1);
  const lngStep = (bounds.east - bounds.west) / (cols + 1);

  if (!Number.isFinite(latStep) || !Number.isFinite(lngStep) || latStep === 0 || lngStep === 0) {
    return particles;
  }

  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
      particles.push({
        lat: bounds.south + i * latStep,
        lng: bounds.west + j * lngStep,
        direction,
        speed,
      });
    }
  }

  return particles;
}

function createParticlesFromSamples(samples?: Array<{ lat: number; lng: number; speed: number; direction: number }>): ParticleData[] {
  if (!samples || samples.length === 0) {
    return [];
  }

  return samples.map((sample) => ({
    lat: sample.lat,
    lng: sample.lng,
    direction: sample.direction,
    speed: sample.speed,
  }));
}

function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const toDegrees = (value: number) => (value * 180) / Math.PI;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDegrees(θ) + 360) % 360;
}

function generateTemperatureDataPoints(
  centerLat: number,
  centerLon: number,
  baseTemperature: number,
  variability: number = 1.5,
  gridSize: number = 5
): TemperatureDataPoint[] {
  const points: TemperatureDataPoint[] = [];
  const spread = 0.05; // ~5km

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat + (i - gridSize / 2) * (spread / gridSize);
      const lon = centerLon + (j - gridSize / 2) * (spread / gridSize);

      const variationSeed = Math.sin(lat * 20 + lon * 30 + i * 7 + j * 11);
      const variation = variationSeed * variability * 0.5;
      const temp = baseTemperature + variation;

      points.push({
        latitude: lat,
        longitude: lon,
        temperature: Math.round(temp * 10) / 10,
      });
    }
  }

  return points;
}

function buildPredictiveCurrentSet(
  weather: WeatherData | null | undefined,
  courseHeading: number
): CurrentPrediction[] {
  if (!weather || !Array.isArray(weather.forecast) || !weather.forecast.length || !weather.coordinates) {
    return [];
  }

  let lat: number | null = null;
  let lng: number | null = null;

  if (Array.isArray(weather.coordinates)) {
    const [rawLng, rawLat] = weather.coordinates;
    lat = typeof rawLat === 'number' ? rawLat : null;
    lng = typeof rawLng === 'number' ? rawLng : null;
  } else if (typeof weather.coordinates === 'object') {
    const coords = weather.coordinates as Record<string, unknown>;
    const rawLat = coords.lat ?? coords.latitude;
    const rawLng = coords.lng ?? coords.longitude ?? coords.lon;

    lat = typeof rawLat === 'number' ? rawLat : null;
    lng = typeof rawLng === 'number' ? rawLng : null;
  }

  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return [];
  }

  const maxSamples = 6;
  const forecasts = weather.forecast
    .filter((forecast) => typeof forecast.currentSpeed === 'number' && typeof forecast.currentDirection === 'number')
    .slice(0, maxSamples);

  return forecasts.map((forecast, index) => {
    const speedKnots = forecast.currentSpeed ?? 0;
    const speedMps = speedKnots / 1.944;
    const direction = forecast.currentDirection ?? 0;

    const nauticalMiles = 0.12 + index * 0.08;
    const radians = (direction * Math.PI) / 180;
    const latOffset = (nauticalMiles * Math.cos(radians)) / 60;
    const lonOffset =
      (nauticalMiles * Math.sin(radians)) /
      (60 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));

    const confidence =
      typeof forecast.confidence === 'number'
        ? Math.max(0.25, Math.min(1, forecast.confidence))
        : Math.max(0.25, Math.min(1, weather.sources?.reliability ?? 0.8));

    return {
      time: forecast.timestamp,
      latitude: lat + latOffset,
      longitude: lng + lonOffset,
      speed: speedMps,
      direction,
      confidence,
    };
  });
}

function convertStrategicZonesToOverlay(
  zones: StrategicZone[] | undefined,
  type: OverlayPolygon['properties']['type'],
  color: string
): OverlayPolygon[] {
  if (!zones || zones.length === 0) {
    return [];
  }

  return zones.map((zone, index) => ({
    type: 'Feature' as const,
    geometry: zone.polygon,
    properties: {
      id: `${type}-${index}`,
      name: zone.name ?? `${type} ${index + 1}`,
      type,
      description: zone.description,
      speedChange: zone.properties?.speedIncrease ?? (type === 'current-acceleration' ? 0.2 : -0.2),
      estimatedSpeed: zone.estimatedCurrent,
      confidence: zone.confidence ?? 0.5,
      color
    }
  }));
}

  // ============================================================================
  // LAYER CONTROLS
  // ============================================================================

  const toggleLayer = (layerId: string) => {
    setLayers((prev) => {
      const oldLayer = prev.find(l => l.id === layerId);
      const updated = prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      );
      const newLayer = updated.find(l => l.id === layerId);

      // Notify parent of layer changes
      if (onLayersChange) {
        const layerState = updated.reduce((acc, layer) => {
          acc[layer.id] = layer.enabled;
          return acc;
        }, {} as { [key: string]: boolean });
        onLayersChange(layerState);
      }

      return updated;
    });
  };

  const toggle2D3D = () => {
    if (!mapRef.current) return;

    const newIs3D = !is3D;
    setIs3D(newIs3D);

    mapRef.current.easeTo({
      pitch: newIs3D ? 45 : 0,
      duration: 800,
    });
  };

  const startDrawingArea = () => {
    setIsDrawingArea(true);
    setRacingAreaPoints([]);
  };

  const clearRacingArea = () => {
    setRacingAreaPoints([]);
  };

  const completeRacingArea = () => {
    if (racingAreaPoints.length < 3) {
      return;
    }

    setIsDrawingArea(false);
  };

  const cancelDrawingArea = () => {
    setIsDrawingArea(false);
    setRacingAreaPoints([]);
  };

  const undoLastPoint = () => {
    setRacingAreaPoints(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  };

  const clearAllPoints = () => {
    setRacingAreaPoints([]);
  };

  useEffect(() => {
    if (!onRacingAreaSelected) return;
    onRacingAreaSelected(racingAreaPoints);
  }, [racingAreaPoints, onRacingAreaSelected]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isWeb) {
    return (
      <View style={styles.fallbackContainer}>
        <Ionicons name="map-outline" size={64} color="#0066CC" />
        <Text style={styles.fallbackText}>3D Tactical Race Map</Text>
        <Text style={styles.fallbackSubtext}>Available on web platform</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={[styles.mapWrapper, { minHeight: 400 }]}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 400,
            borderRadius: 12,
          }}
        />

        {/* Loading Overlay */}
        {!mapLoaded && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>🗺️ Loading tactical map...</Text>
          </View>
        )}

        {/* Depth Legend & Global Shading Toggle */}
        {mapLoaded && depthLayerEnabled && (
          <View style={styles.depthLegendContainer} pointerEvents="box-none">
            <Text style={styles.depthLegendTitle}>Victoria Harbour depth zones</Text>
            {depthLegendItems.map((item) => (
              <View key={item.label} style={styles.depthLegendRow}>
                <View style={[styles.depthLegendSwatch, { backgroundColor: item.color }]} />
                <View style={styles.depthLegendLabelGroup}>
                  <Text style={styles.depthLegendLabel}>{item.label}</Text>
                  <Text style={styles.depthLegendDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.depthLegendToggle,
                showGlobalBathymetry && styles.depthLegendToggleActive,
              ]}
              onPress={() => setShowGlobalBathymetry((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showGlobalBathymetry ? 'earth' : 'earth-outline'}
                size={16}
                color={showGlobalBathymetry ? '#0ea5e9' : '#475569'}
              />
              <View style={styles.depthLegendToggleTextGroup}>
                <Text style={styles.depthLegendToggleText}>
                  {showGlobalBathymetry ? 'Global shading on' : 'Blend GEBCO shading'}
                </Text>
                <Text style={styles.depthLegendToggleSubtext}>
                  Adds worldwide raster tiles for additional context.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Racing Area Selection Controls */}
        {allowAreaSelection && mapLoaded && (
          <View style={styles.racingAreaControls}>
            {!isDrawingArea ? (
              <TouchableOpacity
                style={styles.drawAreaButton}
                onPress={startDrawingArea}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color="white" />
                <Text style={styles.drawAreaButtonText}>Draw Racing Area</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.drawingControls}>
                <Text style={styles.drawingHint}>
                  Click map to add points ({racingAreaPoints.length}/3+ needed)
                </Text>
                <View style={styles.drawingButtons}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearRacingArea}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#ef4444" />
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelDrawingArea}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-outline" size={16} color="#64748B" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      racingAreaPoints.length < 3 && styles.completeButtonDisabled,
                    ]}
                    onPress={completeRacingArea}
                    activeOpacity={0.7}
                    disabled={racingAreaPoints.length < 3}
                  >
                    <Ionicons name="checkmark-outline" size={16} color="white" />
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Layer Controls */}
      {showControls && mapLoaded && (
        <View style={styles.controlsContainer}>
          <Text style={styles.controlsTitle}>Map Layers</Text>

          {/* Environmental Layers */}
          <Text style={styles.categoryTitle}>Environmental</Text>
          <View style={styles.layerGrid}>
            {layers.filter((l) => l.category === 'environmental').map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  layer.enabled && styles.layerButtonActive,
                ]}
                onPress={() => toggleLayer(layer.id)}
              >
                <Ionicons
                  name={layer.icon}
                  size={14}
                  color={layer.enabled ? '#0066CC' : '#666'}
                />
                <Text
                  style={[
                    styles.layerButtonText,
                    layer.enabled && styles.layerButtonTextActive,
                  ]}
                >
                  {layer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tactical Layers */}
          <Text style={styles.categoryTitle}>Tactical</Text>
          <View style={styles.layerGrid}>
            {layers.filter((l) => l.category === 'tactical').map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  layer.enabled && styles.layerButtonActive,
                ]}
                onPress={() => toggleLayer(layer.id)}
              >
                <Ionicons
                  name={layer.icon}
                  size={14}
                  color={layer.enabled ? '#0066CC' : '#666'}
                />
                <Text
                  style={[
                    styles.layerButtonText,
                    layer.enabled && styles.layerButtonTextActive,
                  ]}
                >
                  {layer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Professional Layers */}
          <Text style={styles.categoryTitle}>Professional</Text>
          <View style={styles.layerGrid}>
            {layers.filter((l) => l.category === 'professional').map((layer) => (
              <TouchableOpacity
                key={layer.id}
                style={[
                  styles.layerButton,
                  layer.enabled && styles.layerButtonActive,
                ]}
                onPress={() => toggleLayer(layer.id)}
              >
                <Ionicons
                  name={layer.icon}
                  size={14}
                  color={layer.enabled ? '#0066CC' : '#666'}
                />
                <Text
                  style={[
                    styles.layerButtonText,
                    layer.enabled && styles.layerButtonTextActive,
                  ]}
                >
                  {layer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Environmental Summary */}
      {environmental && mapLoaded && displayConditions && (
        <View style={styles.environmentalSummary}>
          <Text style={styles.summaryTitle}>
            {displayConditions.isForecast ? 'Forecast Conditions' : 'Current Conditions'}
            {displayConditions.isForecast && raceStartDate
              ? ` · ${raceStartDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
              : ''}
          </Text>
          <View style={styles.conditionsGrid}>
            {displayConditions.isForecast && 'time' in displayConditions.snapshot && (
              <View style={styles.conditionItem}>
                <Ionicons name="calendar-outline" size={16} color="#10b981" />
                <Text style={styles.conditionText}>
                  {new Date(displayConditions.snapshot.time).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
            <View style={styles.conditionItem}>
              <Ionicons name="flag-outline" size={16} color="#3b82f6" />
              <Text style={styles.conditionText}>
                {Math.round(displayConditions.snapshot.wind.speed)}kt @ {Math.round(displayConditions.snapshot.wind.direction)}°
              </Text>
            </View>
            {displayConditions.snapshot.tide?.current_speed && (
              <View style={styles.conditionItem}>
                <Ionicons name="water-outline" size={16} color="#06b6d4" />
                <Text style={styles.conditionText}>
                  {displayConditions.snapshot.tide.current_speed.toFixed(1)}kt {displayConditions.snapshot.tide.state}
                </Text>
              </View>
            )}
            {displayConditions.snapshot.wave && (
              <View style={styles.conditionItem}>
                <Ionicons name="trending-up-outline" size={16} color="#f59e0b" />
                <Text style={styles.conditionText}>
                  {displayConditions.snapshot.wave.height.toFixed(1)}m waves
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapWrapper: {
    flex: 1,
    minHeight: 400, // Ensure map has minimum height for MapLibre to render
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
    marginTop: 16,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  controlsContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  layerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  layerButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0066CC',
  },
  layerButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  layerButtonTextActive: {
    color: '#0066CC',
  },
  environmentalSummary: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  conditionsGrid: {
    gap: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conditionText: {
    fontSize: 13,
    color: '#64748B',
  },
  depthLegendContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    maxWidth: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 14,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  depthLegendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  depthLegendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  depthLegendSwatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
  },
  depthLegendLabelGroup: {
    flex: 1,
    gap: 2,
  },
  depthLegendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  depthLegendDescription: {
    fontSize: 12,
    color: '#cbd5f5',
    lineHeight: 16,
  },
  depthLegendToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  depthLegendToggleActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  depthLegendToggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  depthLegendToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  depthLegendToggleSubtext: {
    fontSize: 11,
    color: '#cbd5f5',
  },
  racingAreaControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    maxWidth: 400,
  },
  drawAreaButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  drawAreaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  drawingControls: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 10,
  },
  drawingHint: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  drawingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  completeButtonDisabled: {
    backgroundColor: '#94a3b8',
    borderColor: '#cbd5e1',
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});
