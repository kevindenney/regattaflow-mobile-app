/**
 * Level Tabs Component
 * iOS-style underline tabs for learning paths (Fundamentals, Intermediate, Advanced, etc.)
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Level } from '@/services/CourseCatalogService';
import { IOS_COLORS } from '@/components/cards/constants';

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
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {levels.map((level) => {
        const isSelected = selectedLevelId === level.id;
        const courseCount = level.courses?.length ?? 0;
        return (
          <TouchableOpacity
            key={level.id}
            style={styles.tab}
            onPress={() => onLevelSelect(level.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                isSelected && styles.tabTextActive,
              ]}
            >
              {level.name}
              <Text style={styles.courseCount}> ({courseCount})</Text>
            </Text>
            <View style={[styles.indicator, isSelected && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    paddingHorizontal: 0,
    gap: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tabTextActive: {
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
  courseCount: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  indicator: {
    height: 2,
    width: '100%',
    marginTop: 8,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: IOS_COLORS.blue,
  },
});
