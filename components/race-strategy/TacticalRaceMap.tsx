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
import type {
  CourseMark,
  RaceEventWithDetails,
  EnvironmentalIntelligence,
  WindData,
  TideData,
  WaveData
} from '@/types/raceEvents';

const isWeb = Platform.OS === 'web';

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
  toggle2D3D: toggle2D3DTrigger
}: TacticalRaceMapProps) {
  console.log('🎬 [COMPONENT] TacticalRaceMap render - marks:', marks?.length || 0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(true);

  // Component mount/unmount tracking
  useEffect(() => {
    console.log('🎬 [COMPONENT] TacticalRaceMap MOUNTED');
    return () => {
      console.log('🎬 [COMPONENT] TacticalRaceMap UNMOUNTING');
    };
  }, []);

  // Racing area selection state
  const [isDrawingArea, setIsDrawingArea] = useState(false);
  // INTERNAL state management - this is what makes it work!
  const [racingAreaPoints, setRacingAreaPoints] = useState<[number, number][]>([]);

  // Draggable points state
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);

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

  // Initialize racing area from prop on mount or when prop changes
  useEffect(() => {
    if (initialRacingArea && initialRacingArea.length > 0) {
      const points = initialRacingArea.map(p => [p.lng, p.lat] as [number, number]);
      // Only update if different from current points (to avoid infinite loops)
      const isDifferent = points.length !== racingAreaPoints.length ||
        points.some((p, i) => p[0] !== racingAreaPoints[i]?.[0] || p[1] !== racingAreaPoints[i]?.[1]);

      if (isDifferent) {
        setRacingAreaPoints(points);
        console.log('📍 Initialized racing area from props:', points.length, 'points');
      }
    } else if ((!initialRacingArea || initialRacingArea.length === 0) && racingAreaPoints.length > 0) {
      // Clear racing area if prop is undefined/null OR empty array (e.g., after "Clear All")
      setRacingAreaPoints([]);
      console.log('🧹 Cleared racing area (empty or no initial area provided)');
    }
  }, [initialRacingArea]);

  // Notify parent of point count changes
  useEffect(() => {
    console.log('[TacticalRaceMap] Point count changed:', racingAreaPoints.length, 'points:', racingAreaPoints);
    onPointsChanged?.(racingAreaPoints.length);
  }, [racingAreaPoints.length, racingAreaPoints]);
  // Note: Intentionally omitting onPointsChanged from deps to avoid infinite loops
  // The callback reference may change on every render, but we only care about point changes

  // Layer state
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'wind', name: 'Wind', icon: 'flag-outline', enabled: true, category: 'environmental', description: 'Wind direction and speed' },
    { id: 'current', name: 'Current', icon: 'water-outline', enabled: true, category: 'environmental', description: 'Tidal current flow' },
    { id: 'waves', name: 'Waves', icon: 'trending-up-outline', enabled: false, category: 'environmental', description: 'Wave height gradient' },
    { id: 'depth', name: 'Depth', icon: 'layers-outline', enabled: false, category: 'environmental', description: 'Bathymetry contours' },
    { id: 'laylines', name: 'Laylines', icon: 'git-branch-outline', enabled: false, category: 'tactical', description: 'Upwind laylines' },
    { id: 'strategy', name: 'Strategy', icon: 'analytics-outline', enabled: false, category: 'tactical', description: 'Tactical analysis' },
  ]);

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!isWeb) {
      console.log('⚠️ Not web platform, skipping map initialization');
      return;
    }

    const initializeMap = async () => {
      try {
        console.log('🗺️ [MAP INIT] Starting TacticalRaceMap initialization...');
        console.log('🗺️ [MAP INIT] Container ref exists:', !!mapContainerRef.current);
        console.log('🗺️ [MAP INIT] Current mapRef:', !!mapRef.current);
        console.log('🗺️ [MAP INIT] Map loaded state:', mapLoaded);

        // Prevent duplicate initialization
        if (mapRef.current) {
          console.log('⚠️ [MAP INIT] Map already exists, skipping initialization');
          return;
        }

        const maplibregl = await import('maplibre-gl');
        console.log('✅ [MAP INIT] MapLibre GL library loaded successfully');
        console.log('✅ [MAP INIT] MapLibre GL version:', maplibregl.version || 'unknown');

        // Load CSS dynamically for web
        if (typeof document !== 'undefined' && !document.getElementById('maplibre-gl-css')) {
          const link = document.createElement('link');
          link.id = 'maplibre-gl-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css';
          document.head.appendChild(link);
        }

        if (!mapContainerRef.current) {
          console.error('❌ [MAP INIT] Map container ref is null - cannot create map');
          return;
        }

        console.log('✅ [MAP INIT] Container ref is valid, proceeding with map creation');

        // Clean up any existing MapLibre elements in the container (from HMR)
        const container = mapContainerRef.current;
        if (container.children.length > 0) {
          console.log('🧹 [MAP INIT] Cleaning existing map elements from container (HMR cleanup)');
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }

        // Calculate course center from marks
        const center = getMapCenter(marks, raceEvent.venue);
        console.log('🗺️ [MAP INIT] Calculated center:', center);
        console.log('🗺️ [MAP INIT] Number of marks:', marks?.length || 0);

        // Initialize map
        console.log('🗺️ [MAP INIT] Creating MapLibre Map instance...');
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: createNauticalStyle(),
          center,
          zoom: 14,
          pitch: 45, // 3D perspective
          bearing: 0,
          antialias: true,
        });

        console.log('✅ [MAP INIT] Map instance created successfully');
        mapRef.current = map;
        console.log('✅ [MAP INIT] Map ref assigned');

        // Verify canvas was created
        setTimeout(() => {
          const canvas = container.querySelector('.maplibregl-canvas');
          if (canvas) {
            console.log('✅ [MAP INIT] MapLibre canvas verified in DOM');
          } else {
            console.error('❌ [MAP INIT] MapLibre canvas NOT found in DOM after 100ms');
            console.error('❌ [MAP INIT] Container children:', container.children.length);
          }
        }, 100);

        // Add controls
        console.log('🗺️ [MAP INIT] Adding navigation controls...');
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
        console.log('🗺️ [MAP INIT] Registering load event handler...');
        map.on('load', async () => {
          console.log('✅ [MAP LOAD] Map load event fired!');
          console.log('✅ [MAP LOAD] Setting mapLoaded to true');
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
              console.log('✅ [MAP LOAD] Arrow icon added to map');
            }
          };
          arrowImage.src = 'data:image/svg+xml;base64,' + btoa(arrowSVG);

          // Add all layers
          console.log('🗺️ [MAP LOAD] Adding race course with', marks?.length, 'marks');
          await addRaceCourse(map, marks);

          if (environmental) {
            await addWindLayer(map, marks, environmental);
            await addCurrentLayer(map, marks, environmental);
          }

          // Fit to course
          fitMapToCourse(map, marks);
        });

        console.log('🗺️ [MAP INIT] Registering error event handler...');
        map.on('error', (e: any) => {
          console.error('❌ [MAP ERROR] Map error event fired:', e?.error || e?.message || e);
          if (e?.error) {
            console.error('❌ [MAP ERROR] Error details:', e.error.message, e.error.stack);
          }
        });

        console.log('✅ [MAP INIT] Map initialization complete, waiting for load event...');

      } catch (error) {
        console.error('❌ [MAP INIT] Failed to initialize map:', error);
        console.error('❌ [MAP INIT] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        setMapLoaded(true); // Show error state
      }
    };

    console.log('🗺️ [MAP INIT] Calling initializeMap()...');
    initializeMap();

    return () => {
      console.log('🧹 [MAP CLEANUP] Cleanup function called');
      if (mapRef.current) {
        console.log('🧹 [MAP CLEANUP] Removing map instance...');
        mapRef.current.remove();
        mapRef.current = null;
        console.log('✅ [MAP CLEANUP] Map removed and ref set to null');
      } else {
        console.log('⚠️ [MAP CLEANUP] Map ref was already null, nothing to clean up');
      }
    };
  }, []);

  // ============================================================================
  // MARKS UPDATES - Re-render marks when prop changes
  // ============================================================================

  useEffect(() => {
    console.log('🔄 [MARKS UPDATE] useEffect triggered');
    console.log('🔄 [MARKS UPDATE] mapRef.current exists:', !!mapRef.current);
    console.log('🔄 [MARKS UPDATE] mapLoaded:', mapLoaded);
    console.log('🔄 [MARKS UPDATE] marks length:', marks?.length || 0);

    if (!mapRef.current || !mapLoaded) {
      console.log('⚠️ [MARKS UPDATE] Skipping - map not ready (mapRef:', !!mapRef.current, ', mapLoaded:', mapLoaded, ')');
      return;
    }

    const map = mapRef.current;
    console.log('🔄 [MARKS UPDATE] Marks prop changed, updating map with', marks?.length, 'marks');

    // Re-add race course with updated marks
    addRaceCourse(map, marks).then(() => {
      console.log('✅ [MARKS UPDATE] Marks updated on map successfully');
      // Re-fit map to new course
      fitMapToCourse(map, marks);
    }).catch((error) => {
      console.error('❌ [MARKS UPDATE] Error updating marks:', error);
    });
  }, [marks, mapLoaded]);

  // ============================================================================
  // LAYER UPDATES
  // ============================================================================

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    layers.forEach(async (layer) => {
      const visibility = layer.enabled ? 'visible' : 'none';

      try {
        // Toggle existing layers
        if (map.getLayer(layer.id)) {
          map.setLayoutProperty(layer.id, 'visibility', visibility);
        } else if (layer.enabled) {
          // Create layer if it doesn't exist but should be visible
          switch (layer.id) {
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
        console.log(`Layer ${layer.id} not ready:`, error);
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
      if (!isDrawingArea) return;

      // Check if clicking on an existing point - if so, don't add a new point
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['user-racing-area-points']
      });

      if (features.length > 0) {
        // Clicking on existing point - let the drag handler deal with it
        console.log('🚫 Clicked on existing point - not adding new point');
        return;
      }

      const { lng, lat } = e.lngLat;
      const newPoint: [number, number] = [lng, lat];

      // Update INTERNAL state - this is the key!
      setRacingAreaPoints(prev => {
        const updated = [...prev, newPoint];
        console.log('📍 [TacticalRaceMap] Added point:', newPoint, 'Total points:', updated.length);

        // Notify parent with updated array
        if (onRacingAreaSelected) {
          onRacingAreaSelected(updated);
        }

        return updated;
      });
    };

    if (isDrawingArea) {
      map.getCanvas().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getCanvas().style.cursor = '';
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingArea, mapLoaded]);

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
      console.log('🗑️ Cleared racing area visualization');
      return;
    }

    // Add points markers
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
        console.log('🎯 Centered map on racing area bounds:', bounds);

        // Regenerate environmental layers after map moves to new bounds
        // Wait for moveend event to ensure map has finished animating
        map.once('moveend', async () => {
          console.log('🌊 Regenerating environmental layers for racing area...');

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
            console.log('✅ Environmental layers regenerated');
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

    console.log('✅ Racing area visualization updated:', racingAreaPoints.length, 'points');
  }, [racingAreaPoints, mapLoaded]);

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
      console.warn('⚠️ user-racing-area-points layer not found, skipping drag setup');
      return;
    }

    console.log('🎯 Setting up draggable points for', racingAreaPoints.length, 'points');

    let draggedPointIdx: number | null = null;

    // Mouse down on a point (left-click only - right-click handled by onContextMenu)
    const onMouseDown = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['user-racing-area-points']
      });

      console.log('🖱️ Mouse down, features found:', features.length);

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

      console.log('🖱️ Started dragging point:', draggedPointIdx);
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

      console.log('✅ Finished dragging point:', draggedPointIdx);

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
      console.log('🗑️ Deleting point:', pointIndex);

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
  // MAP STYLE
  // ============================================================================

  const createNauticalStyle = () => {
    console.log('🗺️ [STYLE] Creating nautical map style with Stamen Terrain tiles');
    return {
      version: 8,
      name: 'Nautical Racing Chart',
      sources: {
        'stamen-terrain': {
          type: 'raster',
          tiles: [
            'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© Stamen Design, © OpenStreetMap contributors',
          maxzoom: 18,
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#FF00FF', // Bright magenta to diagnose if tiles are loading
          },
        },
        {
          id: 'terrain-base',
          type: 'raster',
          source: 'stamen-terrain',
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
    console.log('🎯 addRaceCourse called with', marks?.length, 'marks');

    if (!marks || marks.length === 0) {
      console.error('❌ No marks to render!');
      return;
    }

    // Remove existing course layers and sources if they exist
    const layersToRemove = ['race-marks-glow', 'race-marks-circle', 'course-lines', 'course-arrows'];
    const sourcesToRemove = ['race-marks', 'course-lines'];

    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        console.log('🧹 Removed layer:', layerId);
      }
    });

    sourcesToRemove.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
        console.log('🧹 Removed source:', sourceId);
      }
    });

    // Remove existing DOM marker labels
    const existingLabels = document.querySelectorAll('.mark-label');
    existingLabels.forEach(label => label.parentElement?.remove());
    if (existingLabels.length > 0) {
      console.log('🧹 Removed', existingLabels.length, 'existing mark labels');
    }

    // Create GeoJSON for marks
    const markFeatures = marks.map((mark) => {
      // Support both database schemas
      const lat = (mark as any).coordinates_lat || (mark as any).latitude || 0;
      const lng = (mark as any).coordinates_lng || (mark as any).longitude || 0;
      const name = (mark as any).mark_name || (mark as any).name || 'Unknown';
      const type = (mark as any).mark_type || (mark as any).type || 'unknown';

      console.log(`🗺️ [TacticalRaceMap] Rendering mark "${name}":`, { lat, lng, coordinates: [lng, lat] });

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

    // Course lines
    if (marks.length >= 2) {
      const lineCoords = marks.map((m) => {
        const lat = (m as any).coordinates_lat || (m as any).latitude || 0;
        const lng = (m as any).coordinates_lng || (m as any).longitude || 0;
        return [lng, lat];
      });

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

    console.log('✅ Race course rendered:', marks.length, 'marks');
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

    // Create grid of wind arrows across entire visible map
    const gridRows = 8; // Vertical arrows
    const gridCols = 12; // Horizontal arrows
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

    console.log(`✅ Wind layer: ${wind.speed}kt @ ${wind.direction}°`);
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
    const gridRows = 6; // Fewer than wind arrows for less clutter
    const gridCols = 9;
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

    console.log(`✅ Current layer: ${tide.current_speed}kt @ ${tide.current_direction}°`);
  };

  // ============================================================================
  // WAVE LAYER
  // ============================================================================

  const addWaveLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    if (!env || !env.current.wave) return;

    const wave = env.current.wave;
    const center = getMapCenter(marks);

    // Create wave height gradient
    const radius = 0.01; // ~1km
    const waveZones = [
      {
        center,
        radius: radius * 0.3,
        height: wave.height,
      },
      {
        center,
        radius: radius * 0.6,
        height: wave.height * 0.8,
      },
      {
        center,
        radius: radius,
        height: wave.height * 0.6,
      },
    ];

    waveZones.forEach((zone, idx) => {
      map.addSource(`waves-${idx}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: zone.center,
          },
          properties: {
            height: zone.height,
          },
        },
      });

      map.addLayer({
        id: `waves-${idx}`,
        type: 'circle',
        source: `waves-${idx}`,
        paint: {
          'circle-radius': zone.radius * 111000, // degrees to meters
          'circle-color': getWaveColor(zone.height),
          'circle-opacity': 0.2,
        },
      });
    });

    console.log(`✅ Wave layer: ${wave.height}m`);
  };

  // ============================================================================
  // DEPTH/BATHYMETRY LAYER
  // ============================================================================

  const addDepthLayer = async (map: any, marks: CourseMark[]) => {
    // Placeholder for depth contours
    // In production, this would load bathymetry data from NOAA, UK Hydrographic Office, etc.
    console.log('📊 Depth layer would display bathymetry contours here');

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

    console.log(`✅ Laylines: Port=${portTackBearing.toFixed(0)}° Stbd=${starboardTackBearing.toFixed(0)}° (Wind from ${windDirection}°)`);
  };

  const addStrategyLayer = async (map: any, marks: CourseMark[], env?: EnvironmentalIntelligence) => {
    // Strategic analysis visualization
    // - Favored side highlighting
    // - Start line bias
    // - Optimal approach zones
    console.log('🎯 Strategic analysis layer (placeholder)');
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
      pitch: 45,
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
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
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
    console.log('🎨 Started drawing racing area');
  };

  const clearRacingArea = () => {
    setRacingAreaPoints([]);
    console.log('🧹 Cleared racing area');
  };

  const completeRacingArea = () => {
    if (racingAreaPoints.length < 3) {
      console.warn('⚠️ Need at least 3 points to complete racing area');
      return;
    }

    setIsDrawingArea(false);

    if (onRacingAreaSelected) {
      onRacingAreaSelected(racingAreaPoints);
      console.log('✅ Racing area completed:', racingAreaPoints.length, 'points');
    }
  };

  const cancelDrawingArea = () => {
    setIsDrawingArea(false);
    setRacingAreaPoints([]);
    console.log('❌ Cancelled racing area drawing');
  };

  const undoLastPoint = () => {
    setRacingAreaPoints(prev => {
      if (prev.length === 0) return prev;
      const updated = prev.slice(0, -1);
      console.log('↩️ Undid last point. Remaining:', updated.length);

      if (onRacingAreaSelected) {
        onRacingAreaSelected(updated);
      }

      return updated;
    });
  };

  const clearAllPoints = () => {
    setRacingAreaPoints([]);
    console.log('🧹 Cleared all points');

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
      {environmental && mapLoaded && (
        <View style={styles.environmentalSummary}>
          <Text style={styles.summaryTitle}>Conditions</Text>
          <View style={styles.conditionsGrid}>
            <View style={styles.conditionItem}>
              <Ionicons name="flag-outline" size={16} color="#3b82f6" />
              <Text style={styles.conditionText}>
                {environmental.current.wind.speed}kt @ {environmental.current.wind.direction}°
              </Text>
            </View>
            {environmental.current.tide.current_speed && (
              <View style={styles.conditionItem}>
                <Ionicons name="water-outline" size={16} color="#06b6d4" />
                <Text style={styles.conditionText}>
                  {environmental.current.tide.current_speed}kt {environmental.current.tide.state}
                </Text>
              </View>
            )}
            {environmental.current.wave && (
              <View style={styles.conditionItem}>
                <Ionicons name="trending-up-outline" size={16} color="#f59e0b" />
                <Text style={styles.conditionText}>
                  {environmental.current.wave.height}m waves
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
