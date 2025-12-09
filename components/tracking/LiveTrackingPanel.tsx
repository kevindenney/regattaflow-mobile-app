/**
 * Live Tracking Panel
 * 
 * Displays real-time boat positions and race status
 * during live tracking sessions (TracTrac, eStela, etc.)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveBoat, LiveTrackingSession } from '@/services/tracking/types';

// ============================================================================
// Types
// ============================================================================

export interface LiveTrackingPanelProps {
  /** Current tracking session */
  session: LiveTrackingSession | null;
  /** Live boat positions */
  boats: LiveBoat[];
  /** Selected boat ID */
  selectedBoatId?: string;
  /** Callback when boat is selected */
  onBoatSelect?: (boatId: string) => void;
  /** Callback to center map on boat */
  onCenterBoat?: (boat: LiveBoat) => void;
  /** Whether panel is expanded */
  expanded?: boolean;
  /** Callback when expand state changes */
  onExpandChange?: (expanded: boolean) => void;
}

// ============================================================================
// Component
// ============================================================================

export function LiveTrackingPanel({
  session,
  boats,
  selectedBoatId,
  onBoatSelect,
  onCenterBoat,
  expanded = false,
  onExpandChange,
}: LiveTrackingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const animatedHeight = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;

  // Animate expand/collapse
  useEffect(() => {
    Animated.spring(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isExpanded, animatedHeight]);

  const toggleExpand = useCallback(() => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    onExpandChange?.(newValue);
  }, [isExpanded, onExpandChange]);

  // Sort boats by sail number
  const sortedBoats = React.useMemo(() => {
    return [...boats].sort((a, b) => a.sailNumber.localeCompare(b.sailNumber));
  }, [boats]);

  // Connection status indicator
  const statusColor = {
    connecting: '#F59E0B',
    connected: '#10B981',
    disconnected: '#94A3B8',
    error: '#EF4444',
  }[session?.status || 'disconnected'];

  const statusText = {
    connecting: 'Connecting...',
    connected: 'Live',
    disconnected: 'Disconnected',
    error: 'Error',
  }[session?.status || 'disconnected'];

  // Calculate panel height based on content
  const maxHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [56, 300],
  });

  return (
    <Animated.View style={[styles.container, { maxHeight }]}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]}>
            {session?.status === 'connected' && (
              <View style={styles.statusPulse} />
            )}
          </View>
          <Text style={styles.title}>Live Tracking</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.boatCount}>
            <Ionicons name="boat" size={14} color="#64748B" />
            <Text style={styles.boatCountText}>{boats.length}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={20}
            color="#64748B"
          />
        </View>
      </TouchableOpacity>

      {/* Boat List */}
      <ScrollView
        style={styles.boatList}
        showsVerticalScrollIndicator={false}
      >
        {sortedBoats.map((boat) => (
          <TouchableOpacity
            key={boat.id}
            style={[
              styles.boatRow,
              boat.id === selectedBoatId && styles.boatRowSelected,
            ]}
            onPress={() => onBoatSelect?.(boat.id)}
            onLongPress={() => onCenterBoat?.(boat)}
          >
            {/* Color indicator */}
            <View style={[styles.boatColor, { backgroundColor: boat.color }]} />

            {/* Boat info */}
            <View style={styles.boatInfo}>
              <Text style={styles.sailNumber}>{boat.sailNumber}</Text>
              {boat.name && (
                <Text style={styles.boatName}>{boat.name}</Text>
              )}
            </View>

            {/* Speed & heading */}
            <View style={styles.boatMetrics}>
              <View style={styles.metric}>
                <Ionicons name="speedometer-outline" size={12} color="#64748B" />
                <Text style={styles.metricValue}>
                  {boat.speed.toFixed(1)} kn
                </Text>
              </View>
              <View style={styles.metric}>
                <Ionicons name="compass-outline" size={12} color="#64748B" />
                <Text style={styles.metricValue}>
                  {Math.round(boat.heading)}°
                </Text>
              </View>
            </View>

            {/* Active indicator */}
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: boat.isActive ? '#10B981' : '#E2E8F0' },
              ]}
            />
          </TouchableOpacity>
        ))}

        {boats.length === 0 && session?.status === 'connected' && (
          <View style={styles.emptyState}>
            <Ionicons name="boat-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>Waiting for boats...</Text>
          </View>
        )}

        {!session && (
          <View style={styles.emptyState}>
            <Ionicons name="radio-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tracking session active</Text>
          </View>
        )}
      </ScrollView>

      {/* Viewer count */}
      {session?.viewerCount !== undefined && session.viewerCount > 0 && (
        <View style={styles.viewerBar}>
          <Ionicons name="eye-outline" size={14} color="#64748B" />
          <Text style={styles.viewerText}>
            {session.viewerCount} viewer{session.viewerCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPulse: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    opacity: 0.4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
  },
  boatCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boatCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  boatList: {
    flex: 1,
  },
  boatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  boatRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  boatColor: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  boatInfo: {
    flex: 1,
    gap: 2,
  },
  sailNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  boatName: {
    fontSize: 11,
    color: '#64748B',
  },
  boatMetrics: {
    gap: 4,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 11,
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  viewerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewerText: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default LiveTrackingPanel;

