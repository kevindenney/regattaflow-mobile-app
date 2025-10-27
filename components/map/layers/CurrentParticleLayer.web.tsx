/**
 * Current Particle Layer - Web Implementation
 *
 * Renders animated tidal current particles using deck.gl-particle for current flow visualization.
 * Shows current speed and direction across racing area with color-coded speeds.
 */

import React, { useMemo } from 'react';
import { ParticleLayer } from 'deck.gl-particle';
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
 */
export function CurrentParticleLayer({
  particles,
  animationSpeed = 0.3, // Slower than wind (currents are slower)
  maxAge = 150, // Longer lifetime for currents
  numParticles = 8000, // Fewer particles than wind
  visible = true,
  opacity = 0.7
}: CurrentParticleLayerProps) {
  // Convert particle data to texture format
  const particleTexture = useMemo(() => {
    return convertParticlesToTexture(particles);
  }, [particles]);

  // Create color gradient for current speeds (blue tones for water)
  const colorRange = useMemo(() => {
    return [
      [173, 216, 230],  // 0-0.5kt: Light blue
      [135, 206, 250],  // 0.5-1kt: Sky blue
      [0, 191, 255],    // 1-1.5kt: Deep sky blue
      [0, 128, 255],    // 1.5-2kt: Dodger blue
      [0, 0, 255]       // 2+kt: Blue
    ];
  }, []);

  if (!visible || particles.length === 0) {
    return null;
  }

  return (
    <ParticleLayer
      id="current-particle-layer"
      image={particleTexture}
      imageUnscale={[1, 1]}
      bounds={getBoundsFromParticles(particles)}
      animationSpeed={animationSpeed}
      maxAge={maxAge}
      numParticles={numParticles}
      opacity={opacity}
      getColorFromSpeed={(speed: number) => getColorFromSpeed(speed, colorRange)}
    />
  );
}

/**
 * Convert particle data to texture format for deck.gl-particle
 */
function convertParticlesToTexture(particles: ParticleData[]): ImageData {
  const gridSize = 100; // 100x100 grid
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const imageData = ctx.createImageData(gridSize, gridSize);

  // Get bounds
  const bounds = getBoundsFromParticles(particles);

  // Populate texture with current vectors
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const lng = bounds[0] + (x / gridSize) * (bounds[2] - bounds[0]);
      const lat = bounds[1] + (y / gridSize) * (bounds[3] - bounds[1]);

      // Find nearest particle
      const nearest = findNearestParticle(lng, lat, particles);

      if (nearest) {
        const idx = (y * gridSize + x) * 4;

        // Encode current vector in R and G channels
        const angleRad = (nearest.direction * Math.PI) / 180;
        const u = Math.sin(angleRad) * nearest.speed;
        const v = Math.cos(angleRad) * nearest.speed;

        // Normalize to 0-255 (currents are typically slower than wind)
        imageData.data[idx] = ((u + 5) / 10) * 255; // R: u component
        imageData.data[idx + 1] = ((v + 5) / 10) * 255; // G: v component
        imageData.data[idx + 2] = 0; // B: unused
        imageData.data[idx + 3] = 255; // A: opaque
      }
    }
  }

  return imageData;
}

/**
 * Get bounds from particles [west, south, east, north]
 */
function getBoundsFromParticles(particles: ParticleData[]): [number, number, number, number] {
  if (particles.length === 0) {
    return [0, 0, 0, 0];
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  particles.forEach(p => {
    minLng = Math.min(minLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLng = Math.max(maxLng, p.lng);
    maxLat = Math.max(maxLat, p.lat);
  });

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Find nearest particle to a point
 */
function findNearestParticle(lng: number, lat: number, particles: ParticleData[]): ParticleData | null {
  if (particles.length === 0) return null;

  let nearest = particles[0];
  let minDist = Infinity;

  particles.forEach(p => {
    const dist = Math.sqrt(
      Math.pow(p.lng - lng, 2) + Math.pow(p.lat - lat, 2)
    );

    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  });

  return nearest;
}

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
