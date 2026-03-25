/**
 * ReviewTab — Reflection phase wrapping StepCritiqueContent.
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { IOS_SPACING } from '@/lib/design-tokens-ios';
import { StepCritiqueContent } from './StepCritiqueContent';

interface ReviewTabProps {
  stepId: string;
  readOnly?: boolean;
  footer?: React.ReactNode;
}

export function ReviewTab({ stepId, readOnly, footer }: ReviewTabProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <StepCritiqueContent stepId={stepId} readOnly={readOnly} />
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
});
