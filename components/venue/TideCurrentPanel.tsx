/**
 * TideCurrentPanel Component
 * Displays tide and current information for racing sailors
 * Includes visual tide curve and current direction indicators
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useTidalIntel } from '@/hooks/useTidalIntel';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

interface TideCurrentPanelProps {
  latitude?: number;
  longitude?: number;
  compact?: boolean;
}

/**
 * Format minutes to human-readable time
 */
function formatMinutes(minutes: number | null): string {
  if (minutes === null) return '--';
  const absMinutes = Math.abs(minutes);
  if (absMinutes < 60) return `${absMinutes}m`;
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format time to HH:MM
 */
function formatTime(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Get tide trend icon and color
 */
function getTideTrendInfo(trend: 'rising' | 'falling' | 'slack'): { icon: string; color: string; label: string } {
  switch (trend) {
    case 'rising':
      return { icon: 'arrow-up', color: '#0284c7', label: 'Rising' };
    case 'falling':
      return { icon: 'arrow-down', color: '#dc2626', label: 'Falling' };
    case 'slack':
      return { icon: 'remove', color: '#6b7280', label: 'Slack' };
  }
}

/**
 * Get flow type info
 */
function getFlowInfo(flow: 'flood' | 'ebb' | 'slack'): { label: string; color: string; bgColor: string } {
  switch (flow) {
    case 'flood':
      return { label: 'FLOOD', color: '#0284c7', bgColor: '#e0f2fe' };
    case 'ebb':
      return { label: 'EBB', color: '#dc2626', bgColor: '#fee2e2' };
    case 'slack':
      return { label: 'SLACK', color: '#059669', bgColor: '#d1fae5' };
  }
}

/**
 * Simple SVG Tide Curve Component
 */
function TideCurve({ 
  width = 280, 
  height = 80,
  currentTrend,
  nextHighMinutes,
  nextLowMinutes,
  currentHeight,
  highHeight,
  lowHeight,
}: {
  width?: number;
  height?: number;
  currentTrend: 'rising' | 'falling' | 'slack';
  nextHighMinutes: number | null;
  nextLowMinutes: number | null;
  currentHeight?: number;
  highHeight?: number;
  lowHeight?: number;
}) {
  const padding = 20;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  // Generate a simple sine curve representing tide
  const points = useMemo(() => {
    const pts: string[] = [];
    const numPoints = 50;
    
    // Determine phase based on current trend
    let phaseOffset = 0;
    if (currentTrend === 'rising') {
      phaseOffset = -Math.PI / 2; // Rising = before peak
    } else if (currentTrend === 'falling') {
      phaseOffset = Math.PI / 2; // Falling = after peak
    }
    
    for (let i = 0; i <= numPoints; i++) {
      const x = padding + (i / numPoints) * graphWidth;
      const t = (i / numPoints) * Math.PI * 2 + phaseOffset;
      const y = padding + graphHeight / 2 - Math.sin(t) * (graphHeight / 2 - 5);
      pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    
    return pts.join(' ');
  }, [graphWidth, graphHeight, padding, currentTrend]);
  
  // Calculate current position on curve
  const currentX = padding + 10; // Current time is near start
  const currentY = useMemo(() => {
    const t = Math.PI * 0.1 + (currentTrend === 'rising' ? -Math.PI / 2 : Math.PI / 2);
    return padding + graphHeight / 2 - Math.sin(t) * (graphHeight / 2 - 5);
  }, [currentTrend, graphHeight, padding]);
  
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid lines */}
      <Line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4,4" />
      
      {/* Tide curve */}
      <Path d={points} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Current position marker */}
      <Circle cx={currentX} cy={currentY} r="6" fill="#dc2626" stroke="#fff" strokeWidth="2" />
      
      {/* Time labels */}
      <SvgText x={padding} y={height - 4} fontSize="10" fill="#9ca3af" textAnchor="start">Now</SvgText>
      <SvgText x={width / 2} y={height - 4} fontSize="10" fill="#9ca3af" textAnchor="middle">+6h</SvgText>
      <SvgText x={width - padding} y={height - 4} fontSize="10" fill="#9ca3af" textAnchor="end">+12h</SvgText>
      
      {/* High/Low labels */}
      <SvgText x={width / 4} y={padding - 2} fontSize="9" fill="#0284c7" fontWeight="600" textAnchor="middle">H</SvgText>
      <SvgText x={width * 3 / 4} y={height - padding + 8} fontSize="9" fill="#dc2626" fontWeight="600" textAnchor="middle">L</SvgText>
    </Svg>
  );
}

export function TideCurrentPanel({
  latitude,
  longitude,
  compact = false,
}: TideCurrentPanelProps) {
  const coordinates = latitude && longitude ? { lat: latitude, lng: longitude } : null;
  const { intel, loading, error, available, refetch } = useTidalIntel({ coordinates });

  if (!latitude || !longitude) {
    return null;
  }

  if (!available) {
    return (
      <View style={styles.container}>
        <View style={styles.unavailableContainer}>
          <Ionicons name="water-outline" size={20} color="#9ca3af" />
          <ThemedText style={styles.unavailableText}>Tide data unavailable</ThemedText>
        </View>
      </View>
    );
  }

  if (loading && !intel) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0284c7" />
          <ThemedText style={styles.loadingText}>Loading tides...</ThemedText>
        </View>
      </View>
    );
  }

  if (error && !intel) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#dc2626" />
          <ThemedText style={styles.errorText}>Tide data error</ThemedText>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!intel) return null;

  const trendInfo = getTideTrendInfo(intel.current.trend);
  const flowInfo = getFlowInfo(intel.current.flow);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <Ionicons name="water" size={16} color="#0284c7" />
          <ThemedText style={styles.compactText}>
            {intel.current.height.toFixed(1)}m {trendInfo.label}
          </ThemedText>
          <View style={[styles.compactBadge, { backgroundColor: flowInfo.bgColor }]}>
            <ThemedText style={[styles.compactBadgeText, { color: flowInfo.color }]}>
              {flowInfo.label}
            </ThemedText>
          </View>
          {intel.current.speed > 0 && (
            <ThemedText style={styles.compactSpeed}>{intel.current.speed.toFixed(1)}kt</ThemedText>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="water" size={20} color="#0284c7" />
          <ThemedText style={styles.headerTitle}>Tide & Current</ThemedText>
        </View>
        <View style={[styles.flowBadge, { backgroundColor: flowInfo.bgColor }]}>
          <ThemedText style={[styles.flowText, { color: flowInfo.color }]}>
            {flowInfo.label}
          </ThemedText>
        </View>
      </View>

      {/* Current State */}
      <View style={styles.currentStateRow}>
        <View style={styles.heightContainer}>
          <ThemedText style={styles.heightValue}>{intel.current.height.toFixed(2)}</ThemedText>
          <ThemedText style={styles.heightUnit}>m</ThemedText>
          <View style={[styles.trendIndicator, { backgroundColor: trendInfo.color }]}>
            <Ionicons name={trendInfo.icon as any} size={14} color="#fff" />
          </View>
        </View>
        
        {intel.current.speed > 0 && (
          <View style={styles.speedContainer}>
            <ThemedText style={styles.speedLabel}>Current</ThemedText>
            <ThemedText style={styles.speedValue}>{intel.current.speed.toFixed(1)} kt</ThemedText>
          </View>
        )}
        
        <View style={styles.coeffContainer}>
          <ThemedText style={styles.coeffLabel}>Coeff</ThemedText>
          <ThemedText style={styles.coeffValue}>{intel.current.coefficient}</ThemedText>
        </View>
      </View>

      {/* Tide Curve */}
      <View style={styles.curveContainer}>
        <TideCurve
          currentTrend={intel.current.trend}
          nextHighMinutes={intel.extremes.nextHigh?.minutesUntil || null}
          nextLowMinutes={intel.extremes.nextLow?.minutesUntil || null}
          currentHeight={intel.current.height}
          highHeight={intel.extremes.nextHigh?.height}
          lowHeight={intel.extremes.nextLow?.height}
        />
      </View>

      {/* Next Extremes */}
      <View style={styles.extremesRow}>
        {intel.extremes.nextHigh && (
          <View style={styles.extremeItem}>
            <View style={styles.extremeHeader}>
              <Ionicons name="arrow-up" size={14} color="#0284c7" />
              <ThemedText style={styles.extremeLabel}>Next High</ThemedText>
            </View>
            <ThemedText style={styles.extremeTime}>{formatTime(intel.extremes.nextHigh.time)}</ThemedText>
            <ThemedText style={styles.extremeCountdown}>in {formatMinutes(intel.extremes.nextHigh.minutesUntil)}</ThemedText>
            <ThemedText style={styles.extremeHeight}>{intel.extremes.nextHigh.height.toFixed(1)}m</ThemedText>
          </View>
        )}
        
        {intel.extremes.nextLow && (
          <View style={styles.extremeItem}>
            <View style={styles.extremeHeader}>
              <Ionicons name="arrow-down" size={14} color="#dc2626" />
              <ThemedText style={styles.extremeLabel}>Next Low</ThemedText>
            </View>
            <ThemedText style={styles.extremeTime}>{formatTime(intel.extremes.nextLow.time)}</ThemedText>
            <ThemedText style={styles.extremeCountdown}>in {formatMinutes(intel.extremes.nextLow.minutesUntil)}</ThemedText>
            <ThemedText style={styles.extremeHeight}>{intel.extremes.nextLow.height.toFixed(1)}m</ThemedText>
          </View>
        )}
      </View>

      {/* Slack Water Info */}
      {intel.slack.isSlackNow ? (
        <View style={styles.slackAlert}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <ThemedText style={styles.slackAlertText}>Slack water now - optimal for maneuvering</ThemedText>
        </View>
      ) : intel.slack.nextSlackTime && intel.slack.minutesUntilSlack !== null && intel.slack.minutesUntilSlack < 120 && (
        <View style={styles.slackInfo}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <ThemedText style={styles.slackInfoText}>
            Slack {intel.slack.slackType} in {formatMinutes(intel.slack.minutesUntilSlack)}
          </ThemedText>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Range: {intel.range.toFixed(1)}m • Updated {formatTime(intel.fetchedAt)}
        </ThemedText>
        <TouchableOpacity onPress={refetch} style={styles.refreshButton} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons name="refresh" size={16} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  flowBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Current State
  currentStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heightValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  heightUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  speedContainer: {
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  speedValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  coeffContainer: {
    alignItems: 'center',
  },
  coeffLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  coeffValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Curve
  curveContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },

  // Extremes
  extremesRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  extremeItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  extremeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  extremeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  extremeTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  extremeCountdown: {
    fontSize: 12,
    color: '#9ca3af',
  },
  extremeHeight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },

  // Slack
  slackAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  slackAlertText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  slackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  slackInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  refreshButton: {
    padding: 4,
  },

  // Loading & Error states
  loadingContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
  },
  unavailableContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unavailableText: {
    fontSize: 13,
    color: '#9ca3af',
  },

  // Compact
  compactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  compactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compactSpeed: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 'auto',
  },
});

export default TideCurrentPanel;

