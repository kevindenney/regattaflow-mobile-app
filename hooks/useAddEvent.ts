/**
 * useAddEvent Hook
 *
 * Interest-aware wrapper for creating new events.
 * - For sailing: delegates to useAddRace (existing flow)
 * - For other interests: provides subtype selection and form fields from config
 *
 * This hook reads the current interest's eventSubtypes and formFields
 * from InterestEventConfig to drive the "Add Event" flow.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import type { EventSubtypeConfig, EventFormField } from '@/types/interestEventConfig';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useAddEvent');

// =============================================================================
// TYPES
// =============================================================================

export interface EventFormData {
  /** Event subtype ID from the interest config */
  subtypeId: string;
  /** Common fields */
  name: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  /** Dynamic fields from the subtype's formFields config, keyed by field ID */
  fields: Record<string, string | number | boolean | string[]>;
}

export interface UseAddEventParams {
  /** Callback when an event is successfully created */
  onEventCreated?: (eventId: string) => void;
  /** Callback to refresh event list */
  refetchEvents?: () => void;
}

export interface UseAddEventReturn {
  /** "Add Event" button label (e.g., "Add Race", "Add Shift") */
  addEventLabel: string;
  /** Event type noun (e.g., "Race", "Shift") */
  eventNoun: string;
  /** Available event subtypes for this interest */
  subtypes: EventSubtypeConfig[];
  /** Default subtype ID */
  defaultSubtype: string;
  /** Currently selected subtype ID */
  selectedSubtype: string;
  /** Set the selected subtype */
  setSelectedSubtype: (subtypeId: string) => void;
  /** Form fields for the selected subtype */
  formFields: EventFormField[];
  /** Whether the add event sheet/modal is visible */
  isVisible: boolean;
  /** Show the add event flow */
  showAddEvent: () => void;
  /** Hide the add event flow */
  hideAddEvent: () => void;
  /** Submit the event form */
  submitEvent: (data: EventFormData) => Promise<void>;
  /** Whether a submission is in progress */
  isSubmitting: boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useAddEvent({
  onEventCreated,
  refetchEvents,
}: UseAddEventParams = {}): UseAddEventReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const eventConfig = useInterestEventConfig();

  const [isVisible, setIsVisible] = useState(false);
  const [selectedSubtype, setSelectedSubtype] = useState(eventConfig.defaultSubtype);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get form fields for the currently selected subtype
  const currentSubtype = eventConfig.eventSubtypes.find((s) => s.id === selectedSubtype);
  const formFields = currentSubtype?.formFields ?? [];

  const showAddEvent = useCallback(() => {
    if (eventConfig.interestSlug === 'sail-racing') {
      // Sailing uses its own add race page
      router.push('/(tabs)/race/add-tufte');
    } else {
      setIsVisible(true);
    }
  }, [eventConfig.interestSlug, router]);

  const hideAddEvent = useCallback(() => {
    setIsVisible(false);
  }, []);

  const submitEvent = useCallback(
    async (data: EventFormData) => {
      setIsSubmitting(true);
      try {
        logger.debug('[useAddEvent] Submitting event:', {
          interest: eventConfig.interestSlug,
          subtype: data.subtypeId,
          name: data.name,
        });

        // TODO: Implement Supabase insert into betterat_events table
        // For now, log and simulate success
        // const { data: newEvent, error } = await supabase
        //   .from('betterat_events')
        //   .insert({
        //     interest_id: currentInterestId,
        //     event_type: data.subtypeId,
        //     name: data.name,
        //     date: data.date,
        //     time: data.time,
        //     location: data.location,
        //     notes: data.notes,
        //     custom_fields: data.fields,
        //   })
        //   .select('id')
        //   .single();

        const mockEventId = `event-${Date.now()}`;

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['races'] });
        refetchEvents?.();

        onEventCreated?.(mockEventId);
        setIsVisible(false);
      } catch (err) {
        logger.error('[useAddEvent] Submit error:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [eventConfig.interestSlug, queryClient, refetchEvents, onEventCreated]
  );

  return {
    addEventLabel: eventConfig.addEventLabel,
    eventNoun: eventConfig.eventNoun,
    subtypes: eventConfig.eventSubtypes,
    defaultSubtype: eventConfig.defaultSubtype,
    selectedSubtype,
    setSelectedSubtype,
    formFields,
    isVisible,
    showAddEvent,
    hideAddEvent,
    submitEvent,
    isSubmitting,
  };
}

export default useAddEvent;
