/**
 * Boat3DViewer Component
 * Interactive 3D boat model with rig tuning visualization
 * Uses React Three Fiber for WebGL rendering
 *
 * NOTE: 3D rendering temporarily disabled for web compatibility
 * TODO: Re-enable with proper @react-three/fiber setup for web
 */

import React from 'react';
import { View, Text } from 'react-native';
// import { Canvas, useFrame } from '@react-three/fiber';
// import * as THREE from 'three';

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
 *
 * NOTE: Commented out until 3D rendering is re-enabled
 */
/*
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
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[0.8, 0.4, 4]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>

      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[0.75, 0.05, 3.8]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      <mesh position={[0, 1.5 + mastRake * 0.01, -tuning.mastButtPosition * 0.01]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[1.2, 3, 3]} />
        <meshStandardMaterial
          color="#ffffff"
          opacity={0.8}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 1.2, -1.5]}>
        <coneGeometry args={[0.8, 2.4, 3]} />
        <meshStandardMaterial
          color="#ffffff"
          opacity={0.7}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[0.1, 0.8, 1.5]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>

      <mesh position={[0, -0.8, 2]}>
        <boxGeometry args={[0.05, 0.6, 0.3]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
    </group>
  );
}
*/

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
  // Placeholder for all platforms until 3D rendering is fully implemented
  // TODO: Implement 3D rendering with @react-three/fiber for web and expo-gl for native
  return (
    <View style={{ width, height, backgroundColor: '#f0f9ff' }}>
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
          <Text style={{ fontSize: 14, color: '#1e40af', textAlign: 'center' }}>
            3D Boat Viewer
          </Text>
          <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 8, textAlign: 'center' }}>
            {boatClass} - 3D rendering coming soon
          </Text>
          <Text style={{ fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' }}>
            Shrouds: {tuning.shrouds}% | Backstay: {tuning.backstay}%
          </Text>
        </View>
      </View>
    </View>
  );
}
