/**
 * LessonPanel
 *
 * Expandable panel that displays educational content for a checklist item.
 * Shows lesson text, key points, and optional link to learning module.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Check } from 'lucide-react-native';
import type { ChecklistLesson } from '@/types/checklists';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  gray: '#8E8E93',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  lessonBackground: '#007AFF08',
  keyPointBackground: '#34C75910',
};

interface LessonPanelProps {
  lesson: ChecklistLesson;
  expanded: boolean;
  onToggle: () => void;
}

export function LessonPanel({ lesson, expanded, onToggle }: LessonPanelProps) {
  const router = useRouter();

  const handleLearnMore = useCallback(() => {
    if (lesson.learningModuleSlug) {
      // Navigate directly to the lesson player with course slug and lesson ID
      router.push({
        pathname: '/(tabs)/learn/[courseId]/player',
        params: {
          courseId: lesson.learningModuleSlug,
          lessonId: lesson.learningModuleId || '',
        },
      });
    }
  }, [lesson.learningModuleSlug, lesson.learningModuleId, router]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }, [onToggle]);

  if (!expanded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Lesson Content */}
      <Text style={styles.content}>{lesson.content}</Text>

      {/* Key Points */}
      {lesson.keyPoints && lesson.keyPoints.length > 0 && (
        <View style={styles.keyPointsContainer}>
          <Text style={styles.keyPointsTitle}>Key Points</Text>
          {lesson.keyPoints.map((point, index) => (
            <View key={index} style={styles.keyPointRow}>
              <Check size={14} color={IOS_COLORS.green} style={styles.keyPointIcon} />
              <Text style={styles.keyPointText}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Learn More Link */}
      {lesson.learningModuleSlug && (
        <Pressable style={styles.learnMoreButton} onPress={handleLearnMore}>
          <BookOpen size={16} color={IOS_COLORS.purple} />
          <Text style={styles.learnMoreText}>Learn More in Academy</Text>
          <ChevronRight size={16} color={IOS_COLORS.purple} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 14,
    backgroundColor: IOS_COLORS.lessonBackground,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: IOS_COLORS.blue,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    color: IOS_COLORS.secondaryLabel,
  },
  keyPointsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  keyPointsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  keyPointIcon: {
    marginTop: 3,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: IOS_COLORS.label,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: `${IOS_COLORS.purple}12`,
    borderRadius: 8,
    gap: 6,
  },
  learnMoreText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.purple,
  },
});

export default LessonPanel;
