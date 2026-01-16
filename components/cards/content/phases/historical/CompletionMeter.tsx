/**
 * CompletionMeter - Category completion visualization
 *
 * Shows completion progress for checklist categories.
 * Displays as compact progress bars with "4/6 ✓" style indicators.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  green: '#34C759',
};

export interface CategoryProgress {
  /** Category identifier */
  id: string;
  /** Display name */
  name: string;
  /** Number of completed items */
  completed: number;
  /** Total items in category */
  total: number;
  /** Category color */
  color: string;
}

export interface CompletionMeterProps {
  /** Categories with completion data */
  categories: CategoryProgress[];
  /** Display variant */
  variant?: 'compact' | 'detailed';
}

export function CompletionMeter({
  categories,
  variant = 'compact',
}: CompletionMeterProps) {
  // Filter out categories with no items
  const validCategories = categories.filter((cat) => cat.total > 0);

  if (validCategories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No checklist items recorded</Text>
      </View>
    );
  }

  if (variant === 'detailed') {
    return (
      <View style={styles.detailedContainer}>
        {validCategories.map((cat) => (
          <View key={cat.id} style={styles.detailedRow}>
            <View style={styles.detailedLabelRow}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={styles.detailedLabel}>{cat.name}</Text>
              <Text style={styles.detailedCount}>
                {cat.completed}/{cat.total}
              </Text>
              {cat.completed === cat.total && (
                <Check size={12} color={IOS_COLORS.green} strokeWidth={3} />
              )}
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: cat.color,
                    width: `${(cat.completed / cat.total) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  // Compact variant - horizontal chips
  return (
    <View style={styles.compactContainer}>
      {validCategories.map((cat) => {
        const isComplete = cat.completed === cat.total;
        return (
          <View
            key={cat.id}
            style={[
              styles.compactChip,
              isComplete && styles.compactChipComplete,
            ]}
          >
            <View style={[styles.compactDot, { backgroundColor: cat.color }]} />
            <Text style={styles.compactLabel}>{cat.name}</Text>
            <Text style={[styles.compactCount, isComplete && styles.compactCountComplete]}>
              {cat.completed}/{cat.total}
            </Text>
            {isComplete && (
              <Check size={10} color={IOS_COLORS.green} strokeWidth={3} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Empty state
  emptyContainer: {
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 6,
  },
  compactChipComplete: {
    backgroundColor: '#E8F5E9',
  },
  compactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactLabel: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  compactCount: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
    fontWeight: '600',
  },
  compactCountComplete: {
    color: IOS_COLORS.green,
  },

  // Detailed variant
  detailedContainer: {
    gap: 12,
  },
  detailedRow: {
    gap: 4,
  },
  detailedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailedLabel: {
    fontSize: 13,
    color: IOS_COLORS.label,
    fontWeight: '500',
    flex: 1,
  },
  detailedCount: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: IOS_COLORS.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default CompletionMeter;
