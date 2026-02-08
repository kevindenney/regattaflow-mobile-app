/**
 * GPSTrackTile - Apple Weather-inspired GPS track widget (large 2x2 tile)
 *
 * Large tile (full width of 2-column row) showing GPS track mini-map
 * with key stats. Falls back to a "No track" placeholder when no data.
 *
 * Follows IOSWidgetCard animation (Reanimated scale 0.96 spring, haptics)
 * and IOSConditionsWidgets visual style.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { Navigation, Route, Check, Clock, Gauge, MapPin } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_ANIMATIONS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { supabase } from '@/services/supabase';
import { LocationPreviewMap } from './LocationPreviewMap';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  teal: '#5AC8FA',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  background: '#FFFFFF',
};

// Tile dimensions: 2 small tiles wide + gap = 155 + 12 + 155 = 322
const TILE_WIDTH = 322;
const TILE_HEIGHT = 322;
const MAP_HEIGHT = 200;
const MAP_PADDING = 16;

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface TrackData {
  id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  track_points: GPSPoint[];
}

export interface GPSTrackTileProps {
  raceId: string;
  userId?: string;
  timerSessionId?: string;
  /** Race location coordinates (shown on map when no track data) */
  raceLatitude?: number;
  raceLongitude?: number;
  /** Venue display name */
  raceVenue?: string;
  onPress: () => void;
}

/** Haversine distance in nautical miles */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Format seconds as M:SS */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Convert GPS points to SVG polyline points string */
function pointsToSvg(
  points: GPSPoint[],
  width: number,
  height: number,
  padding: number = 16
): {
  polylinePoints: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
} | null {
  if (points.length < 2) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const scaleX = innerW / lngRange;
  const scaleY = innerH / latRange;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - lngRange * scale) / 2;
  const offsetY = (height - latRange * scale) / 2;

  const svgPts = points.map((p) => ({
    x: (p.lng - minLng) * scale + offsetX,
    y: height - ((p.lat - minLat) * scale + offsetY),
  }));

  const polylinePoints = svgPts.map((p) => `${p.x},${p.y}`).join(' ');

  return {
    polylinePoints,
    startPoint: svgPts[0],
    endPoint: svgPts[svgPts.length - 1],
  };
}

export function GPSTrackTile({
  raceId,
  userId,
  timerSessionId,
  raceLatitude,
  raceLongitude,
  raceVenue,
  onPress,
}: GPSTrackTileProps) {
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(!!timerSessionId);

  // Location state — use props first, then fetch from DB as fallback
  const [dbLocation, setDbLocation] = useState<{ lat: number; lng: number; venue?: string } | null>(null);

  // Fetch track data
  useEffect(() => {
    if (!timerSessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTrack() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('race_timer_sessions')
          .select('id, start_time, end_time, duration_seconds, track_points')
          .eq('id', timerSessionId!)
          .single();

        if (!cancelled && !error) {
          setTrackData(data);
        }
      } catch {
        // silently fail — tile will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrack();
    return () => { cancelled = true; };
  }, [timerSessionId]);

  // Fetch race location from regattas table when not provided via props
  useEffect(() => {
    if (typeof raceLatitude === 'number' && typeof raceLongitude === 'number') return;
    if (!raceId) return;

    let cancelled = false;

    async function fetchLocation() {
      try {
        const { data } = await supabase
          .from('regattas')
          .select('latitude, longitude, metadata')
          .eq('id', raceId)
          .single();

        if (cancelled || !data) return;

        const meta = data.metadata as Record<string, any> | undefined;
        const venue = meta?.venue_name || meta?.venue;

        // 1. Try top-level columns (Supabase may return DECIMAL as string)
        const lat = parseFloat(String(data.latitude));
        const lng = parseFloat(String(data.longitude));
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          setDbLocation({ lat, lng, venue });
          return;
        }

        // 2. Try metadata coordinate fields
        if (meta) {
          if (meta.venue_lat && meta.venue_lng) {
            setDbLocation({ lat: Number(meta.venue_lat), lng: Number(meta.venue_lng), venue });
            return;
          }
          if (meta.venue_coordinates?.lat && meta.venue_coordinates?.lng) {
            setDbLocation({ lat: Number(meta.venue_coordinates.lat), lng: Number(meta.venue_coordinates.lng), venue });
            return;
          }
          if (meta.racing_area_coordinates?.lat && meta.racing_area_coordinates?.lng) {
            setDbLocation({ lat: Number(meta.racing_area_coordinates.lat), lng: Number(meta.racing_area_coordinates.lng), venue });
            return;
          }
          if (meta.start_coordinates?.lat && meta.start_coordinates?.lng) {
            setDbLocation({ lat: Number(meta.start_coordinates.lat), lng: Number(meta.start_coordinates.lng), venue });
            return;
          }

          // 3. Lookup via sailing_venues table using venue_id
          if (meta.venue_id) {
            const { data: venueData } = await supabase
              .from('sailing_venues')
              .select('coordinates_lat, coordinates_lng, name')
              .eq('id', meta.venue_id)
              .single();

            if (!cancelled && venueData?.coordinates_lat && venueData?.coordinates_lng) {
              setDbLocation({
                lat: Number(venueData.coordinates_lat),
                lng: Number(venueData.coordinates_lng),
                venue: venue || venueData.name,
              });
              return;
            }
          }

          // 4. Fallback: search sailing_venues by name when venue_name exists but no venue_id
          if (venue && !meta.venue_id) {
            const { data: venueRows } = await supabase
              .from('sailing_venues')
              .select('coordinates_lat, coordinates_lng, name')
              .ilike('name', `%${venue}%`)
              .limit(1);

            const match = venueRows?.[0];
            if (!cancelled && match?.coordinates_lat && match?.coordinates_lng) {
              setDbLocation({
                lat: Number(match.coordinates_lat),
                lng: Number(match.coordinates_lng),
                venue: venue || match.name,
              });
              return;
            }
          }
        }
      } catch {
        // silently fail
      }
    }

    fetchLocation();
    return () => { cancelled = true; };
  }, [raceId, raceLatitude, raceLongitude]);

  // Stats
  const stats = useMemo(() => {
    if (!trackData?.track_points?.length) return null;
    const points = trackData.track_points;
    const speeds = points.map((p) => p.speed || 0).filter((s) => s > 0);
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += haversineDistance(
        points[i - 1].lat,
        points[i - 1].lng,
        points[i].lat,
        points[i].lng
      );
    }

    return {
      maxSpeed: maxSpeed * 1.94384, // m/s → knots
      distance,
      duration: trackData.duration_seconds || 0,
    };
  }, [trackData]);

  // SVG data
  const mapWidth = TILE_WIDTH - MAP_PADDING * 2;
  const svgData = useMemo(() => {
    if (!trackData?.track_points || trackData.track_points.length < 2) return null;
    return pointsToSvg(trackData.track_points, mapWidth, MAP_HEIGHT);
  }, [trackData, mapWidth]);

  const hasTrack = !!svgData;

  // Animation
  const scaleVal = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  const handlePressIn = () => {
    scaleVal.value = withSpring(0.96, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePressOut = () => {
    scaleVal.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };
  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress();
  };

  // Resolved location: props take priority, then DB fetch
  const resolvedLat = typeof raceLatitude === 'number' ? raceLatitude : dbLocation?.lat;
  const resolvedLng = typeof raceLongitude === 'number' ? raceLongitude : dbLocation?.lng;
  const resolvedVenue = raceVenue || dbLocation?.venue;
  const hasRaceLocation = typeof resolvedLat === 'number' && typeof resolvedLng === 'number';

  // Don't render if there's no timer session AND no race location
  if (!timerSessionId && !hasRaceLocation) return null;

  return (
    <AnimatedPressable
      style={[
        styles.tile,
        hasTrack && styles.tileComplete,
        animatedStyle,
        Platform.OS !== 'web' && IOS_SHADOWS.card,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={
        hasTrack
          ? `GPS Track: ${stats ? `${formatDuration(stats.duration)}, ${stats.maxSpeed.toFixed(1)} knots max` : 'recorded'}`
          : 'GPS Track: loading'
      }
    >
      {/* Completion badge */}
      {hasTrack && (
        <View style={styles.completeBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3} />
        </View>
      )}

      {/* Header row */}
      <View style={styles.header}>
        <Navigation size={12} color={COLORS.teal} />
        <Text style={styles.headerLabel}>GPS TRACK</Text>
      </View>

      {/* Map area */}
      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.teal} />
        ) : svgData ? (
          <Svg width={mapWidth} height={MAP_HEIGHT}>
            <Polyline
              points={svgData.polylinePoints}
              fill="none"
              stroke={COLORS.teal}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={svgData.startPoint.x}
              cy={svgData.startPoint.y}
              r={5}
              fill={COLORS.green}
            />
            <Circle
              cx={svgData.endPoint.x}
              cy={svgData.endPoint.y}
              r={5}
              fill="#FF3B30"
            />
          </Svg>
        ) : hasRaceLocation ? (
          <View style={styles.locationMapContainer}>
            <LocationPreviewMap
              latitude={resolvedLat!}
              longitude={resolvedLng!}
              width={mapWidth}
              height={MAP_HEIGHT}
            />
            <View style={styles.noTrackOverlay}>
              <View style={styles.noTrackBadge}>
                <Route size={12} color={COLORS.gray} />
                <Text style={styles.noTrackBadgeText}>No track data</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyMap}>
            <Route size={32} color={COLORS.gray3} />
            <Text style={styles.emptyMapText}>No track data</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      {stats ? (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Clock size={12} color={COLORS.blue} />
            <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Gauge size={12} color={COLORS.green} />
            <Text style={styles.statValue}>{stats.maxSpeed.toFixed(1)} kts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MapPin size={12} color={COLORS.orange} />
            <Text style={styles.statValue}>{stats.distance.toFixed(2)} nm</Text>
          </View>
        </View>
      ) : !loading && hasRaceLocation && resolvedVenue ? (
        <View style={styles.statsRow}>
          <MapPin size={12} color={COLORS.teal} />
          <Text style={styles.statsPlaceholder} numberOfLines={1}>{resolvedVenue}</Text>
        </View>
      ) : !loading ? (
        <View style={styles.statsRow}>
          <Text style={styles.statsPlaceholder}>No stats available</Text>
        </View>
      ) : null}

      {/* Footer */}
      <Text style={styles.hint} numberOfLines={1}>
        {hasTrack ? 'View analysis' : 'View session'}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray5,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
      },
      default: {},
    }),
  },
  tileComplete: {
    borderColor: `${COLORS.green}60`,
    backgroundColor: `${COLORS.green}06`,
  },
  completeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  emptyMap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyMapText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray,
  },
  locationMapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  noTrackOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  noTrackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  noTrackBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.label,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.gray5,
  },
  statsPlaceholder: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.gray3,
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.blue,
  },
});

export default GPSTrackTile;
