/**
 * WaveHeightHeatmap Component
 *
 * Displays wave height as a color-coded heatmap overlay
 * Uses Storm Glass wave height data with interpolation
 */

import React, { useMemo } from 'react';
import { Platform } from 'react-native';

interface GeoPoint {
  latitude: number;
  longitude: number;
  waveHeight: number; // meters
}

interface WaveHeightHeatmapProps {
  dataPoints: GeoPoint[];
  opacity?: number;
  gradient?: {
    [key: number]: string; // Wave height in meters -> color
  };
}

// Default wave height gradient (meters -> color)
const DEFAULT_GRADIENT = {
  0: '#00FFFF',    // 0m - Cyan (flat)
  0.5: '#00FF00',  // 0.5m - Green (small)
  1.0: '#FFFF00',  // 1m - Yellow (moderate)
  1.5: '#FFA500',  // 1.5m - Orange (rough)
  2.0: '#FF4500',  // 2m - Orange-red (very rough)
  3.0: '#FF0000',  // 3m+ - Red (dangerous)
};

/**
 * Get color for wave height using gradient interpolation
 */
function getWaveHeightColor(height: number, gradient = DEFAULT_GRADIENT): string {
  const heights = Object.keys(gradient).map(Number).sort((a, b) => a - b);

  // Below minimum
  if (height <= heights[0]) {
    return gradient[heights[0]];
  }

  // Above maximum
  if (height >= heights[heights.length - 1]) {
    return gradient[heights[heights.length - 1]];
  }

  // Find bounding heights
  for (let i = 0; i < heights.length - 1; i++) {
    const lower = heights[i];
    const upper = heights[i + 1];

    if (height >= lower && height <= upper) {
      // Simple interpolation - could use lerp for smoother transitions
      const ratio = (height - lower) / (upper - lower);

      // For simplicity, return lower color if ratio < 0.5, else upper
      return ratio < 0.5 ? gradient[lower] : gradient[upper];
    }
  }

  return gradient[heights[0]];
}

/**
 * Generate grid of wave height polygons for heatmap
 */
function generateHeatmapGrid(
  dataPoints: GeoPoint[],
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  gridSize: number = 10
): Array<{
  coordinates: [number, number][];
  waveHeight: number;
  color: string;
}> {
  const polygons = [];
  const latStep = region.latitudeDelta / gridSize;
  const lonStep = region.longitudeDelta / gridSize;

  const minLat = region.latitude - region.latitudeDelta / 2;
  const minLon = region.longitude - region.longitudeDelta / 2;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = minLat + i * latStep;
      const lon = minLon + j * lonStep;

      // Interpolate wave height for this cell from nearby data points
      const waveHeight = interpolateWaveHeight(lat + latStep / 2, lon + lonStep / 2, dataPoints);

      // Create polygon for this grid cell
      polygons.push({
        coordinates: [
          [lon, lat],
          [lon + lonStep, lat],
          [lon + lonStep, lat + latStep],
          [lon, lat + latStep],
          [lon, lat], // Close polygon
        ],
        waveHeight,
        color: getWaveHeightColor(waveHeight),
      });
    }
  }

  return polygons;
}

/**
 * Interpolate wave height using inverse distance weighting
 */
function interpolateWaveHeight(
  lat: number,
  lon: number,
  dataPoints: GeoPoint[],
  maxDistance: number = 0.1 // degrees (~11km)
): number {
  if (dataPoints.length === 0) {
    return 0;
  }

  // Calculate distances and weights
  let weightedSum = 0;
  let totalWeight = 0;

  for (const point of dataPoints) {
    const distance = Math.sqrt(
      Math.pow(point.latitude - lat, 2) +
      Math.pow(point.longitude - lon, 2)
    );

    // Skip points too far away
    if (distance > maxDistance) {
      continue;
    }

    // Inverse distance weighting (avoid division by zero)
    const weight = distance < 0.001 ? 1000 : 1 / Math.pow(distance, 2);

    weightedSum += point.waveHeight * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * MapLibre GL layer specification for wave height heatmap
 */
export function getWaveHeightHeatmapLayerSpec(
  dataPoints: GeoPoint[],
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  },
  opacity: number = 0.6,
  gradient = DEFAULT_GRADIENT
): any {
  const polygons = generateHeatmapGrid(dataPoints, region);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: polygons.map((polygon, index) => ({
      type: 'Feature',
      id: `wave-cell-${index}`,
      geometry: {
        type: 'Polygon',
        coordinates: [polygon.coordinates],
      },
      properties: {
        waveHeight: polygon.waveHeight,
        color: polygon.color,
      },
    })),
  };

  return {
    id: 'wave-height-heatmap',
    type: 'fill',
    source: {
      type: 'geojson',
      data: geojson,
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity,
    },
  };
}

/**
 * Get legend items for wave height heatmap
 */
export function getWaveHeightLegend(gradient = DEFAULT_GRADIENT): Array<{
  label: string;
  color: string;
}> {
  const heights = Object.keys(gradient).map(Number).sort((a, b) => a - b);

  return heights.map(height => ({
    label: height === heights[heights.length - 1]
      ? `${height}m+`
      : `${height}m`,
    color: gradient[height],
  }));
}

export const WaveHeightHeatmap: React.FC<WaveHeightHeatmapProps> = ({
  dataPoints,
  opacity = 0.6,
  gradient = DEFAULT_GRADIENT,
}) => {
  // This component is primarily for MapLibre GL on web
  // The actual rendering is handled by the layer spec

  if (Platform.OS !== 'web') {
    return null;
  }

  // MapLibre layer is added through the map engine
  return null;
};

/**
 * Helper: Generate sample wave data from Storm Glass forecast
 */
export function generateWaveDataPoints(
  centerLat: number,
  centerLon: number,
  waveHeight: number,
  variability: number = 0.3,
  gridSize: number = 5
): GeoPoint[] {
  const points: GeoPoint[] = [];
  const spread = 0.05; // ~5km spread

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat + (i - gridSize / 2) * (spread / gridSize);
      const lon = centerLon + (j - gridSize / 2) * (spread / gridSize);

      // Add some variability to wave height
      const variation = (Math.random() - 0.5) * variability;
      const height = Math.max(0, waveHeight + variation);

      points.push({ latitude: lat, longitude: lon, waveHeight: height });
    }
  }

  return points;
}
