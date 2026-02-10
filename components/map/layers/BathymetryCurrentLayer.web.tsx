/**
 * BathymetryCurrentLayer - Web Implementation
 *
 * MapLibre layer showing real bathymetry from Open Topo Data GEBCO
 * and depth-modulated tidal currents.
 *
 * Features:
 * - Real bathymetry visualization (darker blue = deeper)
 * - Coastal shallow water depths (0-50m) - perfect for sailing
 * - Depth-modulated current arrows (stronger in deeper channels)
 * - ~450m resolution globally
 *
 * Data sources:
 * - Primary: Open Topo Data GEBCO (https://www.opentopodata.org/) - free, global coverage
 * - Visual fallback: GEBCO WMS tiles (when API not available)
 */

import React, { useEffect, useState, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import {
  BathymetricCurrentService,
  DepthModulatedCurrentGrid,
} from '@/services/current/BathymetricCurrentService';
import { BathymetryService } from '@/services/weather/BathymetryService';
import type { TideExtreme } from '@/services/tides/TidalCurrentEstimator';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BathymetryCurrentLayer');

export interface BathymetryCurrentLayerProps {
  /** MapLibre map instance */
  map: MapLibreMap | null;

  /** Center of the racing area */
  center: { lat: number; lng: number };

  /** Radius in kilometers (default 5km for 10km x 10km coverage) */
  radiusKm?: number;

  /** Target time for current calculation */
  targetTime: Date;

  /** Show depth visualization */
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

const LAYER_PREFIX = 'bathymetry-current';
const ARROWS_SOURCE_ID = `${LAYER_PREFIX}-arrows-source`;
const ARROWS_LINE_LAYER_ID = `${LAYER_PREFIX}-arrows-line`;

/**
 * Safely check if a MapLibre map instance is still valid and not destroyed
 * Returns false if the map is null, undefined, or has been destroyed
 */
function isMapValid(map: MapLibreMap | null | undefined): map is MapLibreMap {
  if (!map) return false;
  try {
    // getStyle() returns null if the map is destroyed
    return map.getStyle() !== null;
  } catch {
    return false;
  }
}

// Stormglass bathymetry layer IDs
const DEPTH_SOURCE_ID = `${LAYER_PREFIX}-depth-source`;
const DEPTH_LABELS_LAYER_ID = `${LAYER_PREFIX}-depth-labels`;

// OpenSeaMap nautical overlay (buoys, beacons, landmarks)
const SEAMARK_SOURCE_ID = `${LAYER_PREFIX}-seamark-source`;
const SEAMARK_LAYER_ID = `${LAYER_PREFIX}-seamark-layer`;
const OPENSEAMAP_TILES_URL = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png';

// GEBCO bathymetry fallback (when Stormglass quota exceeded)
const GEBCO_SOURCE_ID = `${LAYER_PREFIX}-gebco-source`;
const GEBCO_LAYER_ID = `${LAYER_PREFIX}-gebco-layer`;
const GEBCO_WMS_URL = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?' +
  'request=GetMap&service=WMS&version=1.3.0&layers=GEBCO_LATEST&' +
  'crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png';

// Elevation grid type
interface ElevationGrid {
  points: Array<{ lat: number; lng: number; elevation: number; depth: number }>;
  bounds: { north: number; south: number; east: number; west: number };
  center: { latitude: number; longitude: number };
  minDepth: number;
  maxDepth: number;
}

/**
 * BathymetryCurrentLayer Component
 */
export function BathymetryCurrentLayer({
  map,
  center,
  radiusKm = 5,
  targetTime,
  showContours = true,
  showArrows = true,
  opacity = 0.8,
  visible,
  tideExtremes,
  gridSpacingM = 250,
}: BathymetryCurrentLayerProps): React.ReactElement | null {
  const [grid, setGrid] = useState<DepthModulatedCurrentGrid | null>(null);
  const [elevationGrid, setElevationGrid] = useState<ElevationGrid | null>(null);
  const [isLoadingDepth, setIsLoadingDepth] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const serviceRef = useRef<BathymetricCurrentService | null>(null);
  const bathymetryRef = useRef<BathymetryService | null>(null);

  // Initialize services
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = BathymetricCurrentService.getInstance();
    }
    if (!bathymetryRef.current) {
      bathymetryRef.current = BathymetryService.getInstance();
      console.log('[BathymetryCurrentLayer] Bathymetry service initialized');
    }
  }, []);

  // Fetch current grid data (for current arrows)
  useEffect(() => {
    if (!visible || !center || !serviceRef.current) {
      setGrid(null);
      return;
    }

    let cancelled = false;

    const fetchGrid = async () => {
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
          logger.debug('[BathymetryCurrentLayer] Current grid loaded', {
            pointCount: result.points.length,
            speedRange: [result.minSpeed, result.maxSpeed],
          });
        }
      } catch (error) {
        logger.error('[BathymetryCurrentLayer] Failed to load current grid', error);
        if (!cancelled) {
          setGrid(null);
        }
      }
    };

    fetchGrid();

    return () => {
      cancelled = true;
    };
  }, [visible, center?.lat, center?.lng, radiusKm, targetTime.getTime(), gridSpacingM]);

  // Fetch elevation grid data (for depth visualization)
  useEffect(() => {
    console.log('[BathymetryCurrentLayer] Depth effect triggered:', {
      visible,
      showContours,
      hasCenter: !!center,
      hasBathymetry: !!bathymetryRef.current,
    });

    if (!visible || !showContours || !center || !bathymetryRef.current) {
      setElevationGrid(null);
      return;
    }

    let cancelled = false;

    const fetchElevation = async () => {
      setIsLoadingDepth(true);
      console.log('[BathymetryCurrentLayer] Fetching elevation grid for:', center, 'radius:', radiusKm);
      try {
        // Use 10x10 grid = 100 points for good coverage
        const result = await bathymetryRef.current!.getElevationGrid(
          { latitude: center.lat, longitude: center.lng },
          radiusKm,
          10 // 10x10 grid = 100 points
        );
        if (!cancelled) {
          // Log detailed result for debugging
          const waterPoints = result.points.filter(p => p.depth > 0);
          console.log('[BathymetryCurrentLayer] Elevation grid loaded:', {
            totalPoints: result.points.length,
            waterPoints: waterPoints.length,
            depthRange: [result.minDepth, result.maxDepth],
            sampleDepths: result.points.slice(0, 5).map(p => p.depth),
          });

          // Check if all points returned 0 depth (no water data for this location)
          if (waterPoints.length === 0 && result.points.length > 0) {
            console.warn('[BathymetryCurrentLayer] All depth values are 0 - location may be on land or API issue, using GEBCO fallback');
            setQuotaExceeded(true);
            setElevationGrid(null);
          } else {
            setQuotaExceeded(false);
            setElevationGrid(result);
          }
        }
      } catch (error) {
        console.error('[BathymetryCurrentLayer] Failed to load elevation grid:', error);
        if (!cancelled) {
          setQuotaExceeded(true);
          setElevationGrid(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDepth(false);
        }
      }
    };

    fetchElevation();

    return () => {
      cancelled = true;
    };
  }, [visible, showContours, center?.lat, center?.lng, radiusKm]);

  // Add OpenSeaMap nautical overlay (buoys, beacons, lighthouses, etc.)
  // This is always visible when the layer is visible, independent of depth toggle
  useEffect(() => {
    if (!map || !visible) {
      // Clean up seamark layer
      if (isMapValid(map)) {
        if (map.getLayer(SEAMARK_LAYER_ID)) map.removeLayer(SEAMARK_LAYER_ID);
        if (map.getSource(SEAMARK_SOURCE_ID)) map.removeSource(SEAMARK_SOURCE_ID);
      }
      return;
    }

    // Remove existing if present
    if (map.getLayer(SEAMARK_LAYER_ID)) map.removeLayer(SEAMARK_LAYER_ID);
    if (map.getSource(SEAMARK_SOURCE_ID)) map.removeSource(SEAMARK_SOURCE_ID);

    // Add OpenSeaMap seamark tiles as raster source
    map.addSource(SEAMARK_SOURCE_ID, {
      type: 'raster',
      tiles: [OPENSEAMAP_TILES_URL],
      tileSize: 256,
      attribution: '© <a href="https://www.openseamap.org">OpenSeaMap</a>',
    });

    // Add seamark layer on top
    map.addLayer({
      id: SEAMARK_LAYER_ID,
      type: 'raster',
      source: SEAMARK_SOURCE_ID,
      paint: {
        'raster-opacity': 0.9,
      },
    });

    logger.debug('[BathymetryCurrentLayer] OpenSeaMap seamark overlay added');

    return () => {
      if (!isMapValid(map)) return;
      if (map.getLayer(SEAMARK_LAYER_ID)) map.removeLayer(SEAMARK_LAYER_ID);
      if (map.getSource(SEAMARK_SOURCE_ID)) map.removeSource(SEAMARK_SOURCE_ID);
    };
  }, [map, visible]); // Independent of showContours - nautical overlay always visible

  // Add GEBCO bathymetry raster as fallback when data not available
  useEffect(() => {
    if (!map || !visible || !showContours) {
      // Clean up GEBCO layer
      if (isMapValid(map)) {
        if (map.getLayer(GEBCO_LAYER_ID)) map.removeLayer(GEBCO_LAYER_ID);
        if (map.getSource(GEBCO_SOURCE_ID)) map.removeSource(GEBCO_SOURCE_ID);
      }
      return;
    }

    // Only show GEBCO when data not available
    if (!quotaExceeded) {
      // Clean up GEBCO layer if data is fine
      if (map.getLayer(GEBCO_LAYER_ID)) map.removeLayer(GEBCO_LAYER_ID);
      if (map.getSource(GEBCO_SOURCE_ID)) map.removeSource(GEBCO_SOURCE_ID);
      return;
    }

    console.log('[BathymetryCurrentLayer] Adding GEBCO bathymetry fallback layer');

    // Remove existing if present
    if (map.getLayer(GEBCO_LAYER_ID)) map.removeLayer(GEBCO_LAYER_ID);
    if (map.getSource(GEBCO_SOURCE_ID)) map.removeSource(GEBCO_SOURCE_ID);

    // Add GEBCO WMS as raster source
    map.addSource(GEBCO_SOURCE_ID, {
      type: 'raster',
      tiles: [GEBCO_WMS_URL],
      tileSize: 256,
      attribution: '© <a href="https://www.gebco.net">GEBCO</a>',
    });

    // Add GEBCO layer (below seamarks)
    // Find seamark layer to insert before it
    const beforeLayer = map.getLayer(SEAMARK_LAYER_ID) ? SEAMARK_LAYER_ID : undefined;

    map.addLayer({
      id: GEBCO_LAYER_ID,
      type: 'raster',
      source: GEBCO_SOURCE_ID,
      paint: {
        'raster-opacity': 0.5,
      },
    }, beforeLayer);

    console.log('[BathymetryCurrentLayer] GEBCO bathymetry fallback layer added');

    return () => {
      if (!isMapValid(map)) return;
      if (map.getLayer(GEBCO_LAYER_ID)) map.removeLayer(GEBCO_LAYER_ID);
      if (map.getSource(GEBCO_SOURCE_ID)) map.removeSource(GEBCO_SOURCE_ID);
    };
  }, [map, visible, showContours, quotaExceeded]);

  // Add/update depth labels (numbers only, no circles)
  useEffect(() => {
    if (!map || !visible || !showContours || !elevationGrid) {
      // Clean up depth layers
      if (isMapValid(map)) {
        if (map.getLayer(DEPTH_LABELS_LAYER_ID)) map.removeLayer(DEPTH_LABELS_LAYER_ID);
        if (map.getSource(DEPTH_SOURCE_ID)) map.removeSource(DEPTH_SOURCE_ID);
      }
      return;
    }

    // Create GeoJSON features for depth points (numbers only)
    const features: GeoJSON.Feature[] = elevationGrid.points
      .filter(p => p.depth > 0) // Only show water (depth > 0)
      .map((point) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng, point.lat],
        },
        properties: {
          depth: point.depth,
          // Show depth as integer, like nautical charts
          label: `${Math.round(point.depth)}`,
        },
      }));

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    // Remove existing layers/source
    if (map.getLayer(DEPTH_LABELS_LAYER_ID)) map.removeLayer(DEPTH_LABELS_LAYER_ID);
    if (map.getSource(DEPTH_SOURCE_ID)) map.removeSource(DEPTH_SOURCE_ID);

    // Add source
    map.addSource(DEPTH_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
    });

    // Add depth labels only (no circles) - like nautical chart soundings
    map.addLayer({
      id: DEPTH_LABELS_LAYER_ID,
      type: 'symbol',
      source: DEPTH_SOURCE_ID,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 9,   // Small at low zoom
          12, 11,
          14, 13,  // Larger at high zoom
        ],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-allow-overlap': false,
        'text-padding': 2,
      },
      paint: {
        // Blue color like nautical chart depth soundings
        'text-color': '#1565C0',
        'text-halo-color': 'rgba(255, 255, 255, 0.95)',
        'text-halo-width': 1.5,
        'text-opacity': opacity,
      },
    });

    logger.debug('[BathymetryCurrentLayer] Depth labels added', {
      featureCount: features.length,
      depthRange: [elevationGrid.minDepth, elevationGrid.maxDepth],
    });

    return () => {
      if (!isMapValid(map)) return;
      if (map.getLayer(DEPTH_LABELS_LAYER_ID)) map.removeLayer(DEPTH_LABELS_LAYER_ID);
      if (map.getSource(DEPTH_SOURCE_ID)) map.removeSource(DEPTH_SOURCE_ID);
    };
  }, [map, visible, showContours, elevationGrid, opacity]);

  // Add/update current arrow layers (simple lines showing current direction)
  useEffect(() => {
    if (!map || !visible || !showArrows || !grid) {
      // Clean up
      if (isMapValid(map)) {
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
    if (map.getLayer(ARROWS_LINE_LAYER_ID)) map.removeLayer(ARROWS_LINE_LAYER_ID);
    if (map.getSource(ARROWS_SOURCE_ID)) map.removeSource(ARROWS_SOURCE_ID);

    // Add source
    map.addSource(ARROWS_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
    });

    // Add line layer for current arrows (simple lines, no circle heads)
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
        'line-opacity': opacity * 0.7, // Slightly transparent to reduce clutter
      },
    });

    logger.debug('[BathymetryCurrentLayer] Arrow layers added', { featureCount: features.length });

    return () => {
      if (!isMapValid(map)) return;
      if (map.getLayer(ARROWS_LINE_LAYER_ID)) map.removeLayer(ARROWS_LINE_LAYER_ID);
      if (map.getSource(ARROWS_SOURCE_ID)) map.removeSource(ARROWS_SOURCE_ID);
    };
  }, [map, visible, showArrows, grid, opacity]);

  // This component doesn't render anything directly - it adds layers to the map
  return null;
}

export default BathymetryCurrentLayer;
