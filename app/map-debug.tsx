/**
 * Map Debug Page
 *
 * Simple diagnostic page to test if MapLibre GL is working
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createLogger } from '@/lib/utils/logger';
import { ensureMapLibreCss, ensureMapLibreScript } from '@/lib/maplibreWeb';

const logger = createLogger('MapDebug');
const MAP_STYLE = {
  version: 8,
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#f8fafc' },
    },
    {
      id: 'raster-layer',
      type: 'raster',
      source: 'raster-tiles',
      paint: { 'raster-opacity': 0.9 },
    },
  ],
} as const;

export default function MapDebugPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLoadRef = useRef<((...args: any[]) => void) | null>(null);
  const onErrorRef = useRef<((...args: any[]) => void) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) {
      setError('Not running on web');
      return;
    }

    let cancelled = false;
    const initialize = async () => {
      try {
        if (typeof document !== 'undefined' && !document.getElementById('maplibre-css-debug')) {
          ensureMapLibreCss('maplibre-css-debug');
          logger.debug('MapLibre CSS injected');
        }

        try {
          const maplibreModule = await import('maplibre-gl');
          maplibreRef.current = (maplibreModule as any).default || maplibreModule;
        } catch (_moduleError) {
          await ensureMapLibreScript('maplibre-gl-script-debug');
          maplibreRef.current = typeof window !== 'undefined' ? (window as any).maplibregl : null;
        }
        const MapConstructor = maplibreRef.current?.Map;
        const MarkerConstructor = maplibreRef.current?.Marker;
        if (!MapConstructor || !MarkerConstructor || !mapContainerRef.current) {
          throw new Error('MapLibre constructors unavailable');
        }

        logger.debug('Creating map instance');
        const map = new MapConstructor({
          container: mapContainerRef.current,
          style: MAP_STYLE,
          center: [114.15, 22.28], // Hong Kong
          zoom: 12
        });

        loadTimeoutRef.current = setTimeout(() => {
          if (cancelled) return;
          setError('Map load timed out.');
          setMapLoaded(false);
        }, 8000);

        const onLoad = () => {
          if (cancelled) return;
          logger.debug('Map loaded successfully');
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          setMapLoaded(true);

          // Add a simple marker
          new MarkerConstructor({ color: '#FF0000' })
            .setLngLat([114.15, 22.28])
            .addTo(map);

          logger.debug('Marker added');
        };
        onLoadRef.current = onLoad;
        map.on('load', onLoad);

        const onError = (e: any) => {
          if (cancelled) return;
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          logger.error('Map error:', e);
          setError(`Map error: ${e.error?.message || 'Unknown'}`);
        };
        onErrorRef.current = onError;
        map.on('error', onError);

        mapRef.current = map;
      } catch (e: any) {
        if (!cancelled) {
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          logger.error('Exception creating map:', e);
          setError(`Exception: ${e.message}`);
        }
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (mapRef.current) {
        logger.debug('Cleaning up map');
        if (onLoadRef.current) {
          mapRef.current.off('load', onLoadRef.current);
          onLoadRef.current = null;
        }
        if (onErrorRef.current) {
          mapRef.current.off('error', onErrorRef.current);
          onErrorRef.current = null;
        }
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Web platform only</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MapLibre GL Debug Test</Text>
        <Text style={styles.subtitle}>
          {mapLoaded ? '✅ Map Loaded' : '⏳ Loading...'}
        </Text>
        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      <div
        ref={mapContainerRef as any}
        style={{
          width: '100%',
          height: '600px',
          backgroundColor: '#e0e0e0',
          border: '2px solid #333',
          borderRadius: '8px'
        }}
      />

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Expected: A map showing Hong Kong with a red marker
        </Text>
        <Text style={styles.infoText}>
          If you see a grey box: CSS not loaded or map not rendering
        </Text>
        <Text style={styles.infoText}>
          Check browser console for [MapDebug] logs
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666'
  },
  error: {
    fontSize: 14,
    color: '#ff0000',
    marginTop: 8
  },
  info: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333'
  }
});
