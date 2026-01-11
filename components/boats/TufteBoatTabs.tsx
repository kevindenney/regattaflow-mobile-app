/**
 * TufteBoatTabs
 *
 * Segmented control for switching between My Boats and Tuning Guides.
 * Uses iOS-style segmented control with minimal styling.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

type TabValue = 'boats' | 'tuning';

interface TufteBoatTabsProps {
  value: TabValue;
  onChange: (value: TabValue) => void;
  boatCount?: number;
  guideCount?: number;
}

export function TufteBoatTabs({
  value,
  onChange,
  boatCount = 0,
  guideCount = 0,
}: TufteBoatTabsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, value === 'boats' && styles.segmentActive]}
          onPress={() => onChange('boats')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, value === 'boats' && styles.segmentTextActive]}>
            My Boats
            {boatCount > 0 && <Text style={styles.countText}> ({boatCount})</Text>}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, value === 'tuning' && styles.segmentActive]}
          onPress={() => onChange('tuning')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, value === 'tuning' && styles.segmentTextActive]}>
            Tuning Guides
            {guideCount > 0 && <Text style={styles.countText}> ({guideCount})</Text>}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(142, 142, 147, 0.12)',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: IOS_COLORS.label,
    fontWeight: '600',
  },
  countText: {
    fontWeight: '400',
  },
});
