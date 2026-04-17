/**
 * BlueprintPanelsStack — Renders one BlueprintPanel per subscribed blueprint.
 *
 * Drop-in replacement for BlueprintProgressStrip in the Races screen footer.
 * Handles per-blueprint data wiring so the caller just passes the subscribed
 * blueprint list plus the user's own adopted steps.
 */

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBlueprintSteps, useAdoptBlueprintStep } from '@/hooks/useBlueprint';
import { usePeerTimelines } from '@/hooks/usePeerTimelines';
import { useRouter } from 'expo-router';
import { BlueprintPanel } from './BlueprintPanel';
import type { SubscribedBlueprintInfo } from '@/types/blueprint';
import type { TimelineStepRecord } from '@/types/timeline-steps';

export interface BlueprintPanelsStackProps {
  interestId?: string | null;
  subscribedBlueprints: SubscribedBlueprintInfo[];
  myTimelineSteps?: TimelineStepRecord[] | null;
  /** Called when a peer-sheet user taps "Open & ask AI Coach" on an adopted step. */
  onOpenAdoptedStep?: (stepId: string) => void;
}

export function BlueprintPanelsStack({
  interestId,
  subscribedBlueprints,
  myTimelineSteps,
  onOpenAdoptedStep,
}: BlueprintPanelsStackProps) {
  const { groups } = usePeerTimelines(interestId);

  // Map blueprintId → peers for quick lookup.
  const peersByBlueprint = new Map(groups.map((g) => [g.blueprintId, g.peers]));

  // Master collapse for the whole stack. Expanded by default so the panels
  // remain visible on first load; user can collapse once they want the
  // screen back. Hooks must run before any early return.
  const [expanded, setExpanded] = useState(true);

  if (!subscribedBlueprints || subscribedBlueprints.length === 0) return null;

  const count = subscribedBlueprints.length;

  return (
    <View style={styles.stack}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${count} subscribed blueprint${count === 1 ? '' : 's'}`}
      >
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={12}
          color="#8E8E93"
          style={styles.headerChevron}
        />
        <Text style={styles.headerLabel}>
          Subscribed · {count}
        </Text>
      </Pressable>
      {expanded
        ? subscribedBlueprints.map((bp) => (
            <BlueprintPanelRow
              key={bp.blueprint_id}
              info={bp}
              interestId={interestId}
              peers={peersByBlueprint.get(bp.blueprint_id)}
              myAdoptedSteps={myTimelineSteps ?? undefined}
              onOpenAdoptedStep={onOpenAdoptedStep}
            />
          ))
        : null}
    </View>
  );
}

/**
 * Per-blueprint wrapper so each row can own its own `useBlueprintSteps` call.
 * Pulling the query into its own component keeps the hook count stable when
 * the subscribedBlueprints array changes length.
 */
function BlueprintPanelRow({
  info,
  interestId,
  peers,
  myAdoptedSteps,
  onOpenAdoptedStep,
}: {
  info: SubscribedBlueprintInfo;
  interestId?: string | null;
  peers?: import('@/types/blueprint').PeerTimeline[];
  myAdoptedSteps?: TimelineStepRecord[];
  onOpenAdoptedStep?: (stepId: string) => void;
}) {
  const router = useRouter();
  const { data: curriculumSteps } = useBlueprintSteps(info.blueprint_id);
  const adoptMutation = useAdoptBlueprintStep();

  if (!curriculumSteps || curriculumSteps.length === 0) return null;

  return (
    <BlueprintPanel
      blueprintId={info.blueprint_id}
      blueprintTitle={info.blueprint_title}
      authorName={info.author_name}
      interestId={interestId ?? null}
      subscriptionId={info.subscription_id}
      curriculumSteps={curriculumSteps}
      myAdoptedSteps={myAdoptedSteps}
      peers={peers}
      onAdoptStep={
        interestId
          ? (stepId) => {
              adoptMutation.mutate({
                sourceStepId: stepId,
                interestId,
                subscriptionId: info.subscription_id,
                blueprintId: info.blueprint_id,
              });
            }
          : undefined
      }
      onOpenBlueprint={() => router.push(`/blueprint/${info.blueprint_slug}` as any)}
      onOpenAdoptedStep={onOpenAdoptedStep}
    />
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerChevron: {
    width: 12,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
