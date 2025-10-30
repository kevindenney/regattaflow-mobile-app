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

import React, { useEffect, useRef, useState, useMemo } from 'react';
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

const isWeb = Platform.OS === 'web';
const logger = createLogger('TacticalRaceMap');

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
}

interface MapLayer {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
  category: 'environmental' | 'tactical' | 'base';
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
  racingAreaPolygon
}: TacticalRaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false); // Default to 2D

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

  // Initialize racing area from prop on mount or when prop changes
  useEffect(() => {
    if (initialRacingArea && initialRacingArea.length > 0) {
      const points = initialRacingArea.map(p => [p.lng, p.lat] as [number, number]);
      // Only update if different from current points (to avoid infinite loops)
      const isDifferent = points.length !== racingAreaPoints.length ||
        points.some((p, i) => p[0] !== racingAreaPoints[i]?.[0] || p[1] !== racingAreaPoints[i]?.[1]);

      if (isDifferent) {
        setRacingAreaPoints(points);
      }
    } else if ((!initialRacingArea || initialRacingArea.length === 0) && racingAreaPoints.length > 0) {
      // Clear racing area if prop is undefined/null OR empty array (e.g., after "Clear All")
      setRacingAreaPoints([]);
    }
  }, [initialRacingArea]);

  // Notify parent of point count changes
  useEffect(() => {
    onPointsChanged?.(racingAreaPoints.length);
  }, [racingAreaPoints.length, racingAreaPoints]);
  // Note: Intentionally omitting onPointsChanged from deps to avoid infinite loops
  // The callback reference may change on every render, but we only care about point changes

  // Layer state - initialize from externalLayers if provided
  const [layers, setLayers] = useState<MapLayer[]>(() => [
    { id: 'wind', name: 'Wind', icon: 'flag-outline', enabled: externalLayers?.wind ?? true, category: 'environmental', description: 'Wind direction and speed' },
    { id: 'current', name: 'Current', icon: 'water-outline', enabled: externalLayers?.current ?? true, category: 'environmental', description: 'Tidal current flow' },
    { id: 'waves', name: 'Waves', icon: 'trending-up-outline', enabled: externalLayers?.waves ?? false, category: 'environmental', description: 'Wave height gradient' },
    { id: 'depth', name: 'Depth', icon: 'layers-outline', enabled: externalLayers?.depth ?? false, category: 'environmental', description: 'Bathymetry contours' },
    { id: 'laylines', name: 'Laylines', icon: 'git-branch-outline', enabled: externalLayers?.laylines ?? false, category: 'tactical', description: 'Upwind laylines' },
    { id: 'strategy', name: 'Strategy', icon: 'analytics-outline', enabled: externalLayers?.strategy ?? false, category: 'tactical', description: 'Tactical analysis' },
  ]);

  // Sync with external layer changes
  useEffect(() => {
    if (externalLayers) {
      setLayers(prev => prev.map(layer => ({
        ...layer,
        enabled: externalLayers[layer.id as keyof typeof externalLayers] ?? layer.enabled
      })));
    }
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
        const center = getMapCenter(marks, raceEvent.venue);

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

        mapRef.current = map;
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
          'top-right'
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

          if (environmental) {
            await addWindLayer(map, marks, environmental);
            await addCurrentLayer(map, marks, environmental);
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
      } else {
      }
    };
  }, []);

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
    if (!mapRef.current || !mapLoaded || !environmental) return;

    const map = mapRef.current;
    // Add environmental layers if they don't exist yet
    const ensureEnvironmentalLayers = async () => {
      const windLayer = layers.find(l => l.id === 'wind');
      const currentLayer = layers.find(l => l.id === 'current');
      const waveLayer = layers.find(l => l.id === 'waves');

      try {
        // Add wind layer if it doesn't exist and is enabled
        if (windLayer?.enabled && !map.getLayer('wind')) {
          await addWindLayer(map, marks, environmental);
        }

        // Add current layer if it doesn't exist and is enabled
        if (currentLayer?.enabled && !map.getLayer('current')) {
          await addCurrentLayer(map, marks, environmental);
        }

        // Add wave layer if it doesn't exist and is enabled
        if (waveLayer?.enabled && !map.getLayer('waves')) {
          await addWaveLayer(map, marks, environmental);
        }
      } catch (error) {
      }
    };

    ensureEnvironmentalLayers();
  }, [environmental, mapLoaded, layers]);

  // ============================================================================
  // LAYER UPDATES - Toggle layer visibility
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    layers.forEach(async (layer) => {
      const visibility = layer.enabled ? 'visible' : 'none';

      try {
        // For environmental layers, recreate them when toggling on to use current map bounds
        const isEnvironmentalLayer = ['wind', 'current', 'waves'].includes(layer.id);

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
                await addWindLayer(map, marks, environmental);
                break;
              case 'current':
                await addCurrentLayer(map, marks, environmental);
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
              await addWindLayer(map, marks, environmental);
              break;
            case 'current':
              await addCurrentLayer(map, marks, environmental);
              break;
            case 'waves':
              await addWaveLayer(map, marks, environmental);
              break;
            case 'depth':
              await addDepthLayer(map, marks);
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
  }, [layers, mapLoaded]);

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
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['user-racing-area-points']
      });

      if (features.length > 0) {
        // Clicking on existing point - let the drag handler deal with it
        return;
      }

      const { lng, lat } = e.lngLat;
      const newPoint: [number, number] = [lng, lat];

      // Update INTERNAL state - this is the key!
      setRacingAreaPoints(prev => {
        const updated = [...prev, newPoint];
        // Notify parent with updated array
        if (onRacingAreaSelected) {
          onRacingAreaSelected(updated);
        }

        return updated;
      });
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
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

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

          // Re-add with new bounds
          if (environmental) {
            await addWindLayer(map, marks, environmental);
            await addCurrentLayer(map, marks, environmental);
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

  }, [racingAreaPoints, mapLoaded, isDrawingArea]);

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
      if (onRacingAreaSelected) {
        onRacingAreaSelected(racingAreaPoints);
      }
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
      setRacingAreaPoints(prev => {
        const updated = prev.filter((_, idx) => idx !== pointIndex);

        // Notify parent
        if (onRacingAreaSelected) {
          onRacingAreaSelected(updated);
        }

        return updated;
      });
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
      if (__DEV__) {
        logger.debug('Auto-generation triggered', {
          wind: environmental.current.wind,
          polygonPoints: racingAreaPolygon.length,
          existingMarks: marks.length,
        });
      }
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
      // Check if we should replace existing marks or merge
      // For now, we'll only auto-generate if there are no marks yet
      if (marks.length === 0) {
        if (__DEV__) {
          logger.debug('Adding auto-generated marks', generatedMarks.length);
        }
        generatedMarks.forEach(mark => {
          onMarkAdded?.(mark);
        });
      } else {
        if (__DEV__) {
          logger.debug('Skipping auto-generation because marks exist', marks.length);
        }
      }
    });
  }, [racingAreaPolygon, environmental?.current?.wind, raceEvent.boat_class]);
  // Intentionally NOT including marks to avoid infinite loops

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

  const addDepthLayer = async (map: any, marks: CourseMark[]) => {
    // Placeholder for depth contours
    // In production, this would load bathymetry data from NOAA, UK Hydrographic Office, etc.
    // Example: Add depth zones
    const center = getMapCenter(marks);
    const depthZones = [
      { depth: 50, color: '#0ea5e9', radius: 0.005 },
      { depth: 20, color: '#06b6d4', radius: 0.003 },
      { depth: 10, color: '#22d3ee', radius: 0.002 },
    ];

    depthZones.forEach((zone, idx) => {
      map.addSource(`depth-${idx}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: center,
          },
          properties: {
            depth: zone.depth,
          },
        },
      });

      map.addLayer({
        id: `depth-${idx}`,
        type: 'circle',
        source: `depth-${idx}`,
        paint: {
          'circle-radius': zone.radius * 111000,
          'circle-color': zone.color,
          'circle-opacity': 0.15,
        },
      });
    });
  };

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

  // ============================================================================
  // LAYER CONTROLS
  // ============================================================================

  const toggleLayer = (layerId: string) => {
    setLayers((prev) => {
      const updated = prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      );

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

    if (onRacingAreaSelected) {
      onRacingAreaSelected(racingAreaPoints);
    }
  };

  const cancelDrawingArea = () => {
    setIsDrawingArea(false);
    setRacingAreaPoints([]);
  };

  const undoLastPoint = () => {
    setRacingAreaPoints(prev => {
      if (prev.length === 0) return prev;
      const updated = prev.slice(0, -1);
      if (onRacingAreaSelected) {
        onRacingAreaSelected(updated);
      }

      return updated;
    });
  };

  const clearAllPoints = () => {
    setRacingAreaPoints([]);
    if (onRacingAreaSelected) {
      onRacingAreaSelected([]);
    }
  };

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

        {/* 2D/3D Toggle Button */}
        {mapLoaded && (
          <TouchableOpacity
            style={styles.toggle2D3DButton}
            onPress={toggle2D3D}
            activeOpacity={0.7}
          >
            <Ionicons
              name={is3D ? 'cube-outline' : 'square-outline'}
              size={20}
              color="#0066CC"
            />
            <Text style={styles.toggle2D3DText}>{is3D ? '3D' : '2D'}</Text>
          </TouchableOpacity>
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
  toggle2D3DButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggle2D3DText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066CC',
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
