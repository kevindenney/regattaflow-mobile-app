/**
 * RACE Mode Layout - Phase 2 Enhanced
 * Full-screen live racing interface optimized for on-water use
 *
 * Features:
 * - Full-screen tactical map with GPS tracking
 * - Floating timer overlay
 * - Compact info strip (swipe up to expand)
 * - Quick action buttons
 * - Minimalist, distraction-free design
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Timer, Navigation, Wind, Waves } from 'lucide-react-native';
import { useLayoutContext } from '../ResponsiveRaceLayout';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RaceModeLayoutProps {
  raceId: string | null;
  raceData: any;
  racePhase?: any;
  children?: React.ReactNode;
  phaseHeader?: React.ReactNode;

  // Live racing props
  raceTimer?: React.ReactNode;
  mapComponent?: React.ReactNode;
  gpsPosition?: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  };
  windData?: {
    speed: number;
    direction: number;
  };
  currentData?: {
    speed: number;
    direction: number;
  };
  onQuickAction?: (action: string) => void;
  nextMarkInfo?: {
    name: string;
    distanceNm?: number;
    bearing?: number;
  };
}

export function RaceModeLayout({
  raceId,
  raceData,
  racePhase,
  children,
  phaseHeader,
  raceTimer,
  mapComponent,
  gpsPosition,
  windData,
  currentData,
  onQuickAction,
  nextMarkInfo,
}: RaceModeLayoutProps) {
  const layout = useLayoutContext();
  const [infoDrawerExpanded, setInfoDrawerExpanded] = useState(false);

  // RACE mode: Full-screen map-focused layout
  return (
    <View style={styles.raceContainer}>
      {/* Timer Overlay - Always on top */}
      <View style={styles.timerOverlay}>
        {raceTimer || (
          <View style={styles.timerPlaceholder}>
            <Timer size={24} color="#ffffff" />
            <Text style={styles.timerText}>00:00:00</Text>
          </View>
        )}

        {/* GPS Speed/Heading */}
        {gpsPosition && (
          <View style={styles.gpsInfo}>
            <Navigation size={18} color="#ffffff" />
            <Text style={styles.gpsText}>
              {gpsPosition.speed?.toFixed(1) || '0.0'} kt
            </Text>
            {gpsPosition.heading !== undefined && (
              <Text style={styles.gpsText}>
                {Math.round(gpsPosition.heading)}°
              </Text>
            )}
          </View>
        )}
      </View>

      {phaseHeader && (
        <View style={styles.phaseHeaderContainer}>
          {phaseHeader}
        </View>
      )}

      {/* Full-Screen Map */}
      <View style={[styles.mapContainer, phaseHeader && styles.mapWithHeader]}>
        {mapComponent || (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.placeholderText}>Tactical Map</Text>
            <Text style={styles.placeholderSubtext}>GPS tracking, wind/current overlays</Text>
          </View>
        )}
      </View>

      {/* Compact Info Strip (Bottom) */}
      <Pressable
        style={[
          styles.infoStrip,
          infoDrawerExpanded && styles.infoStripExpanded
        ]}
        onPress={() => setInfoDrawerExpanded(!infoDrawerExpanded)}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />

        {/* Compact Info (Collapsed) */}
        {!infoDrawerExpanded && (
          <View style={styles.compactInfo}>
            {/* Wind Info */}
            {windData && (
              <View style={styles.infoItem}>
                <Wind size={20} color="#3B82F6" />
                <View>
                  <Text style={styles.infoLabel}>Wind</Text>
                  <Text style={styles.infoValue}>
                    {Math.round(windData.speed)}kt @ {Math.round(windData.direction)}°
                  </Text>
                </View>
              </View>
            )}

            {/* Current Info */}
            {currentData && (
              <View style={styles.infoItem}>
                <Waves size={20} color="#10B981" />
                <View>
                  <Text style={styles.infoLabel}>Current</Text>
                  <Text style={styles.infoValue}>
                    {currentData.speed.toFixed(1)}kt @ {Math.round(currentData.direction)}°
                  </Text>
                </View>
              </View>
            )}

            {/* Next Mark Distance */}
            {nextMarkInfo && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{nextMarkInfo.name}</Text>
                <Text style={styles.infoValue}>
                  {(nextMarkInfo.distanceNm ?? 0).toFixed(2)}nm @ {Math.round(nextMarkInfo.bearing ?? 0)}°
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Expanded Drawer Content */}
        {infoDrawerExpanded && (
          <ScrollView
            style={styles.expandedDrawer}
            contentContainerStyle={styles.drawerContent}
          >
            {children || (
              <View style={styles.drawerPlaceholder}>
                <Text style={styles.drawerPlaceholderText}>
                  Race details and tactical info
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </Pressable>

      {/* Quick Action Buttons (Floating) */}
      <View style={styles.quickActions}>
        <Pressable
          style={styles.quickButton}
          onPress={() => onQuickAction?.('voice')}
        >
          <Text style={styles.quickButtonText}>🎙️</Text>
        </Pressable>
        <Pressable
          style={styles.quickButton}
          onPress={() => onQuickAction?.('checklist')}
        >
          <Text style={styles.quickButtonText}>📋</Text>
        </Pressable>
        <Pressable
          style={[styles.quickButton, styles.emergencyButton]}
          onPress={() => onQuickAction?.('emergency')}
        >
          <Text style={styles.quickButtonText}>⚠️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Legacy styles (kept for compatibility)
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mapColumn: {
    flex: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  infoColumn: {
    flex: 4,
    backgroundColor: '#f9fafb',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },

  // RACE Mode Layout Styles
  raceContainer: {
    flex: 1,
    backgroundColor: '#1F2937', // Dark gray (reduce glare)
  },

  // Timer Overlay (Top)
  timerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  timerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  gpsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  phaseHeaderContainer: {
    paddingTop: 72,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // Full-Screen Map
  mapContainer: {
    flex: 1,
    backgroundColor: '#374151',
  },
  mapWithHeader: {
    marginTop: 0,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Info Strip (Bottom)
  infoStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 900,
  },
  infoStripExpanded: {
    height: SCREEN_HEIGHT * 0.6, // 60% of screen when expanded
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },

  // Compact Info (Collapsed State)
  compactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Expanded Drawer
  expandedDrawer: {
    flex: 1,
    marginTop: 8,
  },
  drawerContent: {
    paddingBottom: 20,
  },
  drawerPlaceholder: {
    padding: 20,
    alignItems: 'center',
  },
  drawerPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Quick Action Buttons (Floating)
  quickActions: {
    position: 'absolute',
    right: 16,
    bottom: 140, // Above info strip
    gap: 12,
    zIndex: 1000,
  },
  quickButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  emergencyButton: {
    backgroundColor: '#DC2626', // Red for emergency
  },
  quickButtonText: {
    fontSize: 24,
  },
});
