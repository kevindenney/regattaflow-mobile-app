/**
 * Wind Particle Layer - Web Implementation
 *
 * Renders wind flow vectors using native deck.gl layers.
 * Each wind sample becomes a short arrow coloured by speed.
 * This replaces the previous deck.gl-particle dependency which required deck.gl 8.x.
 */
import type { Layer } from '@deck.gl/core';
import { IconLayer } from '@deck.gl/layers';
import type { ParticleData } from '../../../services/visualization/EnvironmentalVisualizationService';

export interface WindParticleLayerProps {
  /** Wind particle data */
  particles: ParticleData[];

  /** Particle animation speed (0-1) */
  animationSpeed?: number;

  /** Particle age in milliseconds */
  maxAge?: number;

  /** Particle count */
  numParticles?: number;

  /** Visibility */
  visible?: boolean;

  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Wind Particle Layer Component (Web-only)
 *
 * Returns an array of deck.gl layers (arrow stems + heads) that visualise
 * wind speed and direction. Consumers can spread this into the DeckGL
 * `layers` prop or equivalent map engine integration.
 */
const ARROW_ICON = 'data:image/svg+xml;base64,' +
  btoa(
    `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 32 L40 32 L32 24 L52 32 L32 40 L40 32 L18 32 Z" fill="white" />
    </svg>`
  );

const ICON_MAPPING = {
  arrow: { x: 0, y: 0, width: 64, height: 64, mask: true },
} as const;

export function WindParticleLayer({
  particles,
  animationSpeed: _animationSpeed = 0.5,
  maxAge: _maxAge = 100,
  numParticles: _numParticles = 10000,
  visible = true,
  opacity = 0.5
}: WindParticleLayerProps): Layer[] | null {
  if (!visible || particles.length === 0) {
    return null;
  }

  const colorRange = COLOR_RANGE;
  const iconLayer = new IconLayer<ParticleData>({
    id: 'wind-direction-icons',
    data: particles,
    iconAtlas: ARROW_ICON,
    iconMapping: ICON_MAPPING,
    getIcon: () => 'arrow',
    getPosition: (particle) => [particle.lng, particle.lat],
    getAngle: (particle) => (particle.direction ?? 0),
    getSize: (particle) => 24 + Math.min(particle.speed ?? 0, 25) * 1.2,
    sizeUnits: 'pixels',
    sizeMinPixels: 12,
    sizeMaxPixels: 36,
    getColor: (particle) => [...getColorFromSpeed(particle.speed ?? 0, colorRange), Math.floor(opacity * 255)],
    billboard: true,
    pickable: false,
    parameters: { depthTest: false },
  });

  return [iconLayer];
}

const COLOR_RANGE: number[][] = [
  [56, 189, 248],   // 0-5kt: Light blue
  [34, 197, 94],    // 5-10kt: Green
  [250, 204, 21],   // 10-15kt: Yellow
  [249, 115, 22],   // 15-20kt: Orange
  [239, 68, 68]     // 20+kt: Red
];

/**
 * Get color from wind speed
 */
function getColorFromSpeed(speed: number, colorRange: number[][]): number[] {
  // Map speed to color range
  if (speed < 5) return colorRange[0];
  if (speed < 10) return colorRange[1];
  if (speed < 15) return colorRange[2];
  if (speed < 20) return colorRange[3];
  return colorRange[4];
}
