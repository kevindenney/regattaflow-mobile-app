/**
 * Professional 3D Weather Overlay System - OnX Maps Style
 * Advanced weather visualization for sailing race strategy
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type {
  GeoLocation,
  BoundingBox,
  AdvancedWeatherConditions,
  TidalCurrent
} from '@/lib/types/advanced-map';
import { ProfessionalWeatherService } from '@/services/weather/ProfessionalWeatherService';

interface WeatherOverlay3DProps {
  bounds: BoundingBox;
  venue: string;
  showWindField: boolean;
  showWindBarbs: boolean;
  showCurrentArrows: boolean;
  showPressure: boolean;
  showWaveHeight: boolean;
  weatherData?: AdvancedWeatherConditions;
  onWeatherUpdate?: (weather: AdvancedWeatherConditions) => void;
}

export function WeatherOverlay3D({
  bounds,
  venue,
  showWindField = true,
  showWindBarbs = true,
  showCurrentArrows = true,
  showPressure = false,
  showWaveHeight = false,
  weatherData,
  onWeatherUpdate
}: WeatherOverlay3DProps) {
  const [currentWeather, setCurrentWeather] = useState<AdvancedWeatherConditions | null>(weatherData || null);
  const [windField, setWindField] = useState<WindFieldData[]>([]);
  const [tidalCurrents, setTidalCurrents] = useState<TidalCurrent[]>([]);
  const [loading, setLoading] = useState(false);

  const weatherService = useRef(new ProfessionalWeatherService());

  useEffect(() => {
    loadWeatherData();

    // Set up real-time updates every 15 minutes
    const interval = setInterval(loadWeatherData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [bounds, venue]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);

      // Get comprehensive weather data
      const weather = await weatherService.current.getAdvancedWeatherData(
        bounds.north + (bounds.north - bounds.south) / 2, // Center latitude
        bounds.west + (bounds.east - bounds.west) / 2,    // Center longitude
        venue
      );

      setCurrentWeather(weather);
      onWeatherUpdate?.(weather);

      // Generate wind field grid
      const windGrid = generateWindField(bounds, weather);
      setWindField(windGrid);

      // Get tidal current data
      const currents = await weatherService.current.getTidalCurrents(bounds);
      setTidalCurrents(currents);

      console.log('🌤️ Weather overlay updated:', {
        wind: `${weather.wind.speed}kts @ ${weather.wind.direction}°`,
        pressure: `${weather.pressure.sealevel}mb`,
        confidence: `${Math.round(weather.forecast.confidence * 100)}%`,
        windFieldPoints: windGrid.length,
        currentPoints: currents.length
      });

    } catch (error) {
      console.error('❌ Failed to load weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <group>
      {/* 3D Wind Particles */}
      {showWindField && windField.length > 0 && (
        <WindParticleSystem
          windField={windField}
          bounds={bounds}
          intensity={currentWeather?.wind.speed || 0}
        />
      )}

      {/* Wind Barbs (3D Floating) */}
      {showWindBarbs && currentWeather && (
        <WindBarbs3D
          weather={currentWeather}
          bounds={bounds}
        />
      )}

      {/* Tidal Current Arrows */}
      {showCurrentArrows && tidalCurrents.length > 0 && (
        <TidalCurrentArrows3D
          currents={tidalCurrents}
          bounds={bounds}
        />
      )}

      {/* Pressure Field Visualization */}
      {showPressure && currentWeather && (
        <PressureField3D
          weather={currentWeather}
          bounds={bounds}
        />
      )}

      {/* Wave Height Visualization */}
      {showWaveHeight && currentWeather && (
        <WaveHeightField3D
          weather={currentWeather}
          bounds={bounds}
        />
      )}
    </group>
  );
}

// Wind Field Data Structure
interface WindFieldData {
  position: GeoLocation;
  velocity: {
    u: number; // East-West component (m/s)
    v: number; // North-South component (m/s)
    speed: number; // Total speed (knots)
    direction: number; // Direction (degrees)
  };
}

// Generate wind field grid from weather data
function generateWindField(bounds: BoundingBox, weather: AdvancedWeatherConditions): WindFieldData[] {
  const gridPoints: WindFieldData[] = [];
  const gridSpacing = 0.01; // Degrees (roughly 1km)

  for (let lat = bounds.south; lat <= bounds.north; lat += gridSpacing) {
    for (let lng = bounds.west; lng <= bounds.east; lng += gridSpacing) {
      // Add some realistic wind variation
      const windVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const directionVariation = (Math.random() - 0.5) * 20; // ±10° variation

      const speed = weather.wind.speed * (1 + windVariation);
      const direction = weather.wind.direction + directionVariation;

      // Convert to u/v components
      const radians = (direction * Math.PI) / 180;
      const u = speed * Math.sin(radians) * 0.51444; // Convert knots to m/s
      const v = speed * Math.cos(radians) * 0.51444;

      gridPoints.push({
        position: { latitude: lat, longitude: lng },
        velocity: { u, v, speed, direction }
      });
    }
  }

  return gridPoints;
}

// 3D Wind Particle System Component
function WindParticleSystem({
  windField,
  bounds,
  intensity
}: {
  windField: WindFieldData[];
  bounds: BoundingBox;
  intensity: number;
}) {
  const particlesRef = useRef<THREE.Points>();
  const [particles] = useState(() => new Float32Array(windField.length * 3));
  const [velocities] = useState(() => new Float32Array(windField.length * 3));
  const [colors] = useState(() => new Float32Array(windField.length * 3));

  // Initialize particles
  useEffect(() => {
    windField.forEach((point, i) => {
      const x = ((point.position.longitude - bounds.west) / (bounds.east - bounds.west)) * 100 - 50;
      const z = ((bounds.north - point.position.latitude) / (bounds.north - bounds.south)) * 100 - 50;
      const y = 5 + Math.random() * 15; // Height variation

      particles[i * 3] = x;
      particles[i * 3 + 1] = y;
      particles[i * 3 + 2] = z;

      // Store velocity
      velocities[i * 3] = point.velocity.u * 0.1;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = -point.velocity.v * 0.1;

      // Color based on wind speed
      const normalizedSpeed = Math.min(point.velocity.speed / 25, 1);
      colors[i * 3] = normalizedSpeed; // Red
      colors[i * 3 + 1] = 0.5; // Green
      colors[i * 3 + 2] = 1 - normalizedSpeed; // Blue
    });
  }, [windField, bounds]);

  // Animate particles
  useFrame((state, delta) => {
    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      // Update position based on velocity
      positions[i] += velocities[i] * delta;
      positions[i + 2] += velocities[i + 2] * delta;

      // Wrap around boundaries
      if (positions[i] > 50) positions[i] = -50;
      if (positions[i] < -50) positions[i] = 50;
      if (positions[i + 2] > 50) positions[i + 2] = -50;
      if (positions[i + 2] < -50) positions[i + 2] = 50;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [particles, colors]);

  return (
    <points ref={particlesRef} geometry={particleGeometry}>
      <pointsMaterial
        size={1.5}
        vertexColors
        transparent
        opacity={Math.min(intensity / 20, 0.8)}
        sizeAttenuation={true}
      />
    </points>
  );
}

// 3D Wind Barbs Component
function WindBarbs3D({
  weather,
  bounds
}: {
  weather: AdvancedWeatherConditions;
  bounds: BoundingBox;
}) {
  const windBarbs = useMemo(() => {
    const barbs = [];
    const spacing = 10; // Grid spacing in local coordinates

    for (let x = -40; x <= 40; x += spacing) {
      for (let z = -40; z <= 40; z += spacing) {
        barbs.push({
          position: [x, 15, z] as [number, number, number],
          speed: weather.wind.speed,
          direction: weather.wind.direction
        });
      }
    }

    return barbs;
  }, [weather.wind, bounds]);

  return (
    <group>
      {windBarbs.map((barb, index) => (
        <WindBarb3D
          key={index}
          position={barb.position}
          speed={barb.speed}
          direction={barb.direction}
        />
      ))}
    </group>
  );
}

// Individual 3D Wind Barb Component
function WindBarb3D({
  position,
  speed,
  direction
}: {
  position: [number, number, number];
  speed: number;
  direction: number;
}) {
  const groupRef = useRef<THREE.Group>();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = (direction * Math.PI) / 180;
    }
  });

  // Create wind barb geometry
  const barbGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Main shaft
    vertices.push(0, 0, 0, 0, 0, 2);

    // Add barbs based on wind speed
    const fullBarbs = Math.floor(speed / 10);
    const halfBarb = (speed % 10) >= 5;

    for (let i = 0; i < fullBarbs; i++) {
      const y = 1.5 - i * 0.3;
      vertices.push(0, 0, y, 0.5, 0, y + 0.3);
    }

    if (halfBarb) {
      const y = 1.5 - fullBarbs * 0.3;
      vertices.push(0, 0, y, 0.25, 0, y + 0.15);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [speed]);

  return (
    <group ref={groupRef} position={position}>
      <line geometry={barbGeometry}>
        <lineBasicMaterial color="#FF6B35" linewidth={2} />
      </line>

      {/* Wind speed label */}
      <Billboard position={[0, 1, 0]}>
        <Text
          fontSize={0.8}
          color="#FF6B35"
          anchorX="center"
          anchorY="middle"
        >
          {speed.toFixed(0)}kt
        </Text>
      </Billboard>
    </group>
  );
}

// Tidal Current Arrows 3D Component
function TidalCurrentArrows3D({
  currents,
  bounds
}: {
  currents: TidalCurrent[];
  bounds: BoundingBox;
}) {
  return (
    <group>
      {currents.map((current, index) => {
        const x = ((current.location.longitude - bounds.west) / (bounds.east - bounds.west)) * 100 - 50;
        const z = ((bounds.north - current.location.latitude) / (bounds.north - bounds.south)) * 100 - 50;

        return (
          <TidalCurrentArrow3D
            key={index}
            position={[x, 2, z]}
            speed={current.speed}
            direction={current.direction}
            type={current.type}
          />
        );
      })}
    </group>
  );
}

// Individual Tidal Current Arrow Component
function TidalCurrentArrow3D({
  position,
  speed,
  direction,
  type
}: {
  position: [number, number, number];
  speed: number;
  direction: number;
  type: 'flood' | 'ebb' | 'slack';
}) {
  const arrowRef = useRef<THREE.Group>();

  const color = useMemo(() => {
    switch (type) {
      case 'flood': return '#00A651'; // Green for flooding tide
      case 'ebb': return '#FF6B35';   // Orange for ebbing tide
      case 'slack': return '#666666'; // Gray for slack water
      default: return '#0066CC';
    }
  }, [type]);

  useFrame(() => {
    if (arrowRef.current) {
      arrowRef.current.rotation.y = (direction * Math.PI) / 180;
    }
  });

  const arrowGeometry = useMemo(() => {
    const length = Math.max(speed * 2, 0.5);
    const geometry = new THREE.ConeGeometry(0.3, length, 8);
    return geometry;
  }, [speed]);

  return (
    <group ref={arrowRef} position={position}>
      <mesh geometry={arrowGeometry} rotation={[Math.PI / 2, 0, 0]}>
        <meshLambertMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Current speed label */}
      <Billboard position={[0, 2, 0]}>
        <Text
          fontSize={0.6}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {speed.toFixed(1)}kt
        </Text>
      </Billboard>
    </group>
  );
}

// Pressure Field 3D Component
function PressureField3D({
  weather,
  bounds
}: {
  weather: AdvancedWeatherConditions;
  bounds: BoundingBox;
}) {
  const pressureMesh = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 20, 20);
    const pressure = weather.pressure.sealevel;

    // Color based on pressure (high = red, low = blue)
    const normalizedPressure = Math.min(Math.max((pressure - 980) / 60, 0), 1);
    const color = new THREE.Color().setHSL(0.7 - normalizedPressure * 0.7, 0.8, 0.5);

    return { geometry, color };
  }, [weather.pressure, bounds]);

  return (
    <mesh geometry={pressureMesh.geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <meshLambertMaterial
        color={pressureMesh.color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Wave Height Field 3D Component
function WaveHeightField3D({
  weather,
  bounds
}: {
  weather: AdvancedWeatherConditions;
  bounds: BoundingBox;
}) {
  const waveGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const positions = geometry.attributes.position.array as Float32Array;
    const waveHeight = weather.waves?.height || 0;

    // Create wave pattern
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];

      // Generate realistic wave pattern
      const wave = Math.sin(x * 0.1) * Math.cos(z * 0.1) * waveHeight;
      positions[i + 1] = wave;
    }

    geometry.computeVertexNormals();
    return geometry;
  }, [weather.waves, bounds]);

  return (
    <mesh geometry={waveGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <meshLambertMaterial
        color="#87CEEB"
        transparent
        opacity={0.6}
        wireframe={true}
      />
    </mesh>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WeatherOverlay3D;