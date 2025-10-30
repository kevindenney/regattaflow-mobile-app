/**
 * CourseCard Component
 *
 * Displays course selection and start area details
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '@/components/race-ui/Card';
import { CardHeader } from '@/components/race-ui/CardHeader';
import { InfoGrid, InfoItem } from '@/components/race-ui/InfoGrid';
import { EmptyState } from '@/components/race-ui/EmptyState';
import { Typography, Spacing, colors, BorderRadius } from '@/constants/designSystem';

interface Course {
  id: string;
  name: string;
  description?: string;
}

interface CourseCardProps {
  course?: Course;
  startBoatName?: string;
  startPosition?: string;
  pinLength?: string;
  boatSpacing?: string;
  onSelectCourse: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  startBoatName,
  startPosition,
  pinLength,
  boatSpacing,
  onSelectCourse,
}) => {
  return (
    <Card>
      <CardHeader icon="map-outline" title="Course & Start Area" />

      {course ? (
        <View>
          {/* Selected course info */}
          <View style={styles.selectedCourse}>
            <View style={styles.courseInfo}>
              <Text style={styles.courseName}>{course.name}</Text>
              {course.description && (
                <Text style={styles.courseDescription}>{course.description}</Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.changeButton,
                pressed && styles.changeButtonPressed,
              ]}
              onPress={onSelectCourse}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </Pressable>
          </View>

          {/* Start area details */}
          {(startBoatName || startPosition || pinLength || boatSpacing) && (
            <View style={styles.startAreaSection}>
              <Text style={styles.sectionLabel}>START AREA DETAILS</Text>
              <InfoGrid>
                {startBoatName && (
                  <InfoItem label="Start Boat Name" value={startBoatName} />
                )}
                {startPosition && (
                  <InfoItem label="Start Boat Position" value={startPosition} />
                )}
                {pinLength && <InfoItem label="Pin End Length" value={pinLength} />}
                {boatSpacing && (
                  <InfoItem label="Boat-to-Boat Spacing" value={boatSpacing} />
                )}
              </InfoGrid>
            </View>
          )}
        </View>
      ) : (
        <EmptyState
          icon="map-outline"
          title="No course selected"
          description="Select a course from your library"
          action={
            <Pressable style={styles.selectButton} onPress={onSelectCourse}>
              <Text style={styles.selectButtonText}>Select Course from Library</Text>
            </Pressable>
          }
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  selectedCourse: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
  },
  courseInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  courseName: {
    ...Typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  courseDescription: {
    ...Typography.caption,
    color: colors.text.secondary,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  changeButtonPressed: {
    opacity: 0.7,
  },
  changeButtonText: {
    ...Typography.body,
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  startAreaSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionLabel: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  selectButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.primary[600],
    borderRadius: BorderRadius.medium,
  },
  selectButtonText: {
    ...Typography.bodyBold,
    color: colors.text.inverse,
  },
});
