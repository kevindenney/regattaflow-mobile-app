/**
 * RouteMapCard Component
 * Displays route visualization for distance/offshore races
 * Shows waypoints, gates, start/finish locations on a map
 */

import {
    Anchor,
    ChevronRight,
    Circle,
    Flag,
    Info,
    Map,
    Navigation,
    Pencil,
    Route
} from 'lucide-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RouteMapCard');

export interface RouteWaypoint {
  name: string;
  latitude: number;
  longitude: number;
  type: 'start' | 'waypoint' | 'gate' | 'finish';
  required: boolean;
  passingSide?: 'port' | 'starboard' | 'either';
  notes?: string;
}

const ROUTE_MAP_STYLE_CANDIDATES = [
  {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  },
  'https://demotiles.maplibre.org/style.json',
] as const;

// Web-only map component for displaying route
function RouteMapView({ waypoints }: { waypoints: RouteWaypoint[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const initRunIdRef = useRef(0);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styleIndexRef = useRef(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [containerReady, setContainerReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleRetry = useCallback(() => {
    setMapError(null);
    setIsLoading(true);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    setRetryCount(c => c + 1);
  }, []);

  // Also use useLayoutEffect as fallback to detect container after render
  useLayoutEffect(() => {
    if (Platform.OS === 'web' && mapContainerRef.current && !containerReady) {
      setContainerReady(true);
    }
  }, [containerReady]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      initRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    if (!containerReady || !mapContainerRef.current) {
      return;
    }
    if (mapRef.current) {
      return;
    }

    const runId = ++initRunIdRef.current;
    styleIndexRef.current = 0;
    const isCancelled = () =>
      !isMountedRef.current || initRunIdRef.current !== runId;

    const initMap = async () => {
      if (isCancelled()) return;
      setIsLoading(true);
      setMapError(null);
      
      // Overall timeout for the entire map initialization
      initTimeoutRef.current = setTimeout(() => {
        logger.error('Overall initialization timeout');
        if (!isCancelled()) {
          setMapError('Map initialization timed out');
          setIsLoading(false);
        }
      }, 15000);
      
      try {
        // Dynamic import of maplibre-gl with CDN fallback
        let maplibreModule: any;
        try {
          maplibreModule = await import('maplibre-gl');
        } catch (moduleError) {
          logger.warn('Module import failed; attempting CDN fallback', moduleError);
          await ensureMapLibreScript('maplibre-gl-script-route');
          maplibreModule =
            typeof window !== 'undefined' ? { default: (window as any).maplibregl } : null;
        }
        
        // Load CSS dynamically via link element (more reliable than webpack import)
        ensureMapLibreCss('maplibre-gl-css-route');
        
        // Get the Map constructor - handle both default and named exports
        const MapConstructor = maplibreModule.default?.Map || maplibreModule.Map;
        const Marker = maplibreModule.default?.Marker || maplibreModule.Marker;
        
        if (!MapConstructor) {
          throw new Error('Could not find Map constructor in maplibre-gl module');
        }

        // Calculate bounds from waypoints
        const lngs = waypoints.map(w => w.longitude);
        const lats = waypoints.map(w => w.latitude);
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

        // Use a simple raster tile style that's more reliable
        const map = new MapConstructor({
          container: mapContainerRef.current!,
          style: ROUTE_MAP_STYLE_CANDIDATES[styleIndexRef.current],
          center: [centerLng, centerLat],
          zoom: 11,
          attributionControl: false,
        });

        // Wait for map to load
        await new Promise<void>((resolve, reject) => {
          loadTimeoutRef.current = setTimeout(() => {
            logger.error('Map load event timeout');
            reject(new Error('Map load timeout'));
          }, 10000);
          
          map.on('load', () => {
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
            }
            resolve();
          });
          
          map.on('error', (e: any) => {
            logger.error('Map error', e);
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
            }
            if (styleIndexRef.current + 1 < ROUTE_MAP_STYLE_CANDIDATES.length) {
              styleIndexRef.current += 1;
              try {
                map.setStyle(ROUTE_MAP_STYLE_CANDIDATES[styleIndexRef.current] as any);
                return;
              } catch (styleError) {
                logger.error('Fallback style failed', styleError);
              }
            }
            reject(e);
          });
        });

        if (isCancelled()) {
          map.remove();
          return;
        }

        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current); // Clear overall timeout on success
          initTimeoutRef.current = null;
        }
        
        mapRef.current = map;
        setIsLoading(false);

        // Add waypoint markers (no connecting line)
        waypoints.forEach((waypoint, index) => {
          const color = waypoint.type === 'start' ? '#10B981' 
            : waypoint.type === 'finish' ? '#EF4444' 
            : waypoint.type === 'gate' ? '#F59E0B' 
            : '#7C3AED';

          const el = document.createElement('div');
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.color = 'white';
          el.style.fontSize = '10px';
          el.style.fontWeight = 'bold';
          el.innerText = waypoint.type === 'start' ? 'S' 
            : waypoint.type === 'finish' ? 'F' 
            : String(index);

          if (Marker) {
            new Marker({ element: el })
              .setLngLat([waypoint.longitude, waypoint.latitude])
              .addTo(map);
          }
        });

        // Fit bounds
        const LngLatBounds = maplibreModule.default?.LngLatBounds || maplibreModule.LngLatBounds;
        if (waypoints.length >= 2 && LngLatBounds) {
          const bounds = new LngLatBounds();
          waypoints.forEach(w => bounds.extend([w.longitude, w.latitude]));
          map.fitBounds(bounds, { padding: 40 });
        }
      } catch (error: any) {
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current); // Clear overall timeout on error
          initTimeoutRef.current = null;
        }
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        logger.error('Error initializing map', error);
        if (!isCancelled()) {
          setMapError(error.message || 'Failed to load map');
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [waypoints, containerReady, retryCount]);

  // Always render the map container, but overlay loading/error states
  // This ensures the ref gets set even while loading

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Always render the map container so ref gets set */}
      <div 
        ref={(node) => {
          mapContainerRef.current = node;
          if (node && !containerReady) {
            setContainerReady(true);
          }
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }} 
      />
      
      {/* Show loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}>
          <div style={{
            width: 24,
            height: 24,
            border: '3px solid #475569',
            borderTopColor: '#7C3AED',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: '#94A3B8', fontSize: 12 }}>Loading map...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Show error state with waypoint summary */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#1E293B',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ color: '#94A3B8', fontSize: 12 }}>
              Map unavailable - showing waypoint coordinates
            </div>
            <button 
              onClick={handleRetry}
              style={{
                backgroundColor: '#7C3AED',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {waypoints.map((wp, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                backgroundColor: '#334155',
                borderRadius: 6,
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: wp.type === 'start' ? '#10B981' 
                    : wp.type === 'finish' ? '#EF4444' 
                    : wp.type === 'gate' ? '#F59E0B' 
                    : '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: 'white',
                }}>
                  {wp.type === 'start' ? 'S' : wp.type === 'finish' ? 'F' : i}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontSize: 12, fontWeight: 500 }}>{wp.name}</div>
                  <div style={{ color: '#94A3B8', fontSize: 10 }}>
                    {wp.latitude.toFixed(4)}°N, {wp.longitude.toFixed(4)}°E
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RouteMapCardProps {
  waypoints: RouteWaypoint[];
  totalDistanceNm?: number;
  raceName?: string;
  raceId?: string;
  onWaypointPress?: (waypoint: RouteWaypoint, index: number) => void;
  onEditRoute?: () => void;
  expanded?: boolean;
}

export function RouteMapCard({
  waypoints,
  totalDistanceNm,
  raceName: _raceName,
  raceId: _raceId,
  onWaypointPress,
  onEditRoute,
  expanded: _expanded = false,
}: RouteMapCardProps) {
  // Calculate leg distances (simplified - would need proper geo calculation)
  const legs = useMemo(() => {
    const result: { from: string; to: string; estimatedNm?: number }[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      result.push({
        from: waypoints[i].name,
        to: waypoints[i + 1].name,
      });
    }
    return result;
  }, [waypoints]);

  // Get icon for waypoint type
  const getWaypointIcon = (type: RouteWaypoint['type']) => {
    switch (type) {
      case 'start':
        return <Flag size={16} color="#10B981" />;
      case 'finish':
        return <Anchor size={16} color="#EF4444" />;
      case 'gate':
        return <Navigation size={16} color="#F59E0B" />;
      default:
        return <Circle size={14} color="#7C3AED" />;
    }
  };

  // Get passing side label
  const getPassingSideLabel = (side?: 'port' | 'starboard' | 'either') => {
    switch (side) {
      case 'port':
        return 'Leave to Port';
      case 'starboard':
        return 'Leave to Starboard';
      case 'either':
        return 'Either side';
      default:
        return null;
    }
  };

  if (waypoints.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Route size={20} color="#7C3AED" />
          <Text style={styles.title}>Race Route</Text>
        </View>
        <View style={styles.emptyState}>
          <Map size={32} color="#CBD5E1" />
          <Text style={styles.emptyText}>No route waypoints defined</Text>
          <Text style={styles.emptySubtext}>
            Add waypoints to see the race route
          </Text>
          {onEditRoute && (
            <Pressable 
              style={styles.addWaypointsButton}
              onPress={onEditRoute}
            >
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.addWaypointsButtonText}>Add Waypoints</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Route size={20} color="#7C3AED" />
          <Text style={styles.title}>Race Route</Text>
        </View>
        <View style={styles.headerRight}>
          {totalDistanceNm && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{totalDistanceNm} nm</Text>
            </View>
          )}
          {onEditRoute && (
            <Pressable 
              style={styles.editButton}
              onPress={onEditRoute}
            >
              <Pencil size={14} color="#7C3AED" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Route Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <RouteMapView waypoints={waypoints} />
        ) : (
          <View style={styles.mapPlaceholder}>
            <Map size={40} color="#94A3B8" />
            <Text style={styles.mapPlaceholderText}>Route Map</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              {waypoints.length} waypoints • {legs.length} legs
            </Text>
          </View>
        )}
      </View>

      {/* Waypoint List */}
      <View style={styles.waypointSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Route Waypoints</Text>
          {waypoints.length > 4 && (
            <Text style={styles.scrollHint}>↓ Scroll for more</Text>
          )}
        </View>
        
        <ScrollView 
          style={styles.waypointList}
          showsVerticalScrollIndicator={true}
        >
          {waypoints.map((waypoint, index) => (
            <Pressable
              key={`${waypoint.name}-${index}`}
              style={[
                styles.waypointItem,
                index === waypoints.length - 1 && styles.waypointItemLast,
              ]}
              onPress={() => onWaypointPress?.(waypoint, index)}
            >
              {/* Connector line */}
              {index < waypoints.length - 1 && (
                <View style={styles.connectorLine} />
              )}
              
              {/* Waypoint icon */}
              <View style={[
                styles.waypointIcon,
                waypoint.type === 'start' && styles.waypointIconStart,
                waypoint.type === 'finish' && styles.waypointIconFinish,
                waypoint.type === 'gate' && styles.waypointIconGate,
              ]}>
                {getWaypointIcon(waypoint.type)}
              </View>
              
              {/* Waypoint details */}
              <View style={styles.waypointDetails}>
                <View style={styles.waypointHeader}>
                  <Text style={styles.waypointName}>{waypoint.name}</Text>
                  <Text style={styles.waypointType}>
                    {waypoint.type.charAt(0).toUpperCase() + waypoint.type.slice(1)}
                  </Text>
                </View>
                
                {/* Coordinates */}
                <Text style={styles.waypointCoords}>
                  {waypoint.latitude.toFixed(4)}°N, {waypoint.longitude.toFixed(4)}°E
                </Text>
                
                {/* Passing side */}
                {waypoint.passingSide && (
                  <View style={styles.passingSide}>
                    <Info size={12} color="#64748B" />
                    <Text style={styles.passingSideText}>
                      {getPassingSideLabel(waypoint.passingSide)}
                    </Text>
                  </View>
                )}
                
                {/* Notes */}
                {waypoint.notes && (
                  <Text style={styles.waypointNotes}>{waypoint.notes}</Text>
                )}
              </View>
              
              <ChevronRight size={16} color="#CBD5E1" />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Route Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Legs</Text>
          <Text style={styles.summaryValue}>{legs.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Waypoints</Text>
          <Text style={styles.summaryValue}>
            {waypoints.filter(w => w.type === 'waypoint').length}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gates</Text>
          <Text style={styles.summaryValue}>
            {waypoints.filter(w => w.type === 'gate').length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  distanceBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  mapContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  waypointSection: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollHint: {
    fontSize: 11,
    color: '#9333EA',
    fontWeight: '500',
  },
  waypointList: {
    maxHeight: 300,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 4,
    position: 'relative',
  },
  waypointItemLast: {
    borderBottomWidth: 0,
  },
  connectorLine: {
    position: 'absolute',
    left: 23,
    top: 40,
    bottom: -12,
    width: 2,
    backgroundColor: '#E2E8F0',
  },
  waypointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  waypointIconStart: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  waypointIconFinish: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  waypointIconGate: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  waypointDetails: {
    flex: 1,
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  waypointName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  waypointType: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  waypointCoords: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  passingSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  passingSideText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  waypointNotes: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  addWaypointsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  addWaypointsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RouteMapCard;
