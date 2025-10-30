/**
 * 3D Map Component
 * Marine-grade 3D mapping component for React Native using MapLibre GL
 * Optimized for professional sailing race course visualization
 */

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import mapLibreService from '@/services/mapping/MapLibreService';

interface RaceMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
  lat: number;
  lng: number;
  elevation?: number;
  description?: string;
}

interface RaceCourse {
  id: string;
  name: string;
  type: 'windward_leeward' | 'triangle' | 'olympic' | 'custom';
  marks: RaceMark[];
  instructions: string;
  safety_notes: string[];
}

interface Map3DProps {
  center: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  style?: string;
  raceCourse?: RaceCourse;
  onMapLoad?: () => void;
  onMapClick?: (coordinates: [number, number]) => void;
  onMarkClick?: (mark: RaceMark) => void;
  showWeather?: boolean;
  showTactical?: boolean;
  interactive?: boolean;
  className?: string;
}

export interface Map3DRef {
  displayRaceCourse: (course: RaceCourse) => Promise<void>;
  addMark: (mark: RaceMark) => Promise<void>;
  removeMark: (markId: string) => Promise<void>;
  updateMark: (markId: string, updates: Partial<RaceMark>) => Promise<void>;
  fitToCourse: () => void;
  switchStyle: (styleType: 'racing' | 'navigation' | 'tactical' | 'satellite') => Promise<void>;
  exportCourse: () => RaceCourse | null;
  getMap: () => any;
}

const Map3D = forwardRef<Map3DRef, Map3DProps>(({
  center,
  zoom = 15,
  bearing = 0,
  pitch = 45,
  style,
  raceCourse,
  onMapLoad,
  onMapClick,
  onMarkClick,
  showWeather = false,
  showTactical = false,
  interactive = true,
  className,
}, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<RaceCourse | null>(raceCourse || null);

  useImperativeHandle(ref, () => ({
    displayRaceCourse: async (course: RaceCourse) => {
      if (Platform.OS === 'web' && isMapReady) {
        await mapLibreService.displayRaceCourse(course);
        setCurrentCourse(course);
      } else {
        // Mobile: Send command to WebView
        sendToWebView('displayRaceCourse', course);
        setCurrentCourse(course);
      }
    },

    addMark: async (mark: RaceMark) => {
      if (Platform.OS === 'web' && isMapReady) {
        // Update current course and redisplay
        if (currentCourse) {
          const updatedCourse = {
            ...currentCourse,
            marks: [...currentCourse.marks, mark],
          };
          await mapLibreService.displayRaceCourse(updatedCourse);
          setCurrentCourse(updatedCourse);
        }
      } else {
        sendToWebView('addMark', mark);
      }
    },

    removeMark: async (markId: string) => {
      if (Platform.OS === 'web' && isMapReady) {
        if (currentCourse) {
          const updatedCourse = {
            ...currentCourse,
            marks: currentCourse.marks.filter(m => m.id !== markId),
          };
          await mapLibreService.displayRaceCourse(updatedCourse);
          setCurrentCourse(updatedCourse);
        }
      } else {
        sendToWebView('removeMark', { markId });
      }
    },

    updateMark: async (markId: string, updates: Partial<RaceMark>) => {
      if (Platform.OS === 'web' && isMapReady) {
        if (currentCourse) {
          const updatedCourse = {
            ...currentCourse,
            marks: currentCourse.marks.map(mark =>
              mark.id === markId ? { ...mark, ...updates } : mark
            ),
          };
          await mapLibreService.displayRaceCourse(updatedCourse);
          setCurrentCourse(updatedCourse);
        }
      } else {
        sendToWebView('updateMark', { markId, updates });
      }
    },

    fitToCourse: () => {
      if (Platform.OS === 'web' && currentCourse) {
        // Implementation would call map.fitBounds
      } else {
        sendToWebView('fitToCourse');
      }
    },

    switchStyle: async (styleType) => {
      if (Platform.OS === 'web' && isMapReady) {
        await mapLibreService.switchMapStyle(styleType);
      } else {
        sendToWebView('switchStyle', { styleType });
      }
    },

    exportCourse: () => currentCourse,

    getMap: () => {
      if (Platform.OS === 'web') {
        return mapLibreService.getMap();
      }
      return null;
    },
  }));

  const sendToWebView = (action: string, data?: any) => {
    if (webViewRef.current) {
      const message = JSON.stringify({ action, data });
      webViewRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      initializeWebMap();
    }
  }, []);

  useEffect(() => {
    if (raceCourse && isMapReady) {
      if (Platform.OS === 'web') {
        mapLibreService.displayRaceCourse(raceCourse);
      } else {
        sendToWebView('displayRaceCourse', raceCourse);
      }
      setCurrentCourse(raceCourse);
    }
  }, [raceCourse, isMapReady]);

  const initializeWebMap = async () => {
    try {
      // Create map container
      const mapContainer = document.createElement('div');
      mapContainer.id = 'map-container';
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100%';

      // Find the React Native Web container and append map
      const reactContainer = document.querySelector('.map-3d-container');
      if (reactContainer) {
        reactContainer.appendChild(mapContainer);

        // Initialize MapLibre
        await mapLibreService.initializeMap(mapContainer, {
          center,
          zoom,
          bearing,
          pitch,
          style,
        });

        setIsMapReady(true);
        onMapLoad?.();
      }
    } catch (error) {

    }
  };

  // Generate HTML for WebView (mobile)
  const generateMapHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>RegattaFlow 3D Race Map</title>
        <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
        <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet">
        <style>
            body { margin: 0; padding: 0; font-family: 'Helvetica Neue', sans-serif; }
            #map { position: absolute; top: 0; bottom: 0; width: 100%; }

            /* Marine-optimized UI */
            .maplibregl-ctrl-group {
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid #475569;
                border-radius: 8px;
            }

            .maplibregl-ctrl button {
                background: transparent;
                color: #f8fafc;
                border: none;
            }

            .maplibregl-ctrl button:hover {
                background: rgba(14, 165, 233, 0.2);
            }

            .maplibregl-popup-content {
                background: rgba(15, 23, 42, 0.95);
                color: #f8fafc;
                border: 1px solid #475569;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            }

            .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
                border-top-color: rgba(15, 23, 42, 0.95);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>

        <script>
            let map;
            let currentCourse = null;

            // Initialize map
            map = new maplibregl.Map({
                container: 'map',
                style: '${style || 'https://tiles.stadiamaps.com/styles/alidade_smooth.json'}',
                center: [${center[1]}, ${center[0]}],
                zoom: ${zoom},
                bearing: ${bearing},
                pitch: ${pitch},
                antialias: true,
                attributionControl: false
            });

            // Add marine-optimized controls
            map.addControl(new maplibregl.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
            }), 'top-right');

            map.addControl(new maplibregl.ScaleControl({
                maxWidth: 100,
                unit: 'nautical'
            }), 'bottom-left');

            map.on('load', () => {
                // Map is ready
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapReady'
                }));
            });

            map.on('click', (e) => {
                const coordinates = [e.lngLat.lat, e.lngLat.lng];
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                    type: 'mapClick',
                    coordinates: coordinates
                }));
            });

            // Handle messages from React Native
            window.addEventListener('message', (event) => {
                try {
                    const { action, data } = JSON.parse(event.data);

                    switch (action) {
                        case 'displayRaceCourse':
                            displayRaceCourse(data);
                            break;
                        case 'addMark':
                            addMark(data);
                            break;
                        case 'removeMark':
                            removeMark(data.markId);
                            break;
                        case 'updateMark':
                            updateMark(data.markId, data.updates);
                            break;
                        case 'fitToCourse':
                            fitToCourse();
                            break;
                        case 'switchStyle':
                            switchStyle(data.styleType);
                            break;
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            });

            function displayRaceCourse(course) {
                currentCourse = course;
                clearCourse();

                if (!course || !course.marks || course.marks.length === 0) return;

                // Add race marks
                const markFeatures = course.marks.map(mark => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [mark.lng, mark.lat]
                    },
                    properties: {
                        id: mark.id,
                        name: mark.name,
                        type: mark.type,
                        description: mark.description || ''
                    }
                }));

                map.addSource('race-marks', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: markFeatures
                    }
                });

                // Add 3D mark visualization
                map.addLayer({
                    id: 'race-marks-3d',
                    type: 'fill-extrusion',
                    source: 'race-marks',
                    paint: {
                        'fill-extrusion-color': [
                            'case',
                            ['==', ['get', 'type'], 'start'], '#22c55e',
                            ['==', ['get', 'type'], 'finish'], '#ef4444',
                            ['==', ['get', 'type'], 'windward'], '#0ea5e9',
                            ['==', ['get', 'type'], 'leeward'], '#f59e0b',
                            '#8b5cf6'
                        ],
                        'fill-extrusion-height': 50,
                        'fill-extrusion-base': 0,
                        'fill-extrusion-opacity': 0.8
                    }
                });

                // Add mark labels
                map.addLayer({
                    id: 'race-marks-labels',
                    type: 'symbol',
                    source: 'race-marks',
                    layout: {
                        'text-field': ['get', 'name'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 14,
                        'text-offset': [0, -3],
                        'text-anchor': 'bottom'
                    },
                    paint: {
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 2
                    }
                });

                // Add course lines
                if (course.marks.length > 1) {
                    const coordinates = course.marks.map(mark => [mark.lng, mark.lat]);

                    map.addSource('course-lines', {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: coordinates
                            }
                        }
                    });

                    map.addLayer({
                        id: 'course-lines',
                        type: 'line',
                        source: 'course-lines',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#0ea5e9',
                            'line-width': 3,
                            'line-opacity': 0.8,
                            'line-dasharray': [2, 2]
                        }
                    });
                }

                // Fit to course bounds
                fitToCourse();
            }

            function clearCourse() {
                const layersToRemove = ['race-marks-3d', 'race-marks-labels', 'course-lines'];
                const sourcesToRemove = ['race-marks', 'course-lines'];

                layersToRemove.forEach(layerId => {
                    if (map.getLayer(layerId)) {
                        map.removeLayer(layerId);
                    }
                });

                sourcesToRemove.forEach(sourceId => {
                    if (map.getSource(sourceId)) {
                        map.removeSource(sourceId);
                    }
                });
            }

            function fitToCourse() {
                if (!currentCourse || !currentCourse.marks || currentCourse.marks.length === 0) return;

                const bounds = new maplibregl.LngLatBounds();
                currentCourse.marks.forEach(mark => bounds.extend([mark.lng, mark.lat]));

                map.fitBounds(bounds, {
                    padding: 100,
                    duration: 1000
                });
            }

            function addMark(mark) {
                if (currentCourse) {
                    currentCourse.marks.push(mark);
                    displayRaceCourse(currentCourse);
                }
            }

            function removeMark(markId) {
                if (currentCourse) {
                    currentCourse.marks = currentCourse.marks.filter(m => m.id !== markId);
                    displayRaceCourse(currentCourse);
                }
            }

            function updateMark(markId, updates) {
                if (currentCourse) {
                    currentCourse.marks = currentCourse.marks.map(mark =>
                        mark.id === markId ? { ...mark, ...updates } : mark
                    );
                    displayRaceCourse(currentCourse);
                }
            }

            function switchStyle(styleType) {
                const styles = {
                    racing: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
                    navigation: 'https://tiles.stadiamaps.com/styles/outdoors.json',
                    tactical: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
                    satellite: 'https://tiles.stadiamaps.com/styles/satellite.json'
                };

                const styleUrl = styles[styleType];
                if (styleUrl) {
                    map.setStyle(styleUrl);

                    map.once('styledata', () => {
                        if (currentCourse) {
                            displayRaceCourse(currentCourse);
                        }
                    });
                }
            }
        </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'mapReady':
          setIsMapReady(true);
          onMapLoad?.();
          break;
        case 'mapClick':
          onMapClick?.(message.coordinates);
          break;
        case 'markClick':
          onMarkClick?.(message.mark);
          break;
      }
    } catch (error) {

    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, className ? { className } : {}]}>
        <div className="map-3d-container" style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }

  // Mobile: Use WebView
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="compatibility"
        onError={(error) => console.error('[MAP3D] WebView error:', error)}
        onHttpError={(error) => console.error('[MAP3D] WebView HTTP error:', error)}
      />
    </View>
  );
});

Map3D.displayName = 'Map3D';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default Map3D;