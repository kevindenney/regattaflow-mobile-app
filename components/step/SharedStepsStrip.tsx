/**
 * SharedStepsStrip
 *
 * Compact bottom strip for the card (zoomed-in) view showing collaborated steps.
 * Users can adopt a step into their own timeline or dismiss it from view.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCollaboratedSteps } from '@/hooks/useTimelineSteps';
import { useAdoptStep } from '@/hooks/useTimelineSteps';
import type { TimelineStepRecord } from '@/types/timeline-steps';
import type { StepMetadata, StepPlanData } from '@/types/step-detail';

const C = {
  stripBg: 'rgba(255,255,255,0.96)',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E4E1',
  accent: '#3D8A5A',
  accentBg: 'rgba(61,138,90,0.08)',
  gold: '#D4A64A',
  coral: '#D89575',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  badgeBg: '#EDECEA',
  dangerLight: 'rgba(220,80,60,0.08)',
  danger: '#DC503C',
} as const;

const STATUS_DOT: Record<string, { color: string; icon: string }> = {
  pending: { color: C.labelMid, icon: 'ellipse-outline' },
  in_progress: { color: C.gold, icon: 'play-circle-outline' },
  completed: { color: C.accent, icon: 'checkmark-circle' },
  skipped: { color: C.coral, icon: 'close-circle-outline' },
};

interface SharedStepsStripProps {
  interestId?: string | null;
  onSelectStep: (stepId: string) => void;
}

export function SharedStepsStrip({ interestId, onSelectStep }: SharedStepsStripProps) {
  const { data: steps } = useCollaboratedSteps(interestId);
  const adoptStep = useAdoptStep();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());

  const visibleSteps = steps?.filter(
    (s) => !dismissedIds.has(s.id) && !adoptedIds.has(s.id),
  );

  const handleAdopt = useCallback(
    (step: TimelineStepRecord) => {
      if (!interestId) return;
      setAdoptedIds((prev) => new Set(prev).add(step.id));
      adoptStep.mutate(
        { sourceStepId: step.id, interestId },
        {
          onError: () => {
            // Revert on failure
            setAdoptedIds((prev) => {
              const next = new Set(prev);
              next.delete(step.id);
              return next;
            });
          },
        },
      );
    },
    [interestId, adoptStep],
  );

  const handleDismiss = useCallback((stepId: string) => {
    setDismissedIds((prev) => new Set(prev).add(stepId));
  }, []);

  if (!visibleSteps || visibleSteps.length === 0) return null;

  return (
    <View style={styles.strip}>
      <View style={styles.headerRow}>
        <Ionicons name="people-outline" size={11} color={C.labelMid} />
        <Text style={styles.headerTitle}>Shared with me</Text>
        <Text style={styles.headerCount}>{visibleSteps.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleSteps.map((step) => (
          <StripCard
            key={step.id}
            step={step}
            onPress={() => onSelectStep(step.id)}
            onAdopt={() => handleAdopt(step)}
            onDismiss={() => handleDismiss(step.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Strip card
// ---------------------------------------------------------------------------

function StripCard({
  step,
  onPress,
  onAdopt,
  onDismiss,
}: {
  step: TimelineStepRecord;
  onPress: () => void;
  onAdopt: () => void;
  onDismiss: () => void;
}) {
  const statusCfg = STATUS_DOT[step.status] ?? STATUS_DOT.pending;
  const metadata = (step.metadata ?? {}) as StepMetadata;
  const plan: StepPlanData = metadata.plan ?? {};
  const collaborators = plan.collaborators ?? [];
  const ownerCollab = collaborators.find(
    (c) => c.type === 'platform' && c.user_id === step.user_id,
  );
  const ownerName = ownerCollab?.display_name;

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardContent} onPress={onPress}>
        <View style={styles.titleRow}>
          <Ionicons name={statusCfg.icon as any} size={9} color={statusCfg.color} />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {step.title}
          </Text>
        </View>
        {ownerName && (
          <Text style={styles.ownerText} numberOfLines={1}>
            from {ownerName}
          </Text>
        )}
      </Pressable>
      <View style={styles.actionRow}>
        <Pressable style={styles.adoptBtn} onPress={onAdopt}>
          <Ionicons name="add-circle-outline" size={12} color={C.accent} />
          <Text style={styles.adoptText}>Add</Text>
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
    paddingTop: 6,
    paddingBottom: Platform.OS === 'web' ? 8 : 4,
    backgroundColor: C.stripBg,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    ...Platform.select({
      web: { boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: C.labelMid,
  },
  headerCount: {
    fontSize: 9,
    fontWeight: '600',
    color: C.labelLight,
    backgroundColor: C.badgeBg,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    width: 150,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: C.labelDark,
    flex: 1,
  },
  ownerText: {
    fontSize: 9,
    color: C.labelMid,
    paddingLeft: 13,
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
