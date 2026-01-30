/**
 * FilterChipStrip - Horizontal scrollable filter chips
 *
 * Flattens the 3-tier navigation (browse mode toggle, LevelTabs, topic pills)
 * into a single chip strip: All | levels... | topics...
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/components/cards/constants';

interface ChipItem {
  id: string;
  label: string;
  icon?: string;
}

interface FilterChipStripProps {
  activeChipId: string;
  onChipSelect: (chipId: string) => void;
  levels: ChipItem[];
  topics: ChipItem[];
}

export function FilterChipStrip({
  activeChipId,
  onChipSelect,
  levels,
  topics,
}: FilterChipStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* "All" chip */}
      <Chip
        id="all"
        label="All"
        isActive={activeChipId === 'all'}
        onPress={() => onChipSelect('all')}
      />

      {/* Separator */}
      <View style={styles.separator} />

      {/* Level chips */}
      {levels.map((level) => (
        <Chip
          key={level.id}
          id={level.id}
          label={level.label}
          isActive={activeChipId === level.id}
          onPress={() => onChipSelect(level.id)}
        />
      ))}

      {/* Separator */}
      <View style={styles.separator} />

      {/* Topic chips */}
      {topics.map((topic) => (
        <Chip
          key={topic.id}
          id={topic.id}
          label={topic.label}
          icon={topic.icon}
          isActive={activeChipId === topic.id}
          onPress={() => onChipSelect(topic.id)}
        />
      ))}
    </ScrollView>
  );
}

interface ChipProps {
  id: string;
  label: string;
  icon?: string;
  isActive: boolean;
  onPress: () => void;
}

function Chip({ label, icon, isActive, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={(icon + (isActive ? '' : '-outline')) as any}
          size={16}
          color={isActive ? IOS_COLORS.blue : IOS_COLORS.secondaryLabel}
        />
      )}
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingRight: 16,
    marginBottom: 16,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: IOS_COLORS.gray4,
    alignSelf: 'center',
    marginHorizontal: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
  },
  chipActive: {
    backgroundColor: '#007AFF12',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  chipTextActive: {
    color: IOS_COLORS.blue,
    fontWeight: '600',
  },
});
