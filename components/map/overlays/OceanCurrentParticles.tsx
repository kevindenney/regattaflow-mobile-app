/**
 * OceanCurrentParticles Component
 *
 * Animated particle flow visualization for ocean currents
 * Uses Storm Glass current data with real-time animation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

interface CurrentField {
  latitude: number;
  longitude: number;
  speed: number; // m/s
  direction: number; // degrees
}

interface OceanCurrentParticlesProps {
  currentData: CurrentField[];
  particleCount?: number;
  particleLifetime?: number; // seconds
  particleSpeed?: number; // multiplier for visual speed
  particleColor?: string;
  particleOpacity?: number;
}

interface Particle {
  id: number;
  lat: number;
  lon: number;
  age: number; // seconds
  maxAge: number;
  speedX: number; // degrees per second
  speedY: number;
}

/**
 * Get current vector at a specific location using interpolation
 */
function getCurrentAtLocation(
  lat: number,
  lon: number,
  currentData: CurrentField[]
): { speed: number; direction: number } {
  if (currentData.length === 0) {
    return { speed: 0, direction: 0 };
  }

  // Find nearest current data points
  let nearestPoint = currentData[0];
  let minDistance = Infinity;

  for (const point of currentData) {
    const distance = Math.sqrt(
      Math.pow(point.latitude - lat, 2) +
      Math.pow(point.longitude - lon, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
    }
  }

  return {
    speed: nearestPoint.speed,
    direction: nearestPoint.direction,
  };
}

/**
 * Convert current vector to lat/lon velocity components
 */
function currentToVelocity(
  speed: number, // m/s
  direction: number // degrees
): { vx: number; vy: number } {
  // Convert speed from m/s to degrees per second (approximate)
  const metersPerDegree = 111320; // at equator
  const speedDegPerSec = speed / metersPerDegree;

  // Convert direction to radians (0° = North, clockwise)
  const radians = (direction * Math.PI) / 180;

  return {
    vx: speedDegPerSec * Math.sin(radians), // East-West component
    vy: speedDegPerSec * Math.cos(radians), // North-South component
  };
}

/**
 * Update particle positions based on current field
 */
function updateParticles(
  particles: Particle[],
  currentData: CurrentField[],
  deltaTime: number, // seconds
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  speedMultiplier: number
): Particle[] {
  return particles.map(particle => {
    // Age the particle
    const newAge = particle.age + deltaTime;

    // Reset particle if it's too old or out of bounds
    if (
      newAge > particle.maxAge ||
      particle.lat < bounds.minLat ||
      particle.lat > bounds.maxLat ||
      particle.lon < bounds.minLon ||
      particle.lon > bounds.maxLon
    ) {
      // Respawn at random location
      return {
        ...particle,
        lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
        lon: bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon),
        age: 0,
      };
    }

    // Get current at particle location
    const current = getCurrentAtLocation(particle.lat, particle.lon, currentData);
    const velocity = currentToVelocity(current.speed, current.direction);

    // Update position
    return {
      ...particle,
      lat: particle.lat + velocity.vy * deltaTime * speedMultiplier,
      lon: particle.lon + velocity.vx * deltaTime * speedMultiplier,
      age: newAge,
      speedX: velocity.vx,
      speedY: velocity.vy,
    };
  });
}

/**
 * Initialize particles with random positions
 */
function initializeParticles(
  count: number,
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  lifetime: number
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
      lon: bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon),
      age: Math.random() * lifetime, // Stagger initial ages
      maxAge: lifetime,
      speedX: 0,
      speedY: 0,
    });
  }

  return particles;
}

/**
 * Canvas-based particle renderer for web
 */
export const OceanCurrentParticles: React.FC<OceanCurrentParticlesProps> = ({
  currentData,
  particleCount = 1000,
  particleLifetime = 5,
  particleSpeed = 50,
  particleColor = '#00FFFF',
  particleOpacity = 0.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

  // Calculate bounds from current data
  const bounds = React.useMemo(() => {
    if (currentData.length === 0) {
      return {
        minLat: 0,
        maxLat: 0,
        minLon: 0,
        maxLon: 0,
      };
    }

    return {
      minLat: Math.min(...currentData.map(d => d.latitude)) - 0.05,
      maxLat: Math.max(...currentData.map(d => d.latitude)) + 0.05,
      minLon: Math.min(...currentData.map(d => d.longitude)) - 0.05,
      maxLon: Math.max(...currentData.map(d => d.longitude)) + 0.05,
    };
  }, [currentData]);

  // Initialize particles
  useEffect(() => {
    if (currentData.length === 0) {
      return;
    }

    const initialParticles = initializeParticles(
      particleCount,
      bounds,
      particleLifetime
    );
    setParticles(initialParticles);
  }, [particleCount, particleLifetime, bounds, currentData.length]);

  // Animation loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current || particles.length === 0) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000; // Convert to seconds
      lastUpdateRef.current = now;

      // Update particle positions
      const updatedParticles = updateParticles(
        particles,
        currentData,
        deltaTime,
        bounds,
        particleSpeed
      );
      setParticles(updatedParticles);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = particleOpacity;

      for (const particle of updatedParticles) {
        // Convert lat/lon to canvas coordinates
        const x = ((particle.lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * canvas.width;
        const y = ((bounds.maxLat - particle.lat) / (bounds.maxLat - bounds.minLat)) * canvas.height;

        // Fade out based on age
        const ageFactor = 1 - (particle.age / particle.maxAge);
        ctx.globalAlpha = particleOpacity * ageFactor;

        // Draw particle as small circle
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw particle trail
        const trailLength = 10;
        const trailX = x - particle.speedX * trailLength;
        const trailY = y - particle.speedY * trailLength;

        ctx.globalAlpha = particleOpacity * ageFactor * 0.3;
        ctx.strokeStyle = particleColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, currentData, bounds, particleColor, particleOpacity, particleSpeed]);

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      width={800}
      height={600}
    />
  );
};

/**
 * Helper: Generate current field from Storm Glass data
 */
export function generateCurrentField(
  centerLat: number,
  centerLon: number,
  currentSpeed: number, // m/s
  currentDirection: number, // degrees
  gridSize: number = 5,
  variability: number = 0.2
): CurrentField[] {
  const fields: CurrentField[] = [];
  const spread = 0.05; // ~5km spread

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat + (i - gridSize / 2) * (spread / gridSize);
      const lon = centerLon + (j - gridSize / 2) * (spread / gridSize);

      // Add variability to speed and direction
      const speedVar = (Math.random() - 0.5) * variability * currentSpeed;
      const dirVar = (Math.random() - 0.5) * 30; // ±15 degrees

      fields.push({
        latitude: lat,
        longitude: lon,
        speed: Math.max(0, currentSpeed + speedVar),
        direction: (currentDirection + dirVar + 360) % 360,
      });
    }
  }

  return fields;
}
