/**
 * InProgressBanner - Slim ~72px banner for the in-progress course
 *
 * Replaces the ~400px InProgressCard with a compact single-row layout:
 * [ProgressRing 40px] [Title + Subtitle] [Continue → pill button]
 */

import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Course } from '@/services/CourseCatalogService';
import { ProgressRing } from './ProgressRing';

interface InProgressBannerProps {
  course: Course;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current module index (0-based) */
  currentModuleIndex?: number;
  /** Last accessed lesson/module title */
  lastAccessedTitle?: string;
  onContinue: () => void;
  onPress: () => void;
}

export function InProgressBanner({
  course,
  progress,
  currentModuleIndex = 0,
  lastAccessedTitle,
  onContinue,
  onPress,
}: InProgressBannerProps) {
  const modules = course.modules || [];
  const currentModule = modules[currentModuleIndex];
  const subtitle = lastAccessedTitle
    || (currentModule ? `Module ${currentModuleIndex + 1}: ${currentModule.title}` : undefined);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <ProgressRing
        progress={progress}
        size={40}
        strokeWidth={3.5}
        showLabel
      />

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {course.title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueText}>Continue →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      } as unknown,
    }),
  },
  center: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    color: '#3C3C43',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  continueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
