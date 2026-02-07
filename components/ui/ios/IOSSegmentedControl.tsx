/**
 * IOSSegmentedControl - iOS-style segmented control component
 *
 * Supports two API styles:
 * 1. Original: segments with {key, label}, selectedKey, onSelect
 * 2. Alternative: segments with {value, label}, selectedValue, onValueChange
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

interface SegmentWithKey {
  key: string;
  label: string;
}

interface SegmentWithValue<T extends string = string> {
  value: T;
  label: string;
}

type Segment<T extends string = string> = SegmentWithKey | SegmentWithValue<T>;

interface IOSSegmentedControlProps<T extends string = string> {
  segments: Segment<T>[];
  // Original API
  selectedKey?: string;
  onSelect?: (key: string) => void;
  // Alternative API (for compatibility)
  selectedValue?: T;
  onValueChange?: (value: T) => void;
  style?: object;
}

export function IOSSegmentedControl<T extends string = string>({
  segments,
  selectedKey,
  onSelect,
  selectedValue,
  onValueChange,
  style,
}: IOSSegmentedControlProps<T>) {
  // Support both API styles
  const getSegmentKey = (segment: Segment<T>): string => {
    if ('key' in segment) return segment.key;
    if ('value' in segment) return segment.value;
    return '';
  };

  const currentSelectedKey = selectedKey ?? selectedValue;
  const handleSelect = (key: string) => {
    if (onSelect) {
      onSelect(key);
    } else if (onValueChange) {
      onValueChange(key as T);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        const segmentKey = getSegmentKey(segment);
        const isSelected = segmentKey === currentSelectedKey;
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;

        return (
          <Pressable
            key={segmentKey}
            style={({ pressed }) => [
              styles.segment,
              isSelected && styles.selectedSegment,
              isFirst && styles.firstSegment,
              isLast && styles.lastSegment,
              pressed && styles.pressedSegment,
            ]}
            onPress={() => handleSelect(segmentKey)}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.selectedSegmentText,
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  pressedSegment: {
    opacity: 0.7,
  },
  selectedSegment: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  firstSegment: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  lastSegment: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedSegmentText: {
    color: '#000000',
  },
});

export default IOSSegmentedControl;
