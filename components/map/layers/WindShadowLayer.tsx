/**
 * Wind Shadow Layer
 *
 * Renders wind shadow zones as colored polygon overlays on the map.
 * Shows areas where wind is reduced by buildings or terrain obstacles.
 */

import React from 'react';
import type { OverlayPolygon } from '../../../services/visualization/EnvironmentalVisualizationService';

export interface WindShadowLayerProps {
  /** Wind shadow zone polygons */
  shadows: OverlayPolygon[];

  /** Visibility */
  visible?: boolean;

  /** Opacity (0-1) */
  opacity?: number;

  /** On shadow zone click */
  onZoneClick?: (shadow: OverlayPolygon) => void;
}

/**
 * Wind Shadow Layer Component
 *
 * Renders as GeoJSON polygons on MapLibre/Cesium
 */
export function WindShadowLayer({
  shadows,
  visible = true,
  opacity = 0.5,
  onZoneClick
}: WindShadowLayerProps) {
  if (!visible || shadows.length === 0) {
    return null;
  }

  // Convert to GeoJSON FeatureCollection for map rendering
  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: shadows.map(shadow => ({
      ...shadow,
      properties: {
        ...shadow.properties,
        opacity
      }
    }))
  };

  // This component will be rendered by MapLibre/Cesium as a GeoJSON layer
  // The actual rendering is handled by the map engine

  return null; // Rendering handled by map engine
}

/**
 * Get MapLibre layer specification for wind shadows
 */
export function getWindShadowLayerSpec(
  shadows: OverlayPolygon[],
  opacity: number = 0.5
): any {
  return {
    id: 'wind-shadow-zones',
    type: 'fill',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: shadows
      }
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity
    }
  };
}

/**
 * Get MapLibre layer specification for wind shadow borders
 */
export function getWindShadowBorderLayerSpec(
  shadows: OverlayPolygon[]
): any {
  return {
    id: 'wind-shadow-borders',
    type: 'line',
    source: 'wind-shadow-zones', // Reuse same source
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2,
      'line-opacity': 0.8
    }
  };
}
