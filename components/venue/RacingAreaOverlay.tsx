/**
 * RacingAreaOverlay Component
 * Renders racing areas, marks, and prohibited zones on Google Maps
 * Used within VenueMapView to show racing-relevant features
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useVenueRacingAreas, VenueRacingArea } from '@/hooks/useVenueRacingAreas';

interface RacingAreaOverlayProps {
  venueId?: string;
  map?: google.maps.Map | null;
  showRacingAreas?: boolean;
  showMarks?: boolean;
  showProhibitedZones?: boolean;
  showStartFinish?: boolean;
  onAreaClick?: (area: VenueRacingArea) => void;
}

/**
 * Renders racing area overlays on a Google Map instance
 * This component manages the lifecycle of Google Maps overlays
 */
export function RacingAreaOverlay({
  venueId,
  map,
  showRacingAreas = true,
  showMarks = true,
  showProhibitedZones = true,
  showStartFinish = true,
  onAreaClick,
}: RacingAreaOverlayProps) {
  const { areas, racingAreas, marks, prohibitedZones, startFinishLines, isLoading, error } = useVenueRacingAreas(venueId);
  
  // Store references to rendered overlays for cleanup
  const overlaysRef = React.useRef<(google.maps.Polygon | google.maps.Polyline | google.maps.Marker)[]>([]);

  // Clean up overlays when component unmounts or map changes
  React.useEffect(() => {
    return () => {
      overlaysRef.current.forEach(overlay => {
        overlay.setMap(null);
      });
      overlaysRef.current = [];
    };
  }, [map]);

  // Render overlays when areas or visibility changes
  React.useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    // Clear existing overlays
    overlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    overlaysRef.current = [];

    // Render racing areas (polygons)
    if (showRacingAreas) {
      racingAreas.forEach(area => {
        if (area.geometry.type === 'Polygon') {
          const coords = (area.geometry.coordinates as number[][][])[0].map(coord => ({
            lat: coord[1],
            lng: coord[0],
          }));

          const polygon = new google.maps.Polygon({
            paths: coords,
            strokeColor: area.strokeColor,
            strokeOpacity: 1,
            strokeWeight: area.strokeWidth,
            fillColor: area.fillColor.replace(/[0-9a-f]{2}$/i, ''), // Remove alpha from hex
            fillOpacity: area.fillOpacity,
            map,
          });

          polygon.addListener('click', () => onAreaClick?.(area));
          overlaysRef.current.push(polygon);
        }
      });
    }

    // Render start/finish lines (polylines)
    if (showStartFinish) {
      startFinishLines.forEach(area => {
        if (area.geometry.type === 'LineString') {
          const coords = (area.geometry.coordinates as number[][]).map(coord => ({
            lat: coord[1],
            lng: coord[0],
          }));

          const polyline = new google.maps.Polyline({
            path: coords,
            strokeColor: area.areaType === 'start_line' ? '#059669' : '#dc2626',
            strokeOpacity: 1,
            strokeWeight: 4,
            map,
          });

          polyline.addListener('click', () => onAreaClick?.(area));
          overlaysRef.current.push(polyline);
        }
      });
    }

    // Render prohibited zones (polygons with dashed border)
    if (showProhibitedZones) {
      prohibitedZones.forEach(area => {
        if (area.geometry.type === 'Polygon') {
          const coords = (area.geometry.coordinates as number[][][])[0].map(coord => ({
            lat: coord[1],
            lng: coord[0],
          }));

          const polygon = new google.maps.Polygon({
            paths: coords,
            strokeColor: '#dc2626',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#dc2626',
            fillOpacity: 0.15,
            map,
          });

          polygon.addListener('click', () => onAreaClick?.(area));
          overlaysRef.current.push(polygon);
        }
      });
    }

    // Render course marks (markers)
    if (showMarks) {
      marks.forEach(area => {
        if (area.geometry.type === 'Point') {
          const [lng, lat] = area.geometry.coordinates as number[];

          const marker = new google.maps.Marker({
            position: { lat, lng },
            map,
            title: area.markName || area.areaName,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: area.areaType === 'gate' ? '#f97316' : '#0284c7',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => onAreaClick?.(area));
          overlaysRef.current.push(marker);
        }
      });
    }
  }, [map, areas, showRacingAreas, showMarks, showProhibitedZones, showStartFinish, onAreaClick, racingAreas, prohibitedZones, startFinishLines, marks]);

  // This component doesn't render any visible React elements
  // It only manages Google Maps overlays
  return null;
}

/**
 * Racing Area Legend Component
 * Shows a legend explaining the map overlays
 */
export function RacingAreaLegend({
  showRacingAreas,
  showMarks,
  showProhibitedZones,
  showStartFinish,
}: {
  showRacingAreas?: boolean;
  showMarks?: boolean;
  showProhibitedZones?: boolean;
  showStartFinish?: boolean;
}) {
  const items = [];
  
  if (showRacingAreas) {
    items.push({ color: '#0284c7', label: 'Racing Area', type: 'polygon' });
  }
  if (showStartFinish) {
    items.push({ color: '#059669', label: 'Start Line', type: 'line' });
    items.push({ color: '#dc2626', label: 'Finish Line', type: 'line' });
  }
  if (showMarks) {
    items.push({ color: '#0284c7', label: 'Course Mark', type: 'point' });
    items.push({ color: '#f97316', label: 'Gate', type: 'point' });
  }
  if (showProhibitedZones) {
    items.push({ color: '#dc2626', label: 'Prohibited Zone', type: 'polygon' });
  }

  if (items.length === 0) return null;

  return (
    <View style={styles.legend}>
      <ThemedText style={styles.legendTitle}>Map Legend</ThemedText>
      <View style={styles.legendItems}>
        {items.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            {item.type === 'polygon' && (
              <View style={[styles.legendPolygon, { backgroundColor: item.color + '40', borderColor: item.color }]} />
            )}
            {item.type === 'line' && (
              <View style={[styles.legendLine, { backgroundColor: item.color }]} />
            )}
            {item.type === 'point' && (
              <View style={[styles.legendPoint, { backgroundColor: item.color }]} />
            )}
            <ThemedText style={styles.legendLabel}>{item.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Racing Area Info Card
 * Displays details about a selected racing area
 */
export function RacingAreaInfoCard({
  area,
  onClose,
}: {
  area: VenueRacingArea | null;
  onClose: () => void;
}) {
  if (!area) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'racing_area': return 'map';
      case 'practice_area': return 'fitness';
      case 'start_line': return 'flag';
      case 'finish_line': return 'checkmark-circle';
      case 'mark': return 'location';
      case 'gate': return 'git-merge';
      case 'prohibited_zone': return 'warning';
      default: return 'help-circle';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prohibited_zone': return '#dc2626';
      case 'start_line': return '#059669';
      case 'finish_line': return '#dc2626';
      case 'mark':
      case 'gate': return '#f97316';
      default: return '#0284c7';
    }
  };

  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.infoHeaderLeft}>
          <Ionicons name={getTypeIcon(area.areaType) as any} size={20} color={getTypeColor(area.areaType)} />
          <ThemedText style={styles.infoTitle}>{area.areaName}</ThemedText>
        </View>
        <Ionicons name="close" size={24} color="#6b7280" onPress={onClose} />
      </View>

      {area.description && (
        <ThemedText style={styles.infoDescription}>{area.description}</ThemedText>
      )}

      {area.areaType === 'mark' && area.rounding && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Rounding:</ThemedText>
          <ThemedText style={styles.infoValue}>Leave to {area.rounding}</ThemedText>
        </View>
      )}

      {area.typicalCourses && area.typicalCourses.length > 0 && (
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Courses:</ThemedText>
          <ThemedText style={styles.infoValue}>{area.typicalCourses.join(', ')}</ThemedText>
        </View>
      )}

      {area.areaType === 'prohibited_zone' && area.restrictionReason && (
        <View style={styles.warningBox}>
          <Ionicons name="warning" size={16} color="#dc2626" />
          <ThemedText style={styles.warningText}>{area.restrictionReason}</ThemedText>
        </View>
      )}

      {area.penaltyForViolation && (
        <ThemedText style={styles.penaltyText}>
          Penalty: {area.penaltyForViolation}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Legend
  legend: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    maxWidth: 200,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  legendItems: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendPolygon: {
    width: 16,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1,
  },
  legendPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: '#6b7280',
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    maxWidth: 320,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  infoDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#991b1b',
    flex: 1,
    lineHeight: 18,
  },
  penaltyText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 8,
  },
});

export default RacingAreaOverlay;

