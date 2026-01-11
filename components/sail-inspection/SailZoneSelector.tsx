/**
 * SailZoneSelector
 *
 * Interactive sail diagram with tappable zones for inspection.
 * Shows visual representation of sail with color-coded zone status.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, G, Circle, Text as SvgText } from 'react-native-svg';
import { CheckCircle2, AlertTriangle, XCircle, Circle as CircleIcon } from 'lucide-react-native';
import { SailZone } from '@/services/ai/SailAnalysisAIService';

// =============================================================================
// Types
// =============================================================================

export interface ZoneStatus {
  score: number | null; // 0-100, null = not inspected
  hasIssues: boolean;
  isComplete: boolean;
}

interface SailZoneSelectorProps {
  sailType?: 'mainsail' | 'jib' | 'genoa' | 'spinnaker';
  zoneStatuses: Partial<Record<SailZone, ZoneStatus>>;
  selectedZone: SailZone | null;
  onZonePress: (zone: SailZone) => void;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// =============================================================================
// Constants
// =============================================================================

const INSPECTION_ZONES: SailZone[] = ['head', 'leech', 'foot', 'luff', 'battens', 'cloth'];

const ZONE_COLORS = {
  notInspected: '#E5E7EB', // gray-200
  excellent: '#10B981',    // green-500
  good: '#84CC16',         // lime-500
  fair: '#F59E0B',         // amber-500
  poor: '#EF4444',         // red-500
  selected: '#3B82F6',     // blue-500
};

const SIZE_CONFIGS = {
  small: { width: 120, height: 180 },
  medium: { width: 200, height: 300 },
  large: { width: 280, height: 420 },
};

// =============================================================================
// Component
// =============================================================================

export function SailZoneSelector({
  sailType = 'mainsail',
  zoneStatuses,
  selectedZone,
  onZonePress,
  showLabels = true,
  size = 'medium',
}: SailZoneSelectorProps) {
  const { width, height } = SIZE_CONFIGS[size];

  const getZoneColor = (zone: SailZone): string => {
    if (selectedZone === zone) return ZONE_COLORS.selected;

    const status = zoneStatuses[zone];
    if (!status || status.score === null) return ZONE_COLORS.notInspected;

    if (status.score >= 85) return ZONE_COLORS.excellent;
    if (status.score >= 70) return ZONE_COLORS.good;
    if (status.score >= 50) return ZONE_COLORS.fair;
    return ZONE_COLORS.poor;
  };

  const getZoneOpacity = (zone: SailZone): number => {
    const status = zoneStatuses[zone];
    if (selectedZone === zone) return 1;
    if (!status || status.score === null) return 0.3;
    return 0.7;
  };

  // Sail shape paths (normalized to 100x150 viewBox)
  const sailPaths = {
    // Main triangular sail shape
    outline: 'M50 5 L95 145 L5 145 Z',
    // Zone areas (approximate regions)
    head: 'M50 5 L65 35 L35 35 Z',
    leech: 'M65 35 L95 145 L70 145 L55 75 Z',
    foot: 'M5 145 L95 145 L70 145 L30 145 Z',
    luff: 'M35 35 L5 145 L30 145 L45 75 Z',
    cloth: 'M45 50 L55 50 L60 100 L40 100 Z',
    // Batten lines
    battens: 'M40 45 L60 45 M38 65 L62 65 M36 85 L64 85 M34 105 L66 105',
  };

  // Zone touch areas (for interaction)
  const zoneTouchAreas: Record<SailZone, { x: number; y: number; w: number; h: number }> = {
    head: { x: 30, y: 0, w: 40, h: 40 },
    leech: { x: 55, y: 30, w: 45, h: 120 },
    foot: { x: 5, y: 130, w: 90, h: 25 },
    luff: { x: 0, y: 30, w: 45, h: 120 },
    battens: { x: 35, y: 40, w: 30, h: 70 },
    cloth: { x: 35, y: 45, w: 30, h: 60 },
    overview: { x: 0, y: 0, w: 0, h: 0 },
    detail: { x: 0, y: 0, w: 0, h: 0 },
  };

  const renderZoneStatus = (zone: SailZone) => {
    const status = zoneStatuses[zone];
    const isSelected = selectedZone === zone;
    const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 22;

    if (!status) {
      return <CircleIcon size={iconSize} color="#9CA3AF" />;
    }

    if (status.isComplete) {
      if (status.hasIssues) {
        return <AlertTriangle size={iconSize} color={ZONE_COLORS.fair} fill={ZONE_COLORS.fair} />;
      }
      return <CheckCircle2 size={iconSize} color={ZONE_COLORS.excellent} fill={ZONE_COLORS.excellent} />;
    }

    return <CircleIcon size={iconSize} color="#9CA3AF" />;
  };

  return (
    <View style={[styles.container, { width, height: height + (showLabels ? 80 : 0) }]}>
      {/* SVG Sail Diagram */}
      <Svg width={width} height={height} viewBox="0 0 100 150">
        {/* Sail outline */}
        <Path
          d={sailPaths.outline}
          fill="#F3F4F6"
          stroke="#9CA3AF"
          strokeWidth={1}
        />

        {/* Zone overlays */}
        {INSPECTION_ZONES.map((zone) => {
          if (zone === 'battens') {
            // Battens are lines, not filled areas
            return (
              <Path
                key={zone}
                d={sailPaths.battens}
                fill="none"
                stroke={getZoneColor(zone)}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={getZoneOpacity(zone)}
              />
            );
          }

          const path = sailPaths[zone as keyof typeof sailPaths];
          if (!path) return null;

          return (
            <Path
              key={zone}
              d={path}
              fill={getZoneColor(zone)}
              fillOpacity={getZoneOpacity(zone)}
              stroke={selectedZone === zone ? ZONE_COLORS.selected : 'transparent'}
              strokeWidth={selectedZone === zone ? 2 : 0}
            />
          );
        })}

        {/* Zone labels on diagram */}
        {size !== 'small' && (
          <>
            <SvgText x="50" y="22" fontSize="8" fill="#374151" textAnchor="middle">HEAD</SvgText>
            <SvgText x="80" y="90" fontSize="8" fill="#374151" textAnchor="middle" transform="rotate(75, 80, 90)">LEECH</SvgText>
            <SvgText x="50" y="142" fontSize="8" fill="#374151" textAnchor="middle">FOOT</SvgText>
            <SvgText x="20" y="90" fontSize="8" fill="#374151" textAnchor="middle" transform="rotate(-75, 20, 90)">LUFF</SvgText>
            <SvgText x="50" y="75" fontSize="7" fill="#374151" textAnchor="middle">CLOTH</SvgText>
          </>
        )}
      </Svg>

      {/* Touch overlays */}
      <View style={StyleSheet.absoluteFill}>
        {INSPECTION_ZONES.map((zone) => {
          const area = zoneTouchAreas[zone];
          const scaleX = width / 100;
          const scaleY = height / 150;

          return (
            <TouchableOpacity
              key={zone}
              style={[
                styles.touchZone,
                {
                  left: area.x * scaleX,
                  top: area.y * scaleY,
                  width: area.w * scaleX,
                  height: area.h * scaleY,
                },
              ]}
              onPress={() => onZonePress(zone)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>

      {/* Zone Legend */}
      {showLabels && (
        <View style={styles.legend}>
          {INSPECTION_ZONES.map((zone) => {
            const status = zoneStatuses[zone];
            const isSelected = selectedZone === zone;

            return (
              <TouchableOpacity
                key={zone}
                style={[
                  styles.legendItem,
                  isSelected && styles.legendItemSelected,
                ]}
                onPress={() => onZonePress(zone)}
              >
                <View style={[styles.legendDot, { backgroundColor: getZoneColor(zone) }]} />
                <Text style={[styles.legendText, isSelected && styles.legendTextSelected]}>
                  {zone.charAt(0).toUpperCase() + zone.slice(1)}
                </Text>
                {renderZoneStatus(zone)}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  touchZone: {
    position: 'absolute',
    // Debug: uncomment to see touch areas
    // backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  legendItemSelected: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  legendTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default SailZoneSelector;
