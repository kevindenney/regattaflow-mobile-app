import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type CommunityLocation = {
  city: string;
  topic: string;
  lat: number;
  lon: number;
};

const COMMUNITY_LOCATIONS: CommunityLocation[] = [
  { city: 'San Francisco', topic: 'Start line acceleration in flood tide', lat: 37.7749, lon: -122.4194 },
  { city: 'Auckland', topic: 'Wind bend setup before mark rounding', lat: -36.8485, lon: 174.7633 },
  { city: 'Cowes', topic: 'IRC sail selection in mixed breeze', lat: 50.7624, lon: -1.2971 },
  { city: 'Sydney', topic: 'Downwind lane management with current', lat: -33.8688, lon: 151.2093 },
  { city: 'Hong Kong', topic: 'Harbor shifts and layline timing', lat: 22.3193, lon: 114.1694 },
  { city: 'Cape Town', topic: 'Heavy-air depower communication', lat: -33.9249, lon: 18.4241 },
];

function latLonToVector3(lat: number, lon: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;

  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function StaticNativeGlobe() {
  return (
    <View style={styles.globeWrap}>
      <View style={styles.globeShell}>
        <View style={styles.globeGradient} />
        {COMMUNITY_LOCATIONS.map((location) => (
          <View key={location.city} style={styles.pin} />
        ))}
      </View>
    </View>
  );
}

function WebGlobe({
  selectedIndex,
  onPinSelect,
}: {
  selectedIndex: number;
  onPinSelect: (index: number) => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pinMeshesRef = useRef<any[]>([]);
  const globeGroupRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mountRef.current) return;

    let cleanup: (() => void) | null = null;
    let rafId = 0;

    const run = async () => {
      const THREE = await import('three');
      if (!mountRef.current) return;

      const container = mountRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
      camera.position.set(0, 0, 7.6);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      const keyLight = new THREE.DirectionalLight(0x93c5fd, 1.3);
      keyLight.position.set(6, 4, 8);
      const rimLight = new THREE.DirectionalLight(0x2563eb, 1.0);
      rimLight.position.set(-4, -2, -7);
      scene.add(ambientLight, keyLight, rimLight);

      const globeGroup = new THREE.Group();
      globeGroupRef.current = globeGroup;
      scene.add(globeGroup);

      const globeGeometry = new THREE.SphereGeometry(2.45, 64, 64);
      const globeMaterial = new THREE.MeshPhongMaterial({
        color: 0x60a5fa,
        emissive: 0x0b3ea8,
        emissiveIntensity: 0.16,
        shininess: 45,
      });
      const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
      globeGroup.add(globeMesh);

      // Overlay wireframe to mimic globe lines.
      const wireGeometry = new THREE.SphereGeometry(2.47, 24, 24);
      const wireframe = new THREE.MeshBasicMaterial({
        color: 0xbfdbfe,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      });
      globeGroup.add(new THREE.Mesh(wireGeometry, wireframe));

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(2.68, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.18,
          side: THREE.BackSide,
        })
      );
      globeGroup.add(atmosphere);

      const pinMeshes: any[] = [];
      COMMUNITY_LOCATIONS.forEach((location, index) => {
        const pinGroup = new THREE.Group();
        const point = latLonToVector3(location.lat, location.lon, 2.6);
        pinGroup.position.set(point.x, point.y, point.z);
        pinGroup.lookAt(0, 0, 0);

        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.26, 12),
          new THREE.MeshStandardMaterial({ color: 0xfb923c, emissive: 0x7c2d12, emissiveIntensity: 0.55 })
        );
        stem.position.z = 0.1;

        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 18, 18),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.65 })
        );
        dot.position.z = 0.28;

        const halo = new THREE.Mesh(
          new THREE.RingGeometry(0.13, 0.2, 32),
          new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide,
            depthTest: false,
          })
        );
        halo.position.z = 0.29;
        halo.renderOrder = 2;

        // Billboard marker that always faces camera and stays visible over the globe.
        const markerSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            color: 0xf97316,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false,
          })
        );
        markerSprite.position.z = 0.36;
        markerSprite.scale.set(0.2, 0.2, 0.2);
        markerSprite.renderOrder = 3;

        pinGroup.userData = { index };
        pinGroup.add(stem, dot, halo, markerSprite);
        globeGroup.add(pinGroup);
        pinMeshes.push(pinGroup);
      });
      pinMeshesRef.current = pinMeshes;

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      let isDragging = false;
      let dragMoved = false;
      let lastX = 0;
      let lastY = 0;

      const onPointerDown = (event: PointerEvent) => {
        isDragging = true;
        dragMoved = false;
        lastX = event.clientX;
        lastY = event.clientY;
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!isDragging) return;
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragMoved = true;
        globeGroup.rotation.y += dx * 0.006;
        globeGroup.rotation.x = Math.max(-0.4, Math.min(0.4, globeGroup.rotation.x + dy * 0.003));
        lastX = event.clientX;
        lastY = event.clientY;
      };

      const onPointerUp = () => {
        isDragging = false;
      };

      const onClick = (event: MouseEvent) => {
        if (dragMoved) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(pinMeshes, true);
        if (hits.length === 0) return;

        const root = hits[0].object.parent;
        if (root?.userData?.index !== undefined) {
          onPinSelect(root.userData.index);
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('click', onClick);

      const resizeObserver = new ResizeObserver(() => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);

      const animate = () => {
        rafId = requestAnimationFrame(animate);
        if (!isDragging) globeGroup.rotation.y += 0.0021;

        pinMeshes.forEach((pin, idx) => {
          const active = idx === selectedIndex;
          const pulse = 1 + 0.2 * Math.sin(Date.now() * 0.005 + idx);

          pin.children[1].scale.setScalar((active ? 1.45 : 1.1) * pulse);
          pin.children[2].scale.setScalar(active ? 1.3 + 0.2 * pulse : 1.0 + 0.16 * pulse);
          pin.children[3].scale.setScalar(active ? 0.29 : 0.2);

          if (pin.children[1].material) {
            pin.children[1].material.color.set(active ? 0xfde047 : 0xfacc15);
            pin.children[1].material.emissive.set(active ? 0xf59e0b : 0xd97706);
          }

          if (pin.children[2].material) {
            pin.children[2].material.opacity = active ? 0.92 : 0.62;
          }
          if (pin.children[3].material) {
            pin.children[3].material.color.set(active ? 0xf59e0b : 0xf97316);
            pin.children[3].material.opacity = active ? 1 : 0.9;
          }
        });

        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('click', onClick);
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    };

    run();

    return () => {
      if (cleanup) cleanup();
      globeGroupRef.current = null;
      pinMeshesRef.current = [];
    };
  }, [onPinSelect, selectedIndex]);

  useEffect(() => {
    if (!globeGroupRef.current) return;
    const target = COMMUNITY_LOCATIONS[selectedIndex];
    if (!target) return;
    const rotY = ((target.lon + 20) * Math.PI) / 180;
    globeGroupRef.current.rotation.y = -rotY;
  }, [selectedIndex]);

  // @ts-ignore web-only div
  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}

export function CommunityGlobeSection() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedCity = useMemo(
    () => COMMUNITY_LOCATIONS[selectedIndex]?.city ?? COMMUNITY_LOCATIONS[0].city,
    [selectedIndex]
  );

  return (
    <View style={styles.section}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <View style={styles.header}>
          <Text style={styles.title}>Global Sailing Community</Text>
          <Text style={styles.subtitle}>
            Spin the globe, click a pin, and explore live race conversations from sailing communities worldwide.
          </Text>
        </View>

        <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
          <View style={styles.globePane}>
            <View style={styles.globeWrap}>
              {Platform.OS === 'web' ? (
                <WebGlobe selectedIndex={selectedIndex} onPinSelect={setSelectedIndex} />
              ) : (
                <StaticNativeGlobe />
              )}
            </View>
            <Text style={styles.hintText}>Drag to rotate. Click a pin to jump to a city conversation.</Text>
          </View>

          <View style={styles.feedPane}>
            {COMMUNITY_LOCATIONS.map((item, index) => {
              const active = index === selectedIndex;
              return (
                <TouchableOpacity
                  key={item.city}
                  style={[styles.feedCard, active && styles.feedCardActive]}
                  onPress={() => setSelectedIndex(index)}
                  activeOpacity={0.85}
                >
                  <View style={styles.feedCardHeader}>
                    <Ionicons name={active ? 'radio-button-on' : 'location-outline'} size={16} color={active ? '#1D4ED8' : '#2563EB'} />
                    <Text style={[styles.city, active && styles.cityActive]}>{item.city}</Text>
                    {active ? <Text style={styles.liveBadge}>LIVE</Text> : null}
                  </View>
                  <Text style={styles.topic}>{item.topic}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.cta} onPress={() => router.push('/(tabs)/connect')}>
              <Ionicons name="chatbubbles-outline" size={18} color="#FFFFFF" />
              <Text style={styles.ctaText}>Explore {selectedCity} Conversation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 72,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  content: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    gap: 24,
  },
  contentDesktop: {
    gap: 30,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 760,
  },
  layout: {
    flexDirection: 'column',
    gap: 20,
    alignItems: 'stretch',
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  globePane: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
  },
  globeWrap: {
    width: '100%',
    maxWidth: 520,
    height: 420,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FBFF',
    overflow: 'hidden',
  },
  globeShell: {
    width: 320,
    height: 320,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#93C5FD',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 44,
  },
  globeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#BFDBFE',
    ...Platform.select({
      web: {
        backgroundImage: 'radial-gradient(circle at 25% 35%, #E0F2FE 0%, #93C5FD 45%, #2563EB 100%)',
      } as any,
    }),
  },
  pin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#FFF7ED',
  },
  hintText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  feedPane: {
    flex: 1,
    gap: 10,
  },
  feedCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  feedCardActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  cityActive: {
    color: '#1D4ED8',
  },
  liveBadge: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  topic: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  cta: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
