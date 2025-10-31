/**
 * CompactCourseCard Component
 *
 * Compact course & start area display card inspired by macOS Weather app
 */

// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherMetricCard } from './WeatherMetricCard';
import { colors, Spacing } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

interface CompactCourseCardProps {
  courseName?: string;
  startBoatName?: string;
  pinLength?: string;
  marks?: number;
}

// Simple course diagram illustration
const CourseIllustration: React.FC<{ marks: number; size: number }> = ({ marks, size }) => {
  const center = size / 2;
  const markRadius = 4;
  const courseColor = colors.primary[500];

  // Simple triangular course layout
  const startY = size * 0.75;
  const topMarkY = size * 0.25;
  const gateLeftX = center - 15;
  const gateRightX = center + 15;

  return (
    <Svg width={size} height={size}>
      {/* Start line */}
      <Line
        x1={gateLeftX}
        y1={startY}
        x2={gateRightX}
        y2={startY}
        stroke={courseColor}
        strokeWidth={2}
        strokeDasharray="4,2"
      />

      {/* Course lines */}
      <Path
        d={`M ${center},${startY} L ${center},${topMarkY} L ${gateLeftX},${startY}`}
        stroke={courseColor}
        strokeWidth={1.5}
        fill="none"
        opacity={0.5}
      />

      {/* Top mark */}
      <Circle cx={center} cy={topMarkY} r={markRadius} fill={courseColor} />

      {/* Start marks */}
      <Circle cx={gateLeftX} cy={startY} r={markRadius} fill={courseColor} />
      <Circle cx={gateRightX} cy={startY} r={markRadius} fill={courseColor} />

      {/* Start boat icon */}
      <Polygon
        points={`${center},${startY + 15} ${center - 6},${startY + 25} ${center + 6},${startY + 25}`}
        fill={courseColor}
        opacity={0.7}
      />
    </Svg>
  );
};

export const CompactCourseCard: React.FC<CompactCourseCardProps> = ({
  courseName,
  startBoatName,
  pinLength,
  marks = 3,
}) => {
  return (
    <WeatherMetricCard
      title="COURSE"
      icon="navigate-outline"
      backgroundColor={colors.background.card}
    >
      <View style={styles.container}>
        {/* Course diagram */}
        <CourseIllustration marks={marks} size={70} />

        {/* Course name */}
        {courseName && (
          <Text style={styles.courseName} numberOfLines={1}>
            {courseName}
          </Text>
        )}

        {/* Start boat info */}
        {startBoatName && (
          <View style={styles.infoRow}>
            <Ionicons name="boat-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {startBoatName}
            </Text>
          </View>
        )}

        {/* Pin length */}
        {pinLength && (
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.infoText}>{pinLength}</Text>
          </View>
        )}

        {/* Marks count */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{marks} marks</Text>
        </View>
      </View>
    </WeatherMetricCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
    paddingVertical: Spacing.xs,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[700],
    letterSpacing: 0.3,
  },
});
