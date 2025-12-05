/**
 * Lesson Player Component
 * Main wrapper that routes to appropriate player based on lesson type
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import type { LearningLesson } from '@/services/LearningService';
import { VideoPlayer } from './VideoPlayer';
import { InteractivePlayer } from './InteractivePlayer';

interface LessonPlayerProps {
  lesson: LearningLesson;
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
}

export function LessonPlayer({ lesson, onComplete, onProgress }: LessonPlayerProps) {
  switch (lesson.lesson_type) {
    case 'interactive':
      return (
        <InteractivePlayer
          componentName={lesson.interactive_component || ''}
          onComplete={onComplete}
        />
      );

    case 'video':
      return (
        <VideoPlayer
          videoUrl={lesson.video_url || ''}
          onComplete={onComplete}
          onProgress={onProgress}
        />
      );

    case 'text':
      return (
        <View style={styles.textContainer}>
          <Text style={styles.textContent}>
            {lesson.description || 'No content available for this lesson.'}
          </Text>
        </View>
      );

    case 'quiz':
      return (
        <View style={styles.quizContainer}>
          <Text style={styles.comingSoonText}>Quiz Lesson</Text>
          <Text style={styles.comingSoonNote}>
            Quiz functionality will be implemented in a future phase
          </Text>
        </View>
      );

    default:
      return (
        <View style={styles.unknownContainer}>
          <Text style={styles.comingSoonText}>Unknown Lesson Type</Text>
          <Text style={styles.comingSoonSubtext}>Type: {lesson.lesson_type}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  textContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  textContent: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
  },
  quizContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  comingSoonNote: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  unknownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
});

