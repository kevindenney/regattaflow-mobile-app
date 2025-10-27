/**
 * Current Particle Layer - Native Implementation
 *
 * Simplified current visualization for mobile using React Native
 * Shows current vectors as colored arrows instead of animated particles
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
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
 * Current Particle Layer Component (Native - simplified)
 */
export function CurrentParticleLayer({
  particles,
  visible = true,
  opacity = 0.7
}: CurrentParticleLayerProps) {
  if (!visible || particles.length === 0) {
    return null;
  }

  // On mobile, render through MapLibre Native's custom layer API
  return (
    <View style={[styles.container, { opacity }]}>
      {/* Placeholder for native current visualization */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none'
  }
});

/**
 * Helper: Convert particles to current vector arrows for MapLibre
 */
export function convertParticlesToVectors(particles: ParticleData[]) {
  return particles.map(p => ({
    coordinates: [p.lng, p.lat],
    direction: p.direction,
    speed: p.speed,
    color: getColorFromSpeed(p.speed)
  }));
}

/**
 * Get color from current speed (blue tones for water)
 */
function getColorFromSpeed(speed: number): string {
  if (speed < 0.5) return '#add8e6'; // Light blue
  if (speed < 1.0) return '#87ceeb'; // Sky blue
  if (speed < 1.5) return '#00bfff'; // Deep sky blue
  if (speed < 2.0) return '#0080ff'; // Dodger blue
  return '#0000ff'; // Blue
}
