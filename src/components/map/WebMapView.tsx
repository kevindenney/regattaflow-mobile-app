import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

interface WebMapViewProps {
  venue: string;
  style?: React.CSSProperties;
}

export function WebMapView({ venue, style }: WebMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  console.log('🗺️ WebMapView rendering with:', { venue, style });

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) return;

    console.log('🗺️ Loading interactive nautical map fallback');
    showInteractiveFallbackMap();
  }, [venue]);

  const showInteractiveFallbackMap = () => {
    if (!mapContainerRef.current) return;

    const coords = getVenueCoordinates(venue);
    const raceMarks = getRaceMarksForVenue(venue);

    mapContainerRef.current.innerHTML = `
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        background: #E8F4FD;
        overflow: hidden;
        border-radius: 8px;
      ">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=${coords[0]-0.05},${coords[1]-0.05},${coords[0]+0.05},${coords[1]+0.05}&marker=${coords[1]},${coords[0]}&layer=mapnik"
          style="
            width: 100%;
            height: 100%;
            border: none;
            background: #E8F4FD;
          "
          loading="lazy">
        </iframe>

        <div style="
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">🗺️</div>
            <div>
              <div style="font-weight: 600; font-size: 14px;">Professional Nautical Chart</div>
              <div style="opacity: 0.8; font-size: 12px;">${venue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; opacity: 0.8;">
            <div>🎯 Race Marks: ${raceMarks.length}</div>
            <div>🌊 Nautical Features</div>
          </div>
        </div>

        <div style="
          position: absolute;
          bottom: 16px;
          left: 16px;
          right: 16px;
          background: rgba(0, 102, 204, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
            <div>📍 ${coords[1].toFixed(4)}°N, ${Math.abs(coords[0]).toFixed(4)}°W</div>
            <div>🌊 Interactive Nautical Chart</div>
          </div>
        </div>
      </div>
    `;

    console.log(`🗺️ Interactive fallback map loaded for ${venue}`);
  };

  if (Platform.OS !== 'web') {
    return null;
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