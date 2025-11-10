/**
 * Map Debug Page
 *
 * Simple diagnostic page to test if MapLibre GL is working
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('MapDebug');

let maplibregl: any = null;

if (Platform.OS === 'web') {
  try {
    // Inject CSS
    if (typeof document !== 'undefined' && !document.getElementById('maplibre-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@3.5.2/dist/maplibre-gl.css';
      document.head.appendChild(link);
      logger.debug('MapLibre CSS injected');
    }

    // Load MapLibre GL
    maplibregl = require('maplibre-gl');
    logger.debug('MapLibre GL loaded', { typeofMapLibre: typeof maplibregl });
  } catch (e) {
    logger.error('Failed to load MapLibre GL:', e);
  }
}

export default function MapDebugPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !maplibregl || !mapContainerRef.current) {
      setError('Not running on web or MapLibre not loaded');
      return;
    }

    try {
      logger.debug('Creating map instance');

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [114.15, 22.28], // Hong Kong
        zoom: 12
      });

      map.on('load', () => {
        logger.debug('Map loaded successfully');
        setMapLoaded(true);

        // Add a simple marker
        new maplibregl.Marker({ color: '#FF0000' })
          .setLngLat([114.15, 22.28])
          .addTo(map);

        logger.debug('Marker added');
      });

      map.on('error', (e: any) => {
        logger.error('Map error:', e);
        setError(`Map error: ${e.error?.message || 'Unknown'}`);
      });

      mapRef.current = map;

      return () => {
        logger.debug('Cleaning up map');
        map.remove();
      };
    } catch (e: any) {
      logger.error('Exception creating map:', e);
      setError(`Exception: ${e.message}`);
    }
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
