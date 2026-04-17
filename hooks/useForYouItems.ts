/**
 * useForYouItems — Aggregates actionable items from multiple sources
 * into a single prioritized list for the "For You" section.
 */

import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  useNewBlueprintSteps,
  useOrganizationBlueprints,
  useSubscribedBlueprints,
  useAdoptBlueprintStep,
  useDismissBlueprintStep,
  useSubscribe,
} from '@/hooks/useBlueprint';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NotificationService, type SocialNotification } from '@/services/NotificationService';
import { adoptStep } from '@/services/TimelineStepService';
import { getInterest } from '@/lib/landing/sampleData';
import type { BlueprintNewStep } from '@/types/blueprint';

// =============================================================================
// TYPES
// =============================================================================

export type ForYouItemType = 'peer_suggestion' | 'blueprint_update' | 'org_blueprint' | 'join_org';

export interface ForYouItem {
  id: string;
  type: ForYouItemType;
  priority: number; // 1=highest
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useForYouItems(options: {
  interestId?: string | null;
  interestSlug?: string | null;
  orgId?: string | null;
  orgName?: string | null;
  hasOrg: boolean;
}) {
  const { interestId, interestSlug, orgId, orgName, hasOrg } = options;
  const { user } = useAuth();

  // Source 1: Peer suggestions (step_suggested notifications)
  const { data: suggestionsRaw } = useQuery<SocialNotification[]>({
    queryKey: ['for-you-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { notifications } = await NotificationService.getNotifications(user.id, {
        types: ['step_suggested'],
        unreadOnly: true,
        limit: 20,
      });
      return notifications;
    },
    enabled: !!user?.id,
  });

  // Source 2: Blueprint updates
  const { data: newSteps } = useNewBlueprintSteps(interestId);

  // Source 3: Org blueprints (available but not subscribed)
  const { data: orgBlueprints } = useOrganizationBlueprints(orgId);
  const { data: subscribed } = useSubscribedBlueprints(interestId);

  // Source 4: Join org check
  const interest = interestSlug ? getInterest(interestSlug) : undefined;
  const hasJoinableOrgs = !hasOrg && !!interest?.organizations?.length;

  // Mutations
  const adoptStepMutation = useAdoptBlueprintStep();
  const dismissStepMutation = useDismissBlueprintStep();
  const subscribeMutation = useSubscribe();
  const queryClient = useQueryClient();

  const items = useMemo((): ForYouItem[] => {
    const result: ForYouItem[] = [];

    // Priority 1: Peer suggestions
    if (suggestionsRaw) {
      for (const notification of suggestionsRaw) {
        result.push({
          id: `suggestion_${notification.id}`,
          type: 'peer_suggestion',
          priority: 1,
          title: notification.data?.step_title as string || 'Suggested step',
          subtitle: `from ${notification.actorName || 'someone'}`,
          data: {
            notificationId: notification.id,
            sourceStepId: notification.data?.source_step_id,
            stepTitle: notification.data?.step_title,
            stepDescription: notification.data?.step_description,
            interestId: notification.data?.interest_id,
            actorName: notification.actorName,
          },
        });
      }
    }

    // Priority 2: Blueprint updates
    if (newSteps) {
      for (const step of newSteps) {
        result.push({
          id: `bp_update_${step.subscription_id}_${step.step_id}`,
          type: 'blueprint_update',
          priority: 2,
          title: step.step_title,
          subtitle: `from ${step.blueprint_title}`,
          data: {
            stepId: step.step_id,
            interestId: step.interest_id,
            subscriptionId: step.subscription_id,
            blueprintId: step.blueprint_id,
            blueprintTitle: step.blueprint_title,
            authorName: step.author_name,
          },
        });
      }
    }

    // Priority 3: Org blueprints (not subscribed)
    if (orgBlueprints && user) {
      const subscribedIds = new Set((subscribed ?? []).map((s) => s.blueprint_id));
      const available = orgBlueprints.filter(
        (bp) =>
          bp.is_published &&
          bp.user_id !== user.id &&
          (!interestId || bp.interest_id === interestId) &&
          !subscribedIds.has(bp.id),
      );
      for (const bp of available) {
        result.push({
          id: `org_bp_${bp.id}`,
          type: 'org_blueprint',
          priority: 3,
          title: bp.title,
          subtitle: orgName ? `${orgName} pathway` : 'Organization pathway',
          data: {
            blueprintId: bp.id,
            blueprintSlug: bp.slug,
            blueprintUserId: bp.user_id,
            subscriberCount: bp.subscriber_count,
          },
        });
      }
    }

    // Priority 4: Join org
    if (hasJoinableOrgs && interest) {
      const orgs = interest.organizations ?? [];
      const target = orgs.length === 1
        ? `/${interestSlug}/${orgs[0].slug}`
        : `/${interestSlug}`;
      const label = orgs.length === 1
        ? `Join ${orgs[0].name}`
        : 'Join an institution';
      result.push({
        id: 'join_org',
        type: 'join_org',
        priority: 4,
        title: label,
        subtitle: 'Access pathways and blueprints',
        data: { target, orgCount: orgs.length },
      });
    }

    // Sort by priority
    result.sort((a, b) => a.priority - b.priority);
    return result;
  }, [suggestionsRaw, newSteps, orgBlueprints, subscribed, user, interestId, orgName, hasJoinableOrgs, interest, interestSlug]);

  // Actions
  const handleAdoptBlueprintStep = (item: ForYouItem) => {
    const data = item.data as { stepId: string; interestId: string; subscriptionId: string };
    adoptStepMutation.mutate({
      sourceStepId: data.stepId,
      interestId: data.interestId,
      subscriptionId: data.subscriptionId,
    });
  };

  const handleDismissBlueprintStep = (item: ForYouItem) => {
    const data = item.data as { subscriptionId: string; stepId: string };
    dismissStepMutation.mutate({
      subscriptionId: data.subscriptionId,
      sourceStepId: data.stepId,
    });
  };

  const handleSubscribeBlueprint = async (item: ForYouItem) => {
    const data = item.data as { blueprintId: string; blueprintUserId: string };
    await subscribeMutation.mutateAsync(data.blueprintId);
    // Notify owner (best-effort)
    if (user && data.blueprintUserId !== user.id) {
      NotificationService
        .notifyBlueprintSubscribed({
          blueprintOwnerId: data.blueprintUserId,
          subscriberId: user.id,
          subscriberName: user.user_metadata?.full_name || user.email || 'Someone',
          blueprintId: data.blueprintId,
          blueprintTitle: item.title,
        })
        .catch(() => {});
    }
  };

  const handleAdoptSuggestion = async (item: ForYouItem) => {
    if (!user?.id) return;
    const data = item.data as {
      notificationId: string;
      sourceStepId: string;
      interestId?: string;
    };
    try {
      await adoptStep(
        user.id,
        data.sourceStepId,
        data.interestId || interestId || '',
      );
      // Mark notification as read
      await NotificationService.markAsRead(user.id, data.notificationId);
      queryClient.invalidateQueries({ queryKey: ['for-you-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['timeline-steps'] });
    } catch {
      // Silently fail — user can retry
    }
  };

  const handleDismissSuggestion = async (item: ForYouItem) => {
    if (!user?.id) return;
    const data = item.data as { notificationId: string };
    await NotificationService.markAsRead(user.id, data.notificationId);
    queryClient.invalidateQueries({ queryKey: ['for-you-suggestions'] });
  };

  return {
    items,
    actions: {
      adoptBlueprintStep: handleAdoptBlueprintStep,
      dismissBlueprintStep: handleDismissBlueprintStep,
      subscribeBlueprint: handleSubscribeBlueprint,
      adoptSuggestion: handleAdoptSuggestion,
      dismissSuggestion: handleDismissSuggestion,
    },
  };
}
