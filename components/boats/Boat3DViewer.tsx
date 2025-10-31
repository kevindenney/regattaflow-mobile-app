/**
 * Boat3DViewer Component - Web Version
 * Interactive 3D boat model with rig tuning visualization
 * Uses React Three Fiber for WebGL rendering
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
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

interface BoatRigProfile {
  name: string;
  forestayBaseline: number;
  headline: string;
  notes: string[];
}

type BoatClassSummary = Record<string, BoatRigProfile>;

const CLASS_SUMMARY: BoatClassSummary = {
  etchells: {
    name: 'Etchells',
    forestayBaseline: 10950,
    headline: 'Etchells tuned baseline',
    notes: [
      'Mast rake target: 47–47.5 in (forestay ~10950 mm)',
      'Upper shroud: 25–28 Loos PT-2M',
      'Lower shroud: 12–14 Loos PT-1M',
      'Backstay marks 0–7 with vang assist above 12 kts',
    ],
  },
  dragon: {
    name: 'Dragon',
    forestayBaseline: 10800,
    headline: 'Dragon base rig matrix',
    notes: [
      'Forestay baseline: 10800 mm with 120 mm pre-bend',
      'Upper shrouds: 28 Loos, lowers 18 for medium breeze',
      'Backstay adds ~40 mm bend at mark 6 (>14 kts)',
    ],
  },
};

interface BoatSceneProps {
  tuning: Boat3DViewerProps['tuning'];
  forestayBaseline: number;
}

function BoatScene({ tuning, forestayBaseline }: BoatSceneProps) {
  const hullGroupRef = useRef<THREE.Group>(null);
  const mastRef = useRef<THREE.Mesh>(null);
  const boomRef = useRef<THREE.Mesh>(null);
  const jibRef = useRef<THREE.Mesh>(null);

  const mastBend = useMemo(() => {
    const backstayFactor = Math.min(Math.max(tuning.backstay, 0), 100) / 100;
    const shroudFactor = Math.min(Math.max(tuning.shrouds, 0), 100) / 100;
    return THREE.MathUtils.degToRad(backstayFactor * 10 + shroudFactor * 3);
  }, [tuning.backstay, tuning.shrouds]);

  const mastRake = useMemo(() => {
    const delta = tuning.forestay - forestayBaseline;
    const clamped = Math.max(Math.min(delta / 40, 10), -10);
    return THREE.MathUtils.degToRad(clamped * 0.6);
  }, [tuning.forestay, forestayBaseline]);

  const boomAngle = useMemo(() => {
    const normalized = Math.min(Math.max(tuning.mastButtPosition, -80), 80);
    return THREE.MathUtils.degToRad(5 + normalized * 0.12);
  }, [tuning.mastButtPosition]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (hullGroupRef.current) {
      hullGroupRef.current.rotation.y += delta * 0.15;
      hullGroupRef.current.position.y = Math.sin(time * 0.7) * 0.06;
      hullGroupRef.current.rotation.x = Math.sin(time * 0.5) * THREE.MathUtils.degToRad(1.4);
    }

    if (mastRef.current) {
      mastRef.current.rotation.z = -mastBend;
      mastRef.current.rotation.x = -mastRake;
    }

    if (boomRef.current) {
      boomRef.current.rotation.y = boomAngle;
    }

    if (jibRef.current) {
      jibRef.current.rotation.y = boomAngle * 0.65;
    }
  });

  const sailMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    roughness: 0.35,
    metalness: 0.0,
    side: THREE.DoubleSide,
  }), []);

  const translucentWater = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.9,
    metalness: 0.0,
  }), []);

  const hullMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.55,
    metalness: 0.2,
  }), []);

  useEffect(() => () => sailMaterial.dispose(), [sailMaterial]);
  useEffect(() => () => translucentWater.dispose(), [translucentWater]);
  useEffect(() => () => hullMaterial.dispose(), [hullMaterial]);

  return (
    <>
      <group ref={hullGroupRef} position={[0, -0.5, 0]}>
        {/* Hull */}
        <mesh castShadow position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial}>
          <cylinderGeometry args={[0.28, 0.18, 3.6, 32]} />
        </mesh>

        {/* Deck */}
        <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
          <boxGeometry args={[0.5, 0.08, 3.1]} />
          <meshStandardMaterial color={0xf8fafc} roughness={0.7} />
        </mesh>

        {/* Cockpit */}
        <mesh castShadow position={[0, 0.28, -0.4]}> 
          <boxGeometry args={[0.36, 0.05, 0.8]} />
          <meshStandardMaterial color={0xe2e8f0} />
        </mesh>

        {/* Mast */}
        <mesh ref={mastRef} castShadow receiveShadow position={[0, 0.8, -tuning.mastButtPosition / 1000]}> 
          <cylinderGeometry args={[0.03, 0.02, 2.6, 24]} />
          <meshStandardMaterial color={0x94a3b8} />
        </mesh>

        {/* Boom */}
        <mesh ref={boomRef} castShadow position={[0, 0.82, -0.15]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 18]} />
          <meshStandardMaterial color={0x94a3b8} />
        </mesh>

        {/* Main Sail */}
        <mesh castShadow material={sailMaterial} position={[0, 1.1, 0]} rotation={[0, Math.PI, 0]}>
          <coneGeometry args={[0.85, 2.2, 3]} />
        </mesh>

        {/* Jib */}
        <mesh ref={jibRef} castShadow material={sailMaterial} position={[0, 0.95, 0.9]}>
          <coneGeometry args={[0.55, 1.6, 3]} />
        </mesh>

        {/* Keel */}
        <mesh castShadow position={[0, -0.65, 0.25]}>
          <boxGeometry args={[0.12, 0.7, 0.4]} />
          <meshStandardMaterial color={0x0f172a} />
        </mesh>

        {/* Rudder */}
        <mesh castShadow position={[0, -0.45, -1.8]}>
          <boxGeometry args={[0.08, 0.5, 0.1]} />
          <meshStandardMaterial color={0x1e293b} />
        </mesh>
      </group>

      {/* Water plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} material={translucentWater} receiveShadow>
        <planeGeometry args={[12, 10, 32, 32]} />
      </mesh>

      {/* Lighting */}
      <hemisphereLight intensity={0.55} groundColor={0x0f172a} />
      <directionalLight
        castShadow
        intensity={0.8}
        position={[4, 6, 6]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        position={[-6, 7, -4]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.5}
        castShadow
      />
    </>
  );
}

/**
 * 3D Boat Viewer Component - Web Version
 * Renders interactive 3D boat model with WebGL
 */
export function Boat3DViewer({
  boatClass,
  tuning,
  width = 375,
  height = 400,
}: Boat3DViewerProps) {
  const normalizedClass = boatClass.trim().toLowerCase();
  const guide = CLASS_SUMMARY[normalizedClass];
  const forestayBaseline = guide?.forestayBaseline ?? 10950;

  return (
    <View style={[styles.container, { width, height }]}> 
      <Canvas
        camera={{ position: [3.2, 2.2, 3.2], fov: 50 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={[0xf8fafc]} />
        <BoatScene tuning={tuning} forestayBaseline={forestayBaseline} />
      </Canvas>

      <View pointerEvents="none" style={styles.overlay}>
        <Text style={styles.overlayTitle}>{guide ? guide.name : boatClass} Rig Model</Text>
        <Text style={styles.overlayMetrics}>
          Shrouds {tuning.shrouds}% • Backstay {tuning.backstay}% • Forestay {tuning.forestay}mm
        </Text>
        <Text style={styles.overlayMetrics}>
          Mast butt {tuning.mastButtPosition}mm aft
        </Text>
      </View>

      {guide && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryHeadline}>{guide.headline}</Text>
          {guide.notes.map((note) => (
            <Text key={note} style={styles.summaryNote}>
              • {note}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    gap: 4,
  },
  overlayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0f2fe',
  },
  overlayMetrics: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  summaryCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    gap: 6,
  },
  summaryHeadline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryNote: {
    fontSize: 11,
    color: '#334155',
  },
});
