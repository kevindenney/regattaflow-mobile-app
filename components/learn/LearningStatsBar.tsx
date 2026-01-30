/**
 * LearningStatsBar - Single-line learning journey summary
 *
 * Displays: "3 of 12 courses started · 1 completed · ~8 hrs remaining"
 */

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';

interface LearningStatsBarProps {
  coursesStarted: number;
  totalCourses: number;
  coursesCompleted: number;
  estimatedHoursRemaining: number;
}

export function LearningStatsBar({
  coursesStarted,
  totalCourses,
  coursesCompleted,
  estimatedHoursRemaining,
}: LearningStatsBarProps) {
  const parts: string[] = [];

  parts.push(`${coursesStarted} of ${totalCourses} courses started`);

  if (coursesCompleted > 0) {
    parts.push(`${coursesCompleted} completed`);
  }

  if (estimatedHoursRemaining > 0) {
    parts.push(`~${estimatedHoursRemaining} hrs remaining`);
  }

  return (
    <Text style={styles.text}>
      {parts.join(' · ')}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 12,
  },
});
