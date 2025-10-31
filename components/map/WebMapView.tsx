// @ts-nocheck

import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { createLogger } from '@/lib/utils/logger';

interface WebMapViewProps {
  venue: string;
  marks?: any[];
  clubMarkers?: any[];
  onMarkPress?: (mark: any) => void;
  onMapPress?: (coordinates: any) => void;
  style?: React.CSSProperties;
}

const logger = createLogger('WebMapView');
export function WebMapView({ venue, marks = [], clubMarkers = [], onMarkPress, onMapPress, style }: WebMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainerRef.current) return;

    showInteractiveFallbackMap();
  }, [venue, marks, clubMarkers]);

  const generateMarkerOverlays = () => {
    let markersHTML = '';
    const coords = getVenueCoordinates(venue);
    const mapBounds = {
      west: coords[0] - 0.05,
      east: coords[0] + 0.05,
      north: coords[1] + 0.05,
      south: coords[1] - 0.05
    };

    const convertGPSToPixelPercent = (lat: number, lng: number) => {
      // Convert GPS coordinates to percentage position on the map
      const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
      const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * 100;

      logger.debug(`  Input GPS: lat=${lat}, lng=${lng}`);
      logger.debug(`  Map bounds: west=${mapBounds.west}, east=${mapBounds.east}, north=${mapBounds.north}, south=${mapBounds.south}`);
      logger.debug(`  Raw percentages: x=${x}%, y=${y}%`);

      const clampedResult = { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
      logger.debug(`  Clamped result: x=${clampedResult.x}%, y=${clampedResult.y}%`);

      return clampedResult;
    };

    // Add race course marks
    marks.forEach((mark, index) => {
      const color = mark.color || '#FF6B35';
      let position;

      if (mark.lat && mark.lng) {
        // Use GPS coordinates if available
        position = convertGPSToPixelPercent(mark.lat, mark.lng);
      } else {
        // Fallback to distributed positioning
        position = { x: 30 + (index * 15) % 40, y: 35 + (index * 10) % 30 };
      }

      const markName = mark.name || `Race Mark ${index + 1}`;
      const markDescription = mark.description || 'Race course marking buoy';

      markersHTML += `
        <div style="
          position: absolute;
          left: ${position.x}%;
          top: ${position.y}%;
          width: 12px;
          height: 12px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transform: translate(-50%, -50%);
        " title="${markName}"
           onclick="showMarkerDetails('${markName}', 'race-mark', '${mark.lat || 'N/A'}', '${mark.lng || 'N/A'}', '${markDescription}')">
        </div>
      `;
    });

    // Add yacht club markers
    clubMarkers.forEach((club, index) => {
      const color = club.type === 'headquarters' ? '#FF4444' :
                   club.type === 'racing-station' ? '#4444FF' : '#44FF44';
      let position;

      if (club.lat && club.lng) {
        // Use GPS coordinates if available
        position = convertGPSToPixelPercent(club.lat, club.lng);
      } else {
        // Fallback to distributed positioning
        position = { x: 25 + (index * 12) % 50, y: 50 + (index * 8) % 25 };
      }

      markersHTML += `
        <div style="
          position: absolute;
          left: ${position.x}%;
          top: ${position.y}%;
          width: 16px;
          height: 16px;
          background: ${color};
          border: 2px solid white;
          border-radius: 3px;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transform: translate(-50%, -50%);
        " title="${club.name || `Club ${index + 1}`}"
           onclick="showMarkerDetails('${club.name || `Club ${index + 1}`}', 'yacht-club', '${club.lat || 'N/A'}', '${club.lng || 'N/A'}', '${club.description || 'Yacht club facility'}')"
        </div>
      `;
    });

    return markersHTML;
  };

  const showInteractiveFallbackMap = () => {

    if (!mapContainerRef.current) {

      return;
    }

    const coords = getVenueCoordinates(venue);
    const raceMarks = getRaceMarksForVenue(venue); // Keep for backward compatibility

    const markerOverlays = generateMarkerOverlays();

    logger.debug('  venue ID:', venue);
    logger.debug('  mapped coordinates:', coords);
    logger.debug('  expected Hong Kong coords: [114.1694, 22.3193]');

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
            <div>📍 ${coords[1].toFixed(4)}°${coords[1] >= 0 ? 'N' : 'S'}, ${Math.abs(coords[0]).toFixed(4)}°${coords[0] >= 0 ? 'E' : 'W'}</div>
            <div>🌊 Interactive Nautical Chart</div>
          </div>
        </div>

        <!-- Dynamic markers from props -->
        ${markerOverlays}

        <!-- Marker Details Modal -->
        <div id="marker-details-modal" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          z-index: 1000;
          min-width: 280px;
          display: none;
          border: 1px solid #e0e0e0;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 id="marker-title" style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600;"></h3>
            <button onclick="hideMarkerDetails()" style="
              background: none;
              border: none;
              font-size: 20px;
              cursor: pointer;
              color: #666;
              padding: 0;
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">✕</button>
          </div>
          <div id="marker-info" style="color: #666; line-height: 1.5;">
            <div style="margin-bottom: 8px;">
              <strong>Type:</strong> <span id="marker-type"></span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>Coordinates:</strong> <span id="marker-coords"></span>
            </div>
            <div style="margin-bottom: 12px;">
              <strong>Description:</strong> <span id="marker-description"></span>
            </div>
          </div>
          <div style="border-top: 1px solid #e0e0e0; padding-top: 12px; margin-top: 16px;">
            <button onclick="hideMarkerDetails()" style="
              background: #0066cc;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              width: 100%;
            ">Close</button>
          </div>
        </div>

        <!-- Background overlay for modal -->
        <div id="marker-modal-overlay" style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
          display: none;
        " onclick="hideMarkerDetails()"></div>

      </div>
    `;

    // Define JavaScript functions directly (since innerHTML script tags don't execute)

    (window as any).showMarkerDetails = function(name: string, type: string, lat: string, lng: string, description: string) {

      const titleEl = document.getElementById('marker-title');
      const typeEl = document.getElementById('marker-type');
      const coordsEl = document.getElementById('marker-coords');
      const descEl = document.getElementById('marker-description');
      const modalEl = document.getElementById('marker-details-modal');
      const overlayEl = document.getElementById('marker-modal-overlay');

      if (titleEl) titleEl.textContent = name;
      if (typeEl) typeEl.textContent = type === 'race-mark' ? 'Race Course Mark' : 'Yacht Club';
      if (coordsEl) coordsEl.textContent = lat !== 'N/A' && lng !== 'N/A' ? lat + '°, ' + lng + '°' : 'Coordinates not available';
      if (descEl) descEl.textContent = description;
      if (modalEl) modalEl.style.display = 'block';
      if (overlayEl) overlayEl.style.display = 'block';
    };

    (window as any).hideMarkerDetails = function() {

      const modalEl = document.getElementById('marker-details-modal');
      const overlayEl = document.getElementById('marker-modal-overlay');
      if (modalEl) modalEl.style.display = 'none';
      if (overlayEl) overlayEl.style.display = 'none';
    };

  };

  if (Platform.OS !== 'web') {

    logger.debug('  Platform.OS value:', Platform.OS);
    return null;
  }

  logger.debug('  ref:', mapContainerRef);

  const mergedStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px',
    overflow: 'hidden',
    ...style
  };

  return (
    <div
      ref={mapContainerRef}
      style={mergedStyle}
    />
  );
}

function getVenueCoordinates(venue: string): [number, number] {
  const coordinates = {
    'san-francisco-bay': [-122.4, 37.8],
    'newport-rhode-island': [-71.3, 41.5],
    'cowes-isle-of-wight': [-1.3, 50.76],
    'sydney-harbour': [151.2, -33.85],
    'french-riviera': [7.2, 43.7],
    'hong-kong': [114.1694, 22.3193],
    'singapore': [103.8198, 1.3521],
    'bermuda': [-64.7505, 32.2949],
    'valencia': [-0.3763, 39.4699],
    'auckland': [174.7633, -36.8485]
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
    ],
    'hong-kong': [
      { name: 'Royal Hong Kong YC', lat: 22.2783, lng: 114.1747 },
      { name: 'Aberdeen Channel', lat: 22.2481, lng: 114.1542 },
      { name: 'Middle Island', lat: 22.2934, lng: 114.1923 }
    ]
  };

  return marks[venue as keyof typeof marks] || marks['san-francisco-bay'];
}
