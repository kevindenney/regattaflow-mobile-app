/**
 * Course Detail Card
 * Compact view of course information for the detail zone
 */

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Mark {
  id: string;
  name: string;
  type: 'windward' | 'leeward' | 'gate' | 'offset' | 'start' | 'finish' | 'waypoint';
}

interface CourseDetailCardProps {
  raceId: string;
  courseName?: string;
  courseType?: 'windward-leeward' | 'triangle' | 'trapezoid' | 'distance' | 'custom';
  numberOfLegs?: number;
  approximateDistance?: string;
  marks?: Mark[];
  onPress?: () => void;
}

export function CourseDetailCard({
  raceId,
  courseName,
  courseType,
  numberOfLegs,
  approximateDistance,
  marks,
  onPress,
}: CourseDetailCardProps) {
  const hasData = courseName || courseType || numberOfLegs || marks?.length;

  const getCourseTypeLabel = (type?: string) => {
    switch (type) {
      case 'windward-leeward':
        return 'Windward-Leeward';
      case 'triangle':
        return 'Triangle';
      case 'trapezoid':
        return 'Trapezoid';
      case 'distance':
        return 'Distance Race';
      case 'custom':
        return 'Custom';
      default:
        return type || 'Unknown';
    }
  };

  const getCourseIcon = (type?: string) => {
    switch (type) {
      case 'windward-leeward':
        return 'arrow-up-down';
      case 'triangle':
        return 'triangle-outline';
      case 'distance':
        return 'map-marker-path';
      default:
        return 'map-marker-multiple';
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="map-outline" size={18} color="#10B981" />
        </View>
        <Text style={styles.headerTitle}>Course</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      </View>

      {hasData ? (
        <View style={styles.content}>
          {/* Course Name & Type */}
          <View style={styles.courseInfo}>
            {courseName && (
              <Text style={styles.courseName}>{courseName}</Text>
            )}
            {courseType && (
              <View style={styles.typeBadge}>
                <MaterialCommunityIcons
                  name={getCourseIcon(courseType) as any}
                  size={12}
                  color="#10B981"
                />
                <Text style={styles.typeBadgeText}>
                  {getCourseTypeLabel(courseType)}
                </Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {numberOfLegs !== undefined && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{numberOfLegs}</Text>
                <Text style={styles.statLabel}>Legs</Text>
              </View>
            )}
            {marks && marks.length > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{marks.length}</Text>
                <Text style={styles.statLabel}>Marks</Text>
              </View>
            )}
            {approximateDistance && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{approximateDistance}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            )}
          </View>

          {/* Marks Preview */}
          {marks && marks.length > 0 && (
            <View style={styles.marksPreview}>
              {marks.slice(0, 4).map((mark, index) => (
                <View key={mark.id} style={styles.markChip}>
                  <MaterialCommunityIcons name="map-marker" size={10} color="#64748B" />
                  <Text style={styles.markName} numberOfLines={1}>
                    {mark.name}
                  </Text>
                </View>
              ))}
              {marks.length > 4 && (
                <Text style={styles.moreMarks}>+{marks.length - 4} more</Text>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>No course set</Text>
          <Text style={styles.emptySubtext}>Tap to select a course</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  content: {
    gap: 10,
  },
  courseInfo: {
    gap: 6,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  marksPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  markChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  markName: {
    fontSize: 10,
    color: '#475569',
    maxWidth: 60,
  },
  moreMarks: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
