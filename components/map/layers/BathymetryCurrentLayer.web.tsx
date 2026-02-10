/**
 * BathymetryCurrentLayer - Web Implementation
 *
 * MapLibre layer showing depth-modulated tidal currents.
 * Visualizes how current strength varies with underwater depth:
 * - Deeper channels → stronger currents (larger, darker arrows)
 * - Shallow areas → weaker currents (smaller, lighter arrows)
 * - Optional depth contour lines as background reference
 *
 * Uses native MapLibre circle + line layers for reliable rendering.
 */

import React, { useEffect, useState, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  BathymetricCurrentService,
  DepthModulatedCurrentGrid,
} from '@/services/current/BathymetricCurrentService';
import type { TideExtreme } from '@/services/tides/TidalCurrentEstimator';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BathymetryCurrentLayer');

export interface BathymetryCurrentLayerProps {
  /** MapLibre map instance */
  map: MapLibreMap | null;

  /** Center of the racing area */
  center: { lat: number; lng: number };

  /** Radius in kilometers (default 2km) */
  radiusKm?: number;

  /** Target time for current calculation */
  targetTime: Date;

  /** Show depth contour lines */
  showContours?: boolean;

  /** Show current arrows */
  showArrows?: boolean;

  /** Layer opacity (0-1) */
  opacity?: number;

  /** Layer visibility */
  visible: boolean;

  /** Optional tide extremes for better current estimation */
  tideExtremes?: { high?: TideExtreme; low?: TideExtreme };

  /** Grid spacing in meters (default 250m for performance) */
  gridSpacingM?: number;
}

/**
 * Color scale for current speed (blue tones matching plan)
 */
function getColorForSpeed(speed: number): string {
  if (speed < 0.25) return '#E0F2FE';   // Very slow - light blue
  if (speed < 0.5) return '#BAE6FD';
  if (speed < 0.75) return '#7DD3FC';   // Slow
  if (speed < 1.25) return '#38BDF8';   // Moderate
  if (speed < 1.75) return '#0EA5E9';   // Strong
  if (speed < 2.25) return '#0369A1';   // Very strong
  return '#075985';                      // Extreme - dark blue
}

/**
 * Calculate endpoint of arrow given start point, direction, and length
 */
function calculateArrowEndpoint(
  lng: number,
  lat: number,
  direction: number,
  lengthKm: number
): [number, number] {
  // Convert direction to radians (0° = North, clockwise)
  const dirRad = ((90 - direction) * Math.PI) / 180;

  // Approximate degrees per km at this latitude
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos(lat * Math.PI / 180);

  const endLng = lng + (lengthKm / kmPerDegreeLng) * Math.cos(dirRad);
  const endLat = lat + (lengthKm / kmPerDegreeLat) * Math.sin(dirRad);

  return [endLng, endLat];
}

/**
 * Depth contour configuration
 */
const DEPTH_CONTOURS = [
  { depth: 5, color: '#90CAF9', width: 1, label: '5m' },
  { depth: 10, color: '#64B5F6', width: 1.5, label: '10m' },
  { depth: 20, color: '#42A5F5', width: 2, label: '20m' },
  { depth: 50, color: '#1E88E5', width: 2, label: '50m' },
];

const LAYER_PREFIX = 'bathymetry-current';
const ARROWS_SOURCE_ID = `${LAYER_PREFIX}-arrows-source`;
const ARROWS_LINE_LAYER_ID = `${LAYER_PREFIX}-arrows-line`;
const ARROWS_HEAD_LAYER_ID = `${LAYER_PREFIX}-arrows-head`;

/**
 * BathymetryCurrentLayer Component
 */
export function BathymetryCurrentLayer({
  map,
  center,
  radiusKm = 2,
  targetTime,
  showContours = true,
  showArrows = true,
  opacity = 0.8,
  visible,
  tideExtremes,
  gridSpacingM = 250,
}: BathymetryCurrentLayerProps): React.ReactElement | null {
  const [grid, setGrid] = useState<DepthModulatedCurrentGrid | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const serviceRef = useRef<BathymetricCurrentService | null>(null);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = BathymetricCurrentService.getInstance();
    }
  }, []);

  // Fetch current grid data
  useEffect(() => {
    if (!visible || !center || !serviceRef.current) {
      setGrid(null);
      return;
    }

    let cancelled = false;

    const fetchGrid = async () => {
      setIsLoading(true);
      try {
        const result = await serviceRef.current!.generateCurrentGrid(
          center,
          radiusKm,
          targetTime,
          gridSpacingM,
          tideExtremes
        );
        if (!cancelled) {
          setGrid(result);
          logger.debug('[BathymetryCurrentLayer] Grid loaded', {
            pointCount: result.points.length,
            speedRange: [result.minSpeed, result.maxSpeed],
          });
        }
      } catch (error) {
        logger.error('[BathymetryCurrentLayer] Failed to load grid', error);
        if (!cancelled) {
          setGrid(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGrid();

    return () => {
      cancelled = true;
    };
  }, [visible, center?.lat, center?.lng, radiusKm, targetTime.getTime(), gridSpacingM]);

  // Add/update arrow layers (lines with arrow heads)
  useEffect(() => {
    if (!map || !visible || !showArrows || !grid) {
      // Clean up
      if (map) {
        if (map.getLayer(ARROWS_HEAD_LAYER_ID)) map.removeLayer(ARROWS_HEAD_LAYER_ID);
        if (map.getLayer(ARROWS_LINE_LAYER_ID)) map.removeLayer(ARROWS_LINE_LAYER_ID);
        if (map.getSource(ARROWS_SOURCE_ID)) map.removeSource(ARROWS_SOURCE_ID);
      }
      return;
    }

    // Create GeoJSON lines from grid points
    const features: GeoJSON.Feature[] = grid.points
      .filter(p => p.modulatedSpeed > 0.1) // Filter out very weak currents
      .map((point) => {
        // Arrow length proportional to speed (0.1-0.4 km)
        const arrowLength = 0.1 + Math.min(point.modulatedSpeed, 2) * 0.15;
        const endPoint = calculateArrowEndpoint(point.lng, point.lat, point.direction, arrowLength);

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [point.lng, point.lat],
              endPoint,
            ],
          },
          properties: {
            speed: point.modulatedSpeed,
            direction: point.direction,
            depth: point.depth,
            depthFactor: point.depthFactor,
            color: getColorForSpeed(point.modulatedSpeed),
            width: 2 + Math.min(point.modulatedSpeed, 2) * 1.5,
          },
        };
      });

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    // Remove existing layers/source
    if (map.getLayer(ARROWS_HEAD_LAYER_ID)) map.removeLayer(ARROWS_HEAD_LAYER_ID);
    if (map.getLayer(ARROWS_LINE_LAYER_ID)) map.removeLayer(ARROWS_LINE_LAYER_ID);
    if (map.getSource(ARROWS_SOURCE_ID)) map.removeSource(ARROWS_SOURCE_ID);

    // Add source
    map.addSource(ARROWS_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
    });

    // Add line layer for arrow shafts
    map.addLayer({
      id: ARROWS_LINE_LAYER_ID,
      type: 'line',
      source: ARROWS_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': opacity,
      },
    });

    // Add circle layer for arrow heads (at the end of lines)
    // Create separate source for arrow head points
    const headFeatures: GeoJSON.Feature[] = grid.points
      .filter(p => p.modulatedSpeed > 0.1)
      .map((point) => {
        const arrowLength = 0.1 + Math.min(point.modulatedSpeed, 2) * 0.15;
        const endPoint = calculateArrowEndpoint(point.lng, point.lat, point.direction, arrowLength);

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: endPoint,
          },
          properties: {
            speed: point.modulatedSpeed,
            color: getColorForSpeed(point.modulatedSpeed),
            radius: 3 + Math.min(point.modulatedSpeed, 2) * 2,
          },
        };
      });

    const headSourceId = `${ARROWS_SOURCE_ID}-heads`;
    if (map.getSource(headSourceId)) map.removeSource(headSourceId);

    map.addSource(headSourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: headFeatures,
      },
    });

    map.addLayer({
      id: ARROWS_HEAD_LAYER_ID,
      type: 'circle',
      source: headSourceId,
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['get', 'radius'],
        'circle-opacity': opacity,
        'circle-stroke-color': 'rgba(255,255,255,0.5)',
        'circle-stroke-width': 1,
      },
    });

    logger.debug('[BathymetryCurrentLayer] Arrow layers added', { featureCount: features.length });

    return () => {
      if (map.getLayer(ARROWS_HEAD_LAYER_ID)) map.removeLayer(ARROWS_HEAD_LAYER_ID);
      if (map.getLayer(ARROWS_LINE_LAYER_ID)) map.removeLayer(ARROWS_LINE_LAYER_ID);
      if (map.getSource(`${ARROWS_SOURCE_ID}-heads`)) map.removeSource(`${ARROWS_SOURCE_ID}-heads`);
      if (map.getSource(ARROWS_SOURCE_ID)) map.removeSource(ARROWS_SOURCE_ID);
    };
  }, [map, visible, showArrows, grid, opacity]);

  // Add depth contour lines
  useEffect(() => {
    if (!map || !visible || !showContours || !grid) {
      // Clean up contour layers
      DEPTH_CONTOURS.forEach((_, i) => {
        const layerId = `${LAYER_PREFIX}-contour-${i}`;
        const sourceId = `${LAYER_PREFIX}-contour-source-${i}`;
        if (map?.getLayer(layerId)) map.removeLayer(layerId);
        if (map?.getSource(sourceId)) map.removeSource(sourceId);
      });
      return;
    }

    // Generate contour lines from grid data
    const contourFeatures = generateContourFeatures(grid, DEPTH_CONTOURS);

    // Add each contour level as a separate layer
    contourFeatures.forEach((features, i) => {
      const contourConfig = DEPTH_CONTOURS[i];
      const layerId = `${LAYER_PREFIX}-contour-${i}`;
      const sourceId = `${LAYER_PREFIX}-contour-source-${i}`;

      // Remove existing if present
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      if (features.length > 0) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features,
          },
        });

        map.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': contourConfig.color,
            'line-width': contourConfig.width,
            'line-opacity': opacity * 0.4,
            'line-dasharray': [4, 2],
          },
        });
      }
    });

    return () => {
      DEPTH_CONTOURS.forEach((_, i) => {
        const layerId = `${LAYER_PREFIX}-contour-${i}`;
        const sourceId = `${LAYER_PREFIX}-contour-source-${i}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
    };
  }, [map, visible, showContours, grid, opacity]);

  // This component doesn't render anything directly - it adds layers to the map
  return null;
}

/**
 * Generate GeoJSON contour line features from grid data
 */
function generateContourFeatures(
  grid: DepthModulatedCurrentGrid,
  contourLevels: typeof DEPTH_CONTOURS
): GeoJSON.Feature[][] {
  const results: GeoJSON.Feature[][] = contourLevels.map(() => []);

  const { points, center } = grid;

  contourLevels.forEach((contour, levelIndex) => {
    const contourPoints: { lat: number; lng: number }[] = [];

    // Find points near the contour depth
    const tolerance = 3; // meters
    points.forEach((point) => {
      const depth = Math.abs(point.depth);
      if (Math.abs(depth - contour.depth) < tolerance) {
        contourPoints.push({ lat: point.lat, lng: point.lng });
      }
    });

    // If we have contour points, create a simplified contour line
    if (contourPoints.length >= 3) {
      // Sort points by angle from center for a rough contour ordering
      const sortedPoints = contourPoints.sort((a, b) => {
        const angleA = Math.atan2(a.lat - center.lat, a.lng - center.lng);
        const angleB = Math.atan2(b.lat - center.lat, b.lng - center.lng);
        return angleA - angleB;
      });

      // Create a line feature
      const coordinates = sortedPoints.map((p) => [p.lng, p.lat]);
      // Close the loop if points wrap around
      if (coordinates.length > 2) {
        coordinates.push(coordinates[0]);
      }

      results[levelIndex].push({
        type: 'Feature',
        properties: { depth: contour.depth, label: contour.label },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }
  });

  return results;
}

export default BathymetryCurrentLayer;
