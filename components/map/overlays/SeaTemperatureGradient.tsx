/**
 * SeaTemperatureGradient Component
 *
 * Displays sea surface temperature as a gradient overlay
 * Uses Storm Glass water temperature data with interpolation
 */

import React from 'react';

interface TemperatureDataPoint {
  latitude: number;
  longitude: number;
  temperature: number; // Celsius
}

interface SeaTemperatureGradientProps {
  temperatureData: TemperatureDataPoint[];
  opacity?: number;
  showIsotherms?: boolean; // Show temperature contour lines
  gradient?: {
    [key: number]: string; // Temperature in Celsius -> color
  };
}

// Default temperature gradient (Celsius -> color)
// Cold water (upwelling, currents) to warm water
const DEFAULT_GRADIENT = {
  10: '#0000FF',   // 10°C - Deep Blue (very cold)
  12: '#1E90FF',   // 12°C - Dodger Blue
  14: '#00BFFF',   // 14°C - Deep Sky Blue
  16: '#87CEEB',   // 16°C - Sky Blue
  18: '#00FFFF',   // 18°C - Cyan
  20: '#00FF00',   // 20°C - Green (comfortable)
  22: '#FFFF00',   // 22°C - Yellow
  24: '#FFA500',   // 24°C - Orange
  26: '#FF4500',   // 26°C - Orange Red
  28: '#FF0000',   // 28°C+ - Red (very warm)
};

/**
 * Get color for temperature using gradient interpolation
 */
function getTemperatureColor(
  temp: number,
  gradient = DEFAULT_GRADIENT
): string {
  const temps = Object.keys(gradient).map(Number).sort((a, b) => a - b);

  if (temp <= temps[0]) {
    return gradient[temps[0]];
  }

  if (temp >= temps[temps.length - 1]) {
    return gradient[temps[temps.length - 1]];
  }

  // Linear interpolation between colors
  for (let i = 0; i < temps.length - 1; i++) {
    const lower = temps[i];
    const upper = temps[i + 1];

    if (temp >= lower && temp <= upper) {
      const ratio = (temp - lower) / (upper - lower);
      return ratio < 0.5 ? gradient[lower] : gradient[upper];
    }
  }

  return gradient[temps[0]];
}

/**
 * Interpolate temperature using inverse distance weighting
 */
function interpolateTemperature(
  lat: number,
  lon: number,
  data: TemperatureDataPoint[]
): number {
  if (data.length === 0) return 20; // Default

  let weightedSum = 0;
  let totalWeight = 0;

  for (const point of data) {
    const distance = Math.sqrt(
      Math.pow(point.latitude - lat, 2) +
      Math.pow(point.longitude - lon, 2)
    );

    const weight = distance < 0.001 ? 1000 : 1 / Math.pow(distance, 2);
    weightedSum += point.temperature * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 20;
}

/**
 * Generate isotherm contour lines
 */
function generateIsotherms(
  temperatureData: TemperatureDataPoint[],
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  isotherms: number[] = [12, 14, 16, 18, 20, 22, 24, 26]
): Array<{
  temperature: number;
  coordinates: [number, number][];
}> {
  // Simplified isotherm generation - in production use marching squares algorithm
  const gridSize = 20;
  const latStep = (bounds.maxLat - bounds.minLat) / gridSize;
  const lonStep = (bounds.maxLon - bounds.minLon) / gridSize;

  const contours: Array<{
    temperature: number;
    coordinates: [number, number][];
  }> = [];

  // Create temperature grid
  const grid: number[][] = [];
  for (let i = 0; i <= gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j <= gridSize; j++) {
      const lat = bounds.minLat + i * latStep;
      const lon = bounds.minLon + j * lonStep;
      grid[i][j] = interpolateTemperature(lat, lon, temperatureData);
    }
  }

  // Simple contour detection (marching squares would be better)
  for (const isotherm of isotherms) {
    const coords: [number, number][] = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = bounds.minLat + i * latStep;
        const lon = bounds.minLon + j * lonStep;

        // Check if this cell crosses the isotherm
        const corners = [
          grid[i][j],
          grid[i + 1][j],
          grid[i][j + 1],
          grid[i + 1][j + 1],
        ];

        const crossesIsotherm =
          Math.min(...corners) <= isotherm &&
          Math.max(...corners) >= isotherm;

        if (crossesIsotherm) {
          coords.push([lon, lat]);
        }
      }
    }

    if (coords.length > 0) {
      contours.push({
        temperature: isotherm,
        coordinates: coords,
      });
    }
  }

  return contours;
}

/**
 * Generate temperature gradient cells
 */
function generateTemperatureGrid(
  temperatureData: TemperatureDataPoint[],
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  gridSize: number = 15,
  gradient = DEFAULT_GRADIENT
): Array<{
  coordinates: [number, number][];
  temperature: number;
  color: string;
}> {
  const cells = [];
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

      const temperature = interpolateTemperature(
        centerLat,
        centerLon,
        temperatureData
      );

      cells.push({
        coordinates: [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
        temperature,
        color: getTemperatureColor(temperature, gradient),
      });
    }
  }

  return cells;
}

/**
 * MapLibre GL layer specification for temperature gradient
 */
export function getSeaTemperatureGradientLayerSpec(
  temperatureData: TemperatureDataPoint[],
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  opacity: number = 0.5,
  showIsotherms: boolean = true,
  gradient = DEFAULT_GRADIENT
): any[] {
  const layers: any[] = [];

  // Temperature gradient cells
  const cells = generateTemperatureGrid(temperatureData, bounds, 15, gradient);

  const gradientLayer = {
    id: 'sea-temperature-gradient',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: cells.map((cell, index) => ({
          type: 'Feature',
          id: `temp-cell-${index}`,
          geometry: {
            type: 'Polygon',
            coordinates: [cell.coordinates],
          },
          properties: {
            temperature: cell.temperature,
            color: cell.color,
          },
        })),
      },
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity,
    },
  };

  layers.push(gradientLayer);

  // Isotherm lines
  if (showIsotherms) {
    const isotherms = generateIsotherms(temperatureData, bounds);

    const isothermLayer = {
      id: 'sea-temperature-isotherms',
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: isotherms.map((isotherm, index) => ({
            type: 'Feature',
            id: `isotherm-${index}`,
            geometry: {
              type: 'LineString',
              coordinates: isotherm.coordinates,
            },
            properties: {
              temperature: isotherm.temperature,
            },
          })),
        },
      },
      paint: {
        'line-color': '#FFFFFF',
        'line-width': 1.5,
        'line-opacity': 0.6,
        'line-dasharray': [2, 1],
      },
    };

    // Isotherm labels
    const isothermLabelLayer = {
      id: 'sea-temperature-isotherm-labels',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: isotherms.map((isotherm, index) => {
            // Use first coordinate for label
            const coord = isotherm.coordinates[0];
            return {
              type: 'Feature',
              id: `isotherm-label-${index}`,
              geometry: {
                type: 'Point',
                coordinates: coord,
              },
              properties: {
                label: `${isotherm.temperature}°C`,
              },
            };
          }),
        },
      },
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': 11,
        'text-anchor': 'center',
      },
      paint: {
        'text-color': '#FFFFFF',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
      minzoom: 11,
    };

    layers.push(isothermLayer, isothermLabelLayer);
  }

  return layers;
}

/**
 * Get legend for temperature gradient
 */
export function getTemperatureLegend(
  gradient = DEFAULT_GRADIENT
): Array<{
  label: string;
  color: string;
}> {
  const temps = Object.keys(gradient).map(Number).sort((a, b) => a - b);

  return temps.map(temp => ({
    label: `${temp}°C`,
    color: gradient[temp],
  }));
}

/**
 * Get temperature statistics
 */
export function getTemperatureStats(
  temperatureData: TemperatureDataPoint[]
): {
  min: number;
  max: number;
  average: number;
  range: number;
} {
  if (temperatureData.length === 0) {
    return {
      min: 20,
      max: 20,
      average: 20,
      range: 0,
    };
  }

  const temps = temperatureData.map(d => d.temperature);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const average = temps.reduce((a, b) => a + b, 0) / temps.length;

  return {
    min,
    max,
    average,
    range: max - min,
  };
}

/**
 * Detect thermal boundaries (temperature fronts)
 */
export function detectThermalBoundaries(
  temperatureData: TemperatureDataPoint[],
  threshold: number = 2.0 // °C
): Array<{
  location: { latitude: number; longitude: number };
  temperatureDrop: number;
  type: 'upwelling' | 'front' | 'eddy';
}> {
  const boundaries: Array<any> = [];

  // Simple detection - compare adjacent points
  for (let i = 0; i < temperatureData.length - 1; i++) {
    const point1 = temperatureData[i];
    const point2 = temperatureData[i + 1];

    const tempDiff = Math.abs(point1.temperature - point2.temperature);

    if (tempDiff >= threshold) {
      boundaries.push({
        location: {
          latitude: (point1.latitude + point2.latitude) / 2,
          longitude: (point1.longitude + point2.longitude) / 2,
        },
        temperatureDrop: tempDiff,
        type: point1.temperature < point2.temperature ? 'upwelling' : 'front',
      });
    }
  }

  return boundaries;
}

export const SeaTemperatureGradient: React.FC<SeaTemperatureGradientProps> = ({
  temperatureData,
  opacity = 0.5,
  showIsotherms = true,
  gradient = DEFAULT_GRADIENT,
}) => {
  // This component is primarily for MapLibre GL on web
  // The actual rendering is handled by the layer spec
  return null;
};
