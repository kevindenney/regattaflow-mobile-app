// @ts-nocheck

/**
 * Professional 3D Bathymetry Viewer - OnX Maps Style
 * Advanced depth visualization for sailing race strategy
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import type {
  BoundingBox,
  GeoLocation,
  BathymetryData,
  DepthContour,
  DepthPoint
} from '@/lib/types/advanced-map';
import { NOAABathymetryService } from '@/services/bathymetry/NOAABathymetryService';

interface Bathymetry3DViewerProps {
  bounds: BoundingBox;
  venue: string;
  exaggeration: number;
  showContours: boolean;
  showSoundings: boolean;
  colorScheme: 'ocean' | 'bathymetric' | 'nautical';
  onDepthQuery?: (depth: number, location: GeoLocation) => void;
}

export function Bathymetry3DViewer({
  bounds,
  venue,
  exaggeration = 2.0,
  showContours = true,
  showSoundings = false,
  colorScheme = 'ocean',
  onDepthQuery
}: Bathymetry3DViewerProps) {
  const [bathymetryData, setBathymetryData] = useState<BathymetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bathymetryService = useRef(new NOAABathymetryService());

  useEffect(() => {
    loadBathymetryData();
  }, [bounds, venue]);

  const loadBathymetryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch bathymetry data from NOAA
      const data = await bathymetryService.current.getBathymetryData(bounds);
      setBathymetryData(data);

    } catch (err: any) {

      setError(`Failed to load depth data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getColorForDepth = (depth: number): THREE.Color => {
    if (!bathymetryData) return new THREE.Color(0x0066CC);

    // Normalize depth (0 = shallow, 1 = deep)
    const normalizedDepth = Math.abs(depth - bathymetryData.minDepth) /
                           (bathymetryData.maxDepth - bathymetryData.minDepth);

    switch (colorScheme) {
      case 'ocean':
        // Blue gradient from shallow to deep
        return new THREE.Color().setHSL(0.58, 1.0, 0.9 - normalizedDepth * 0.6);

      case 'bathymetric':
        // Traditional bathymetric colors
        if (depth > -2) return new THREE.Color(0xE3F2FD); // Very shallow
        if (depth > -5) return new THREE.Color(0x90CAF9); // Shallow
        if (depth > -10) return new THREE.Color(0x42A5F5); // Medium
        if (depth > -20) return new THREE.Color(0x1E88E5); // Deep
        if (depth > -50) return new THREE.Color(0x1565C0); // Very deep
        return new THREE.Color(0x0D47A1); // Abyss

      case 'nautical':
        // High contrast for navigation
        if (depth > -5) return new THREE.Color(0xFF6B35); // Danger - shallow
        if (depth > -10) return new THREE.Color(0xFFD700); // Caution
        return new THREE.Color(0x00A651); // Safe - deep water

      default:
        return new THREE.Color(0x0066CC);
    }
  };

  const handleDepthClick = (depth: number, position: THREE.Vector3) => {
    // Convert 3D position back to lat/lng
    const location: GeoLocation = {
      latitude: bounds.northeast.latitude - (position.z / 100) * (bounds.northeast.latitude - bounds.southwest.latitude),
      longitude: bounds.southwest.longitude + (position.x / 100) * (bounds.northeast.longitude - bounds.southwest.longitude)
    };

    onDepthQuery?.(depth, location);

    Alert.alert(
      'Depth Information',
      `Depth: ${Math.abs(depth).toFixed(1)}m\n` +
      `Position: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText type="title">🌊 Loading Bathymetry</ThemedText>
        <ThemedText type="default">Fetching depth data from NOAA...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText type="title">❌ Error</ThemedText>
        <ThemedText type="default">{error}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 3D Bathymetry Visualization */}
      <Canvas
        camera={{
          position: [50, 30, 50],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={10}
          maxDistance={200}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 50, 0]} intensity={0.3} color="#87CEEB" />

        {/* Reference Grid */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#ffffff"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#0066CC"
          fadeDistance={80}
          fadeStrength={1}
          position={[0, -1, 0]}
        />

        {/* Bathymetry Mesh */}
        {bathymetryData && (
          <BathymetryMesh
            data={bathymetryData}
            exaggeration={exaggeration}
            colorScheme={colorScheme}
            onDepthClick={handleDepthClick}
          />
        )}

        {/* Depth Contours */}
        {bathymetryData && showContours && (
          <DepthContours
            contours={bathymetryData.contours}
            bounds={bounds}
            exaggeration={exaggeration}
          />
        )}

        {/* Depth Soundings */}
        {bathymetryData && showSoundings && (
          <DepthSoundings
            depths={bathymetryData.depths}
            bounds={bounds}
            exaggeration={exaggeration}
          />
        )}

        {/* Venue Label */}
        <Text
          position={[0, 40, 0]}
          fontSize={3}
          color="#0066CC"
          anchorX="center"
          anchorY="middle"
        >
          {venue.replace(/-/g, ' ').toUpperCase()}
        </Text>
      </Canvas>

      {/* Depth Legend */}
      <View style={styles.legend}>
        <ThemedText style={styles.legendTitle}>Depth Legend (m)</ThemedText>
        <DepthLegend
          minDepth={bathymetryData?.minDepth || 0}
          maxDepth={bathymetryData?.maxDepth || -50}
          colorScheme={colorScheme}
        />
      </View>
    </View>
  );
}

// 3D Bathymetry Mesh Component
function BathymetryMesh({
  data,
  exaggeration,
  colorScheme,
  onDepthClick
}: {
  data: BathymetryData;
  exaggeration: number;
  colorScheme: 'ocean' | 'bathymetric' | 'nautical';
  onDepthClick: (depth: number, position: THREE.Vector3) => void;
}) {
  const meshRef = useRef<THREE.Mesh>();
  const [geometry, setGeometry] = useState<THREE.PlaneGeometry>();

  useEffect(() => {
    createBathymetryGeometry();
  }, [data, exaggeration]);

  const createBathymetryGeometry = () => {
    const gridSize = data.gridSize;
    const geometry = new THREE.PlaneGeometry(100, 100, gridSize - 1, gridSize - 1);

    // Create height map from depth data
    const vertices = geometry.attributes.position.array as Float32Array;
    const colors: number[] = [];

    for (let i = 0; i < data.depths.length; i++) {
      const depth = data.depths[i];

      // Set vertex height (Y position) based on depth
      const vertexIndex = i * 3;
      vertices[vertexIndex + 1] = depth.depth * exaggeration;

      // Set vertex color based on depth
      const color = getColorForDepth(depth.depth);
      colors.push(color.r, color.g, color.b);
    }

    // Add colors to geometry
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    setGeometry(geometry);
  };

  const getColorForDepth = (depth: number): THREE.Color => {
    const normalizedDepth = Math.abs(depth - data.minDepth) /
                           (data.maxDepth - data.minDepth);

    switch (colorScheme) {
      case 'ocean':
        return new THREE.Color().setHSL(0.58, 1.0, 0.9 - normalizedDepth * 0.6);
      case 'bathymetric':
        if (depth > -2) return new THREE.Color(0xE3F2FD);
        if (depth > -5) return new THREE.Color(0x90CAF9);
        if (depth > -10) return new THREE.Color(0x42A5F5);
        if (depth > -20) return new THREE.Color(0x1E88E5);
        if (depth > -50) return new THREE.Color(0x1565C0);
        return new THREE.Color(0x0D47A1);
      case 'nautical':
        if (depth > -5) return new THREE.Color(0xFF6B35);
        if (depth > -10) return new THREE.Color(0xFFD700);
        return new THREE.Color(0x00A651);
      default:
        return new THREE.Color(0x0066CC);
    }
  };

  const handleClick = (event: any) => {
    if (event.point && meshRef.current) {
      const point = event.point as THREE.Vector3;

      // Calculate depth at clicked point
      const x = Math.round((point.x + 50) * data.gridSize / 100);
      const z = Math.round((point.z + 50) * data.gridSize / 100);
      const index = z * data.gridSize + x;

      if (index >= 0 && index < data.depths.length) {
        const depth = data.depths[index].depth;
        onDepthClick(depth, point);
      }
    }
  };

  return geometry ? (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
      receiveShadow
      castShadow
    >
      <meshLambertMaterial
        vertexColors
        wireframe={false}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
      />
    </mesh>
  ) : null;
}

// Depth Contours Component
function DepthContours({
  contours,
  bounds,
  exaggeration
}: {
  contours: DepthContour[];
  bounds: BoundingBox;
  exaggeration: number;
}) {
  return (
    <group>
      {contours.map((contour, index) => (
        <ContourLine
          key={`contour-${contour.depth}-${index}`}
          contour={contour}
          bounds={bounds}
          exaggeration={exaggeration}
        />
      ))}
    </group>
  );
}

// Individual Contour Line Component
function ContourLine({
  contour,
  bounds,
  exaggeration
}: {
  contour: DepthContour;
  bounds: BoundingBox;
  exaggeration: number;
}) {
  const points = contour.points.map(point => {
    // Convert lat/lng to local coordinates
    const x = ((point.longitude - bounds.southwest.longitude) / (bounds.northeast.longitude - bounds.southwest.longitude)) * 100 - 50;
    const z = ((bounds.northeast.latitude - point.latitude) / (bounds.northeast.latitude - bounds.southwest.latitude)) * 100 - 50;
    const y = contour.depth * exaggeration;

    return new THREE.Vector3(x, y, z);
  });

  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 64, 0.2, 8, false);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={contour.style.color}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// Depth Soundings Component
function DepthSoundings({
  depths,
  bounds,
  exaggeration
}: {
  depths: DepthPoint[];
  bounds: BoundingBox;
  exaggeration: number;
}) {
  return (
    <group>
      {depths
        .filter((_, index) => index % 10 === 0) // Show every 10th sounding
        .map((depth, index) => {
          const x = ((depth.location.longitude - bounds.southwest.longitude) / (bounds.northeast.longitude - bounds.southwest.longitude)) * 100 - 50;
          const z = ((bounds.northeast.latitude - depth.location.latitude) / (bounds.northeast.latitude - bounds.southwest.latitude)) * 100 - 50;
          const y = depth.depth * exaggeration + 2;

          return (
            <Text
              key={`sounding-${index}`}
              position={[x, y, z]}
              fontSize={1}
              color="#000000"
              anchorX="center"
              anchorY="middle"
            >
              {Math.abs(depth.depth).toFixed(0)}
            </Text>
          );
        })}
    </group>
  );
}

// Depth Legend Component
function DepthLegend({
  minDepth,
  maxDepth,
  colorScheme
}: {
  minDepth: number;
  maxDepth: number;
  colorScheme: 'ocean' | 'bathymetric' | 'nautical';
}) {
  const steps = 6;
  const depthRange = maxDepth - minDepth;
  const stepSize = depthRange / (steps - 1);

  const legendItems = [];
  for (let i = 0; i < steps; i++) {
    const depth = minDepth + (stepSize * i);
    const color = getColorForDepthLegend(depth, minDepth, maxDepth, colorScheme);

    legendItems.push(
      <View key={i} style={styles.legendItem}>
        <View style={[styles.colorSwatch, { backgroundColor: color }]} />
        <ThemedText style={styles.legendText}>
          {Math.abs(depth).toFixed(0)}m
        </ThemedText>
      </View>
    );
  }

  return <View style={styles.legendContainer}>{legendItems}</View>;
}

function getColorForDepthLegend(
  depth: number,
  minDepth: number,
  maxDepth: number,
  colorScheme: 'ocean' | 'bathymetric' | 'nautical'
): string {
  const normalizedDepth = Math.abs(depth - minDepth) / (maxDepth - minDepth);

  switch (colorScheme) {
    case 'ocean':
      const hue = 0.58;
      const lightness = 0.9 - normalizedDepth * 0.6;
      return `hsl(${hue * 360}, 100%, ${lightness * 100}%)`;

    case 'bathymetric':
      if (depth > -2) return '#E3F2FD';
      if (depth > -5) return '#90CAF9';
      if (depth > -10) return '#42A5F5';
      if (depth > -20) return '#1E88E5';
      if (depth > -50) return '#1565C0';
      return '#0D47A1';

    case 'nautical':
      if (depth > -5) return '#FF6B35';
      if (depth > -10) return '#FFD700';
      return '#00A651';

    default:
      return '#0066CC';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  legendContainer: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});

export default Bathymetry3DViewer;
