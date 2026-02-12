/**
 * CourseRow Component
 * Tufte-inspired compact course list row (~80px height)
 * Displays course title, description, metadata, and progress inline
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Course } from '@/services/CourseCatalogService';
import { ProgressRing } from './ProgressRing';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

// Design tokens
const TOKENS = {
  rowMinHeight: 80,
  rowPadding: 16,
  metadataSeparator: ' \u00B7 ', // middle dot
  colors: {
    title: IOS_COLORS.label,
    description: IOS_COLORS.secondaryLabel,
    metadata: IOS_COLORS.systemGray,
    border: IOS_COLORS.separator,
    chevron: IOS_COLORS.systemGray3,
    statusIndicatorStarted: IOS_COLORS.systemBlue,
    statusIndicatorNotStarted: '#E5E7EB',
    comingSoon: '#9CA3AF',
  },
};

const LEVEL_ACCENT_COLORS: Record<string, string> = {
  'level-1': '#10B981',
  'level-2': '#F59E0B',
  'level-3': '#EF4444',
  'specializations': '#8B5CF6',
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

  const accentColor = LEVEL_ACCENT_COLORS[course.level] || TOKENS.colors.metadata;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Level accent bar on left edge */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

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

          {/* Pill-style badges */}
          {isComingSoon && (
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonPillText}>COMING SOON</Text>
            </View>
          )}
          {isFree && !isComingSoon && (
            <View style={styles.freePill}>
              <Text style={styles.freePillText}>FREE</Text>
            </View>
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

          {/* Progress ring indicator */}
          {!isComingSoon && progress !== undefined && (
            <View style={styles.progressContainer}>
              <ProgressRing
                progress={progress}
                size={20}
                strokeWidth={2.5}
                showLabel={false}
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
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
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
  comingSoonPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  comingSoonPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: TOKENS.colors.comingSoon,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  freePill: {
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freePillText: {
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
