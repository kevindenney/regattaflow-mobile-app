/**
 * Simplified Weather Overlay System
 * Static, single arrows for wind, tide, and waves - no animations
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Billboard } from '@react-three/drei';
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
  const [tidalCurrents, setTidalCurrents] = useState<TidalCurrent[]>([]);
  const [loading, setLoading] = useState(false);

  const weatherService = useRef(new ProfessionalWeatherService({
    stormglass: process.env.EXPO_PUBLIC_STORMGLASS_API_KEY || 'demo-key',
    openweathermap: process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY || '',
    meteomatics: process.env.EXPO_PUBLIC_METEOMATICS_API_KEY || 'demo-key',
  }));

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
      const centerLat = bounds.southwest.latitude + ((bounds.northeast.latitude - bounds.southwest.latitude) / 2);
      const centerLng = bounds.southwest.longitude + ((bounds.northeast.longitude - bounds.southwest.longitude) / 2);

      const weather = await weatherService.current.getAdvancedWeatherData(centerLat, centerLng, venue);

      setCurrentWeather(weather);
      onWeatherUpdate?.(weather);

      // Get tidal current data
      const currents = await weatherService.current.getTidalCurrents(bounds);
      setTidalCurrents(currents);

    } catch (error) {
      // Silent fail - keep existing data
    } finally {
      setLoading(false);
    }
  };

  // Calculate average tidal current
  const averageTide = useMemo(() => {
    if (tidalCurrents.length === 0) return null;

    const avgSpeed = tidalCurrents.reduce((sum, c) => sum + c.speed, 0) / tidalCurrents.length;
    const avgDirection = tidalCurrents.reduce((sum, c) => sum + c.direction, 0) / tidalCurrents.length;
    const mostCommonType = tidalCurrents.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const type = Object.keys(mostCommonType).reduce((a, b) =>
      mostCommonType[a] > mostCommonType[b] ? a : b
    ) as 'flood' | 'ebb' | 'slack';

    return { speed: avgSpeed, direction: avgDirection, type };
  }, [tidalCurrents]);

  return (
    <group>
      {/* Single Wind Arrow */}
      {(showWindField || showWindBarbs) && currentWeather && (
        <SimpleWeatherArrow
          position={[-15, 15, -15]}
          speed={currentWeather.wind.speed}
          direction={currentWeather.wind.direction}
          color="#FF6B35"
          label="Wind"
          unit="kt"
        />
      )}

      {/* Single Tide/Current Arrow */}
      {showCurrentArrows && averageTide && (
        <SimpleWeatherArrow
          position={[15, 15, -15]}
          speed={averageTide.speed}
          direction={averageTide.direction}
          color={averageTide.type === 'flood' ? '#00A651' : averageTide.type === 'ebb' ? '#FF6B35' : '#666666'}
          label="Tide"
          unit="kt"
        />
      )}

      {/* Single Wave Arrow */}
      {showWaveHeight && currentWeather?.waves && (
        <SimpleWeatherArrow
          position={[0, 15, -20]}
          speed={currentWeather.waves.height || 0}
          direction={currentWeather.waves.direction || 0}
          color="#87CEEB"
          label="Waves"
          unit="m"
        />
      )}

      {/* Pressure Field Visualization */}
      {showPressure && currentWeather && (
        <PressureField3D
          weather={currentWeather}
          bounds={bounds}
        />
      )}
    </group>
  );
}

// Simple Weather Arrow Component - Static, no animations
function SimpleWeatherArrow({
  position,
  speed,
  direction,
  color,
  label,
  unit
}: {
  position: [number, number, number];
  speed: number;
  direction: number;
  color: string;
  label: string;
  unit: string;
}) {
  // Arrow size scales with strength (min 2, max 8)
  const arrowLength = Math.max(2, Math.min(8, speed * 0.5));
  const arrowWidth = arrowLength * 0.15;

  // Convert direction to rotation (static - no useFrame!)
  const rotation = useMemo(() => {
    return [0, (direction * Math.PI) / 180, 0] as [number, number, number];
  }, [direction]);

  // Create arrow geometry
  const arrowGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Arrow shaft (line)
    vertices.push(0, 0, 0, 0, 0, arrowLength);

    // Arrowhead (triangle at tip)
    const headSize = arrowWidth * 2;
    vertices.push(
      0, 0, arrowLength,
      -headSize, 0, arrowLength - headSize,
      0, 0, arrowLength,
      headSize, 0, arrowLength - headSize
    );

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }, [arrowLength, arrowWidth]);

  return (
    <group position={position} rotation={rotation}>
      {/* Arrow */}
      <line geometry={arrowGeometry}>
        <lineBasicMaterial color={color} linewidth={3} />
      </line>

      {/* Label and value */}
      <Billboard position={[0, 2, 0]}>
        <Text
          fontSize={1.2}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {label}: {speed.toFixed(1)}{unit}
        </Text>
      </Billboard>
    </group>
  );
}

// Pressure Field 3D Component (static)
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WeatherOverlay3D;
