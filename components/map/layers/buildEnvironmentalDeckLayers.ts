import type { Layer } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { VisualizationLayers } from '@/services/visualization/EnvironmentalVisualizationService';
import { WindParticleLayer } from './WindParticleLayer';
import { CurrentParticleLayer } from './CurrentParticleLayer';

export interface EnvironmentalDeckLayerOptions {
  wind?: boolean;
  current?: boolean;
  windZones?: boolean;
  currentZones?: boolean;
}

/**
 * Convert our environmental layer model into deck.gl layers so the map engine
 * can render them without re-implementing styling logic in multiple places.
 */
export function buildEnvironmentalDeckLayers(
  layers: VisualizationLayers,
  options: EnvironmentalDeckLayerOptions = {}
): Layer[] {
  const settings = {
    wind: options.wind ?? true,
    current: options.current ?? true,
    windZones: options.windZones ?? true,
    currentZones: options.currentZones ?? true,
  };

  const deckLayers: Layer[] = [];

  if (settings.wind && layers.windParticles.length > 0) {
    const windLayers = WindParticleLayer({
      particles: layers.windParticles,
      animationSpeed: 0.5,
      visible: true,
      opacity: 0.85,
    });
    if (windLayers) {
      deckLayers.push(...windLayers);
    }
  }

  if (settings.current && layers.currentParticles.length > 0) {
    const currentLayers = CurrentParticleLayer({
      particles: layers.currentParticles,
      animationSpeed: 0.3,
      visible: true,
      opacity: 0.7,
    });
    if (currentLayers) {
      deckLayers.push(...currentLayers);
    }
  }

  if (settings.windZones && layers.windShadowZones.length > 0) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'wind-shadow-zones',
        data: layers.windShadowZones,
        filled: true,
        stroked: false,
        getFillColor: (feature: any) => {
          const color = feature.properties?.color ?? '#0f172a';
          return hexToRgba(color, 160);
        },
        opacity: 0.6,
        pickable: false,
      })
    );
  }

  if (settings.currentZones && layers.currentAccelerationZones.length > 0) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'current-acceleration-zones',
        data: layers.currentAccelerationZones,
        filled: true,
        stroked: false,
        getFillColor: (feature: any) => {
          const color = feature.properties?.color ?? '#0284c7';
          return hexToRgba(color, 140);
        },
        opacity: 0.5,
        pickable: false,
      })
    );
  }

  if (settings.currentZones && layers.currentEddyZones.length > 0) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'current-eddy-zones',
        data: layers.currentEddyZones,
        filled: true,
        stroked: false,
        getFillColor: (feature: any) => {
          const color = feature.properties?.color ?? '#0ea5e9';
          return hexToRgba(color, 120);
        },
        opacity: 0.45,
        pickable: false,
      })
    );
  }

  if (settings.windZones && layers.windAccelerationZones.length > 0) {
    deckLayers.push(
      new GeoJsonLayer({
        id: 'wind-acceleration-zones',
        data: layers.windAccelerationZones,
        filled: true,
        stroked: false,
        getFillColor: (feature: any) => {
          const color = feature.properties?.color ?? '#22c55e';
          return hexToRgba(color, 120);
        },
        opacity: 0.45,
        pickable: false,
      })
    );
  }

  return deckLayers;
}

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed.length === 3 ? parsed.repeat(2) : parsed, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b, Math.max(0, Math.min(255, alpha))];
}
