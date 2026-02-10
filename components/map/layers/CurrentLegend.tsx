/**
 * CurrentLegend Component
 *
 * Small overlay showing the current speed color scale when depth current
 * visualization is enabled. Displays as a compact legend in the map corner.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Waves } from 'lucide-react-native';

interface CurrentLegendProps {
  /** Whether the legend is visible */
  visible: boolean;

  /** Position on the map */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

  /** Current speed range to display (optional, for dynamic labeling) */
  speedRange?: { min: number; max: number };
}

/**
 * Color scale matching BathymetryCurrentLayer
 */
const LEGEND_ITEMS = [
  { speed: '0', color: '#E0F2FE', label: '0 kt' },
  { speed: '0.5', color: '#7DD3FC', label: '0.5 kt' },
  { speed: '1.0', color: '#38BDF8', label: '1.0 kt' },
  { speed: '1.5', color: '#0EA5E9', label: '1.5 kt' },
  { speed: '2.0', color: '#0369A1', label: '2.0 kt' },
  { speed: '2.5+', color: '#075985', label: '2.5+ kt' },
];

export function CurrentLegend({
  visible,
  position = 'bottom-left',
  speedRange,
}: CurrentLegendProps): React.ReactElement | null {
  if (!visible) return null;

  const isWeb = Platform.OS === 'web';

  // Position styles for different corners
  const positionStyle = getPositionStyle(position);

  if (!isWeb) {
    // Native fallback - simple styled view
    return (
      <View style={[styles.container, positionStyle]}>
        <View style={styles.header}>
          <Waves size={12} color="#0EA5E9" />
          <Text style={styles.title}>Current</Text>
        </View>
        <View style={styles.gradientBar}>
          {LEGEND_ITEMS.map((item, index) => (
            <View
              key={index}
              style={[styles.gradientSegment, { backgroundColor: item.color }]}
            />
          ))}
        </View>
        <View style={styles.labels}>
          <Text style={styles.labelText}>0</Text>
          <Text style={styles.labelText}>kt</Text>
          <Text style={styles.labelText}>2.5+</Text>
        </View>
      </View>
    );
  }

  // Web implementation with proper styling
  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyle,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderRadius: 8,
        padding: 8,
        minWidth: 90,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 6,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
            stroke="#0EA5E9"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2 3 2 4.5 2 3-.5 4.5-2"
            stroke="#0EA5E9"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#0EA5E9',
            letterSpacing: '0.02em',
          }}
        >
          Current
        </span>
      </div>

      {/* Gradient bar */}
      <div
        style={{
          display: 'flex',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 4,
        }}
      >
        {LEGEND_ITEMS.map((item, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 9, color: '#94A3B8' }}>0</span>
        <span style={{ fontSize: 9, color: '#94A3B8' }}>kt</span>
        <span style={{ fontSize: 9, color: '#94A3B8' }}>2.5+</span>
      </div>

      {/* Speed range indicator (optional) */}
      {speedRange && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <span style={{ fontSize: 10, color: '#64748B' }}>
            Range: {speedRange.min.toFixed(1)} - {speedRange.max.toFixed(1)} kt
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Get position styles for different corners
 */
function getPositionStyle(position: CurrentLegendProps['position']): any {
  switch (position) {
    case 'bottom-left':
      return { bottom: 16, left: 16 };
    case 'bottom-right':
      return { bottom: 16, right: 16 };
    case 'top-left':
      return { top: 80, left: 16 }; // Below wind indicator
    case 'top-right':
      return { top: 80, right: 16 }; // Below current indicator
    default:
      return { bottom: 16, left: 16 };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 8,
    padding: 8,
    minWidth: 90,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  gradientBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gradientSegment: {
    flex: 1,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 9,
    color: '#94A3B8',
  },
});

export default CurrentLegend;
