/**
 * PlanQuestionCard — card for each planning question.
 * Always shows content (not collapsible).
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';

interface PlanQuestionCardProps {
  icon: string;
  title: string;
  /** Whether this question has been answered */
  isComplete?: boolean;
  /** @deprecated No longer used — kept for call-site compat */
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function PlanQuestionCard({
  icon,
  title,
  isComplete = false,
  children,
}: PlanQuestionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, isComplete && styles.iconCircleComplete]}>
            <Ionicons
              name={isComplete ? 'checkmark' : (icon as any)}
              size={16}
              color={isComplete ? '#FFFFFF' : STEP_COLORS.accent}
            />
          </View>
          <Text style={[styles.title, isComplete && styles.titleComplete]}>{title}</Text>
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: STEP_COLORS.cardBg,
    borderRadius: 12,
    marginBottom: IOS_SPACING.sm,
    borderWidth: 1,
    borderColor: STEP_COLORS.cardBorder,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: IOS_SPACING.md,
    paddingBottom: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: STEP_COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleComplete: {
    backgroundColor: STEP_COLORS.complete,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  titleComplete: {
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    paddingHorizontal: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.md,
    paddingTop: IOS_SPACING.sm,
  },
});
