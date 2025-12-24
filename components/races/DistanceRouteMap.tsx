/**
 * DistanceRouteMap - Click-to-add waypoint map for distance racing
 * 
 * Allows users to click on the map to add waypoints that form a route.
 * Waypoints are connected by a polyline showing the race route.
 */

import { Anchor, ArrowDown, ArrowUp, Check, Edit2, Flag, MapPin, Navigation, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const isWeb = Platform.OS === 'web';

export interface RouteWaypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
}

interface DistanceRouteMapProps {
  waypoints: RouteWaypoint[];
  onWaypointsChange: (waypoints: RouteWaypoint[]) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  totalDistanceNm?: number;
  onTotalDistanceChange?: (distance: number) => void;
  onReimportWaypoints?: () => void; // Optional callback for re-importing waypoints
}

// Calculate distance between two points in nautical miles
function calculateDistanceNm(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate total route distance
function calculateTotalDistance(waypoints: RouteWaypoint[]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += calculateDistanceNm(
      waypoints[i - 1].latitude,
      waypoints[i - 1].longitude,
      waypoints[i].latitude,
      waypoints[i].longitude
    );
  }
  return Math.round(total * 10) / 10; // Round to 1 decimal
}

const WAYPOINT_TYPE_COLORS = {
  start: '#22c55e',    // green
  waypoint: '#3b82f6', // blue  
  gate: '#f59e0b',     // amber
  finish: '#ef4444',   // red
};

const WAYPOINT_TYPE_ICONS = {
  start: Flag,
  waypoint: MapPin,
  gate: Navigation,
  finish: Anchor,
};

export function DistanceRouteMap({
  waypoints,
  onWaypointsChange,
  initialCenter = { lat: 22.28, lng: 114.16 }, // Default: Hong Kong
  initialZoom = 10,
  onTotalDistanceChange,
  onReimportWaypoints,
}: DistanceRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null); // Store maplibre module reference
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const hasFitBoundsRef = useRef(false); // Track if we've already fit bounds to prevent re-fitting on every update
  const lastWaypointsKeyRef = useRef<string>(''); // Track waypoint changes to detect actual coordinate changes
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(true); // Start in add mode
  const [nextWaypointType, setNextWaypointType] = useState<RouteWaypoint['type']>('start'); // Start with 'start' waypoint
  const [editingWaypoint, setEditingWaypoint] = useState<string | null>(null); // ID of waypoint being edited
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<RouteWaypoint['type']>('waypoint');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false); // When true, clicking map sets coordinates
  
  // Refs to track current state for event handlers (closures capture stale values)
  const isAddingWaypointRef = useRef(true);
  const nextWaypointTypeRef = useRef<RouteWaypoint['type']>('start');
  const waypointsRef = useRef<RouteWaypoint[]>(waypoints);
  const onWaypointsChangeRef = useRef(onWaypointsChange);
  const isSelectingOnMapRef = useRef(false);
  const editingWaypointRef = useRef<string | null>(null);

  // Helper function to update map cursor
  const updateMapCursor = useCallback((map: any, isAdding: boolean) => {
    if (!map || !map.getCanvasContainer) return;
    const canvas = map.getCanvasContainer();
    if (canvas) {
      canvas.style.cursor = isAdding ? 'crosshair' : 'grab';
    }
  }, []);

  // Keep refs in sync with state (for event handlers)
  useEffect(() => {
    isAddingWaypointRef.current = isAddingWaypoint;
    // Update cursor and drag behavior when adding mode changes
    if (mapRef.current) {
      const canvas = mapRef.current.getCanvasContainer();
      if (canvas) {
        if (isSelectingOnMap) {
          canvas.style.cursor = 'crosshair';
        } else {
          canvas.style.cursor = isAddingWaypoint ? 'crosshair' : 'grab';
        }
      }
      // Enable/disable map panning based on mode
      if (isAddingWaypoint || isSelectingOnMap) {
        mapRef.current.dragPan.disable();
      } else {
        mapRef.current.dragPan.enable();
      }
    }
  }, [isAddingWaypoint, isSelectingOnMap, updateMapCursor]);
  
  useEffect(() => {
    nextWaypointTypeRef.current = nextWaypointType;
  }, [nextWaypointType]);
  
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);
  
  useEffect(() => {
    onWaypointsChangeRef.current = onWaypointsChange;
  }, [onWaypointsChange]);
  
  useEffect(() => {
    isSelectingOnMapRef.current = isSelectingOnMap;
  }, [isSelectingOnMap]);
  
  useEffect(() => {
    editingWaypointRef.current = editingWaypoint;
  }, [editingWaypoint]);

  // Calculate and report total distance when waypoints change
  useEffect(() => {
    const distance = calculateTotalDistance(waypoints);
    onTotalDistanceChange?.(distance);
  }, [waypoints, onTotalDistanceChange]);

  // Initialize map (web only with MapLibre)
  useEffect(() => {
    if (!isWeb || !mapContainerRef.current || mapRef.current) return;

    let handleKeyDown: ((e: KeyboardEvent) => void) | null = null;
    let handleKeyUp: ((e: KeyboardEvent) => void) | null = null;

    const initMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        await import('maplibre-gl/dist/maplibre-gl.css');
        
        // Store module reference for marker creation
        maplibreRef.current = maplibregl.default;

        const map = new maplibregl.default.Map({
          container: mapContainerRef.current!,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
        });

        map.addControl(new maplibregl.default.NavigationControl(), 'top-left');

        // Enable panning with right-click drag (common map pattern)
        let isRightClickPanning = false;
        map.on('contextmenu', (e: any) => {
          e.preventDefault();
          isRightClickPanning = true;
          map.dragPan.enable();
          // Temporarily disable click-to-add while right-click panning
          const canvas = map.getCanvasContainer();
          if (canvas) {
            canvas.style.cursor = 'grab';
          }
        });

        // Re-enable click-to-add when right mouse button is released
        map.on('mouseup', (e: any) => {
          if (e.originalEvent.button === 2) { // Right mouse button
            isRightClickPanning = false;
            // Restore proper drag pan state based on mode
            if (isAddingWaypointRef.current || isSelectingOnMapRef.current) {
              map.dragPan.disable();
              const canvas = map.getCanvasContainer();
              if (canvas) {
                canvas.style.cursor = isAddingWaypointRef.current ? 'crosshair' : 'grab';
              }
            }
          }
        });

        // Enable panning with spacebar (hold space + drag)
        let isSpacePressed = false;
        handleKeyDown = (e: KeyboardEvent) => {
          if (e.code === 'Space' && !isSpacePressed) {
            isSpacePressed = true;
            map.dragPan.enable();
            const canvas = map.getCanvasContainer();
            if (canvas) {
              canvas.style.cursor = 'grab';
            }
          }
        };
        handleKeyUp = (e: KeyboardEvent) => {
          if (e.code === 'Space' && isSpacePressed) {
            isSpacePressed = false;
            // Restore proper drag pan state based on mode
            if (isAddingWaypointRef.current || isSelectingOnMapRef.current) {
              map.dragPan.disable();
              const canvas = map.getCanvasContainer();
              if (canvas) {
                canvas.style.cursor = isAddingWaypointRef.current ? 'crosshair' : 'grab';
              }
            } else {
              const canvas = map.getCanvasContainer();
              if (canvas) {
                canvas.style.cursor = 'grab';
              }
            }
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Set up click handler BEFORE map loads to ensure it's registered
        // Handle click to add waypoint OR select location for editing - use refs for current state
        map.on('click', (e: any) => {
          // Don't add waypoint if we're right-click panning or space panning
          if (isRightClickPanning || isSpacePressed) {
            return;
          }
          const { lng, lat } = e.lngLat;
          
          // Check if we're selecting location for editing a waypoint
          if (isSelectingOnMapRef.current && editingWaypointRef.current) {
            console.log('[DistanceRouteMap] Selecting location for waypoint:', lat, lng);
            // Update coordinates via state - this will trigger a re-render
            setEditLat(lat.toFixed(6));
            setEditLng(lng.toFixed(6));
            setIsSelectingOnMap(false);
            // Center map on selected location
            map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14), duration: 500 });
            return;
          }
          
          // Otherwise, handle adding new waypoint
          console.log('[DistanceRouteMap] Map clicked, isAddingWaypoint:', isAddingWaypointRef.current);
          if (!isAddingWaypointRef.current) return;
          
          // Prevent default map behavior (panning) when adding waypoints
          e.preventDefault?.();
          
          console.log('[DistanceRouteMap] Adding waypoint at:', lat, lng, 'type:', nextWaypointTypeRef.current);
          
          // Create waypoint directly here to avoid stale closure issues
          const currentWaypoints = waypointsRef.current;
          const waypointType = nextWaypointTypeRef.current;
          // Ensure waypoint name is always valid (no empty strings or special chars that could cause rendering issues)
          const getWaypointName = () => {
            if (waypointType === 'start') return 'Start';
            if (waypointType === 'finish') return 'Finish';
            if (waypointType === 'gate') {
              const gateCount = currentWaypoints.filter(w => w.type === 'gate').length + 1;
              return `Gate ${gateCount}`;
            }
            const waypointCount = currentWaypoints.filter(w => w.type === 'waypoint').length + 1;
            return `Waypoint ${waypointCount}`;
          };

          const newWaypoint: RouteWaypoint = {
            id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: getWaypointName(),
            latitude: lat,
            longitude: lng,
            type: waypointType,
            required: waypointType === 'start' || waypointType === 'finish',
          };

          // Update waypoints - use requestAnimationFrame to ensure it happens after render
          requestAnimationFrame(() => {
            try {
              onWaypointsChangeRef.current([...currentWaypoints, newWaypoint]);
              
              // Auto-advance to next logical type
              if (waypointType === 'start') {
                // Use setTimeout to avoid state update during render cycle
                setTimeout(() => {
                  setNextWaypointType('waypoint');
                }, 0);
              }
            } catch (error) {
              console.error('[DistanceRouteMap] Error updating waypoints:', error);
            }
          });
        });

        map.on('load', () => {
          console.log('[DistanceRouteMap] Map loaded, initializing...');
          mapRef.current = map;
          setMapLoaded(true);
          
          // Add route line source and layer
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [],
              },
            },
          });

          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#9333ea',
              'line-width': 3,
              'line-dasharray': [2, 1],
            },
          });

          // Set initial cursor style
          updateMapCursor(map, isAddingWaypointRef.current);
          
          // Disable map drag/pan when in add waypoint mode
          if (isAddingWaypointRef.current) {
            map.dragPan.disable();
          }
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    // Cleanup function for useEffect
    return () => {
      // Clean up event listeners
      if (handleKeyDown) {
        window.removeEventListener('keydown', handleKeyDown);
      }
      if (handleKeyUp) {
        window.removeEventListener('keyup', handleKeyUp);
      }
      // Remove map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialCenter, initialZoom]);

  // Start editing a waypoint
  const startEditWaypoint = useCallback((wp: RouteWaypoint) => {
    setEditingWaypoint(wp.id);
    setEditName(wp.name);
    setEditType(wp.type);
    setEditLat(wp.latitude.toString());
    setEditLng(wp.longitude.toString());
    setIsSelectingOnMap(false);
  }, []);

  // Update map when waypoints change
  useEffect(() => {
    console.log('[DistanceRouteMap] Waypoints effect triggered:', {
      waypointsCount: waypoints.length,
      mapRef: !!mapRef.current,
      mapLoaded,
      maplibreRef: !!maplibreRef.current
    });

    if (!mapRef.current || !mapLoaded || !maplibreRef.current) {
      console.log('[DistanceRouteMap] Map not ready, skipping marker update');
      return;
    }

    console.log('[DistanceRouteMap] Updating markers for', waypoints.length, 'waypoints');

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.warn('[DistanceRouteMap] Error removing marker:', e);
      }
    });
    markersRef.current = [];

    // Add markers for each waypoint
    console.log('[DistanceRouteMap] Processing waypoints:', waypoints.map(wp => ({ 
      name: wp.name, 
      type: wp.type, 
      lat: wp.latitude, 
      lng: wp.longitude 
    })));
    
    waypoints.forEach((wp, index) => {
      try {
        // Debug: Log each waypoint being processed
        console.log(`[DistanceRouteMap] Processing waypoint ${index}:`, {
          name: wp.name,
          type: wp.type,
          lat: wp.latitude,
          lng: wp.longitude,
          id: wp.id
        });
        
        const el = document.createElement('div');
        el.className = 'waypoint-marker';
        // Note: Do NOT add transform, position, top, left, etc. - MapLibre handles positioning via offset
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: ${WAYPOINT_TYPE_COLORS[wp.type]};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          line-height: 1;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          z-index: 1000;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          text-align: center;
          vertical-align: middle;
        `;
        
        // Set marker label
        const label = wp.type === 'start' ? 'S' : 
                     wp.type === 'finish' ? 'F' : 
                     wp.type === 'gate' ? 'G' : 
                     `${index + 1}`;
        el.textContent = label; // Use textContent instead of innerHTML for safety

        // Ensure coordinates are valid numbers
        const lat = typeof wp.latitude === 'number' ? wp.latitude : parseFloat(String(wp.latitude)) || 0;
        const lng = typeof wp.longitude === 'number' ? wp.longitude : parseFloat(String(wp.longitude)) || 0;
        
        console.log(`[DistanceRouteMap] Waypoint ${wp.name} (${wp.type}): lat=${lat}, lng=${lng}`);
        
        if (lat === 0 && lng === 0) {
          console.warn(`[DistanceRouteMap] ⚠️ SKIPPING waypoint "${wp.name}" (type: ${wp.type}) with invalid coordinates (0,0)`);
          console.warn(`[DistanceRouteMap] This waypoint will NOT appear on the map and will NOT be saved to Supabase!`);
          return;
        }
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`[DistanceRouteMap] ⚠️ SKIPPING waypoint "${wp.name}" (type: ${wp.type}) with NaN coordinates`);
          return;
        }

        // Calculate explicit offset to center the marker perfectly
        // Marker is 32px x 32px, so center offset is -16px, -16px
        const marker = new maplibreRef.current.Marker({ 
          element: el, 
          draggable: true,
          offset: [-16, -16] // Explicit offset: half width and half height to center perfectly
        })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        // Click marker to edit waypoint
        el.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent map click
          startEditWaypoint(wp);
        });

        // Update waypoint position on drag
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          const updated = waypoints.map((w, i) => 
            i === index 
              ? { ...w, latitude: lngLat.lat, longitude: lngLat.lng }
              : w
          );
          onWaypointsChange(updated);
        });

        markersRef.current.push(marker);
        console.log('[DistanceRouteMap] Added marker for', wp.name, 'at', wp.latitude, wp.longitude);
      } catch (error) {
        console.error('[DistanceRouteMap] Error creating marker for waypoint', wp.name, ':', error);
      }
    });

    // Filter out waypoints with invalid coordinates (0,0 or null)
    const validWaypoints = waypoints.filter(
      wp => wp.latitude && wp.longitude && 
            wp.latitude !== 0 && wp.longitude !== 0 &&
            !isNaN(wp.latitude) && !isNaN(wp.longitude)
    );
    
    console.log(`[DistanceRouteMap] Valid waypoints: ${validWaypoints.length}/${waypoints.length}`);
    
    // Update route line
    const routeSource = mapRef.current.getSource('route');
    if (routeSource) {
      const coordinates = validWaypoints.map(wp => [wp.longitude, wp.latitude]);
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }

    // Fit map to waypoints if we have any valid ones (only on initial load, not on every waypoint change)
    // This prevents the map from jumping around when markers are updated
    // Create a stable key from waypoint coordinates to detect actual changes
    const waypointsKey = validWaypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
    const waypointsChanged = waypointsKey !== lastWaypointsKeyRef.current;
    
    if (validWaypoints.length > 0) {
      if (!hasFitBoundsRef.current || waypointsChanged) {
        const bounds = validWaypoints.reduce(
          (bounds, wp) => {
            return [
              [Math.min(bounds[0][0], wp.longitude), Math.min(bounds[0][1], wp.latitude)],
              [Math.max(bounds[1][0], wp.longitude), Math.max(bounds[1][1], wp.latitude)],
            ];
          },
          [[Infinity, Infinity], [-Infinity, -Infinity]] as [[number, number], [number, number]]
        );
        
        if (bounds[0][0] !== Infinity) {
          // Only fit bounds on initial load or when waypoints actually change
          if (!hasFitBoundsRef.current) {
            mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
            hasFitBoundsRef.current = true;
          }
          lastWaypointsKeyRef.current = waypointsKey;
        }
      }
    } else if (waypoints.length > 0 && validWaypoints.length === 0 && !hasFitBoundsRef.current) {
      // If we have waypoints but no valid coordinates, center on initial center
      console.log('[DistanceRouteMap] No valid waypoint coordinates, centering on initial location');
      mapRef.current.setCenter([initialCenter.lng, initialCenter.lat]);
      mapRef.current.setZoom(initialZoom);
      hasFitBoundsRef.current = true;
    }
  }, [waypoints, mapLoaded, onWaypointsChange]);

  // Add a new waypoint
  const addWaypoint = useCallback((lat: number, lng: number) => {
    const newWaypoint: RouteWaypoint = {
      id: `wp-${Date.now()}`,
      name: nextWaypointType === 'start' ? 'Start' :
            nextWaypointType === 'finish' ? 'Finish' :
            nextWaypointType === 'gate' ? `Gate ${waypoints.filter(w => w.type === 'gate').length + 1}` :
            `Waypoint ${waypoints.filter(w => w.type === 'waypoint').length + 1}`,
      latitude: lat,
      longitude: lng,
      type: nextWaypointType,
      required: nextWaypointType === 'start' || nextWaypointType === 'finish',
    };

    onWaypointsChange([...waypoints, newWaypoint]);
    
    // Auto-advance to next logical type
    if (nextWaypointType === 'start') {
      setNextWaypointType('waypoint');
    }
  }, [waypoints, nextWaypointType, onWaypointsChange]);

  // Remove a waypoint
  const removeWaypoint = useCallback((id: string) => {
    onWaypointsChange(waypoints.filter(wp => wp.id !== id));
  }, [waypoints, onWaypointsChange]);

  // Move waypoint up in order
  const moveWaypointUp = useCallback((index: number) => {
    if (index === 0) return; // Can't move first item up
    const newWaypoints = [...waypoints];
    [newWaypoints[index - 1], newWaypoints[index]] = [newWaypoints[index], newWaypoints[index - 1]];
    onWaypointsChange(newWaypoints);
  }, [waypoints, onWaypointsChange]);

  // Move waypoint down in order
  const moveWaypointDown = useCallback((index: number) => {
    if (index === waypoints.length - 1) return; // Can't move last item down
    const newWaypoints = [...waypoints];
    [newWaypoints[index], newWaypoints[index + 1]] = [newWaypoints[index + 1], newWaypoints[index]];
    onWaypointsChange(newWaypoints);
  }, [waypoints, onWaypointsChange]);

  // Save edited waypoint
  const saveEditWaypoint = useCallback(() => {
    if (!editingWaypoint || !editName.trim()) return;
    
    const lat = parseFloat(editLat) || 0;
    const lng = parseFloat(editLng) || 0;
    
    if (lat === 0 || lng === 0) {
      alert('Please enter valid coordinates or select a location on the map');
      return;
    }
    
    const updated = waypoints.map(wp => 
      wp.id === editingWaypoint 
        ? { ...wp, name: editName.trim(), type: editType, latitude: lat, longitude: lng }
        : wp
    );
    onWaypointsChange(updated);
    setEditingWaypoint(null);
    setEditName('');
    setEditLat('');
    setEditLng('');
    setIsSelectingOnMap(false);
  }, [editingWaypoint, editName, editType, editLat, editLng, waypoints, onWaypointsChange]);

  // Cancel editing
  const cancelEditWaypoint = useCallback(() => {
    setEditingWaypoint(null);
    setEditName('');
    setEditLat('');
    setEditLng('');
    setIsSelectingOnMap(false);
  }, []);

  // Clear all waypoints
  const clearWaypoints = useCallback(() => {
    onWaypointsChange([]);
    setNextWaypointType('start');
  }, [onWaypointsChange]);

  // Undo last waypoint
  const undoLastWaypoint = useCallback(() => {
    if (waypoints.length > 0) {
      onWaypointsChange(waypoints.slice(0, -1));
    }
  }, [waypoints, onWaypointsChange]);

  const totalDistance = calculateTotalDistance(waypoints);

  if (!isWeb) {
    return (
      <View className="bg-gray-100 rounded-lg p-4 items-center justify-center" style={{ height: 300 }}>
        <MapPin size={32} color="#9333ea" />
        <Text className="text-gray-600 mt-2">Route map available on web</Text>
      </View>
    );
  }

  return (
    <View className="rounded-lg overflow-hidden border border-purple-200">
      {/* Toolbar */}
      <View className="bg-purple-50 p-3 border-b border-purple-200">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setIsAddingWaypoint(!isAddingWaypoint)}
              className={`flex-row items-center gap-1 px-3 py-2 rounded-lg ${
                isAddingWaypoint ? 'bg-purple-600' : 'bg-purple-100'
              }`}
            >
              <Plus size={16} color={isAddingWaypoint ? '#fff' : '#9333ea'} />
              <Text className={`text-sm font-semibold ${isAddingWaypoint ? 'text-white' : 'text-purple-700'}`}>
                {isAddingWaypoint ? 'Click Map to Add' : 'Add Waypoint'}
              </Text>
            </Pressable>
            
            {/* Panning hint */}
            {isAddingWaypoint && (
              <Text className="text-xs text-purple-600 ml-2 self-center">
                💡 Hold Space or Right-click to pan
              </Text>
            )}
            
            <Pressable
              onPress={undoLastWaypoint}
              disabled={waypoints.length === 0}
              className={`p-2 rounded-lg ${waypoints.length === 0 ? 'bg-gray-100' : 'bg-purple-100'}`}
            >
              <RotateCcw size={16} color={waypoints.length === 0 ? '#9ca3af' : '#9333ea'} />
            </Pressable>
            
            <Pressable
              onPress={clearWaypoints}
              disabled={waypoints.length === 0}
              className={`p-2 rounded-lg ${waypoints.length === 0 ? 'bg-gray-100' : 'bg-red-100'}`}
            >
              <Trash2 size={16} color={waypoints.length === 0 ? '#9ca3af' : '#ef4444'} />
            </Pressable>
            
            {onReimportWaypoints && (
              <Pressable
                onPress={onReimportWaypoints}
                className="p-2 rounded-lg bg-blue-100"
                title="Re-import waypoints from SIs/NOR"
              >
                <Upload size={16} color="#2563eb" />
              </Pressable>
            )}
          </View>
          
          <View className="bg-white px-3 py-1 rounded-full border border-purple-200">
            <Text className="text-sm font-semibold text-purple-700">
              {totalDistance} nm
            </Text>
          </View>
        </View>
        
        {/* Waypoint Type Selector */}
        {isAddingWaypoint && (
          <View className="flex-row gap-2 mt-2">
            {(['start', 'waypoint', 'gate', 'finish'] as const).map((type) => {
              const Icon = WAYPOINT_TYPE_ICONS[type];
              const isSelected = nextWaypointType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setNextWaypointType(type)}
                  className={`flex-row items-center gap-1 px-2 py-1 rounded-full border ${
                    isSelected 
                      ? 'border-purple-400 bg-purple-100' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <View 
                    style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: 6, 
                      backgroundColor: WAYPOINT_TYPE_COLORS[type] 
                    }} 
                  />
                  <Text className={`text-xs capitalize ${isSelected ? 'text-purple-700 font-semibold' : 'text-gray-600'}`}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      
      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          height: 350, 
          width: '100%',
          position: 'relative',
        }} 
      />
      
      {/* Waypoint List - Vertical for better visibility */}
      {waypoints.length > 0 && (
        <View className="bg-white border-t border-purple-200 p-3">
          <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase">
            Route ({waypoints.length} waypoints) - Scroll to see all ↕
          </Text>
          <ScrollView 
            style={{ maxHeight: 200 }} 
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {waypoints.map((wp, index) => (
              <View 
                key={wp.id}
                className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 mb-2 border border-gray-200"
              >
                {/* Waypoint number */}
                <Text className="text-xs font-bold text-gray-400 w-5 mr-2">{index + 1}.</Text>
                
                {/* Type indicator with color */}
                <View 
                  style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: 6, 
                    backgroundColor: WAYPOINT_TYPE_COLORS[wp.type],
                    marginRight: 8,
                  }} 
                />
                
                {/* Type label */}
                <Text 
                  className="text-xs font-semibold mr-2 w-16"
                  style={{ color: WAYPOINT_TYPE_COLORS[wp.type] }}
                >
                  {wp.type.toUpperCase()}
                </Text>
                
                {/* Name */}
                <Text className="text-sm text-gray-700 flex-1" numberOfLines={1}>{wp.name}</Text>
                
                {/* Reorder buttons */}
                <View className="flex-row mr-2">
                  <Pressable
                    onPress={() => moveWaypointUp(index)}
                    disabled={index === 0}
                    className={`p-1 ${index === 0 ? 'opacity-30' : ''}`}
                  >
                    <ArrowUp size={14} color={index === 0 ? "#9ca3af" : "#64748b"} />
                  </Pressable>
                  <Pressable
                    onPress={() => moveWaypointDown(index)}
                    disabled={index === waypoints.length - 1}
                    className={`p-1 ${index === waypoints.length - 1 ? 'opacity-30' : ''}`}
                  >
                    <ArrowDown size={14} color={index === waypoints.length - 1 ? "#9ca3af" : "#64748b"} />
                  </Pressable>
                </View>
                
                {/* Edit button */}
                <Pressable
                  onPress={() => startEditWaypoint(wp)}
                  className="p-1 mr-1"
                >
                  <Edit2 size={14} color="#64748b" />
                </Pressable>
                
                {/* Delete button */}
                <Pressable
                  onPress={() => removeWaypoint(wp.id)}
                  className="p-1"
                >
                  <Trash2 size={14} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Text className="text-xs text-gray-400 mt-2 text-center">
            💡 Tip: Use ↑↓ arrows to reorder • Drag markers on map to move • Click edit to rename/change type
          </Text>
        </View>
      )}

      {/* Edit Waypoint Modal */}
      <Modal
        visible={editingWaypoint !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelEditWaypoint}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 20,
            width: '100%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#1E293B',
              marginBottom: 16,
            }}>
              Edit Waypoint
            </Text>

            {/* Waypoint Name */}
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#64748B',
              marginBottom: 6,
            }}>
              Name
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Waypoint name"
              style={{
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: '#1E293B',
                marginBottom: 16,
              }}
              autoFocus
            />

            {/* Coordinates */}
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#64748B',
              marginBottom: 6,
            }}>
              Coordinates
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Latitude</Text>
                <TextInput
                  value={editLat}
                  onChangeText={setEditLat}
                  placeholder="22.19175"
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: '#1E293B',
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Longitude</Text>
                <TextInput
                  value={editLng}
                  onChangeText={setEditLng}
                  placeholder="114.12769"
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: '#1E293B',
                  }}
                />
              </View>
            </View>
            
            {/* Select on Map Button */}
            <Pressable
              onPress={() => {
                setIsSelectingOnMap(true);
                // Change cursor to crosshair
                if (mapRef.current) {
                  const canvas = mapRef.current.getCanvasContainer();
                  if (canvas) {
                    canvas.style.cursor = 'crosshair';
                  }
                }
              }}
              style={{
                backgroundColor: isSelectingOnMap ? '#9333ea' : '#F3F4F6',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isSelectingOnMap ? '#9333ea' : '#E2E8F0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MapPin size={16} color={isSelectingOnMap ? '#fff' : '#64748B'} />
                <Text style={{
                  color: isSelectingOnMap ? '#fff' : '#64748B',
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                  {isSelectingOnMap ? 'Click on map to set location...' : 'Select Location on Map'}
                </Text>
              </View>
            </Pressable>
            {isSelectingOnMap && (
              <Text style={{
                fontSize: 11,
                color: '#9333ea',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                Click anywhere on the map to set the waypoint location
              </Text>
            )}

            {/* Waypoint Type */}
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#64748B',
              marginBottom: 6,
            }}>
              Type
            </Text>
            <View style={{
              flexDirection: 'row',
              gap: 8,
              marginBottom: 20,
            }}>
              {(['start', 'waypoint', 'gate', 'finish'] as const).map((type) => {
                const Icon = WAYPOINT_TYPE_ICONS[type];
                const isSelected = editType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setEditType(type)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isSelected ? '#9333ea' : '#E2E8F0',
                      backgroundColor: isSelected ? '#F3E8FF' : 'white',
                    }}
                  >
                    <View 
                      style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: 5, 
                        backgroundColor: WAYPOINT_TYPE_COLORS[type] 
                      }} 
                    />
                    <Text style={{
                      fontSize: 11,
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? '#9333ea' : '#64748B',
                      textTransform: 'capitalize',
                    }}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 8,
              justifyContent: 'flex-end',
            }}>
              <Pressable
                onPress={cancelEditWaypoint}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <X size={16} color="#64748B" />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#64748B',
                }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={saveEditWaypoint}
                disabled={!editName.trim()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: editName.trim() ? '#9333ea' : '#CBD5E1',
                }}
              >
                <Check size={16} color="white" />
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: 'white',
                }}>
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Instructions */}
      {waypoints.length === 0 && !isAddingWaypoint && (
        <View className="bg-purple-50 p-3 border-t border-purple-200">
          <Text className="text-xs text-purple-700 text-center">
            Click "Add Waypoint" then click on the map to define your race route
          </Text>
        </View>
      )}
    </View>
  );
}

export default DistanceRouteMap;

