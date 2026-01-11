/**
 * useAdaptiveLearning Hook
 *
 * React Query hook for the adaptive learning system.
 * Provides access to learnable events, personalized nudges, and nudge management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AdaptiveLearningService } from '@/services/AdaptiveLearningService';
import type {
  LearnableEvent,
  LearnableEventType,
  PersonalizedNudge,
  PersonalizedNudgeSet,
  NudgeDeliveryChannel,
  ExtractionSourceType,
  ExtractionInput,
} from '@/types/adaptiveLearning';
import type { RacePhase } from '@/types/excellenceFramework';

// Query keys
const ADAPTIVE_LEARNING_KEYS = {
  all: ['adaptive-learning'] as const,
  events: (sailorId: string) => [...ADAPTIVE_LEARNING_KEYS.all, 'events', sailorId] as const,
  eventsByType: (sailorId: string, eventType: LearnableEventType) =>
    [...ADAPTIVE_LEARNING_KEYS.events(sailorId), 'type', eventType] as const,
  eventsByVenue: (sailorId: string, venueId: string) =>
    [...ADAPTIVE_LEARNING_KEYS.events(sailorId), 'venue', venueId] as const,
  nudges: (raceEventId: string) =>
    [...ADAPTIVE_LEARNING_KEYS.all, 'nudges', raceEventId] as const,
  insights: (sailorId: string) =>
    [...ADAPTIVE_LEARNING_KEYS.all, 'insights', sailorId] as const,
};

/**
 * Hook for accessing learnable events
 */
export function useLearnableEvents(options?: {
  eventType?: LearnableEventType;
  venueId?: string;
  phase?: RacePhase;
  nudgeEligibleOnly?: boolean;
  limit?: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  // Fetch events
  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: sailorId
      ? options?.eventType
        ? ADAPTIVE_LEARNING_KEYS.eventsByType(sailorId, options.eventType)
        : options?.venueId
          ? ADAPTIVE_LEARNING_KEYS.eventsByVenue(sailorId, options.venueId)
          : ADAPTIVE_LEARNING_KEYS.events(sailorId)
      : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return [];
      return AdaptiveLearningService.getLearnableEvents({
        sailorId,
        ...options,
      });
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 5,
  });

  // Confirm event mutation
  const confirmMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return AdaptiveLearningService.confirmEvent(eventId);
    },
    onSuccess: () => {
      if (sailorId) {
        queryClient.invalidateQueries({
          queryKey: ADAPTIVE_LEARNING_KEYS.events(sailorId),
        });
      }
    },
  });

  // Dismiss event mutation
  const dismissMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return AdaptiveLearningService.dismissEvent(eventId);
    },
    onMutate: async (eventId) => {
      // Optimistic update
      const queryKey = sailorId
        ? ADAPTIVE_LEARNING_KEYS.events(sailorId)
        : ['no-user'];
      await queryClient.cancelQueries({ queryKey });
      const previousEvents = queryClient.getQueryData<LearnableEvent[]>(queryKey);
      queryClient.setQueryData<LearnableEvent[]>(queryKey, (old) =>
        old?.filter((e) => e.id !== eventId)
      );
      return { previousEvents };
    },
    onError: (_err, _eventId, context) => {
      if (context?.previousEvents && sailorId) {
        queryClient.setQueryData(
          ADAPTIVE_LEARNING_KEYS.events(sailorId),
          context.previousEvents
        );
      }
    },
    onSettled: () => {
      if (sailorId) {
        queryClient.invalidateQueries({
          queryKey: ADAPTIVE_LEARNING_KEYS.events(sailorId),
        });
      }
    },
  });

  // Rate effectiveness mutation
  const rateMutation = useMutation({
    mutationFn: async ({ eventId, rating }: { eventId: string; rating: number }) => {
      return AdaptiveLearningService.rateEventEffectiveness(eventId, rating);
    },
    onSuccess: () => {
      if (sailorId) {
        queryClient.invalidateQueries({
          queryKey: ADAPTIVE_LEARNING_KEYS.events(sailorId),
        });
      }
    },
  });

  // Group events by type
  const eventsByType = events.reduce(
    (acc, event) => {
      if (!acc[event.eventType]) acc[event.eventType] = [];
      acc[event.eventType].push(event);
      return acc;
    },
    {} as Record<LearnableEventType, LearnableEvent[]>
  );

  // Count positive vs negative
  const positiveCount = events.filter((e) => e.outcome === 'positive').length;
  const negativeCount = events.filter((e) => e.outcome === 'negative').length;

  return {
    // Data
    events,
    eventsByType,
    positiveCount,
    negativeCount,
    totalCount: events.length,

    // State
    isLoading,
    error,

    // Actions
    confirmEvent: confirmMutation.mutateAsync,
    dismissEvent: dismissMutation.mutateAsync,
    rateEffectiveness: (eventId: string, rating: number) =>
      rateMutation.mutateAsync({ eventId, rating }),
    refetch,
  };
}

/**
 * Hook for personalized nudges for a specific race
 */
export function usePersonalizedNudges(
  raceEventId: string,
  options?: {
    venueId?: string;
    forecast?: { windSpeed: number; windDirection: number };
    boatClassId?: string;
    raceType?: 'fleet' | 'team' | 'match' | 'distance';
  }
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  // Fetch nudges
  const {
    data: nudgeSet,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ADAPTIVE_LEARNING_KEYS.nudges(raceEventId),
    queryFn: async () => {
      if (!sailorId) return null;
      return AdaptiveLearningService.generatePersonalizedNudges({
        sailorId,
        raceEventId,
        ...options,
      });
    },
    enabled: !!sailorId && !!raceEventId,
    staleTime: 1000 * 60 * 15, // 15 minutes - nudges are expensive to generate
  });

  // Record delivery mutation
  const recordDeliveryMutation = useMutation({
    mutationFn: async ({
      learnableEventId,
      channel,
    }: {
      learnableEventId: string;
      channel: NudgeDeliveryChannel;
    }) => {
      if (!sailorId) throw new Error('Not authenticated');
      return AdaptiveLearningService.recordNudgeDelivery(
        learnableEventId,
        sailorId,
        channel,
        raceEventId
      );
    },
  });

  // Acknowledge nudge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      return AdaptiveLearningService.recordNudgeAcknowledged(deliveryId);
    },
  });

  // Record action taken mutation
  const actionTakenMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      return AdaptiveLearningService.recordNudgeActionTaken(deliveryId);
    },
  });

  // Record outcome mutation
  const recordOutcomeMutation = useMutation({
    mutationFn: async ({
      deliveryId,
      rating,
      notes,
      issueRecurred,
    }: {
      deliveryId: string;
      rating: number;
      notes?: string;
      issueRecurred?: boolean;
    }) => {
      return AdaptiveLearningService.recordNudgeOutcome(
        deliveryId,
        rating,
        notes,
        issueRecurred
      );
    },
  });

  // Computed values
  const allNudges = nudgeSet
    ? [
        ...nudgeSet.checklistAdditions,
        ...nudgeSet.venueInsights,
        ...nudgeSet.conditionsInsights,
        ...nudgeSet.reminders,
      ]
    : [];

  const highPriorityNudges = allNudges.filter((n) => n.matchScore >= 0.7);

  return {
    // Data
    nudgeSet,
    checklistAdditions: nudgeSet?.checklistAdditions || [],
    venueInsights: nudgeSet?.venueInsights || [],
    conditionsInsights: nudgeSet?.conditionsInsights || [],
    reminders: nudgeSet?.reminders || [],
    allNudges,
    highPriorityNudges,
    totalCount: nudgeSet?.totalCount || 0,
    highPriorityCount: nudgeSet?.highPriorityCount || 0,

    // State
    isLoading,
    error,

    // Actions
    recordDelivery: (learnableEventId: string, channel: NudgeDeliveryChannel) =>
      recordDeliveryMutation.mutateAsync({ learnableEventId, channel }),
    acknowledgeNudge: acknowledgeMutation.mutateAsync,
    recordActionTaken: actionTakenMutation.mutateAsync,
    recordOutcome: (
      deliveryId: string,
      rating: number,
      notes?: string,
      issueRecurred?: boolean
    ) =>
      recordOutcomeMutation.mutateAsync({ deliveryId, rating, notes, issueRecurred }),
    refetch,
  };
}

/**
 * Hook for extracting learnable events from text
 */
export function useEventExtraction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  const extractMutation = useMutation({
    mutationFn: async ({
      text,
      sourceType,
      context,
    }: {
      text: string;
      sourceType: ExtractionSourceType;
      context?: ExtractionInput['context'];
    }) => {
      return AdaptiveLearningService.extractEventsFromText(text, sourceType, context);
    },
  });

  const processRaceMutation = useMutation({
    mutationFn: async ({
      raceEventId,
      feedback,
      context,
    }: {
      raceEventId: string;
      feedback: {
        narrative?: string;
        keyMoments?: { description: string; phase?: RacePhase }[];
        phaseNotes?: { phase: RacePhase; notes: string }[];
      };
      context?: ExtractionInput['context'];
    }) => {
      if (!sailorId) throw new Error('Not authenticated');
      return AdaptiveLearningService.processRaceCompletion(
        sailorId,
        raceEventId,
        feedback,
        context
      );
    },
    onSuccess: () => {
      if (sailorId) {
        queryClient.invalidateQueries({
          queryKey: ADAPTIVE_LEARNING_KEYS.events(sailorId),
        });
      }
    },
  });

  return {
    // Extract from arbitrary text
    extractEvents: extractMutation.mutateAsync,
    isExtracting: extractMutation.isPending,
    extractionError: extractMutation.error,

    // Process complete race feedback
    processRace: processRaceMutation.mutateAsync,
    isProcessing: processRaceMutation.isPending,
    processingError: processRaceMutation.error,
  };
}

/**
 * Hook for learning insights summary
 */
export function useLearningInsights() {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: insights,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: sailorId ? ADAPTIVE_LEARNING_KEYS.insights(sailorId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return AdaptiveLearningService.getLearningInsights(sailorId);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 10,
  });

  return {
    insights,
    totalEvents: insights?.totalEvents || 0,
    positiveEvents: insights?.positiveEvents || 0,
    negativeEvents: insights?.negativeEvents || 0,
    topCategories: insights?.topCategories || [],
    recentLearnings: insights?.recentLearnings || [],
    isLoading,
    error,
    refetch,
  };
}

export default useLearnableEvents;
