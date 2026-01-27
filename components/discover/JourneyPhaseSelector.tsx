/**
 * JourneyPhaseSelector Component
 *
 * Tab-style selector for switching between journey phases:
 * - Days Before (pre-race planning)
 * - On Water (race day)
 * - After Race (results & learnings)
 *
 * Highlights the current phase based on race date.
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Waves, Trophy } from 'lucide-react-native';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

export type JourneyPhase = 'days_before' | 'on_water' | 'after_race';

interface PhaseTab {
  key: JourneyPhase;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const PHASE_TABS: PhaseTab[] = [
  { key: 'days_before', label: 'Plan', icon: Calendar },
  { key: 'on_water', label: 'Race', icon: Waves },
  { key: 'after_race', label: 'Review', icon: Trophy },
];

interface JourneyPhaseSelectorProps {
  selectedPhase: JourneyPhase;
  onSelectPhase: (phase: JourneyPhase) => void;
  /** Race start date for determining current phase indicator */
  raceDate?: string;
}

/**
 * Determine if a phase should be highlighted as "current"
 */
function isCurrentPhase(phase: JourneyPhase, raceDate?: string): boolean {
  if (!raceDate) return phase === 'days_before';

  const raceDateObj = new Date(raceDate);
  const now = new Date();

  // Race end estimate (4 hours after start)
  const raceEndEstimate = new Date(raceDateObj);
  raceEndEstimate.setHours(raceEndEstimate.getHours() + 4);

  if (raceEndEstimate < now) {
    return phase === 'after_race';
  }

  // Race is today
  const isToday =
    raceDateObj.getFullYear() === now.getFullYear() &&
    raceDateObj.getMonth() === now.getMonth() &&
    raceDateObj.getDate() === now.getDate();

  if (isToday) {
    return phase === 'on_water';
  }

  return phase === 'days_before';
}

export function JourneyPhaseSelector({
  selectedPhase,
  onSelectPhase,
  raceDate,
}: JourneyPhaseSelectorProps) {
  const currentPhase = useMemo(() => {
    for (const tab of PHASE_TABS) {
      if (isCurrentPhase(tab.key, raceDate)) {
        return tab.key;
      }
    }
    return 'days_before';
  }, [raceDate]);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {PHASE_TABS.map((tab) => {
          const isSelected = selectedPhase === tab.key;
          const isCurrent = tab.key === currentPhase;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isSelected && styles.tabSelected]}
              onPress={() => onSelectPhase(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Icon
                  size={18}
                  color={
                    isSelected
                      ? IOS_COLORS.systemBlue
                      : IOS_COLORS.secondaryLabel
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isSelected && styles.tabLabelSelected,
                  ]}
                >
                  {tab.label}
                </Text>
                {isCurrent && !isSelected && (
                  <View style={styles.currentIndicator} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tabLabelSelected: {
    color: IOS_COLORS.systemBlue,
    fontWeight: '600',
  },
  currentIndicator: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.systemOrange,
  },
});

export default JourneyPhaseSelector;
