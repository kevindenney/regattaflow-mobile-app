/**
 * VisibilityZones Component
 *
 * Displays visibility condition zones (fog, haze, clear) as colored overlay regions
 * Uses Storm Glass visibility data
 */

import React, { useMemo } from 'react';

interface VisibilityData {
  latitude: number;
  longitude: number;
  visibility: number; // kilometers
}

interface VisibilityZonesProps {
  visibilityData: VisibilityData[];
  opacity?: number;
  showLabels?: boolean;
}

type VisibilityCondition = 'clear' | 'good' | 'moderate' | 'poor' | 'fog';

/**
 * Classify visibility into conditions
 */
function getVisibilityCondition(visibilityKm: number): VisibilityCondition {
  if (visibilityKm >= 10) return 'clear';
  if (visibilityKm >= 5) return 'good';
  if (visibilityKm >= 2) return 'moderate';
  if (visibilityKm >= 1) return 'poor';
  return 'fog';
}

/**
 * Get color for visibility condition
 */
function getVisibilityColor(condition: VisibilityCondition): string {
  switch (condition) {
    case 'clear':
      return '#00FF0020'; // Transparent green
    case 'good':
      return '#90EE9040'; // Light green
    case 'moderate':
      return '#FFFF0060'; // Yellow
    case 'poor':
      return '#FFA50080'; // Orange
    case 'fog':
      return '#FF0000A0'; // Red
  }
}

/**
 * Get label for visibility condition
 */
function getVisibilityLabel(condition: VisibilityCondition, visibilityKm: number): string {
  return `${condition.toUpperCase()}\n${visibilityKm.toFixed(1)}km`;
}

/**
 * Generate visibility zones from data points
 */
function generateVisibilityZones(
  visibilityData: VisibilityData[],
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }
): Array<{
  id: string;
  condition: VisibilityCondition;
  visibility: number;
  geometry: GeoJSON.Polygon;
  center: [number, number];
}> {
  const zones = [];
  const gridSize = Math.max(3, Math.floor(Math.sqrt(visibilityData.length)));
  const latStep = (bounds.maxLat - bounds.minLat) / gridSize;
  const lonStep = (bounds.maxLon - bounds.minLon) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const minLat = bounds.minLat + i * latStep;
      const maxLat = minLat + latStep;
      const minLon = bounds.minLon + j * lonStep;
      const maxLon = minLon + lonStep;

      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;

      // Interpolate visibility at this cell center
      const visibility = interpolateVisibility(centerLat, centerLon, visibilityData);
      const condition = getVisibilityCondition(visibility);

      zones.push({
        id: `visibility-zone-${i}-${j}`,
        condition,
        visibility,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLon, minLat],
            [maxLon, minLat],
            [maxLon, maxLat],
            [minLon, maxLat],
            [minLon, minLat],
          ]],
        },
        center: [centerLon, centerLat],
      });
    }
  }

  return zones;
}

/**
 * Interpolate visibility using inverse distance weighting
 */
function interpolateVisibility(
  lat: number,
  lon: number,
  data: VisibilityData[]
): number {
  if (data.length === 0) return 10; // Default clear

  let weightedSum = 0;
  let totalWeight = 0;

  for (const point of data) {
    const distance = Math.sqrt(
      Math.pow(point.latitude - lat, 2) +
      Math.pow(point.longitude - lon, 2)
    );

    const weight = distance < 0.001 ? 1000 : 1 / Math.pow(distance, 2);
    weightedSum += point.visibility * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 10;
}

/**
 * MapLibre GL layer specification for visibility zones
 */
export function getVisibilityZonesLayerSpec(
  visibilityData: VisibilityData[],
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  opacity: number = 0.4
): any[] {
  const zones = generateVisibilityZones(visibilityData, bounds);

  // Fill layer
  const fillLayer = {
    id: 'visibility-zones-fill',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: zones.map(zone => ({
          type: 'Feature',
          id: zone.id,
          geometry: zone.geometry,
          properties: {
            condition: zone.condition,
            visibility: zone.visibility,
            color: getVisibilityColor(zone.condition),
          },
        })),
      },
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity,
    },
  };

  // Border layer
  const borderLayer = {
    id: 'visibility-zones-border',
    type: 'line',
    source: fillLayer.source,
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 1,
      'line-opacity': 0.3,
    },
  };

  // Label layer
  const labelLayer = {
    id: 'visibility-zones-label',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: zones.map(zone => ({
          type: 'Feature',
          id: `${zone.id}-label`,
          geometry: {
            type: 'Point',
            coordinates: zone.center,
          },
          properties: {
            label: getVisibilityLabel(zone.condition, zone.visibility),
          },
        })),
      },
    },
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-anchor': 'center',
      'text-justify': 'center',
    },
    paint: {
      'text-color': '#FFFFFF',
      'text-halo-color': '#000000',
      'text-halo-width': 2,
    },
    minzoom: 11,
  };

  return [fillLayer, borderLayer, labelLayer];
}

export const VisibilityZones: React.FC<VisibilityZonesProps> = ({
  visibilityData,
  opacity = 0.4,
  showLabels = true,
}) => {
  // This component is primarily for MapLibre GL on web
  // The actual rendering is handled by the layer spec
  return null;
};

/**
 * Get visibility statistics for display
 */
export function getVisibilityStats(visibilityData: VisibilityData[]): {
  min: number;
  max: number;
  average: number;
  condition: VisibilityCondition;
} {
  if (visibilityData.length === 0) {
    return {
      min: 10,
      max: 10,
      average: 10,
      condition: 'clear',
    };
  }

  const visibilities = visibilityData.map(d => d.visibility);
  const min = Math.min(...visibilities);
  const max = Math.max(...visibilities);
  const average = visibilities.reduce((a, b) => a + b, 0) / visibilities.length;

  return {
    min,
    max,
    average,
    condition: getVisibilityCondition(average),
  };
}

/**
 * Check if visibility is safe for racing
 */
export function isVisibilitySafeForRacing(
  visibilityData: VisibilityData[],
  minimumVisibility: number = 2 // km
): {
  safe: boolean;
  minVisibility: number;
  warnings: string[];
} {
  const stats = getVisibilityStats(visibilityData);
  const warnings: string[] = [];

  if (stats.min < minimumVisibility) {
    warnings.push(`Minimum visibility ${stats.min.toFixed(1)}km below safe threshold`);
  }

  if (stats.condition === 'fog') {
    warnings.push('Fog conditions detected - racing may be unsafe');
  } else if (stats.condition === 'poor') {
    warnings.push('Poor visibility - extra caution required');
  }

  return {
    safe: stats.min >= minimumVisibility && stats.condition !== 'fog',
    minVisibility: stats.min,
    warnings,
  };
}
