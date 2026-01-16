/**
 * TufteChecklistSection
 *
 * Checklist category with items, following Tufte principles:
 * - Unicode progress bar shows completion at a glance
 * - Dense item rows with subtle completion state
 * - Category label in small caps, not decorated badge
 */

import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Check, Info } from 'lucide-react-native';
import { IOS_COLORS, TUFTE_BACKGROUND, TUFTE_TEXT } from '@/components/cards/constants';
import { unicodeBar } from '@/lib/tufte';
import { ChecklistCategory, CATEGORY_CONFIG } from '@/types/checklists';
import type { PracticeChecklistItem, PracticeChecklistCompletion } from '@/lib/checklists/practiceChecklists';

interface TufteChecklistSectionProps {
  category: ChecklistCategory;
  items: PracticeChecklistItem[];
  completions: Record<string, PracticeChecklistCompletion>;
  onToggleItem: (itemId: string) => void;
  onItemAction?: (item: PracticeChecklistItem) => void;
}

export function TufteChecklistSection({
  category,
  items,
  completions,
  onToggleItem,
  onItemAction,
}: TufteChecklistSectionProps) {
  const config = CATEGORY_CONFIG[category];
  const completedCount = items.filter((item) => completions[item.id]).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header row: Category label + progress bar + count */}
      <View style={styles.header}>
        <Text style={styles.categoryLabel}>{config.label}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressBar}>{unicodeBar(progress, 10)}</Text>
          <Text style={styles.progressCount}>
            {completedCount}/{items.length}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {items.map((item) => {
          const isCompleted = !!completions[item.id];
          const completion = completions[item.id];
          const hasTool = !!item.toolId && item.toolType === 'full_wizard';

          return (
            <Pressable
              key={item.id}
              style={styles.itemRow}
              onPress={() => onToggleItem(item.id)}
              onLongPress={() => onItemAction?.(item)}
            >
              {/* Checkbox */}
              <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
                {isCompleted && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>

              {/* Label */}
              <View style={styles.labelContainer}>
                <Text
                  style={[styles.itemLabel, isCompleted && styles.itemLabelDone]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {/* Show who completed for shared checklists */}
                {completion?.completedByName && (
                  <Text style={styles.completedBy}>
                    {completion.completedByName}
                  </Text>
                )}
              </View>

              {/* Priority indicator for high-priority incomplete items */}
              {!isCompleted && item.priority === 'high' && (
                <View style={styles.priorityDot} />
              )}

              {/* Tool indicator - tap to open wizard */}
              {hasTool && onItemAction && (
                <Pressable
                  style={styles.toolButton}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onItemAction(item);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Info size={18} color={IOS_COLORS.blue} />
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    letterSpacing: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: IOS_COLORS.gray,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    fontVariant: ['tabular-nums'],
    minWidth: 32,
    textAlign: 'right',
  },
  itemsContainer: {
    gap: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TUFTE_BACKGROUND,
  },
  checkboxDone: {
    backgroundColor: IOS_COLORS.green,
    borderColor: IOS_COLORS.green,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: TUFTE_TEXT,
    flex: 1,
  },
  itemLabelDone: {
    color: IOS_COLORS.gray,
    textDecorationLine: 'line-through',
  },
  completedBy: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.orange,
  },
  toolButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export default TufteChecklistSection;
