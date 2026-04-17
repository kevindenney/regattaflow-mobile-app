/**
 * BlueprintPanelsStack — Renders one BlueprintPanel per subscribed blueprint.
 *
 * Drop-in replacement for BlueprintProgressStrip in the Races screen footer.
 * Handles per-blueprint data wiring so the caller just passes the subscribed
 * blueprint list plus the user's own adopted steps.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
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
}

export function BlueprintPanelsStack({
  interestId,
  subscribedBlueprints,
  myTimelineSteps,
}: BlueprintPanelsStackProps) {
  const { groups } = usePeerTimelines(interestId);

  // Map blueprintId → peers for quick lookup.
  const peersByBlueprint = new Map(groups.map((g) => [g.blueprintId, g.peers]));

  if (!subscribedBlueprints || subscribedBlueprints.length === 0) return null;

  return (
    <View style={styles.stack}>
      {subscribedBlueprints.map((bp) => (
        <BlueprintPanelRow
          key={bp.blueprint_id}
          info={bp}
          interestId={interestId}
          peers={peersByBlueprint.get(bp.blueprint_id)}
          myAdoptedSteps={myTimelineSteps ?? undefined}
        />
      ))}
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
}: {
  info: SubscribedBlueprintInfo;
  interestId?: string | null;
  peers?: import('@/types/blueprint').PeerTimeline[];
  myAdoptedSteps?: TimelineStepRecord[];
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
    />
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
