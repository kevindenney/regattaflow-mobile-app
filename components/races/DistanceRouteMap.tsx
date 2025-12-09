/**
 * DistanceRouteMap - Click-to-add waypoint map for distance racing
 * 
 * Allows users to click on the map to add waypoints that form a route.
 * Waypoints are connected by a polyline showing the race route.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Platform, ScrollView } from 'react-native';
import { MapPin, Navigation, Flag, Anchor, Trash2, RotateCcw, Plus } from 'lucide-react-native';

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
}: DistanceRouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null); // Store maplibre module reference
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(true); // Start in add mode
  const [nextWaypointType, setNextWaypointType] = useState<RouteWaypoint['type']>('start'); // Start with 'start' waypoint
  
  // Refs to track current state for event handlers (closures capture stale values)
  const isAddingWaypointRef = useRef(true);
  const nextWaypointTypeRef = useRef<RouteWaypoint['type']>('start');
  const waypointsRef = useRef<RouteWaypoint[]>(waypoints);
  const onWaypointsChangeRef = useRef(onWaypointsChange);

  // Keep refs in sync with state (for event handlers)
  useEffect(() => {
    isAddingWaypointRef.current = isAddingWaypoint;
  }, [isAddingWaypoint]);
  
  useEffect(() => {
    nextWaypointTypeRef.current = nextWaypointType;
  }, [nextWaypointType]);
  
  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);
  
  useEffect(() => {
    onWaypointsChangeRef.current = onWaypointsChange;
  }, [onWaypointsChange]);

  // Calculate and report total distance when waypoints change
  useEffect(() => {
    const distance = calculateTotalDistance(waypoints);
    onTotalDistanceChange?.(distance);
  }, [waypoints, onTotalDistanceChange]);

  // Initialize map (web only with MapLibre)
  useEffect(() => {
    if (!isWeb || !mapContainerRef.current || mapRef.current) return;

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

        map.on('load', () => {
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
        });

        // Handle click to add waypoint - use refs for current state
        map.on('click', (e: any) => {
          console.log('[DistanceRouteMap] Map clicked, isAddingWaypoint:', isAddingWaypointRef.current);
          if (!isAddingWaypointRef.current) return;
          
          const { lng, lat } = e.lngLat;
          console.log('[DistanceRouteMap] Adding waypoint at:', lat, lng, 'type:', nextWaypointTypeRef.current);
          
          // Create waypoint directly here to avoid stale closure issues
          const currentWaypoints = waypointsRef.current;
          const waypointType = nextWaypointTypeRef.current;
          const newWaypoint: RouteWaypoint = {
            id: `wp-${Date.now()}`,
            name: waypointType === 'start' ? 'Start' :
                  waypointType === 'finish' ? 'Finish' :
                  waypointType === 'gate' ? `Gate ${currentWaypoints.filter(w => w.type === 'gate').length + 1}` :
                  `Waypoint ${currentWaypoints.filter(w => w.type === 'waypoint').length + 1}`,
            latitude: lat,
            longitude: lng,
            type: waypointType,
            required: waypointType === 'start' || waypointType === 'finish',
          };

          onWaypointsChangeRef.current([...currentWaypoints, newWaypoint]);
          
          // Auto-advance to next logical type
          if (waypointType === 'start') {
            setNextWaypointType('waypoint');
          }
        });

        return () => {
          map.remove();
        };
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();
  }, [initialCenter, initialZoom]);

  // Update map when waypoints change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !maplibreRef.current) return;

    console.log('[DistanceRouteMap] Updating markers for', waypoints.length, 'waypoints');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each waypoint
    waypoints.forEach((wp, index) => {
      const el = document.createElement('div');
      el.className = 'waypoint-marker';
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
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      el.innerHTML = wp.type === 'start' ? 'S' : 
                     wp.type === 'finish' ? 'F' : 
                     wp.type === 'gate' ? 'G' : 
                     `${index}`;

      const marker = new maplibreRef.current.Marker({ element: el, draggable: true })
        .setLngLat([wp.longitude, wp.latitude])
        .addTo(mapRef.current);

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
    });

    // Update route line
    const routeSource = mapRef.current.getSource('route');
    if (routeSource) {
      const coordinates = waypoints.map(wp => [wp.longitude, wp.latitude]);
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }

    // Fit map to waypoints if we have any
    if (waypoints.length > 0) {
      const bounds = waypoints.reduce(
        (bounds, wp) => {
          return [
            [Math.min(bounds[0][0], wp.longitude), Math.min(bounds[0][1], wp.latitude)],
            [Math.max(bounds[1][0], wp.longitude), Math.max(bounds[1][1], wp.latitude)],
          ];
        },
        [[Infinity, Infinity], [-Infinity, -Infinity]] as [[number, number], [number, number]]
      );
      
      if (bounds[0][0] !== Infinity) {
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      }
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
          cursor: isAddingWaypoint ? 'crosshair' : 'grab',
        }} 
      />
      
      {/* Waypoint List */}
      {waypoints.length > 0 && (
        <View className="bg-white border-t border-purple-200 p-3">
          <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase">
            Route ({waypoints.length} waypoints)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {waypoints.map((wp, index) => (
                <View 
                  key={wp.id}
                  className="flex-row items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-200"
                >
                  <View 
                    style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: WAYPOINT_TYPE_COLORS[wp.type],
                      marginRight: 6,
                    }} 
                  />
                  <Text className="text-xs text-gray-700 mr-2">{wp.name}</Text>
                  {index < waypoints.length - 1 && (
                    <Text className="text-xs text-gray-400 mr-2">→</Text>
                  )}
                  <Pressable
                    onPress={() => removeWaypoint(wp.id)}
                    className="p-1"
                  >
                    <Trash2 size={12} color="#9ca3af" />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      
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

