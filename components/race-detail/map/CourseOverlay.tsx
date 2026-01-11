/**
 * CourseOverlay Component
 *
 * Displays race course on map: start line, course marks, path, and finish line
 * Enhanced with mark type icons, colors, and labels
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, TurboModuleRegistry } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/designSystem';
import type { CourseMark, MarkType } from '@/types/raceEvents';

// Conditional imports for native only
let Polyline: any = null;
let Marker: any = null;
let Callout: any = null;
let mapsAvailable = false;

// Check if native module is registered BEFORE requiring react-native-maps
if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      const maps = require('react-native-maps');
      Polyline = maps.Polyline;
      Marker = maps.Marker;
      Callout = maps.Callout;
      mapsAvailable = true;
    }
  } catch (e) {
    console.warn('[CourseOverlay] react-native-maps not available:', e);
  }
}

// Mark colors matching web TacticalRaceMap
const MARK_COLORS: Record<string, string> = {
  start: '#22c55e',
  committee_boat: '#22c55e',
  pin: '#22c55e',
  finish: '#ef4444',
  windward: '#3b82f6',
  leeward: '#f59e0b',
  gate_left: '#8b5cf6',
  gate_right: '#8b5cf6',
  offset: '#ec4899',
};

const getMarkColor = (type?: string | null): string => {
  if (!type) return '#64748b';
  return MARK_COLORS[type] || '#64748b';
};

// Mark icons
const getMarkIcon = (type?: string | null): { name: keyof typeof Ionicons.glyphMap; size: number } => {
  switch (type) {
    case 'committee_boat':
      return { name: 'boat-outline', size: 16 };
    case 'windward':
      return { name: 'arrow-up-outline', size: 14 };
    case 'leeward':
      return { name: 'arrow-down-outline', size: 14 };
    case 'gate_left':
    case 'gate_right':
      return { name: 'git-branch-outline', size: 14 };
    case 'pin':
      return { name: 'flag-outline', size: 14 };
    case 'finish':
      return { name: 'checkmark-outline', size: 14 };
    case 'offset':
      return { name: 'ellipse-outline', size: 14 };
    default:
      return { name: 'location-outline', size: 14 };
  }
};

// Mark display names
const getMarkDisplayName = (mark: EnhancedMark): string => {
  if (mark.name) return mark.name;

  const names: Record<string, string> = {
    committee_boat: 'Committee Boat',
    pin: 'Pin',
    windward: 'Windward Mark',
    leeward: 'Leeward Mark',
    gate_left: 'Gate A',
    gate_right: 'Gate B',
    offset: 'Offset Mark',
    finish: 'Finish',
    start: 'Start',
  };

  return names[mark.type || ''] || `Mark ${mark.sequence || ''}`;
};

// Enhanced mark interface supporting both legacy Course format and CourseMark
interface EnhancedMark {
  id?: string;
  coordinate: { latitude: number; longitude: number };
  name?: string;
  type?: string | null;
  sequence?: number;
  rounding?: string | null;
}

interface Course {
  startLine: Array<{ latitude: number; longitude: number }>;
  finishLine?: Array<{ latitude: number; longitude: number }>;
  marks: EnhancedMark[];
  path: Array<{ latitude: number; longitude: number }>;
}

interface CourseOverlayProps {
  course: Course;
  onMarkPress?: (mark: EnhancedMark) => void;
  showLabels?: boolean;
}

export const CourseOverlay: React.FC<CourseOverlayProps> = ({
  course,
  onMarkPress,
  showLabels = true
}) => {
  return (
    <>
      {/* Start line - GREEN with thicker stroke */}
      <Polyline
        coordinates={course.startLine}
        strokeColor={MARK_COLORS.start}
        strokeWidth={4}
        lineCap="round"
      />

      {/* Course marks with type-based styling */}
      {course.marks.map((mark, index) => {
        const markColor = getMarkColor(mark.type);
        const markIcon = getMarkIcon(mark.type);
        const isGate = mark.type === 'gate_left' || mark.type === 'gate_right';

        return (
          <Marker
            key={mark.id || `mark-${index}`}
            coordinate={mark.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onMarkPress?.(mark)}
            tracksViewChanges={false}
          >
            <View style={[
              styles.courseMark,
              { backgroundColor: markColor },
              isGate && styles.gateMark
            ]}>
              <Ionicons
                name={markIcon.name}
                size={markIcon.size}
                color="#ffffff"
              />
            </View>
            {showLabels && Callout && (
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{getMarkDisplayName(mark)}</Text>
                  {mark.rounding && (
                    <Text style={styles.calloutSubtitle}>
                      Round to {mark.rounding}
                    </Text>
                  )}
                </View>
              </Callout>
            )}
          </Marker>
        );
      })}

      {/* Course path - BLUE DASHED with arrows */}
      {course.path.length > 0 && (
        <Polyline
          coordinates={course.path}
          strokeColor="#0ea5e9"
          strokeWidth={3}
          lineDashPattern={[8, 4]}
          lineCap="round"
        />
      )}

      {/* Finish line - RED/GOLD checkerboard style */}
      {course.finishLine && course.finishLine.length > 0 && (
        <>
          {/* Outer glow */}
          <Polyline
            coordinates={course.finishLine}
            strokeColor="rgba(239, 68, 68, 0.3)"
            strokeWidth={8}
            lineCap="round"
          />
          {/* Main line */}
          <Polyline
            coordinates={course.finishLine}
            strokeColor={MARK_COLORS.finish}
            strokeWidth={4}
            lineCap="round"
          />
        </>
      )}
    </>
  );
};

// Helper function to convert CourseMark[] to Course format
export const convertMarksToCoourse = (marks: CourseMark[]): Course => {
  // Extract coordinates from marks
  const marksWithCoords = marks.map(m => ({
    id: m.id,
    name: m.mark_name || undefined,
    type: m.mark_type || undefined,
    sequence: m.sequence || undefined,
    rounding: m.rounding || undefined,
    coordinate: {
      latitude: m.latitude,
      longitude: m.longitude,
    },
  })).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  // Find start line marks
  const committeeBoat = marksWithCoords.find(m =>
    m.type === 'committee_boat' || m.name?.toLowerCase().includes('committee')
  );
  const pin = marksWithCoords.find(m =>
    m.type === 'pin' || m.name?.toLowerCase().includes('pin')
  );

  // Find finish marks
  const finishMark = marksWithCoords.find(m =>
    m.type === 'finish' || m.name?.toLowerCase().includes('finish')
  );

  // Build start line
  const startLine: Array<{ latitude: number; longitude: number }> = [];
  if (committeeBoat && pin) {
    startLine.push(committeeBoat.coordinate, pin.coordinate);
  }

  // Build finish line (committee boat to finish mark if exists)
  const finishLine: Array<{ latitude: number; longitude: number }> = [];
  if (committeeBoat && finishMark) {
    finishLine.push(committeeBoat.coordinate, finishMark.coordinate);
  }

  // Racing marks (exclude start/finish line marks)
  const racingMarks = marksWithCoords.filter(m =>
    m.type !== 'committee_boat' &&
    m.type !== 'pin' &&
    !m.name?.toLowerCase().includes('committee') &&
    !m.name?.toLowerCase().includes('pin')
  );

  // Build course path through marks
  const path: Array<{ latitude: number; longitude: number }> = [];

  // Start from middle of start line
  if (startLine.length === 2) {
    path.push({
      latitude: (startLine[0].latitude + startLine[1].latitude) / 2,
      longitude: (startLine[0].longitude + startLine[1].longitude) / 2,
    });
  }

  // Add racing marks to path
  racingMarks.forEach(mark => {
    path.push(mark.coordinate);
  });

  // End at middle of finish line
  if (finishLine.length === 2) {
    path.push({
      latitude: (finishLine[0].latitude + finishLine[1].latitude) / 2,
      longitude: (finishLine[0].longitude + finishLine[1].longitude) / 2,
    });
  }

  return {
    startLine,
    finishLine,
    marks: marksWithCoords,
    path,
  };
};

const styles = StyleSheet.create({
  courseMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gateMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  calloutContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  calloutTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  calloutSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
});
