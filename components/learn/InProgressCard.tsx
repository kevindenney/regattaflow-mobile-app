/**
 * InProgressCard Component
 * Tufte-Apple synthesis: Rich featured card for courses the user is actively working on
 * "Earns its space" by showing real content: modules, progress, clear CTA
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Course } from '@/services/CourseCatalogService';
import { ProgressDots } from './ProgressDots';

// Design tokens
const TOKENS = {
  colors: {
    title: '#000000',
    subtitle: '#3C3C43',
    metadata: '#8E8E93',
    border: '#E5E7EB',
    accent: '#007AFF',
    accentLight: '#EBF5FF',
    levelBeginner: '#10B981',
    levelIntermediate: '#F59E0B',
    levelAdvanced: '#EF4444',
    levelSpecialization: '#8B5CF6',
    moduleNumber: '#6B7280',
    divider: '#F3F4F6',
  },
  metadataSeparator: ' \u00B7 ', // middle dot
};

interface InProgressCardProps {
  course: Course;
  /** Progress percentage (0-100) */
  progress: number;
  /** Last accessed module/lesson title */
  lastAccessedTitle?: string;
  /** Last accessed module index (0-based) */
  currentModuleIndex?: number;
  onContinue: () => void;
  onPress: () => void;
}

/**
 * Get level display info
 */
function getLevelInfo(levelId: string): { name: string; color: string } {
  const levels: Record<string, { name: string; color: string }> = {
    'level-1': { name: 'BEGINNER', color: TOKENS.colors.levelBeginner },
    'level-2': { name: 'INTERMEDIATE', color: TOKENS.colors.levelIntermediate },
    'level-3': { name: 'ADVANCED', color: TOKENS.colors.levelAdvanced },
    'specializations': { name: 'SPECIALIZATION', color: TOKENS.colors.levelSpecialization },
  };
  return levels[levelId] || { name: levelId.toUpperCase(), color: TOKENS.colors.metadata };
}

/**
 * Format inline metadata
 */
function formatMetadata(course: Course): string {
  const parts: string[] = [];

  if (course.duration.totalMinutes) {
    parts.push(`${course.duration.totalMinutes} min`);
  }

  const moduleCount = course.modules?.length || Math.ceil(course.duration.totalMinutes / 45);
  parts.push(`${moduleCount} modules`);

  // Count AI tools/interactive features
  const interactiveCount = course.modules?.reduce((count, mod) => {
    return count + (mod.lessons?.filter(l => l.interactiveComponent)?.length || 0);
  }, 0) || 0;

  if (interactiveCount > 0) {
    parts.push(`${interactiveCount} interactive ${interactiveCount === 1 ? 'tool' : 'tools'}`);
  }

  return parts.join(TOKENS.metadataSeparator);
}

export function InProgressCard({
  course,
  progress,
  lastAccessedTitle,
  currentModuleIndex = 0,
  onContinue,
  onPress,
}: InProgressCardProps) {
  const levelInfo = getLevelInfo(course.level);
  const modules = course.modules || [];
  const displayModules = modules.slice(0, 3); // Show first 3 modules

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Header: Level badge */}
      <View style={styles.header}>
        <Text style={[styles.levelBadge, { color: levelInfo.color }]}>
          {levelInfo.name}
        </Text>
        <Text style={styles.continueLabel}>CONTINUE</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{course.title}</Text>

      {/* Divider line (Tufte: horizontal rule for separation) */}
      <View style={styles.divider} />

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {course.longDescription || course.description}
      </Text>

      {/* Module list - shows real content */}
      {displayModules.length > 0 && (
        <View style={styles.moduleList}>
          {displayModules.map((module, index) => (
            <View key={module.id} style={styles.moduleRow}>
              <Text
                style={[
                  styles.moduleNumber,
                  index <= currentModuleIndex && styles.moduleNumberActive,
                ]}
              >
                {index + 1}.
              </Text>
              <Text
                style={[
                  styles.moduleTitle,
                  index < currentModuleIndex && styles.moduleTitleCompleted,
                  index === currentModuleIndex && styles.moduleTitleCurrent,
                ]}
                numberOfLines={1}
              >
                {module.title}
              </Text>
              {index < currentModuleIndex && (
                <Ionicons name="checkmark" size={16} color="#10B981" />
              )}
              {index === currentModuleIndex && (
                <View style={styles.currentIndicator} />
              )}
            </View>
          ))}
          {modules.length > 3 && (
            <Text style={styles.moreModules}>
              +{modules.length - 3} more {modules.length - 3 === 1 ? 'module' : 'modules'}
            </Text>
          )}
        </View>
      )}

      {/* Metadata */}
      <Text style={styles.metadata}>{formatMetadata(course)}</Text>

      {/* Progress and CTA row */}
      <View style={styles.footer}>
        <View style={styles.progressSection}>
          <ProgressDots
            progress={progress}
            dotCount={5}
            dotSize={8}
            gap={4}
          />
          <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>Continue</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      } as unknown,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  continueLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: TOKENS.colors.accent,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TOKENS.colors.title,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: TOKENS.colors.divider,
    marginVertical: 12,
  },
  description: {
    fontSize: 15,
    color: TOKENS.colors.subtitle,
    lineHeight: 22,
    marginBottom: 16,
  },
  moduleList: {
    marginBottom: 16,
    gap: 8,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: TOKENS.colors.moduleNumber,
    width: 20,
  },
  moduleNumberActive: {
    color: TOKENS.colors.title,
  },
  moduleTitle: {
    fontSize: 14,
    color: TOKENS.colors.subtitle,
    flex: 1,
  },
  moduleTitleCompleted: {
    color: TOKENS.colors.metadata,
  },
  moduleTitleCurrent: {
    fontWeight: '600',
    color: TOKENS.colors.title,
  },
  currentIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TOKENS.colors.accent,
  },
  moreModules: {
    fontSize: 13,
    color: TOKENS.colors.metadata,
    marginLeft: 28,
    fontStyle: 'italic',
  },
  metadata: {
    fontSize: 13,
    color: TOKENS.colors.metadata,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.divider,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: TOKENS.colors.subtitle,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TOKENS.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InProgressCard;
