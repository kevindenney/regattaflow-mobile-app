/**
 * usePeerTimelines — Fetches peer subscriber timelines for all blueprints
 * the current user subscribes to in the active interest.
 */

import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscribedBlueprints } from '@/hooks/useBlueprint';
import { getPeerSubscriberTimelines } from '@/services/BlueprintService';
import type { PeerTimeline } from '@/types/blueprint';

export interface PeerBlueprintGroup {
  blueprintId: string;
  blueprintTitle: string;
  blueprintSlug: string;
  peers: PeerTimeline[];
}

export function usePeerTimelines(interestId?: string | null) {
  const { user } = useAuth();
  const { data: subscribed } = useSubscribedBlueprints(interestId);

  const blueprints = subscribed ?? [];

  const queries = useQueries({
    queries: blueprints.map((bp) => ({
      queryKey: ['peer-timelines', bp.blueprint_id, user?.id, interestId],
      queryFn: () =>
        getPeerSubscriberTimelines(
          bp.blueprint_id,
          user!.id,
          interestId!,
          bp.blueprint_title,
        ),
      enabled: !!user?.id && !!interestId,
      staleTime: 60_000,
    })),
  });

  const groups: PeerBlueprintGroup[] = [];
  for (let i = 0; i < blueprints.length; i++) {
    const result = queries[i];
    if (result?.data && result.data.length > 0) {
      groups.push({
        blueprintId: blueprints[i].blueprint_id,
        blueprintTitle: blueprints[i].blueprint_title,
        blueprintSlug: blueprints[i].blueprint_slug,
        peers: result.data,
      });
    }
  }

  const isLoading = queries.some((q) => q.isLoading);

  return { groups, isLoading };
}
