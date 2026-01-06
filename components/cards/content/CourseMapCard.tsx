/**
 * CourseMapCard - Position 1
 *
 * Shows the race course with:
 * - MapLibre map of the race area
 * - Mark positions with labels
 * - Start/finish line visualization
 * - Bearing and distance between marks
 * - Current/tide overlay
 *
 * This card integrates with the venue's course data.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import {
  Map,
  Navigation,
  Flag,
  Anchor,
  ArrowRight,
  Compass,
  CornerDownRight,
} from 'lucide-react-native';

import { CardContentProps } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface CourseMark {
  id: string;
  name: string;
  type: 'start' | 'finish' | 'windward' | 'leeward' | 'gate' | 'offset' | 'spreader';
  latitude?: number;
  longitude?: number;
  rounding?: 'port' | 'starboard';
  sequence?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get icon for mark type
 */
function getMarkIcon(type: CourseMark['type']) {
  switch (type) {
    case 'start':
    case 'finish':
      return Flag;
    case 'windward':
      return Navigation;
    case 'leeward':
      return Anchor;
    case 'gate':
      return CornerDownRight;
    default:
      return Compass;
  }
}

/**
 * Get color for mark type
 */
function getMarkColor(type: CourseMark['type']): string {
  switch (type) {
    case 'start':
      return '#22C55E';
    case 'finish':
      return '#EF4444';
    case 'windward':
      return '#F59E0B';
    case 'leeward':
      return '#3B82F6';
    case 'gate':
      return '#8B5CF6';
    default:
      return '#6B7280';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CourseMapCard({
  race,
  cardType,
  isActive,
  dimensions,
}: CardContentProps) {
  // Extract course info from race data
  const courseName = (race as any).metadata?.selected_course_name || 'Course';
  const courseMarks: CourseMark[] = useMemo(() => {
    // Try to get marks from race data
    const marks = (race as any).marks || (race as any).courseMarks || [];
    if (marks.length > 0) return marks;

    // Default course marks for demo
    return [
      { id: '1', name: 'Start Line', type: 'start', sequence: 1 },
      { id: '2', name: 'Windward Mark', type: 'windward', sequence: 2, rounding: 'port' },
      { id: '3', name: 'Leeward Gate', type: 'gate', sequence: 3, rounding: 'port' },
      { id: '4', name: 'Windward Mark', type: 'windward', sequence: 4, rounding: 'port' },
      { id: '5', name: 'Finish Line', type: 'finish', sequence: 5 },
    ];
  }, [race]);

  // Course type (inferred from marks)
  const courseType = useMemo(() => {
    const hasGate = courseMarks.some((m) => m.type === 'gate');
    const windwardCount = courseMarks.filter((m) => m.type === 'windward').length;
    const leewardCount = courseMarks.filter((m) => m.type === 'leeward').length;

    if (windwardCount >= 2 && (leewardCount >= 1 || hasGate)) {
      return 'Windward-Leeward';
    }
    if (courseMarks.length >= 4) {
      return 'Triangle';
    }
    return 'Custom';
  }, [courseMarks]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Map size={20} color="#3B82F6" />
          <Text style={styles.title}>Course Map</Text>
        </View>
        <View style={styles.courseTypeBadge}>
          <Text style={styles.courseTypeText}>{courseType}</Text>
        </View>
      </View>

      {/* Course Name */}
      <Text style={styles.courseName}>{courseName}</Text>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Map size={48} color="#D1D5DB" />
          <Text style={styles.mapPlaceholderText}>Course Map</Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Interactive map coming soon
          </Text>
        </View>

        {/* Course Diagram Overlay */}
        <View style={styles.courseDiagram}>
          {/* Simplified course representation */}
          <View style={styles.courseLineVertical} />
          <View style={[styles.markDot, styles.markWindward]} />
          <View style={styles.courseLineHorizontal} />
          <View style={[styles.markDot, styles.markLeeward]} />
          <View style={styles.courseLineVertical2} />
          <View style={[styles.markDot, styles.markStart]} />
        </View>
      </View>

      {/* Mark List */}
      <View style={styles.marksSection}>
        <Text style={styles.sectionTitle}>Course Marks</Text>
        <View style={styles.marksList}>
          {courseMarks.map((mark, index) => {
            const Icon = getMarkIcon(mark.type);
            const color = getMarkColor(mark.type);

            return (
              <View key={mark.id} style={styles.markRow}>
                <View style={styles.markSequence}>
                  <Text style={styles.sequenceNumber}>{index + 1}</Text>
                </View>
                <View style={[styles.markIcon, { backgroundColor: `${color}20` }]}>
                  <Icon size={16} color={color} />
                </View>
                <View style={styles.markInfo}>
                  <Text style={styles.markName}>{mark.name}</Text>
                  {mark.rounding && (
                    <Text style={styles.markRounding}>
                      {mark.rounding === 'port' ? '← Port' : '→ Starboard'}
                    </Text>
                  )}
                </View>
                {index < courseMarks.length - 1 && (
                  <ArrowRight size={14} color="#D1D5DB" style={styles.arrowIcon} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Course Info */}
      <View style={styles.courseInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Marks</Text>
          <Text style={styles.infoValue}>{courseMarks.length}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Roundings</Text>
          <Text style={styles.infoValue}>
            {courseMarks.filter((m) => m.rounding).length}
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={styles.infoValue}>{courseType}</Text>
        </View>
      </View>

    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  courseTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  courseTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // Course name
  courseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  // Map
  mapContainer: {
    height: 200,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 4,
  },

  // Course diagram overlay
  courseDiagram: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseLineVertical: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: '#3B82F620',
    top: 30,
  },
  courseLineVertical2: {
    position: 'absolute',
    width: 2,
    height: 80,
    backgroundColor: '#3B82F620',
    bottom: 30,
  },
  courseLineHorizontal: {
    position: 'absolute',
    width: 80,
    height: 2,
    backgroundColor: '#3B82F620',
  },
  markDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  markWindward: {
    top: 25,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  markLeeward: {
    bottom: 25,
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  markStart: {
    bottom: 15,
    left: '30%',
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  // Marks section
  marksSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  marksList: {
    gap: 8,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  markSequence: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sequenceNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  markIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  markInfo: {
    flex: 1,
  },
  markName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  markRounding: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  arrowIcon: {
    marginLeft: 8,
  },

  // Course info
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
});

export default CourseMapCard;
