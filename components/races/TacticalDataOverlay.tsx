/**
 * Tactical Data Overlay Component - Phase 2
 * Provides wind, current, and tactical calculations for map display
 *
 * Features:
 * - Wind data (speed, direction, arrows)
 * - Current data (speed, direction, vectors)
 * - Laylines to windward mark
 * - Favored side indicator
 * - VMG calculations
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wind, Waves, TrendingUp } from 'lucide-react-native';

interface WindData {
  speed: number; // knots
  direction: number; // degrees true
  gust?: number; // knots
}

interface CurrentData {
  speed: number; // knots
  direction: number; // degrees true
  type?: 'flood' | 'ebb' | 'slack';
}

interface Position {
  latitude: number;
  longitude: number;
}

interface Mark {
  latitude: number;
  longitude: number;
  name: string;
}

interface TacticalDataOverlayProps {
  wind?: WindData;
  current?: CurrentData;
  position?: Position;
  heading?: number; // degrees
  speed?: number; // knots
  nextMark?: Mark;
  boatPolars?: {
    tackAngle: number; // degrees (typical 45°)
    optimalVMG: number; // knots
  };
}

export function TacticalDataOverlay({
  wind,
  current,
  position,
  heading,
  speed,
  nextMark,
  boatPolars = { tackAngle: 45, optimalVMG: 5.0 },
}: TacticalDataOverlayProps) {

  // Calculate laylines to windward mark
  const laylines = useMemo(() => {
    if (!wind || !position || !nextMark) return null;

    const windDir = wind.direction;
    const portLayline = (windDir - boatPolars.tackAngle + 360) % 360;
    const starboardLayline = (windDir + boatPolars.tackAngle) % 360;

    return {
      port: portLayline,
      starboard: starboardLayline,
      wind: windDir,
    };
  }, [wind, position, nextMark, boatPolars.tackAngle]);

  // Calculate VMG (Velocity Made Good)
  const vmg = useMemo(() => {
    if (!speed || !heading || !nextMark || !position) return null;

    // Calculate bearing to mark
    const bearing = calculateBearing(
      position.latitude,
      position.longitude,
      nextMark.latitude,
      nextMark.longitude
    );

    // VMG = speed * cos(angle difference)
    const angleDiff = Math.abs(heading - bearing);
    const vmgValue = speed * Math.cos((angleDiff * Math.PI) / 180);

    return {
      value: vmgValue,
      bearing: bearing,
      angleDiff: angleDiff,
    };
  }, [speed, heading, position, nextMark]);

  // Determine favored side (port or starboard)
  const favoredSide = useMemo(() => {
    if (!wind || !nextMark || !position) return null;

    // Calculate bearing to mark
    const bearing = calculateBearing(
      position.latitude,
      position.longitude,
      nextMark.latitude,
      nextMark.longitude
    );

    // Calculate wind angle relative to mark bearing
    const windAngle = (wind.direction - bearing + 360) % 360;

    // If wind is from the right (> 180°), port tack is favored
    // If wind is from the left (< 180°), starboard tack is favored
    return {
      side: windAngle > 180 ? 'port' : 'starboard',
      advantage: Math.abs(180 - windAngle), // degrees of advantage
    };
  }, [wind, nextMark, position]);

  // Calculate current effect on course
  const currentEffect = useMemo(() => {
    if (!current || !heading) return null;

    const angleDiff = Math.abs(heading - current.direction);
    const isHelping = angleDiff < 90 || angleDiff > 270;

    return {
      isHelping,
      speedEffect: current.speed * Math.cos((angleDiff * Math.PI) / 180),
      pushAngle: angleDiff,
    };
  }, [current, heading]);

  return (
    <View style={styles.container}>
      {/* Wind Display */}
      {wind && (
        <View style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <Wind size={18} color="#3B82F6" />
            <Text style={styles.cardTitle}>Wind</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.primaryValue}>{Math.round(wind.speed)} kt</Text>
            <Text style={styles.secondaryValue}>@ {Math.round(wind.direction)}°T</Text>
            {wind.gust && wind.gust > wind.speed && (
              <Text style={styles.gustValue}>Gust: {Math.round(wind.gust)} kt</Text>
            )}
          </View>
        </View>
      )}

      {/* Current Display */}
      {current && (
        <View style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <Waves size={18} color="#10B981" />
            <Text style={styles.cardTitle}>Current</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.primaryValue}>{current.speed.toFixed(1)} kt</Text>
            <Text style={styles.secondaryValue}>@ {Math.round(current.direction)}°T</Text>
            {current.type && (
              <Text style={styles.typeValue}>
                {current.type.charAt(0).toUpperCase() + current.type.slice(1)}
              </Text>
            )}
            {currentEffect && (
              <Text style={[
                styles.effectValue,
                currentEffect.isHelping ? styles.helping : styles.hindering
              ]}>
                {currentEffect.isHelping ? '↗ Helping' : '↙ Hindering'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* VMG Display */}
      {vmg && (
        <View style={styles.dataCard}>
          <View style={styles.cardHeader}>
            <TrendingUp size={18} color="#F59E0B" />
            <Text style={styles.cardTitle}>VMG</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.primaryValue}>{vmg.value.toFixed(1)} kt</Text>
            <Text style={styles.secondaryValue}>
              {vmg.angleDiff.toFixed(0)}° off course
            </Text>
          </View>
        </View>
      )}

      {/* Favored Side */}
      {favoredSide && (
        <View style={[
          styles.dataCard,
          favoredSide.side === 'port' ? styles.portFavored : styles.starboardFavored
        ]}>
          <Text style={styles.favoredText}>
            {favoredSide.side.toUpperCase()} TACK FAVORED
          </Text>
          <Text style={styles.advantageText}>
            {favoredSide.advantage.toFixed(0)}° advantage
          </Text>
        </View>
      )}

      {/* Laylines Info (for display purposes) */}
      {laylines && (
        <View style={styles.laylinesInfo}>
          <Text style={styles.laylinesText}>
            Laylines: Port {Math.round(laylines.port)}° / Stbd {Math.round(laylines.starboard)}°
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper function: Calculate bearing between two points
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

// Export calculation functions for use in other components
export const TacticalCalculations = {
  calculateBearing,

  calculateLaylines: (windDirection: number, tackAngle: number) => ({
    port: (windDirection - tackAngle + 360) % 360,
    starboard: (windDirection + tackAngle) % 360,
  }),

  calculateVMG: (speed: number, heading: number, targetBearing: number) => {
    const angleDiff = Math.abs(heading - targetBearing);
    return speed * Math.cos((angleDiff * Math.PI) / 180);
  },

  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },
  cardContent: {
    gap: 4,
  },
  primaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  secondaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },
  gustValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  typeValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  effectValue: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  helping: {
    color: '#10B981',
  },
  hindering: {
    color: '#EF4444',
  },
  portFavored: {
    borderLeftColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  starboardFavored: {
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  favoredText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  advantageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  laylinesInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  laylinesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
  },
});
