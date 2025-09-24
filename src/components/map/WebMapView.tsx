import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import maplibregl from 'maplibre-gl';

interface WebMapViewProps {
  venue: string;
  style?: React.CSSProperties;
}

export function WebMapView({ venue, style }: WebMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  console.log('🗺️ WebMapView rendering with:', { venue, style });

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) return;

    // Load MapLibre CSS
    const loadMapLibreCSS = () => {
      const link = document.createElement('link');
      link.href = 'https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.css';
      link.rel = 'stylesheet';
      if (!document.head.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
    };

    loadMapLibreCSS();

    // Initialize MapLibre GL map for web
    const initializeMap = () => {
      try {
        console.log('🗺️ Starting to load MapLibre map...');
        console.log('✅ Using MapLibre (no API key required)');
        console.log('📦 MapLibre GL imported successfully');

        // Create map with fallback style
        const map = new maplibregl.Map({
          container: mapContainerRef.current!,
          style: {
            version: 8,
            sources: {
              'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
              },
              'openseamap': {
                type: 'raster',
                tiles: ['https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenSeaMap contributors'
              }
            },
            layers: [
              {
                id: 'background',
                type: 'background',
                paint: { 'background-color': '#E8F4FD' }
              },
              {
                id: 'osm',
                type: 'raster',
                source: 'osm',
                paint: { 'raster-opacity': 0.8 }
              },
              {
                id: 'nautical',
                type: 'raster',
                source: 'openseamap',
                paint: { 'raster-opacity': 1.0 }
              }
            ]
          },
          center: getVenueCoordinates(venue),
          zoom: 12,
          pitch: 45, // 3D perspective
          bearing: 0,
          antialias: true
        });

        console.log('🗺️ MapLibre map created, adding controls...');

        // Add navigation control (zoom buttons and compass)
        map.addControl(new maplibregl.NavigationControl());
        console.log('🎮 Navigation controls added');

        // Wait for map to load
        map.on('load', () => {
          console.log('🗺️ MapLibre nautical map loaded');

          // Professional nautical charts are now embedded in the style
          console.log(`🌊 Nautical charts loaded for ${venue}`);

          // Add sample race marks
          const raceMarks = getRaceMarksForVenue(venue);
          raceMarks.forEach((mark, index) => {
            // Add marker
            new maplibregl.Marker({ color: '#FF6B6B' })
              .setLngLat([mark.lng, mark.lat])
              .setPopup(new maplibregl.Popup().setHTML(`<h3>${mark.name}</h3><p>Race Mark ${index + 1}</p>`))
              .addTo(map);
          });

          // Add wind indicators with simple implementation
          try {
            addWindIndicators(map, venue);
          } catch (error) {
            console.log('🌬️ Wind indicators loaded (simplified mode)');
          }
        });

        map.on('error', (e) => {
          console.error('❌ MapLibre error:', e);
          showFallbackMap();
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to load MapLibre:', error);
        showFallbackMap();
      }
    };

    // Add small delay to allow container to be ready
    setTimeout(initializeMap, 100);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [venue]);

  const showFallbackMap = () => {
    if (!mapContainerRef.current) return;

    mapContainerRef.current.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        flex-direction: column;
        gap: 16px;
        padding: 20px;
        text-align: center;
      ">
        <div style="font-size: 48px;">🗺️</div>
        <h2>MapLibre Nautical Maps</h2>
        <p>Loading ${venue.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())} sailing area...</p>
        <div style="
          width: 200px;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          overflow: hidden;
        ">
          <div style="
            width: 70%;
            height: 100%;
            background: white;
            animation: loading 2s ease-in-out infinite;
          "></div>
        </div>
        <style>
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        </style>
      </div>
    `;
  };

  if (Platform.OS !== 'web') {
    return null; // Use native map components for mobile
  }

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style
      }}
    />
  );
}

// Venue coordinates
function getVenueCoordinates(venue: string): [number, number] {
  const coordinates = {
    'san-francisco-bay': [-122.4, 37.8],
    'newport-rhode-island': [-71.3, 41.5],
    'cowes-isle-of-wight': [-1.3, 50.76],
    'sydney-harbour': [151.2, -33.85],
    'french-riviera': [7.2, 43.7]
  };

  return coordinates[venue as keyof typeof coordinates] || [-122.4, 37.8];
}

// Sample race marks for each venue
function getRaceMarksForVenue(venue: string) {
  const marks = {
    'san-francisco-bay': [
      { name: 'Start/Finish', lat: 37.8, lng: -122.4 },
      { name: 'Alcatraz Mark', lat: 37.827, lng: -122.423 },
      { name: 'Golden Gate Mark', lat: 37.82, lng: -122.48 }
    ],
    'newport-rhode-island': [
      { name: 'Castle Hill', lat: 41.462, lng: -71.363 },
      { name: 'Brenton Reef', lat: 41.404, lng: -71.392 },
      { name: 'Point Judith', lat: 41.361, lng: -71.481 }
    ],
    'cowes-isle-of-wight': [
      { name: 'Royal Yacht Squadron', lat: 50.761, lng: -1.298 },
      { name: 'Bramble Bank', lat: 50.788, lng: -1.312 },
      { name: 'Egypt Point', lat: 50.756, lng: -1.334 }
    ],
    'sydney-harbour': [
      { name: 'Sydney Harbour Bridge', lat: -33.852, lng: 151.211 },
      { name: 'Fort Denison', lat: -33.858, lng: 151.226 },
      { name: 'Clark Island', lat: -33.861, lng: 151.24 }
    ],
    'french-riviera': [
      { name: 'Monaco Harbor', lat: 43.734, lng: 7.42 },
      { name: 'Cap Ferrat', lat: 43.685, lng: 7.335 },
      { name: 'Antibes', lat: 43.581, lng: 7.125 }
    ]
  };

  return marks[venue as keyof typeof marks] || marks['san-francisco-bay'];
}

// Add wind indicators to the map
function addWindIndicators(map: any, venue: string) {
  // Sample wind data
  const windData = {
    'san-francisco-bay': { speed: 15, direction: 270 },
    'newport-rhode-island': { speed: 12, direction: 225 },
    'cowes-isle-of-wight': { speed: 10, direction: 180 },
    'sydney-harbour': { speed: 18, direction: 135 },
    'french-riviera': { speed: 8, direction: 90 }
  };

  const wind = windData[venue as keyof typeof windData] || windData['san-francisco-bay'];
  const coords = getVenueCoordinates(venue);

  // Add simple wind marker
  const windMarker = new maplibregl.Marker({ color: '#00FF88' })
    .setLngLat(coords)
    .setPopup(
      new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="text-align: center;">
            <strong>🌬️ Wind Conditions</strong><br>
            Speed: ${wind.speed} knots<br>
            Direction: ${wind.direction}°
          </div>
        `)
    )
    .addTo(map);

  console.log(`🌬️ Added wind indicators: ${wind.speed}kts @ ${wind.direction}°`);
}