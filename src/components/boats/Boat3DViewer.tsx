/**
 * Boat3DViewer Component
 * Interactive 3D boat model with rig tuning visualization
 * Uses React Three Fiber for WebGL rendering
 */

import React, { useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Boat3DViewerProps {
  boatClass: string;
  tuning: {
    shrouds: number; // 0-100
    backstay: number; // 0-100
    forestay: number; // mm
    mastButtPosition: number; // mm aft
  };
  width?: number;
  height?: number;
}

/**
 * Simple boat mesh - placeholder until GLTF models are loaded
 * Represents a Dragon class sailboat with adjustable rig
 */
function BoatMesh({ tuning }: { tuning: Boat3DViewerProps['tuning'] }) {
  const meshRef = useRef<THREE.Group>(null);
  const [rotation, setRotation] = useState(0);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
    }
  });

  // Calculate mast bend based on shroud and backstay tension
  const mastBend = (tuning.backstay / 100) * 0.3; // Max 30cm bend
  const mastRake = (tuning.forestay - 10750) / 100; // Forestay length affects rake

  return (
    <group ref={meshRef}>
      {/* Hull - simplified Dragon hull shape */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[0.8, 0.4, 4]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>

      {/* Deck */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[0.75, 0.05, 3.8]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* Mast - adjustable position and bend */}
      <mesh position={[0, 1.5 + mastRake * 0.01, -tuning.mastButtPosition * 0.01]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Boom */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Mainsail - simplified triangle */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[1.2, 3, 3]} />
        <meshStandardMaterial
          color="#ffffff"
          opacity={0.8}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Jib - front sail */}
      <mesh position={[0, 1.2, -1.5]}>
        <coneGeometry args={[0.8, 2.4, 3]} />
        <meshStandardMaterial
          color="#ffffff"
          opacity={0.7}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Keel */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[0.1, 0.8, 1.5]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>

      {/* Rudder */}
      <mesh position={[0, -0.8, 2]}>
        <boxGeometry args={[0.05, 0.6, 0.3]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
    </group>
  );
}

/**
 * 3D Boat Viewer Component
 * Renders interactive 3D boat model with touch controls
 */
export function Boat3DViewer({
  boatClass,
  tuning,
  width = 375,
  height = 400,
}: Boat3DViewerProps) {
  if (Platform.OS === 'web') {
    // Web rendering with React Three Fiber
    return (
      <View style={{ width, height, backgroundColor: '#f0f9ff' }}>
        <Canvas
          camera={{ position: [5, 3, 5], fov: 50 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <BoatMesh tuning={tuning} />
          {/* TODO: Add OrbitControls for mouse/touch rotation */}
        </Canvas>
      </View>
    );
  }

  // Mobile rendering - to be implemented with expo-gl
  return (
    <View style={{ width, height, backgroundColor: '#f0f9ff' }}>
      {/* TODO: Implement mobile 3D rendering with expo-gl */}
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <View style={{
          padding: 16,
          backgroundColor: '#dbeafe',
          borderRadius: 8
        }}>
          <View style={{ fontSize: 14, color: '#1e40af', textAlign: 'center' }}>
            3D Boat Viewer
          </View>
          <View style={{ fontSize: 12, color: '#3b82f6', marginTop: 8 }}>
            {boatClass} - Mobile rendering coming soon
          </View>
        </View>
      </View>
    </View>
  );
}
