/**
 * CourseModule
 *
 * Displays course information including marks, distances, and layout.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Map, Navigation, Target } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData } from '@/components/cards/types';

interface CourseModuleProps extends ContentModuleProps<CardRaceData> {}

/**
 * Course content module
 */
function CourseModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: CourseModuleProps) {
  if (isCollapsed) {
    return null;
  }

  // Extract course info from race data
  const courseName = (race as any).course_name || (race as any).courseName;
  const marks = (race as any).marks || [];
  const totalDistance = (race as any).total_distance_nm;

  return (
    <View style={styles.container}>
      {/* Course Name */}
      {courseName && (
        <View style={styles.courseHeader}>
          <Map size={16} color={IOS_COLORS.purple} />
          <Text style={styles.courseName}>{courseName}</Text>
        </View>
      )}

      {/* Distance */}
      {totalDistance && (
        <View style={styles.statRow}>
          <Navigation size={14} color={IOS_COLORS.blue} />
          <Text style={styles.statLabel}>Total Distance:</Text>
          <Text style={styles.statValue}>{totalDistance} nm</Text>
        </View>
      )}

      {/* Marks */}
      {marks.length > 0 ? (
        <View style={styles.marksSection}>
          <Text style={styles.sectionTitle}>Course Marks</Text>
          <View style={styles.marksList}>
            {marks.slice(0, 5).map((mark: any, index: number) => (
              <View key={index} style={styles.markItem}>
                <View style={styles.markNumber}>
                  <Text style={styles.markNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.markName}>
                  {typeof mark === 'string' ? mark : mark.name || `Mark ${index + 1}`}
                </Text>
              </View>
            ))}
            {marks.length > 5 && (
              <Text style={styles.moreMarks}>+{marks.length - 5} more marks</Text>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noCourseInfo}>
          <Target size={20} color={IOS_COLORS.gray2} />
          <Text style={styles.noCourseText}>
            Course details will be posted
          </Text>
          <Text style={styles.noCourseSubtext}>
            Check sailing instructions or VHF
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.gray6,
    padding: 10,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 13,
    color: IOS_COLORS.gray,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  marksSection: {
    marginTop: 4,
  },
  marksList: {
    gap: 8,
  },
  markItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: IOS_COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  markName: {
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  moreMarks: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    marginLeft: 32,
    fontStyle: 'italic',
  },
  noCourseInfo: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noCourseText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  noCourseSubtext: {
    fontSize: 12,
    color: IOS_COLORS.gray2,
  },
});

export default CourseModule;
