/**
 * ChecklistModule
 *
 * Displays phase-appropriate checklists for race preparation.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import type { ContentModuleProps } from '@/types/raceCardContent';
import type { CardRaceData, RacePhase } from '@/components/cards/types';

interface ChecklistModuleProps extends ContentModuleProps<CardRaceData> {}

interface ChecklistItem {
  id: string;
  label: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Checklist content module
 */
function ChecklistModule({
  race,
  phase,
  raceType,
  isCollapsed,
}: ChecklistModuleProps) {
  // Track completed items locally (would integrate with useRaceChecklist in real impl)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  if (isCollapsed) {
    return null;
  }

  // Get checklist items for current phase
  const items = getChecklistForPhase(phase, raceType);

  const toggleItem = (itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const completedCount = completedItems.size;
  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              progress === 1 && styles.progressComplete,
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {completedCount}/{totalCount} completed
        </Text>
      </View>

      {/* Checklist Items */}
      <View style={styles.itemsList}>
        {items.map((item) => {
          const isCompleted = completedItems.has(item.id);
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.checklistItem,
                pressed && styles.checklistItemPressed,
              ]}
              onPress={() => toggleItem(item.id)}
            >
              {isCompleted ? (
                <CheckCircle2 size={20} color={IOS_COLORS.green} />
              ) : item.priority === 'high' ? (
                <AlertCircle size={20} color={IOS_COLORS.red} />
              ) : (
                <Circle size={20} color={IOS_COLORS.gray3} />
              )}
              <Text
                style={[
                  styles.checklistLabel,
                  isCompleted && styles.checklistLabelCompleted,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Get checklist items based on race phase
 */
function getChecklistForPhase(phase: RacePhase, raceType: string): ChecklistItem[] {
  switch (phase) {
    case 'days_before':
      return [
        { id: 'review_si', label: 'Review Sailing Instructions', priority: 'high' },
        { id: 'check_forecast', label: 'Check weather forecast', priority: 'high' },
        { id: 'boat_prep', label: 'Boat preparation complete', priority: 'medium' },
        { id: 'crew_comms', label: 'Confirm crew arrangements', priority: 'medium' },
        { id: 'pack_gear', label: 'Pack race gear', priority: 'low' },
      ];

    case 'race_morning':
      return [
        { id: 'final_forecast', label: 'Check final forecast', priority: 'high' },
        { id: 'tune_rig', label: 'Tune rig for conditions', priority: 'high' },
        { id: 'select_sails', label: 'Select and rig sails', priority: 'high' },
        { id: 'review_tactics', label: 'Review tactics with crew', priority: 'medium' },
      ];

    case 'on_water':
      return [
        { id: 'check_in', label: 'Check in with race committee', priority: 'high' },
        { id: 'test_compass', label: 'Test compass bearings', priority: 'medium' },
        { id: 'observe_wind', label: 'Observe wind patterns', priority: 'high' },
      ];

    case 'after_race':
      return [
        { id: 'enter_results', label: 'Enter race results', priority: 'high' },
        { id: 'note_learnings', label: 'Note key learnings', priority: 'medium' },
        { id: 'equipment_notes', label: 'Record equipment issues', priority: 'medium' },
      ];

    default:
      return [];
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12,
  },
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
  },
  progressComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  progressText: {
    fontSize: 11,
    color: IOS_COLORS.gray,
    textAlign: 'right',
  },
  itemsList: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checklistItemPressed: {
    opacity: 0.7,
  },
  checklistLabel: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
  },
  checklistLabelCompleted: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
});

export default ChecklistModule;
