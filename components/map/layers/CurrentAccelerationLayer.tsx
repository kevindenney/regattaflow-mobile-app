/**
 * Current Acceleration Layer
 *
 * Renders current acceleration zones as colored polygon overlays on the map.
 * Shows areas where tidal current is accelerated or creates eddies.
 */

import React from 'react';
import type { OverlayPolygon } from '../../../services/visualization/EnvironmentalVisualizationService';

export interface CurrentAccelerationLayerProps {
  /** Current acceleration zone polygons */
  zones: OverlayPolygon[];

  /** Visibility */
  visible?: boolean;

  /** Opacity (0-1) */
  opacity?: number;

  /** On zone click */
  onZoneClick?: (zone: OverlayPolygon) => void;
}

/**
 * Current Acceleration Layer Component
 *
 * Renders as GeoJSON polygons on MapLibre/Cesium
 */
export function CurrentAccelerationLayer({
  zones,
  visible = true,
  opacity = 0.4,
  onZoneClick
}: CurrentAccelerationLayerProps) {
  if (!visible || zones.length === 0) {
    return null;
  }

  // Convert to GeoJSON FeatureCollection for map rendering
  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: zones.map(zone => ({
      ...zone,
      properties: {
        ...zone.properties,
        opacity
      }
    }))
  };

  // Rendering handled by map engine
  return null;
}

/**
 * Get MapLibre layer specification for current acceleration zones
 */
export function getCurrentAccelerationLayerSpec(
  zones: OverlayPolygon[],
  opacity: number = 0.4
): any {
  return {
    id: 'current-acceleration-zones',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: zones
      }
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity
    }
  };
}

/**
 * Get MapLibre layer specification for current acceleration borders
 */
export function getCurrentAccelerationBorderLayerSpec(
  zones: OverlayPolygon[]
): any {
  return {
    id: 'current-acceleration-borders',
    type: 'line',
    source: 'current-acceleration-zones', // Reuse same source
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2,
      'line-opacity': 0.9
    }
  };
}

/**
 * Get MapLibre layer specification for current eddies
 */
export function getCurrentEddyLayerSpec(
  eddies: OverlayPolygon[],
  opacity: number = 0.4
): any {
  return {
    id: 'current-eddy-zones',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: eddies
      }
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity,
      'fill-pattern': 'spiral' // If available, use spiral pattern for eddies
    }
  };
}
