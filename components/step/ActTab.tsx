/**
 * ActTab — Execution phase wrapping StepDrawContent.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { StepDrawContent } from './StepDrawContent';
import { DateEnrichmentCard } from './DateEnrichmentCard';
import type { DateEnrichment } from '@/types/step-detail';

interface ActTabProps {
  stepId: string;
  dateEnrichment?: DateEnrichment;
  onNextTab?: () => void;
  readOnly?: boolean;
  footer?: React.ReactNode;
}

export function ActTab({ stepId, dateEnrichment, onNextTab, readOnly, footer }: ActTabProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Conditions reference card */}
      {dateEnrichment && (dateEnrichment.wind || dateEnrichment.tide) && (
        <View style={styles.conditionsContainer}>
          <DateEnrichmentCard
            dateLabel="today's session"
            dateIso=""
            enrichment={dateEnrichment}
          />
        </View>
      )}

      <StepDrawContent stepId={stepId} readOnly={readOnly} />

      {/* Next tab CTA */}
      {onNextTab && !readOnly && (
        <View style={styles.nextCtaContainer}>
          <Pressable style={styles.nextCtaPrimary} onPress={onNextTab}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            <Text style={styles.nextCtaPrimaryText}>Next: Review & Reflect</Text>
          </Pressable>
        </View>
      )}
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: IOS_SPACING.md,
    paddingBottom: 100,
  },
  conditionsContainer: {
    paddingHorizontal: IOS_SPACING.md,
    marginBottom: IOS_SPACING.md,
  },
  nextCtaContainer: {
    paddingHorizontal: IOS_SPACING.md,
    paddingTop: IOS_SPACING.lg,
    gap: 8,
  },
  nextCtaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEP_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(61,138,90,0.25)' } as any,
      default: {
        shadowColor: STEP_COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  nextCtaPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
