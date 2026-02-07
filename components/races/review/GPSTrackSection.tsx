/**
 * GPSTrackSection - GPS Track Preview for Review Tab
 *
 * Shows a mini-map preview of the GPS track with key stats
 * and a link to the full track analysis screen.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Navigation,
  Route,
  ChevronRight,
  Gauge,
  Clock,
  MapPin,
} from 'lucide-react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { supabase } from '@/services/supabase';
import { IOS_COLORS } from '@/components/cards/constants';

const MINI_MAP_WIDTH = Dimensions.get('window').width - 64; // Account for margins
const MINI_MAP_HEIGHT = 120;

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface GPSTrackSectionProps {
  raceId: string;
  userId?: string;
  timerSessionId?: string;
}

interface TrackData {
  id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  track_points: GPSPoint[];
}

/**
 * Calculate haversine distance between two points in nautical miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format duration as MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Convert GPS points to SVG path coordinates
 */
function pointsToSvgPath(
  points: GPSPoint[],
  width: number,
  height: number,
  padding: number = 10
): { path: string; startPoint: { x: number; y: number }; endPoint: { x: number; y: number } } | null {
  if (points.length < 2) return null;

  // Find bounds
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

  // Handle case where all points are the same
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  // Scale to fit in SVG with padding
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const scaleX = innerWidth / lngRange;
  const scaleY = innerHeight / latRange;
  const scale = Math.min(scaleX, scaleY);

  // Center the track
  const offsetX = (width - lngRange * scale) / 2;
  const offsetY = (height - latRange * scale) / 2;

  // Convert points to SVG coordinates
  const svgPoints = points.map(p => ({
    x: (p.lng - minLng) * scale + offsetX,
    y: height - ((p.lat - minLat) * scale + offsetY), // Flip Y axis
  }));

  // Create path string
  const path = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return {
    path,
    startPoint: svgPoints[0],
    endPoint: svgPoints[svgPoints.length - 1],
  };
}

export function GPSTrackSection({ raceId, userId, timerSessionId }: GPSTrackSectionProps) {
  const router = useRouter();
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch track data
  useEffect(() => {
    async function fetchTrack() {
      if (!timerSessionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('race_timer_sessions')
          .select('id, start_time, end_time, duration_seconds, track_points')
          .eq('id', timerSessionId)
          .single();

        if (fetchError) throw fetchError;
        setTrackData(data);
      } catch (err: any) {
        console.error('Error fetching track data:', err);
        setError('Failed to load track');
      } finally {
        setLoading(false);
      }
    }

    fetchTrack();
  }, [timerSessionId]);

  // Calculate stats from track points
  const stats = useMemo(() => {
    if (!trackData) return null;

    const points = trackData.track_points || [];
    if (points.length === 0) return null;

    const speeds = points.map(p => p.speed || 0).filter(s => s > 0);
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length > 0
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length
      : 0;

    // Calculate total distance
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
      maxSpeed: maxSpeed * 1.94384, // m/s to knots
      avgSpeed: avgSpeed * 1.94384,
      distance,
      pointCount: points.length,
      duration: trackData.duration_seconds || 0,
    };
  }, [trackData]);

  // Generate SVG path
  const svgData = useMemo(() => {
    if (!trackData?.track_points || trackData.track_points.length < 2) return null;
    return pointsToSvgPath(trackData.track_points, MINI_MAP_WIDTH, MINI_MAP_HEIGHT);
  }, [trackData]);

  // Navigate to full analysis
  const handleViewFullAnalysis = () => {
    if (timerSessionId) {
      router.push(`/(tabs)/race-session/${timerSessionId}` as any);
    }
  };

  // No session - don't show section
  if (!timerSessionId) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Navigation size={16} color={IOS_COLORS.teal} />
          <Text style={styles.sectionLabel}>GPS TRACK</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={IOS_COLORS.teal} />
          <Text style={styles.loadingText}>Loading track...</Text>
        </View>
      </View>
    );
  }

  // Error or no data
  if (error || !trackData) {
    return null;
  }

  const hasTrackPoints = trackData.track_points && trackData.track_points.length > 0;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Navigation size={16} color={IOS_COLORS.teal} />
        <Text style={styles.sectionLabel}>GPS TRACK</Text>
        {hasTrackPoints && (
          <Text style={styles.sectionCount}>{trackData.track_points.length} points</Text>
        )}
      </View>

      {/* Track Card */}
      <TouchableOpacity
        style={styles.trackCard}
        onPress={handleViewFullAnalysis}
        activeOpacity={0.7}
      >
        {/* Mini Map */}
        <View style={styles.miniMapContainer}>
          {svgData ? (
            <Svg width={MINI_MAP_WIDTH} height={MINI_MAP_HEIGHT}>
              {/* Track line */}
              <Polyline
                points={svgData.path.replace(/[ML]/g, '').trim()}
                fill="none"
                stroke={IOS_COLORS.teal}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Start point (green) */}
              <Circle
                cx={svgData.startPoint.x}
                cy={svgData.startPoint.y}
                r={5}
                fill={IOS_COLORS.green}
              />
              {/* End point (red) */}
              <Circle
                cx={svgData.endPoint.x}
                cy={svgData.endPoint.y}
                r={5}
                fill={IOS_COLORS.red}
              />
            </Svg>
          ) : (
            <View style={styles.noTrackContainer}>
              <Route size={32} color={IOS_COLORS.gray3} />
              <Text style={styles.noTrackText}>
                {hasTrackPoints ? 'Track too short to display' : 'No track data'}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock size={14} color={IOS_COLORS.blue} />
              <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Gauge size={14} color={IOS_COLORS.green} />
              <Text style={styles.statValue}>{stats.maxSpeed.toFixed(1)} kts</Text>
              <Text style={styles.statLabel}>Max Speed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MapPin size={14} color={IOS_COLORS.orange} />
              <Text style={styles.statValue}>{stats.distance.toFixed(2)} nm</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
          </View>
        )}

        {/* View Full Analysis Button */}
        <View style={styles.viewFullRow}>
          <Text style={styles.viewFullText}>View Full Analysis</Text>
          <ChevronRight size={18} color={IOS_COLORS.blue} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },

  // Track Card
  trackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
  },

  // Mini Map
  miniMapContainer: {
    width: '100%',
    height: MINI_MAP_HEIGHT,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTrackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noTrackText: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: IOS_COLORS.gray5,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  statLabel: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
  },

  // View Full Button
  viewFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  viewFullText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
});

export default GPSTrackSection;
