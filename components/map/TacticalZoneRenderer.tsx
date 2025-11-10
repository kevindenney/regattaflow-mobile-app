/**
 * Tactical Zone Renderer
 *
 * High-level component for rendering tactical zones on the map.
 * Handles layer management, updates, and user interaction.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTacticalZones, useTacticalZoneLayerConfig } from '@/hooks/useTacticalZones';
import {
  getAllTacticalZoneLayers,
  getTacticalZoneFillLayerSpec,
  getTacticalZoneBorderLayerSpec,
  getTacticalZoneLabelLayerSpec
} from './layers/TacticalCurrentZones';
import type { TacticalZone } from '@/stores/raceConditionsStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/RacingDesignSystem';

export interface TacticalZoneRendererProps {
  /** MapLibre map instance */
  map?: any;

  /** Visibility */
  visible?: boolean;

  /** Opacity (0-1) */
  opacity?: number;

  /** Show zone labels */
  showLabels?: boolean;

  /** Show zone borders */
  showBorders?: boolean;

  /** Show confidence indicators */
  showConfidence?: boolean;

  /** Filter by zone type */
  filterTypes?: Array<TacticalZone['type']>;

  /** Minimum confidence threshold */
  minConfidence?: number;

  /** Only show active zones */
  onlyActive?: boolean;

  /** On zone click callback */
  onZoneClick?: (zone: TacticalZone) => void;

  /** Show zone legend */
  showLegend?: boolean;
}

/**
 * Tactical Zone Renderer Component
 *
 * Renders tactical zones on a MapLibre GL map
 */
export function TacticalZoneRenderer({
  map,
  visible = true,
  opacity = 0.35,
  showLabels = true,
  showBorders = true,
  showConfidence = true,
  filterTypes,
  minConfidence = 0.5,
  onlyActive = false,
  onZoneClick,
  showLegend = false
}: TacticalZoneRendererProps) {
  const layerIdsRef = useRef<string[]>([]);

  // Get tactical zones data
  const {
    filteredZones,
    reliefLanes,
    accelerationZones,
    shearBoundaries,
    leeBowZones,
    anchoringZones,
    hasEnvironmentalData
  } = useTacticalZones({
    filterTypes,
    minConfidence,
    onlyActive
  });

  // Update map layers when zones change
  useEffect(() => {
    if (!map || !visible || filteredZones.length === 0) {
      // Remove existing layers
      layerIdsRef.current.forEach(layerId => {
        if (map?.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      layerIdsRef.current = [];
      return;
    }

    // Remove old layers
    layerIdsRef.current.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
    });

    // Add new layers
    const layers = getAllTacticalZoneLayers(filteredZones, {
      opacity,
      showBorders,
      showLabels,
      showConfidence
    });

    layers.forEach(layer => {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
        layerIdsRef.current.push(layer.id);
      }
    });

    // Add click handler for zones
    if (onZoneClick) {
      const handleMapClick = (e: any) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['tactical-zones-fill']
        });

        if (features.length > 0) {
          const zoneId = features[0].id;
          const zone = filteredZones.find(z => z.id === zoneId);
          if (zone) {
            onZoneClick(zone);
          }
        }
      };

      map.on('click', 'tactical-zones-fill', handleMapClick);

      // Cleanup
      return () => {
        map.off('click', 'tactical-zones-fill', handleMapClick);
      };
    }
  }, [map, visible, filteredZones, opacity, showBorders, showLabels, showConfidence, onZoneClick]);

  // Render legend if requested
  if (showLegend && hasEnvironmentalData) {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendHeader}>
          <MaterialCommunityIcons
            name="chart-bubble"
            size={20}
            color={Colors.primary.blue}
          />
          <Text style={styles.legendTitle}>Tactical Zones</Text>
        </View>

        <View style={styles.legendItems}>
          {reliefLanes.length > 0 && (
            <LegendItem
              icon="water-outline"
              label="Relief Lanes"
              count={reliefLanes.length}
              color={Colors.tactical.reliefLane}
            />
          )}

          {accelerationZones.length > 0 && (
            <LegendItem
              icon="speedometer"
              label="Acceleration"
              count={accelerationZones.length}
              color={Colors.tactical.acceleration}
            />
          )}

          {shearBoundaries.length > 0 && (
            <LegendItem
              icon="wave"
              label="Shear Boundary"
              count={shearBoundaries.length}
              color={Colors.tactical.shearBoundary}
            />
          )}

          {leeBowZones.length > 0 && (
            <LegendItem
              icon="target"
              label="Lee-Bow"
              count={leeBowZones.length}
              color={Colors.tactical.leeBow}
            />
          )}

          {anchoringZones.length > 0 && (
            <LegendItem
              icon="anchor"
              label="Anchoring"
              count={anchoringZones.length}
              color={Colors.tactical.anchoring}
            />
          )}
        </View>

        <View style={styles.legendFooter}>
          <Text style={styles.legendFooterText}>
            {filteredZones.length} zone{filteredZones.length !== 1 ? 's' : ''} active
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

interface LegendItemProps {
  icon: string;
  label: string;
  count: number;
  color: string;
}

function LegendItem({ icon, label, count, color }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColorBox, { backgroundColor: color + '40', borderColor: color }]} />
      <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendCount}>({count})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legendContainer: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.ui.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    padding: Spacing.md,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },

  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm
  },

  legendTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary
  },

  legendItems: {
    gap: Spacing.xs
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs
  },

  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 2
  },

  legendLabel: {
    flex: 1,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium
  },

  legendCount: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.tertiary
  },

  legendFooter: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border
  },

  legendFooterText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
    textAlign: 'center'
  }
});
