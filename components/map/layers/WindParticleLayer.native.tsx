/**
 * Wind Particle Layer - Native Implementation
 *
 * Simplified wind visualization for mobile using React Native
 * Shows wind vectors as colored arrows instead of animated particles
 * (animated particles are too performance-intensive for mobile)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
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
 * Wind Particle Layer Component (Native - simplified)
 *
 * Note: Full particle animation is too performance-intensive for mobile.
 * This implementation uses static wind vectors or integration with
 * MapLibre Native's custom layer API.
 */
export function WindParticleLayer({
  particles,
  visible = true,
  opacity = 0.8
}: WindParticleLayerProps) {
  if (!visible || particles.length === 0) {
    return null;
  }

  // On mobile, we'll render this through MapLibre Native's custom layer API
  // or use vector arrows instead of animated particles
  // This is a placeholder that will be enhanced with native map integration

  return (
    <View style={[styles.container, { opacity }]}>
      {/* Placeholder for native wind visualization */}
      {/* In production, this would integrate with MapLibre Native's */}
      {/* custom layer API to render wind vectors */}
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
 * Helper: Convert particles to wind vector arrows for MapLibre
 * This will be used when integrating with MapLibre Native
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
 * Get color from wind speed
 */
function getColorFromSpeed(speed: number): string {
  if (speed < 5) return '#0080ff'; // Light blue
  if (speed < 10) return '#00ff80'; // Green
  if (speed < 15) return '#ffff00'; // Yellow
  if (speed < 20) return '#ff8000'; // Orange
  return '#ff0000'; // Red
}
