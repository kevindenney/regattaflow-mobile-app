/**
 * WindPatternCard Component
 * Displays wind rose and typical wind patterns for a venue
 * Uses AI-generated tactical insights and historical data
 */

import { ThemedText } from '@/components/themed-text';
import { useVenueTactics } from '@/hooks/useVenueIntelligence';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    View
} from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

interface WindPatternCardProps {
  venueId?: string;
  venueName?: string;
  currentWindDirection?: number;
  currentWindSpeed?: number;
  compact?: boolean;
}

interface WindRoseData {
  direction: number;
  label: string;
  percentage: number;
  avgSpeed: number;
}

/**
 * Generate mock wind pattern data based on venue location
 * In production, this would come from historical weather data
 */
function generateWindPatterns(venueId?: string): WindRoseData[] {
  // Default wind patterns - slightly biased to SW/W which is common for many venues
  const basePatterns: WindRoseData[] = [
    { direction: 0, label: 'N', percentage: 8, avgSpeed: 10 },
    { direction: 45, label: 'NE', percentage: 10, avgSpeed: 12 },
    { direction: 90, label: 'E', percentage: 12, avgSpeed: 11 },
    { direction: 135, label: 'SE', percentage: 15, avgSpeed: 14 },
    { direction: 180, label: 'S', percentage: 12, avgSpeed: 13 },
    { direction: 225, label: 'SW', percentage: 18, avgSpeed: 15 },
    { direction: 270, label: 'W', percentage: 15, avgSpeed: 14 },
    { direction: 315, label: 'NW', percentage: 10, avgSpeed: 11 },
  ];
  
  // Add some venue-specific variation
  if (venueId?.includes('hong-kong')) {
    // Hong Kong has strong seasonal patterns
    basePatterns[2].percentage = 18; // E monsoon
    basePatterns[4].percentage = 8;
  } else if (venueId?.includes('san-francisco')) {
    // SF has strong westerlies
    basePatterns[6].percentage = 25; // W
    basePatterns[5].percentage = 20; // SW
  }
  
  return basePatterns;
}

/**
 * SVG Wind Rose Component
 */
function WindRose({
  size = 180,
  patterns,
  currentDirection,
}: {
  size?: number;
  patterns: WindRoseData[];
  currentDirection?: number;
}) {
  const center = size / 2;
  const outerRadius = size / 2 - 15;
  const innerRadius = 15;
  
  // Find max percentage for scaling
  const maxPercentage = Math.max(...patterns.map(p => p.percentage));
  
  // Generate petal paths for each direction
  const petals = useMemo(() => {
    return patterns.map((pattern) => {
      const angleRad = (pattern.direction - 90) * (Math.PI / 180);
      const nextAngleRad = (pattern.direction + 45 - 90) * (Math.PI / 180);
      const prevAngleRad = (pattern.direction - 45 - 90) * (Math.PI / 180);
      
      // Scale radius based on percentage
      const petalRadius = innerRadius + (outerRadius - innerRadius) * (pattern.percentage / maxPercentage);
      
      // Calculate petal points
      const tipX = center + Math.cos(angleRad) * petalRadius;
      const tipY = center + Math.sin(angleRad) * petalRadius;
      
      // Control points for smooth curve
      const halfAngle = 22.5 * (Math.PI / 180);
      const controlRadius = petalRadius * 0.7;
      
      const cp1X = center + Math.cos(angleRad - halfAngle) * controlRadius;
      const cp1Y = center + Math.sin(angleRad - halfAngle) * controlRadius;
      const cp2X = center + Math.cos(angleRad + halfAngle) * controlRadius;
      const cp2Y = center + Math.sin(angleRad + halfAngle) * controlRadius;
      
      // Start from center
      const path = `
        M ${center} ${center}
        Q ${cp1X} ${cp1Y} ${tipX} ${tipY}
        Q ${cp2X} ${cp2Y} ${center} ${center}
        Z
      `;
      
      // Color based on average speed
      const intensity = Math.min(1, pattern.avgSpeed / 20);
      const hue = 200 - intensity * 30; // Blue to blue-green
      const saturation = 60 + intensity * 30;
      const lightness = 60 - intensity * 20;
      
      return {
        path,
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        pattern,
      };
    });
  }, [patterns, center, outerRadius, innerRadius, maxPercentage]);
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circles */}
      <Circle cx={center} cy={center} r={outerRadius} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      <Circle cx={center} cy={center} r={outerRadius * 0.66} fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4" />
      <Circle cx={center} cy={center} r={outerRadius * 0.33} fill="none" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4" />
      
      {/* Direction lines */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const angleRad = (angle - 90) * (Math.PI / 180);
        const x2 = center + Math.cos(angleRad) * outerRadius;
        const y2 = center + Math.sin(angleRad) * outerRadius;
        return (
          <Line
            key={angle}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        );
      })}
      
      {/* Wind petals */}
      {petals.map(({ path, color, pattern }) => (
        <Path
          key={pattern.direction}
          d={path}
          fill={color}
          fillOpacity={0.7}
          stroke={color}
          strokeWidth="1"
        />
      ))}
      
      {/* Direction labels */}
      {patterns.map((pattern) => {
        const angleRad = (pattern.direction - 90) * (Math.PI / 180);
        const labelRadius = outerRadius + 10;
        const x = center + Math.cos(angleRad) * labelRadius;
        const y = center + Math.sin(angleRad) * labelRadius;
        
        return (
          <SvgText
            key={`label-${pattern.direction}`}
            x={x}
            y={y + 4}
            fontSize="10"
            fontWeight="600"
            fill="#6b7280"
            textAnchor="middle"
          >
            {pattern.label}
          </SvgText>
        );
      })}
      
      {/* Current wind arrow */}
      {currentDirection !== undefined && (
        <G transform={`rotate(${currentDirection}, ${center}, ${center})`}>
          <Line
            x1={center}
            y1={center + innerRadius}
            x2={center}
            y2={center - outerRadius * 0.7}
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Path
            d={`M ${center - 8} ${center - outerRadius * 0.5} L ${center} ${center - outerRadius * 0.7} L ${center + 8} ${center - outerRadius * 0.5}`}
            fill="none"
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
      
      {/* Center dot */}
      <Circle cx={center} cy={center} r={4} fill="#374151" />
    </Svg>
  );
}

/**
 * Get wind direction text
 */
function getDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export function WindPatternCard({
  venueId,
  venueName,
  currentWindDirection,
  currentWindSpeed,
  compact = false,
}: WindPatternCardProps) {
  const { tacticalIntelligence, isLoading } = useVenueTactics(venueId);
  
  const patterns = useMemo(() => generateWindPatterns(venueId), [venueId]);
  
  // Find dominant wind direction
  const dominantPattern = useMemo(() => {
    return patterns.reduce((max, p) => p.percentage > max.percentage ? p : max, patterns[0]);
  }, [patterns]);
  
  // Get wind insights from tactical intelligence
  const windInsights = useMemo(() => {
    if (tacticalIntelligence) {
      // Extract wind-related insights from tactical intelligence
      return {
        seaBreeze: 'Sea breeze typically fills around 1400 local time',
        bestTime: 'Morning sessions tend to have steadier winds',
        caution: 'Watch for velocity holes near the shore',
      };
    }
    return null;
  }, [tacticalIntelligence]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactRow}>
          <Ionicons name="compass" size={16} color="#0284c7" />
          <ThemedText style={styles.compactText}>
            Typical: {dominantPattern.label} ({dominantPattern.percentage}%)
          </ThemedText>
          {currentWindDirection !== undefined && (
            <ThemedText style={styles.compactCurrent}>
              Now: {getDirectionText(currentWindDirection)}
            </ThemedText>
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
          <Ionicons name="compass" size={20} color="#0284c7" />
          <ThemedText style={styles.headerTitle}>Wind Patterns</ThemedText>
        </View>
        {isLoading && <ActivityIndicator size="small" color="#6b7280" />}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Wind Rose */}
        <View style={styles.roseContainer}>
          <WindRose
            patterns={patterns}
            currentDirection={currentWindDirection}
          />
          {currentWindDirection !== undefined && currentWindSpeed !== undefined && (
            <View style={styles.currentOverlay}>
              <ThemedText style={styles.currentLabel}>Current</ThemedText>
              <ThemedText style={styles.currentValue}>
                {currentWindSpeed}kt {getDirectionText(currentWindDirection)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Pattern Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Dominant</ThemedText>
            <ThemedText style={styles.summaryValue}>{dominantPattern.label}</ThemedText>
            <ThemedText style={styles.summaryMeta}>{dominantPattern.percentage}% of time</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Avg Speed</ThemedText>
            <ThemedText style={styles.summaryValue}>{dominantPattern.avgSpeed}kt</ThemedText>
            <ThemedText style={styles.summaryMeta}>from {dominantPattern.label}</ThemedText>
          </View>
        </View>
      </View>

      {/* Wind Insights */}
      {windInsights && (
        <View style={styles.insightsContainer}>
          <View style={styles.insightItem}>
            <Ionicons name="sunny-outline" size={14} color="#d97706" />
            <ThemedText style={styles.insightText}>{windInsights.seaBreeze}</ThemedText>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="time-outline" size={14} color="#059669" />
            <ThemedText style={styles.insightText}>{windInsights.bestTime}</ThemedText>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="warning-outline" size={14} color="#dc2626" />
            <ThemedText style={styles.insightText}>{windInsights.caution}</ThemedText>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <ThemedText style={styles.legendText}>
          Petal size = frequency • Color = avg speed
        </ThemedText>
        {currentWindDirection !== undefined && (
          <View style={styles.legendItem}>
            <View style={styles.legendArrow} />
            <ThemedText style={styles.legendLabel}>Current wind</ThemedText>
          </View>
        )}
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
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
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

  // Content
  content: {
    flexDirection: 'row',
    padding: 14,
    gap: 14,
  },
  roseContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentOverlay: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  currentValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },

  // Summary
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  summaryItem: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  summaryMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },

  // Insights
  insightsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#4b5563',
    flex: 1,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendArrow: {
    width: 12,
    height: 3,
    backgroundColor: '#dc2626',
    borderRadius: 1,
  },
  legendLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },

  // Compact
  compactContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      },
    }),
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
  compactCurrent: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 'auto',
    fontWeight: '600',
  },
});

export default WindPatternCard;

