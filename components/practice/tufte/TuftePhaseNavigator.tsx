/**
 * TuftePhaseNavigator
 *
 * Minimal phase tab bar following Tufte principles:
 * - Typography-driven tabs, not heavy segmented control
 * - Subtle active indicator
 * - No unnecessary chrome
 */

import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { IOS_COLORS, TUFTE_TEXT } from '@/components/cards/constants';
import {
  PracticePhase,
  PRACTICE_PHASE_LABELS,
  canOverrideToPhase,
  PracticeStatus,
} from '@/types/practice';

interface TuftePhaseNavigatorProps {
  currentPhase: PracticePhase;
  sessionStatus: PracticeStatus;
  onPhaseChange: (phase: PracticePhase) => void;
}

const PHASES: PracticePhase[] = [
  'practice_prepare',
  'practice_launch',
  'practice_train',
  'practice_reflect',
];

export function TuftePhaseNavigator({
  currentPhase,
  sessionStatus,
  onPhaseChange,
}: TuftePhaseNavigatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {PHASES.map((phase) => {
          const isActive = phase === currentPhase;
          const canSelect = canOverrideToPhase({ status: sessionStatus }, phase);

          return (
            <Pressable
              key={phase}
              style={[styles.tab, !canSelect && styles.tabDisabled]}
              onPress={() => canSelect && onPhaseChange(phase)}
              disabled={!canSelect}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  !canSelect && styles.tabLabelDisabled,
                ]}
              >
                {PRACTICE_PHASE_LABELS[phase]}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.gray5,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  tabLabelActive: {
    color: TUFTE_TEXT,
    fontWeight: '600',
  },
  tabLabelDisabled: {
    color: IOS_COLORS.gray3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 1,
  },
});

export default TuftePhaseNavigator;
