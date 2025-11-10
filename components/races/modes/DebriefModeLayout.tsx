/**
 * DEBRIEF Mode Layout
 * Post-race analysis and learning interface
 *
 * Part of Phase 3: DEBRIEF Mode
 * Enhanced with race summary, export/share, and proper data types
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLayoutContext } from '../ResponsiveRaceLayout';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('DebriefModeLayout');

export interface GPSPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number; // SOG in knots
  heading: number; // COG in degrees
  accuracy?: number;
}

export interface SplitTime {
  markId: string;
  markName: string;
  time: Date;
  position: number; // Fleet position
  roundingType: 'port' | 'starboard';
  roundingTime: number; // Seconds spent in rounding
}

interface DebriefModeLayoutProps {
  raceId: string | null;
  raceData: any;
  gpsTrack?: GPSPoint[];
  splitTimes?: SplitTime[];
  children?: React.ReactNode;
  onExport?: () => void;
  onShare?: () => void;
}

export function DebriefModeLayout({
  raceId,
  raceData,
  gpsTrack = [],
  splitTimes = [],
  children,
  onExport,
  onShare,
}: DebriefModeLayoutProps) {
  const layout = useLayoutContext();

  const handleExport = () => {
    logger.debug('[DebriefModeLayout] Export requested');
    onExport?.();
  };

  const handleShare = () => {
    logger.debug('[DebriefModeLayout] Share requested');
    onShare?.();
  };

  // Calculate race summary stats
  const raceDuration = raceData?.start_date && raceData?.end_date
    ? Math.round((new Date(raceData.end_date).getTime() - new Date(raceData.start_date).getTime()) / 1000 / 60)
    : gpsTrack.length > 0
    ? Math.round((gpsTrack[gpsTrack.length - 1].timestamp.getTime() - gpsTrack[0].timestamp.getTime()) / 1000 / 60)
    : 0;

  const avgSpeed = gpsTrack.length > 0
    ? (gpsTrack.reduce((sum, p) => sum + p.speed, 0) / gpsTrack.length).toFixed(1)
    : '0.0';

  const totalDistance = gpsTrack.length > 1
    ? calculateTotalDistance(gpsTrack).toFixed(2)
    : '0.00';

  // Tablet landscape: two-column layout
  if (layout.isTablet && layout.isLandscape) {
    return (
      <View style={styles.container}>
        {/* Header with summary */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{raceData?.name || 'Race Analysis'}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.summaryText}>{raceDuration} min</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
                <Text style={styles.summaryText}>{avgSpeed} kts avg</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="navigate-outline" size={16} color="#6B7280" />
                <Text style={styles.summaryText}>{totalDistance} nm</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleExport}>
              <Ionicons name="download-outline" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Export</Text>
            </Pressable>
          </View>
        </View>

        {/* Two-column content */}
        <View style={styles.twoColumnContent}>
          {/* Left Column: Analysis */}
          <ScrollView
            style={styles.leftColumn}
            contentContainerStyle={styles.scrollContent}
          >
            {children}
          </ScrollView>

          {/* Right Column: GPS Track Replay */}
          <View style={styles.rightColumn}>
            {/* TODO: GPS track replay map goes here */}
            <View style={styles.placeholder}>
              {/* Track replay placeholder */}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Default: single column layout
  return (
    <View style={styles.container}>
      {/* Header with summary */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{raceData?.name || 'Race Analysis'}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.summaryText}>{raceDuration} min</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
              <Text style={styles.summaryText}>{avgSpeed} kts avg</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="navigate-outline" size={16} color="#6B7280" />
              <Text style={styles.summaryText}>{totalDistance} nm</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleExport}>
            <Ionicons name="download-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionText}>Export</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/**
 * Calculate total distance sailed using Haversine formula
 */
function calculateTotalDistance(track: GPSPoint[]): number {
  let distance = 0;

  for (let i = 1; i < track.length; i++) {
    const prev = track[i - 1];
    const curr = track[i];

    // Haversine formula
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = toRad(curr.latitude - prev.latitude);
    const dLon = toRad(curr.longitude - prev.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(prev.latitude)) * Math.cos(toRad(curr.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance += R * c;
  }

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  twoColumnContent: {
    flex: 1,
    flexDirection: 'row',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  leftColumn: {
    flex: 6,
  },
  rightColumn: {
    flex: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
});
