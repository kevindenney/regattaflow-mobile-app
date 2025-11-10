/**
 * Tactical Current Zones Layer
 *
 * Renders tactical current zones for racing strategy:
 * - Relief lanes (favorable current corridors)
 * - Acceleration zones (current speed increase areas)
 * - Shear boundaries (current direction change lines)
 * - Lee-bow zones (tactical positioning areas)
 * - Anchoring zones (minimal current areas)
 *
 * Integrates with RaceConditionsStore and AI tactical recommendations.
 */

import React, { useMemo } from 'react';
import { useRaceConditions, selectTacticalZones } from '@/stores/raceConditionsStore';
import { getTacticalZoneColors } from '@/constants/RacingDesignSystem';
import type { TacticalZone } from '@/stores/raceConditionsStore';

export interface TacticalCurrentZonesProps {
  /** Override zones (if not using store) */
  zones?: TacticalZone[];

  /** Visibility */
  visible?: boolean;

  /** Opacity (0-1) */
  opacity?: number;

  /** Show zone labels */
  showLabels?: boolean;

  /** Show zone borders */
  showBorders?: boolean;

  /** Filter by zone type */
  filterTypes?: Array<TacticalZone['type']>;

  /** On zone click */
  onZoneClick?: (zone: TacticalZone) => void;
}

/**
 * Tactical Current Zones Layer Component
 *
 * Renders tactical zones as GeoJSON polygons on MapLibre
 */
export function TacticalCurrentZones({
  zones: propsZones,
  visible = true,
  opacity = 0.35,
  showLabels = true,
  showBorders = true,
  filterTypes,
  onZoneClick
}: TacticalCurrentZonesProps) {
  // Get zones from store if not provided via props
  const storeZones = useRaceConditions(selectTacticalZones);
  const zones = propsZones || storeZones;

  // Filter zones by type if specified
  const filteredZones = useMemo(() => {
    if (!filterTypes || filterTypes.length === 0) {
      return zones;
    }
    return zones.filter(zone => filterTypes.includes(zone.type));
  }, [zones, filterTypes]);

  // Convert to GeoJSON FeatureCollection
  const geoJSON = useMemo((): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: filteredZones.map(zone => {
        const colors = getTacticalZoneColors(zone.type);

        return {
          type: 'Feature',
          id: zone.id,
          geometry: zone.geometry,
          properties: {
            id: zone.id,
            type: zone.type,
            name: zone.name,
            description: zone.description,
            confidence: zone.confidence,
            timing: zone.timing,
            advantage: zone.advantage,
            color: colors.fill,
            borderColor: colors.border,
            opacity
          }
        };
      })
    };
  }, [filteredZones, opacity]);

  if (!visible || filteredZones.length === 0) {
    return null;
  }

  // Rendering handled by map engine
  return null;
}

/**
 * Get MapLibre layer specification for tactical zone fills
 */
export function getTacticalZoneFillLayerSpec(
  zones: TacticalZone[],
  opacity: number = 0.35
): mapboxgl.FillLayer {
  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: zones.map(zone => {
      const colors = getTacticalZoneColors(zone.type);
      return {
        type: 'Feature',
        id: zone.id,
        geometry: zone.geometry,
        properties: {
          ...zone,
          color: colors.fill,
          borderColor: colors.border
        }
      };
    })
  };

  return {
    id: 'tactical-zones-fill',
    type: 'fill',
    source: {
      type: 'geojson',
      data: geoJSON
    },
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity
    }
  };
}

/**
 * Get MapLibre layer specification for tactical zone borders
 */
export function getTacticalZoneBorderLayerSpec(
  zones: TacticalZone[]
): mapboxgl.LineLayer {
  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: zones.map(zone => {
      const colors = getTacticalZoneColors(zone.type);
      return {
        type: 'Feature',
        id: `${zone.id}-border`,
        geometry: zone.geometry,
        properties: {
          ...zone,
          borderColor: colors.border
        }
      };
    })
  };

  return {
    id: 'tactical-zones-border',
    type: 'line',
    source: {
      type: 'geojson',
      data: geoJSON
    },
    paint: {
      'line-color': ['get', 'borderColor'],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 2,
        16, 3,
        20, 4
      ],
      'line-opacity': 0.9,
      'line-dasharray': [2, 1] // Dashed border for tactical zones
    }
  };
}

/**
 * Get MapLibre layer specification for tactical zone labels
 */
export function getTacticalZoneLabelLayerSpec(
  zones: TacticalZone[]
): mapboxgl.SymbolLayer {
  // Create point features at zone centroids for labels
  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: zones.map(zone => {
      // Calculate centroid of polygon (simplified - use actual centroid calculation)
      const coords = zone.geometry.coordinates[0];
      const centroid = coords.reduce(
        (acc, coord) => [acc[0] + coord[0] / coords.length, acc[1] + coord[1] / coords.length],
        [0, 0]
      );

      return {
        type: 'Feature',
        id: `${zone.id}-label`,
        geometry: {
          type: 'Point',
          coordinates: centroid
        },
        properties: {
          name: zone.name,
          type: zone.type,
          advantage: zone.advantage || '',
          confidence: zone.confidence
        }
      };
    })
  };

  return {
    id: 'tactical-zones-label',
    type: 'symbol',
    source: {
      type: 'geojson',
      data: geoJSON
    },
    layout: {
      'text-field': [
        'concat',
        ['get', 'name'],
        '\n',
        ['get', 'advantage']
      ],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 10,
        16, 14,
        20, 18
      ],
      'text-anchor': 'center',
      'text-justify': 'center',
      'text-max-width': 8,
      'text-allow-overlap': false,
      'text-ignore-placement': false
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': '#000000',
      'text-halo-width': 2,
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['get', 'confidence'],
        0.5, 0.6,
        1.0, 1.0
      ]
    },
    minzoom: 13
  };
}

/**
 * Get MapLibre layer specification for zone confidence indicators
 */
export function getTacticalZoneConfidenceLayerSpec(
  zones: TacticalZone[]
): mapboxgl.FillLayer {
  // Create a secondary fill layer with striped pattern for low confidence zones
  const lowConfidenceZones = zones.filter(z => z.confidence < 0.7);

  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: lowConfidenceZones.map(zone => ({
      type: 'Feature',
      id: `${zone.id}-confidence`,
      geometry: zone.geometry,
      properties: {
        confidence: zone.confidence
      }
    }))
  };

  return {
    id: 'tactical-zones-confidence',
    type: 'fill',
    source: {
      type: 'geojson',
      data: geoJSON
    },
    paint: {
      'fill-color': '#ffffff',
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['get', 'confidence'],
        0.3, 0.3,
        0.7, 0.0
      ],
      'fill-pattern': 'stripes' // If pattern available, show stripes for low confidence
    }
  };
}

/**
 * Get all tactical zone layers as a group
 */
export function getAllTacticalZoneLayers(
  zones: TacticalZone[],
  options: {
    opacity?: number;
    showBorders?: boolean;
    showLabels?: boolean;
    showConfidence?: boolean;
  } = {}
): Array<mapboxgl.Layer> {
  const {
    opacity = 0.35,
    showBorders = true,
    showLabels = true,
    showConfidence = true
  } = options;

  const layers: Array<mapboxgl.Layer> = [];

  // Base fill layer
  layers.push(getTacticalZoneFillLayerSpec(zones, opacity));

  // Border layer
  if (showBorders) {
    layers.push(getTacticalZoneBorderLayerSpec(zones));
  }

  // Confidence indicator layer
  if (showConfidence) {
    layers.push(getTacticalZoneConfidenceLayerSpec(zones));
  }

  // Label layer (on top)
  if (showLabels) {
    layers.push(getTacticalZoneLabelLayerSpec(zones));
  }

  return layers;
}

/**
 * Helper: Get zones by type
 */
export function getZonesByType(
  zones: TacticalZone[],
  type: TacticalZone['type']
): TacticalZone[] {
  return zones.filter(z => z.type === type);
}

/**
 * Helper: Get high-confidence zones
 */
export function getHighConfidenceZones(
  zones: TacticalZone[],
  threshold: number = 0.7
): TacticalZone[] {
  return zones.filter(z => z.confidence >= threshold);
}

/**
 * Helper: Get zones active at specific time
 */
export function getActiveZones(
  zones: TacticalZone[],
  time: Date = new Date()
): TacticalZone[] {
  return zones.filter(zone => {
    if (!zone.timing) return true;

    const { validFrom, validUntil } = zone.timing;
    const now = time.getTime();

    if (validFrom && now < new Date(validFrom).getTime()) return false;
    if (validUntil && now > new Date(validUntil).getTime()) return false;

    return true;
  });
}

/**
 * Helper: Sort zones by advantage (highest first)
 */
export function sortZonesByAdvantage(zones: TacticalZone[]): TacticalZone[] {
  return [...zones].sort((a, b) => {
    // Extract numeric advantage if present (e.g., "+2 BL" -> 2)
    const aAdv = parseFloat(a.advantage?.match(/[+-]?[\d.]+/)?.[0] || '0');
    const bAdv = parseFloat(b.advantage?.match(/[+-]?[\d.]+/)?.[0] || '0');
    return bAdv - aAdv;
  });
}
