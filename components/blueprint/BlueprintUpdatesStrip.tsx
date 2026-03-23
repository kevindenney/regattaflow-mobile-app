/**
 * BlueprintUpdatesStrip
 *
 * Compact strip shown on the Races/Timeline tab for users with active
 * blueprint subscriptions. Shows new steps from subscribed blueprints
 * that haven't been adopted or dismissed yet.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useNewBlueprintSteps,
  useAdoptBlueprintStep,
  useDismissBlueprintStep,
} from '@/hooks/useBlueprint';
import type { BlueprintNewStep } from '@/types/blueprint';

const C = {
  stripBg: 'rgba(255,255,255,0.96)',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E4E1',
  accent: '#00897B',
  accentBg: 'rgba(0,137,123,0.08)',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  badgeBg: '#E0F2F1',
  badgeText: '#00695C',
} as const;

interface BlueprintUpdatesStripProps {
  interestId?: string | null;
  onSelectStep?: (stepId: string) => void;
}

export function BlueprintUpdatesStrip({
  interestId,
  onSelectStep,
}: BlueprintUpdatesStripProps) {
  const { data: newSteps } = useNewBlueprintSteps(interestId);
  const adoptStep = useAdoptBlueprintStep();
  const dismissStep = useDismissBlueprintStep();

  const handleAdopt = useCallback(
    (step: BlueprintNewStep) => {
      adoptStep.mutate({
        sourceStepId: step.step_id,
        interestId: step.blueprint_id, // Will be resolved from the blueprint
        subscriptionId: step.subscription_id,
      });
    },
    [adoptStep],
  );

  const handleDismiss = useCallback(
    (step: BlueprintNewStep) => {
      dismissStep.mutate({
        subscriptionId: step.subscription_id,
        sourceStepId: step.step_id,
      });
    },
    [dismissStep],
  );

  if (!newSteps || newSteps.length === 0) return null;

  // Group by blueprint for display
  const byBlueprint = new Map<string, BlueprintNewStep[]>();
  for (const step of newSteps) {
    const key = step.blueprint_id;
    if (!byBlueprint.has(key)) byBlueprint.set(key, []);
    byBlueprint.get(key)!.push(step);
  }

  return (
    <View style={styles.strip}>
      <View style={styles.headerRow}>
        <Ionicons name="layers-outline" size={11} color={C.accent} />
        <Text style={styles.headerTitle}>Blueprint Updates</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{newSteps.length}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {newSteps.map((step) => (
          <StepCard
            key={`${step.subscription_id}-${step.step_id}`}
            step={step}
            onPress={() => onSelectStep?.(step.step_id)}
            onAdopt={() => handleAdopt(step)}
            onDismiss={() => handleDismiss(step)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step card
// ---------------------------------------------------------------------------

function StepCard({
  step,
  onPress,
  onAdopt,
  onDismiss,
}: {
  step: BlueprintNewStep;
  onPress: () => void;
  onAdopt: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.cardContent} onPress={onPress}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {step.step_title}
        </Text>
        <Text style={styles.sourceText} numberOfLines={1}>
          from {step.author_name ?? 'Blueprint'}
        </Text>
        <View style={styles.blueprintTag}>
          <Ionicons name="layers-outline" size={8} color={C.accent} />
          <Text style={styles.blueprintTagText} numberOfLines={1}>
            {step.blueprint_title}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actionRow}>
        <Pressable style={styles.adoptBtn} onPress={onAdopt}>
          <Ionicons name="add-circle-outline" size={12} color={C.accent} />
          <Text style={styles.adoptText}>Adopt</Text>
        </Pressable>
        <Pressable style={styles.dismissBtn} onPress={onDismiss}>
          <Ionicons name="close" size={12} color={C.labelLight} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  strip: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 8 : 4,
    backgroundColor: C.stripBg,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: C.accent,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: C.badgeBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.badgeText,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    width: 160,
    backgroundColor: C.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: C.labelDark,
  },
  sourceText: {
    fontSize: 9,
    color: C.labelMid,
  },
  blueprintTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    backgroundColor: C.accentBg,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  blueprintTagText: {
    fontSize: 8,
    fontWeight: '500',
    color: C.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.cardBorder,
  },
  adoptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  adoptText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.accent,
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: C.cardBorder,
  },
});
