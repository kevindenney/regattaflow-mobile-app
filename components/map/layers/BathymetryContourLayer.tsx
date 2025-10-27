/**
 * Bathymetry Contour Layer
 *
 * Generates and renders depth contour lines for underwater terrain visualization.
 * Shows constant-depth lines to help understand underwater topography.
 */

import React from 'react';

export interface BathymetryContourLayerProps {
  /** Bathymetry data (2D array of depths) */
  depths: number[][];

  /** Geographic bounds of the data */
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };

  /** Contour interval in meters (e.g., 5m, 10m) */
  interval?: number;

  /** Specific depths to contour (overrides interval) */
  depths_to_contour?: number[];

  /** Line color */
  lineColor?: string;

  /** Line width */
  lineWidth?: number;

  /** Show depth labels */
  showLabels?: boolean;

  /** Visibility */
  visible?: boolean;

  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Bathymetry Contour Layer Component
 *
 * Generates contour lines from bathymetry data using marching squares algorithm
 */
export function BathymetryContourLayer({
  depths,
  bounds,
  interval = 10,
  depths_to_contour,
  lineColor = '#0080ff',
  lineWidth = 1,
  showLabels = true,
  visible = true,
  opacity = 0.6
}: BathymetryContourLayerProps) {
  if (!visible || !depths || depths.length === 0) {
    return null;
  }

  // Generate contours (this will be done by map engine)
  // This component provides the configuration

  return null; // Rendering handled by map engine
}

/**
 * Generate depth contour lines from bathymetry data
 */
export function generateDepthContours(
  depths: number[][],
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  options: {
    interval?: number;
    depths_to_contour?: number[];
  }
): GeoJSON.FeatureCollection {
  const interval = options.interval ?? 10;
  const depthsToContour = options.depths_to_contour ?? generateContourLevels(depths, interval);

  const features: GeoJSON.Feature[] = [];

  // For each contour depth level
  depthsToContour.forEach(depthLevel => {
    const contourLines = extractContourLines(depths, bounds, depthLevel);

    contourLines.forEach(line => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: line
        },
        properties: {
          depth: depthLevel,
          depthLabel: `${depthLevel}m`
        }
      });
    });
  });

  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Generate contour levels from depth range
 */
function generateContourLevels(depths: number[][], interval: number): number[] {
  // Find min and max depths
  let minDepth = Infinity;
  let maxDepth = -Infinity;

  depths.forEach(row => {
    row.forEach(depth => {
      minDepth = Math.min(minDepth, depth);
      maxDepth = Math.max(maxDepth, depth);
    });
  });

  // Generate levels at interval
  const levels: number[] = [];
  const startLevel = Math.ceil(minDepth / interval) * interval;
  const endLevel = Math.floor(maxDepth / interval) * interval;

  for (let level = startLevel; level <= endLevel; level += interval) {
    levels.push(level);
  }

  return levels;
}

/**
 * Extract contour lines for a specific depth level using marching squares
 */
function extractContourLines(
  depths: number[][],
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  },
  targetDepth: number
): Array<Array<[number, number]>> {
  const rows = depths.length;
  const cols = depths[0]?.length || 0;

  if (rows === 0 || cols === 0) return [];

  // Calculate cell size
  const latStep = (bounds.north - bounds.south) / (rows - 1);
  const lngStep = (bounds.east - bounds.west) / (cols - 1);

  const contours: Array<Array<[number, number]>> = [];

  // Marching squares algorithm (simplified)
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      // Get corners of cell
      const topLeft = depths[i][j];
      const topRight = depths[i][j + 1];
      const bottomLeft = depths[i + 1][j];
      const bottomRight = depths[i + 1][j + 1];

      // Determine which corners are above/below target depth
      const tl = topLeft >= targetDepth ? 1 : 0;
      const tr = topRight >= targetDepth ? 1 : 0;
      const bl = bottomLeft >= targetDepth ? 1 : 0;
      const br = bottomRight >= targetDepth ? 1 : 0;

      // Calculate marching squares case
      const caseIndex = tl * 8 + tr * 4 + br * 2 + bl * 1;

      // Skip if no contour in this cell
      if (caseIndex === 0 || caseIndex === 15) continue;

      // Calculate cell coordinates
      const lat1 = bounds.south + i * latStep;
      const lat2 = bounds.south + (i + 1) * latStep;
      const lng1 = bounds.west + j * lngStep;
      const lng2 = bounds.west + (j + 1) * lngStep;

      // Interpolate contour line positions (simplified)
      // In production, use proper linear interpolation

      const contourSegment: Array<[number, number]> = [];

      // Add contour segment based on case
      switch (caseIndex) {
        case 1:
        case 14:
          // Line from left to bottom
          contourSegment.push([lng1, (lat1 + lat2) / 2]);
          contourSegment.push([(lng1 + lng2) / 2, lat2]);
          break;
        case 2:
        case 13:
          // Line from bottom to right
          contourSegment.push([(lng1 + lng2) / 2, lat2]);
          contourSegment.push([lng2, (lat1 + lat2) / 2]);
          break;
        case 3:
        case 12:
          // Line from left to right
          contourSegment.push([lng1, (lat1 + lat2) / 2]);
          contourSegment.push([lng2, (lat1 + lat2) / 2]);
          break;
        case 4:
        case 11:
          // Line from top to right
          contourSegment.push([(lng1 + lng2) / 2, lat1]);
          contourSegment.push([lng2, (lat1 + lat2) / 2]);
          break;
        case 5:
          // Saddle case - two separate lines
          contourSegment.push([lng1, (lat1 + lat2) / 2]);
          contourSegment.push([(lng1 + lng2) / 2, lat1]);
          contours.push([...contourSegment]);
          contourSegment.length = 0;
          contourSegment.push([(lng1 + lng2) / 2, lat2]);
          contourSegment.push([lng2, (lat1 + lat2) / 2]);
          break;
        case 6:
        case 9:
          // Line from top to bottom
          contourSegment.push([(lng1 + lng2) / 2, lat1]);
          contourSegment.push([(lng1 + lng2) / 2, lat2]);
          break;
        case 7:
        case 8:
          // Line from left to top
          contourSegment.push([lng1, (lat1 + lat2) / 2]);
          contourSegment.push([(lng1 + lng2) / 2, lat1]);
          break;
        case 10:
          // Saddle case - two separate lines
          contourSegment.push([lng1, (lat1 + lat2) / 2]);
          contourSegment.push([(lng1 + lng2) / 2, lat2]);
          contours.push([...contourSegment]);
          contourSegment.length = 0;
          contourSegment.push([(lng1 + lng2) / 2, lat1]);
          contourSegment.push([lng2, (lat1 + lat2) / 2]);
          break;
      }

      if (contourSegment.length > 0) {
        contours.push(contourSegment);
      }
    }
  }

  return contours;
}

/**
 * Generate color scale for depth visualization
 */
export function getDepthColorScale(depth: number): string {
  // Color scale from shallow (light blue) to deep (dark blue)
  if (depth >= 0) return '#d4f1f9';      // Very shallow (positive = above water)
  if (depth >= -5) return '#ace0f0';     // Shallow
  if (depth >= -10) return '#6ec3d8';    // Moderate
  if (depth >= -20) return '#3da5c0';    // Deep
  if (depth >= -30) return '#2b8aa8';    // Deeper
  if (depth >= -50) return '#1e6f90';    // Very deep
  return '#0f5278';                       // Extremely deep
}

/**
 * Get contour line width based on depth
 */
export function getContourLineWidth(depth: number, baseWidth: number = 1): number {
  // Make major contour lines (multiples of 50m) thicker
  if (depth % 50 === 0) return baseWidth * 2;
  // Make intermediate lines (multiples of 10m) normal
  if (depth % 10 === 0) return baseWidth * 1.5;
  // Minor lines thin
  return baseWidth;
}
