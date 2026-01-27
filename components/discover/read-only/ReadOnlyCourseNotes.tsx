/**
 * ReadOnlyCourseNotes Component
 *
 * Displays sailor's course selection and notes in read-only mode.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Navigation, FileText, CheckCircle } from 'lucide-react-native';
import { CourseSelectionIntention } from '@/types/raceIntentions';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface ReadOnlyCourseNotesProps {
  courseSelection?: CourseSelectionIntention;
}

export function ReadOnlyCourseNotes({
  courseSelection,
}: ReadOnlyCourseNotesProps) {
  if (!courseSelection) {
    return (
      <Text style={styles.emptyText}>No course notes shared</Text>
    );
  }

  const hasCourseName = Boolean(courseSelection.selectedCourseName?.trim());
  const hasCourseSequence = Boolean(courseSelection.selectedCourseSequence?.trim());
  const hasNotes = Boolean(courseSelection.notes?.trim());
  const identifiedFromSI = courseSelection.identifiedFromSI;
  const isConfirmed = courseSelection.confirmed;

  if (!hasCourseName && !hasCourseSequence && !hasNotes) {
    return (
      <Text style={styles.emptyText}>No course notes shared</Text>
    );
  }

  return (
    <View style={styles.container}>
      {/* Course Name */}
      {hasCourseName && (
        <View style={styles.courseHeader}>
          <View style={styles.courseIconContainer}>
            <Navigation size={20} color={IOS_COLORS.systemPurple} />
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{courseSelection.selectedCourseName}</Text>
            <View style={styles.badges}>
              {identifiedFromSI && (
                <View style={styles.badge}>
                  <FileText size={10} color={IOS_COLORS.systemBlue} />
                  <Text style={styles.badgeText}>From SI</Text>
                </View>
              )}
              {isConfirmed && (
                <View style={[styles.badge, styles.confirmedBadge]}>
                  <CheckCircle size={10} color={IOS_COLORS.systemGreen} />
                  <Text style={[styles.badgeText, styles.confirmedText]}>Confirmed</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Course Sequence */}
      {hasCourseSequence && (
        <View style={styles.sequenceSection}>
          <Text style={styles.sequenceLabel}>Course Sequence</Text>
          <View style={styles.sequenceContainer}>
            <Text style={styles.sequenceText}>{courseSelection.selectedCourseSequence}</Text>
          </View>
        </View>
      )}

      {/* Course Notes */}
      {hasNotes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{courseSelection.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: IOS_COLORS.systemGray6,
    padding: 14,
    borderRadius: 10,
  },
  courseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.systemPurple}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confirmedBadge: {
    backgroundColor: `${IOS_COLORS.systemGreen}15`,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  confirmedText: {
    color: IOS_COLORS.systemGreen,
  },
  sequenceSection: {
    gap: 6,
  },
  sequenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  sequenceContainer: {
    backgroundColor: IOS_COLORS.systemGray6,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.systemPurple,
  },
  sequenceText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  notesSection: {
    gap: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  notesText: {
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },
});

export default ReadOnlyCourseNotes;
