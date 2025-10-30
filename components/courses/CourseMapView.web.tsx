import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import maplibregl, { GeoJSONSource, LngLatBoundsLike, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'mark' | 'finish' | 'gate';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  color?: string;
}

interface CourseMapViewProps {
  courseMarks?: CourseMark[];
  centerCoordinate?: { latitude: number; longitude: number };
  onMarkPress?: (mark: CourseMark) => void;
  onMarkMove?: (
    markId: string,
    coordinates: { latitude: number; longitude: number }
  ) => void;
  selectedMarkId?: string;
}

const LINE_SOURCE_ID = 'course-line';
const LINE_LAYER_ID = 'course-line-layer';

const MARK_COLORS: Record<CourseMark['type'], string> = {
  start: '#16a34a',
  finish: '#ef4444',
  gate: '#8b5cf6',
  mark: '#2563eb',
};

const MAP_STYLE = 'https://demotiles.maplibre.org/style.json';

const CourseMapView: React.FC<CourseMapViewProps> = ({
  courseMarks = [],
  centerCoordinate = { latitude: 22.2793, longitude: 114.1628 },
  onMarkPress,
  onMarkMove,
  selectedMarkId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const hasFitToBoundsRef = useRef(false);
  const previousCountRef = useRef(courseMarks.length);

  const bounds = useMemo(() => {
    if (!courseMarks.length) return null;
    const mapBounds = new maplibregl.LngLatBounds();
    courseMarks.forEach((mark) => {
      mapBounds.extend([mark.coordinates.longitude, mark.coordinates.latitude]);
    });
    return mapBounds;
  }, [courseMarks]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [centerCoordinate.longitude, centerCoordinate.latitude],
      zoom: 11,
      pitch: 45,
      bearing: 0,
      antialias: true,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'nautical' }), 'bottom-left');

    const handleLoad = () => {
      setMapReady(true);
    };

    map.on('load', handleLoad);

    return () => {
      map.off('load', handleLoad);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [centerCoordinate.latitude, centerCoordinate.longitude]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;

    // Remove previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    courseMarks.forEach((mark) => {
      const isSelected = selectedMarkId === mark.id;
      const markerEl = document.createElement('div');
      markerEl.style.width = isSelected ? '18px' : '14px';
      markerEl.style.height = markerEl.style.width;
      markerEl.style.borderRadius = '9999px';
      markerEl.style.border = isSelected ? '2px solid #0ea5e9' : '2px solid rgba(15,23,42,0.4)';
      markerEl.style.backgroundColor = mark.color || MARK_COLORS[mark.type] || '#2563eb';
      markerEl.style.boxShadow = '0 2px 8px rgba(15,23,42,0.25)';
      markerEl.style.cursor = onMarkMove ? 'grab' : 'pointer';

      markerEl.setAttribute('data-marker-id', mark.id);

      markerEl.addEventListener('click', (event) => {
        event.stopPropagation();
        onMarkPress?.(mark);
      });

      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'center',
      })
        .setLngLat([mark.coordinates.longitude, mark.coordinates.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${mark.name}</strong><br/>${mark.type.toUpperCase()}`
          )
        )
        .addTo(map);

      marker.setDraggable(!!onMarkMove);

      if (onMarkMove) {
        marker.on('dragstart', () => {
          markerEl.style.cursor = 'grabbing';
        });
        marker.on('dragend', () => {
          markerEl.style.cursor = 'grab';
          const position = marker.getLngLat();
          onMarkMove(mark.id, { latitude: position.lat, longitude: position.lng });
        });
      }

      markersRef.current.push(marker);
    });

    const coordinates = courseMarks.map((mark) => [mark.coordinates.longitude, mark.coordinates.latitude]);

    if (coordinates.length >= 2) {
      const lineFeature = {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
        properties: {},
      };

      if (!map.getSource(LINE_SOURCE_ID)) {
        map.addSource(LINE_SOURCE_ID, {
          type: 'geojson',
          data: lineFeature,
        });

        map.addLayer({
          id: LINE_LAYER_ID,
          type: 'line',
          source: LINE_SOURCE_ID,
          paint: {
            'line-color': '#0ea5e9',
            'line-width': 3,
            'line-dasharray': [1.5, 1.5],
          },
        });
      } else {
        (map.getSource(LINE_SOURCE_ID) as GeoJSONSource).setData(lineFeature);
      }
    } else if (map.getLayer(LINE_LAYER_ID)) {
      map.removeLayer(LINE_LAYER_ID);
      map.removeSource(LINE_SOURCE_ID);
    }

    if (courseMarks.length > 0 && bounds && !bounds.isEmpty()) {
      const shouldAnimate =
        !hasFitToBoundsRef.current || previousCountRef.current !== courseMarks.length;
      map.fitBounds(bounds as LngLatBoundsLike, {
        padding: 80,
        duration: shouldAnimate ? 600 : 0,
      });
      hasFitToBoundsRef.current = true;
      previousCountRef.current = courseMarks.length;
    } else if (!courseMarks.length) {
      map.easeTo({
        center: [centerCoordinate.longitude, centerCoordinate.latitude],
        zoom: 11,
        duration: 400,
      });
      hasFitToBoundsRef.current = false;
      previousCountRef.current = 0;
    }
  }, [
    courseMarks,
    mapReady,
    onMarkPress,
    onMarkMove,
    selectedMarkId,
    bounds,
    centerCoordinate.longitude,
    centerCoordinate.latitude,
  ]);

  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
      />
      {!mapReady && (
        <View
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
          }}
        >
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      )}
    </View>
  );
};

export default CourseMapView;
