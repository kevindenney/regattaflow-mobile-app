/**
 * useRegattaContent Hook
 *
 * Manages race prep notes, post-race analysis, and content visibility
 * for the Sailor Discovery feature.
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRegattaContent');

// =============================================================================
// TYPES
// =============================================================================

export type ContentVisibility = 'private' | 'fleet' | 'public';

export interface TuningSettings {
  // Shroud tensions (split for upper/lower)
  upper_shroud_tension?: number | string;
  lower_shroud_tension?: number | string;
  // Legacy field - may exist in older data
  shroud_tension?: number | string;
  // Consolidated vang (replaces separate kicker/boom vang)
  vang?: string;
  // Legacy field - may exist in older data, maps to vang
  kicker?: string;
  cunningham?: string;
  outhaul?: string;
  backstay?: string;
  forestay?: string;
  jib_car?: string;
  traveler?: string;
  mast_rake?: string;
  // Allow custom fields
  [key: string]: string | number | undefined;
}

export interface RegattaContent {
  prepNotes?: string;
  tuningSettings?: TuningSettings;
  postRaceNotes?: string;
  lessonsLearned?: string[];
  contentVisibility?: ContentVisibility;
}

export interface UseRegattaContentParams {
  regattaId: string;
  /** Callback when content is saved */
  onSaved?: () => void;
}

export interface UseRegattaContentReturn {
  /** Current content from database */
  content: RegattaContent | null;
  /** Whether content is loading */
  isLoading: boolean;
  /** Whether content is being saved */
  isSaving: boolean;
  /** Error message if any */
  error: string | null;
  /** Save prep notes and tuning settings */
  savePreRaceContent: (data: {
    prepNotes?: string;
    tuningSettings?: TuningSettings;
    contentVisibility?: ContentVisibility;
  }) => Promise<boolean>;
  /** Save post-race notes and lessons learned */
  savePostRaceContent: (data: {
    postRaceNotes?: string;
    lessonsLearned?: string[];
    contentVisibility?: ContentVisibility;
  }) => Promise<boolean>;
  /** Save just the visibility setting */
  saveVisibility: (visibility: ContentVisibility) => Promise<boolean>;
  /** Reload content from database */
  refetch: () => Promise<void>;
}

/**
 * Hook for managing regatta content (prep notes, post-race analysis)
 */
export function useRegattaContent({
  regattaId,
  onSaved,
}: UseRegattaContentParams): UseRegattaContentReturn {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [content, setContent] = useState<RegattaContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch content from database
  const refetch = useCallback(async () => {
    if (!regattaId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('regattas')
        .select('prep_notes, tuning_settings, post_race_notes, lessons_learned, content_visibility')
        .eq('id', regattaId)
        .single();

      if (fetchError) {
        logger.error('[useRegattaContent] Fetch error:', fetchError);
        setError(fetchError.message);
        return;
      }

      setContent({
        prepNotes: data?.prep_notes || undefined,
        tuningSettings: data?.tuning_settings || undefined,
        postRaceNotes: data?.post_race_notes || undefined,
        lessonsLearned: data?.lessons_learned || undefined,
        contentVisibility: data?.content_visibility || 'fleet',
      });
    } catch (err) {
      logger.error('[useRegattaContent] Exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [regattaId]);

  // Save pre-race content
  const savePreRaceContent = useCallback(async (data: {
    prepNotes?: string;
    tuningSettings?: TuningSettings;
    contentVisibility?: ContentVisibility;
  }): Promise<boolean> => {
    if (!regattaId || !user?.id) {
      Alert.alert('Error', 'Must be logged in to save content');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: Record<string, any> = {};

      if (data.prepNotes !== undefined) {
        updateData.prep_notes = data.prepNotes || null;
      }
      if (data.tuningSettings !== undefined) {
        updateData.tuning_settings = data.tuningSettings || null;
      }
      if (data.contentVisibility !== undefined) {
        updateData.content_visibility = data.contentVisibility;
      }

      const { error: updateError } = await supabase
        .from('regattas')
        .update(updateData)
        .eq('id', regattaId)
        .eq('created_by', user.id); // Ensure user owns this regatta

      if (updateError) {
        logger.error('[useRegattaContent] Save pre-race error:', updateError);
        Alert.alert('Error', updateError.message || 'Failed to save prep notes');
        return false;
      }

      // Update local state
      setContent(prev => ({
        ...prev,
        prepNotes: data.prepNotes ?? prev?.prepNotes,
        tuningSettings: data.tuningSettings ?? prev?.tuningSettings,
        contentVisibility: data.contentVisibility ?? prev?.contentVisibility,
      }));

      // Invalidate queries that depend on this data
      queryClient.invalidateQueries({ queryKey: ['regattas'] });
      queryClient.invalidateQueries({ queryKey: ['fleetActivity'] });
      queryClient.invalidateQueries({ queryKey: ['raceParticipants'] });

      onSaved?.();
      return true;
    } catch (err) {
      logger.error('[useRegattaContent] Exception:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [regattaId, user?.id, queryClient, onSaved]);

  // Save post-race content
  const savePostRaceContent = useCallback(async (data: {
    postRaceNotes?: string;
    lessonsLearned?: string[];
    contentVisibility?: ContentVisibility;
  }): Promise<boolean> => {
    if (!regattaId || !user?.id) {
      Alert.alert('Error', 'Must be logged in to save content');
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updateData: Record<string, any> = {};

      if (data.postRaceNotes !== undefined) {
        updateData.post_race_notes = data.postRaceNotes || null;
      }
      if (data.lessonsLearned !== undefined) {
        // Filter out empty strings
        updateData.lessons_learned = data.lessonsLearned.filter(l => l.trim()) || null;
      }
      if (data.contentVisibility !== undefined) {
        updateData.content_visibility = data.contentVisibility;
      }

      const { error: updateError } = await supabase
        .from('regattas')
        .update(updateData)
        .eq('id', regattaId)
        .eq('created_by', user.id);

      if (updateError) {
        logger.error('[useRegattaContent] Save post-race error:', updateError);
        Alert.alert('Error', updateError.message || 'Failed to save post-race notes');
        return false;
      }

      // Update local state
      setContent(prev => ({
        ...prev,
        postRaceNotes: data.postRaceNotes ?? prev?.postRaceNotes,
        lessonsLearned: data.lessonsLearned ?? prev?.lessonsLearned,
        contentVisibility: data.contentVisibility ?? prev?.contentVisibility,
      }));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['regattas'] });
      queryClient.invalidateQueries({ queryKey: ['fleetActivity'] });
      queryClient.invalidateQueries({ queryKey: ['raceParticipants'] });
      queryClient.invalidateQueries({ queryKey: ['classExperts'] });

      onSaved?.();
      return true;
    } catch (err) {
      logger.error('[useRegattaContent] Exception:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [regattaId, user?.id, queryClient, onSaved]);

  // Save just visibility
  const saveVisibility = useCallback(async (visibility: ContentVisibility): Promise<boolean> => {
    if (!regattaId || !user?.id) {
      return false;
    }

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('regattas')
        .update({ content_visibility: visibility })
        .eq('id', regattaId)
        .eq('created_by', user.id);

      if (updateError) {
        logger.error('[useRegattaContent] Save visibility error:', updateError);
        return false;
      }

      setContent(prev => ({
        ...prev,
        contentVisibility: visibility,
      }));

      queryClient.invalidateQueries({ queryKey: ['regattas'] });
      return true;
    } catch (err) {
      logger.error('[useRegattaContent] Exception:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [regattaId, user?.id, queryClient]);

  return {
    content,
    isLoading,
    isSaving,
    error,
    savePreRaceContent,
    savePostRaceContent,
    saveVisibility,
    refetch,
  };
}

export default useRegattaContent;
