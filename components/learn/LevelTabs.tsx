/**
 * Level Tabs Component
 * Navigation tabs for learning paths (Fundamentals, Intermediate, Advanced, etc.)
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Level } from '@/services/CourseCatalogService';

interface LevelTabsProps {
  levels: Level[];
  selectedLevelId: string;
  onLevelSelect: (levelId: string) => void;
}

export function LevelTabs({ levels, selectedLevelId, onLevelSelect }: LevelTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.levelTabsContainer}
      contentContainerStyle={styles.levelTabsContent}
    >
      {levels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.levelTab,
            selectedLevelId === level.id && styles.levelTabActive,
          ]}
          onPress={() => onLevelSelect(level.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.levelTabText,
              selectedLevelId === level.id && styles.levelTabTextActive,
            ]}
          >
            {level.name}
          </Text>
          <Text
            style={[
              styles.levelTabSubtext,
              selectedLevelId === level.id && styles.levelTabSubtextActive,
            ]}
          >
            {level.courses.length} {level.courses.length === 1 ? 'course' : 'courses'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  levelTabsContainer: {
    marginBottom: 24,
  },
  levelTabsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  levelTab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 120,
    alignItems: 'center',
  },
  levelTabActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  levelTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  levelTabTextActive: {
    color: '#FFFFFF',
  },
  levelTabSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  levelTabSubtextActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

