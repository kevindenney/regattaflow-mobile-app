/**
 * CourseRow Component
 * Tufte-inspired compact course list row (~80px height)
 * Displays course title, description, metadata, and progress inline
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Course } from '@/services/CourseCatalogService';
import { ProgressDots } from './ProgressDots';

// Design tokens (Tufte-inspired)
const TOKENS = {
  rowMinHeight: 80,
  rowPadding: 16,
  metadataSeparator: ' \u00B7 ', // middle dot
  colors: {
    title: '#000000',
    description: '#3C3C43',
    metadata: '#8E8E93',
    border: '#E5E7EB',
    chevron: '#C7C7CC',
    statusIndicatorStarted: '#007AFF',
    statusIndicatorNotStarted: '#E5E7EB',
    comingSoon: '#9CA3AF',
  },
};

interface CourseRowProps {
  course: Course;
  /** Progress percentage (0-100), undefined if not started */
  progress?: number;
  /** Whether the course is currently in progress */
  isInProgress?: boolean;
  /** Whether the user has access to this course (unlocked/purchased) */
  hasAccess?: boolean;
  onPress: () => void;
}

/**
 * Get the number of modules in a course
 */
function getModuleCount(course: Course): number {
  return course.modules?.length || Math.ceil(course.duration.totalMinutes / 45);
}

/**
 * Format inline metadata string
 * Example: "150 min · 3 modules"
 */
function formatMetadata(course: Course): string {
  const parts: string[] = [];

  // Duration
  if (course.duration.totalMinutes) {
    parts.push(`${course.duration.totalMinutes} min`);
  }

  // Module count
  const moduleCount = getModuleCount(course);
  parts.push(`${moduleCount} ${moduleCount === 1 ? 'module' : 'modules'}`);

  return parts.join(TOKENS.metadataSeparator);
}

export function CourseRow({
  course,
  progress,
  isInProgress = false,
  hasAccess = true,
  onPress
}: CourseRowProps) {
  const isComingSoon = course.status === 'coming-soon';
  const isFree = course.price?.cents === 0;
  const isLocked = !hasAccess && !isFree && !isComingSoon;
  const hasStarted = progress !== undefined && progress > 0;
  const isCompleted = progress === 100;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isComingSoon}
    >
      {/* Status indicator: lock icon for locked, dot for accessible */}
      <View style={styles.statusContainer}>
        {isLocked ? (
          <Ionicons name="lock-closed" size={14} color={TOKENS.colors.metadata} />
        ) : (
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: hasStarted
                  ? TOKENS.colors.statusIndicatorStarted
                  : TOKENS.colors.statusIndicatorNotStarted,
                borderWidth: hasStarted ? 0 : 1,
                borderColor: TOKENS.colors.border,
              },
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              isComingSoon && styles.titleDisabled,
              isLocked && styles.titleLocked,
            ]}
            numberOfLines={1}
          >
            {course.title}
          </Text>

          {/* Status badges - inline */}
          {isComingSoon && (
            <Text style={styles.comingSoonBadge}>Coming Soon</Text>
          )}
          {isFree && !isComingSoon && (
            <Text style={styles.freeBadge}>Free</Text>
          )}
        </View>

        {/* Description */}
        <Text
          style={[
            styles.description,
            isComingSoon && styles.descriptionDisabled,
            isLocked && styles.descriptionLocked,
          ]}
          numberOfLines={1}
        >
          {course.description}
        </Text>

        {/* Metadata row: duration · modules | progress */}
        <View style={styles.metadataRow}>
          <Text style={styles.metadata}>
            {formatMetadata(course)}
          </Text>

          {/* Progress indicator */}
          {!isComingSoon && progress !== undefined && (
            <View style={styles.progressContainer}>
              <ProgressDots
                progress={progress}
                dotCount={5}
                dotSize={5}
                gap={2}
              />
              {progress > 0 && progress < 100 && (
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              )}
              {isCompleted && (
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              )}
            </View>
          )}

          {!isComingSoon && progress === undefined && (
            <Text style={styles.notStarted}>not started</Text>
          )}
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isComingSoon ? TOKENS.colors.comingSoon : TOKENS.colors.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: TOKENS.rowMinHeight,
    paddingVertical: 12,
    paddingHorizontal: TOKENS.rowPadding,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TOKENS.colors.border,
  },
  statusContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    marginLeft: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: TOKENS.colors.title,
    flex: 1,
  },
  titleDisabled: {
    color: TOKENS.colors.comingSoon,
  },
  titleLocked: {
    color: TOKENS.colors.metadata,
  },
  comingSoonBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: TOKENS.colors.comingSoon,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  freeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: TOKENS.colors.description,
    marginTop: 2,
    lineHeight: 18,
  },
  descriptionDisabled: {
    color: TOKENS.colors.comingSoon,
  },
  descriptionLocked: {
    color: TOKENS.colors.metadata,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metadata: {
    fontSize: 13,
    color: TOKENS.colors.metadata,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: TOKENS.colors.metadata,
  },
  notStarted: {
    fontSize: 12,
    color: TOKENS.colors.metadata,
    fontStyle: 'italic',
  },
  chevronContainer: {
    marginLeft: 8,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CourseRow;
