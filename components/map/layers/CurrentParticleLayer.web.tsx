// @ts-nocheck

/**
 * Current Particle Layer - Web Implementation
 *
 * Renders tidal current flow vectors using native deck.gl layers.
 * Each current sample becomes a short arrow coloured by speed, replacing the
 * previous dependency on deck.gl-particle (which was tied to deck.gl 8.x).
 */

import type { Layer } from '@deck.gl/core';
import { IconLayer } from '@deck.gl/layers';
import type { ParticleData } from '../../../services/visualization/EnvironmentalVisualizationService';

export interface CurrentParticleLayerProps {
  /** Current particle data */
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
 * Current Particle Layer Component (Web-only)
 *
 * Returns deck.gl layers that visualise tidal currents as directional arrows.
 */
const CURRENT_ARROW_ICON = 'data:image/svg+xml;base64,' +
  btoa(
    `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 32 L40 32 L32 24 L52 32 L32 40 L40 32 L18 32 Z" fill="white" />
    </svg>`
  );

const CURRENT_ICON_MAPPING = {
  arrow: { x: 0, y: 0, width: 64, height: 64, mask: true },
} as const;

export function CurrentParticleLayer({
  particles,
  animationSpeed: _animationSpeed = 0.3,
  maxAge: _maxAge = 150,
  numParticles: _numParticles = 8000,
  visible = true,
  opacity = 0.45
}: CurrentParticleLayerProps): Layer[] | null {
  if (!visible || particles.length === 0) {
    return null;
  }

  const colorRange = COLOR_RANGE;
  const iconLayer = new IconLayer<ParticleData>({
    id: 'current-direction-icons',
    data: particles,
    iconAtlas: CURRENT_ARROW_ICON,
    iconMapping: CURRENT_ICON_MAPPING,
    getIcon: () => 'arrow',
    getPosition: (particle) => [particle.lng, particle.lat],
    getAngle: (particle) => (particle.direction ?? 0),
    getSize: (particle) => 22 + Math.min(particle.speed ?? 0, 3) * 8,
    sizeUnits: 'pixels',
    sizeMinPixels: 10,
    sizeMaxPixels: 30,
    getColor: (particle) => [...getColorFromSpeed(particle.speed ?? 0, colorRange), Math.floor(opacity * 255)],
    billboard: true,
    pickable: false,
    parameters: { depthTest: false },
  });

  return [iconLayer];
}

const COLOR_RANGE: number[][] = [
  [191, 219, 254],  // 0-0.5kt: Light blue
  [147, 197, 253],  // 0.5-1kt: Sky blue
  [96, 165, 250],   // 1-1.5kt: Blue
  [59, 130, 246],   // 1.5-2kt: Darker blue
  [37, 99, 235]     // 2+kt: Dodger blue
];

/**
 * Get color from current speed (blue tones)
 */
function getColorFromSpeed(speed: number, colorRange: number[][]): number[] {
  // Map speed to color range (currents are typically 0-3kt)
  if (speed < 0.5) return colorRange[0];
  if (speed < 1.0) return colorRange[1];
  if (speed < 1.5) return colorRange[2];
  if (speed < 2.0) return colorRange[3];
  return colorRange[4];
}
