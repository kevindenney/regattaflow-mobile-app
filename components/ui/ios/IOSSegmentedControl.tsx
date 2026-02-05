/**
 * IOSSegmentedControl - iOS-style segmented control component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Segment {
  key: string;
  label: string;
}

interface IOSSegmentedControlProps {
  segments: Segment[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: object;
}

export function IOSSegmentedControl({
  segments,
  selectedKey,
  onSelect,
  style,
}: IOSSegmentedControlProps) {
  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => {
        const isSelected = segment.key === selectedKey;
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;

        return (
          <TouchableOpacity
            key={segment.key}
            style={[
              styles.segment,
              isSelected && styles.selectedSegment,
              isFirst && styles.firstSegment,
              isLast && styles.lastSegment,
            ]}
            onPress={() => onSelect(segment.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                isSelected && styles.selectedSegmentText,
              ]}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
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
