/**
 * FollowerSuggestionService
 *
 * Handles CRUD operations for follower race suggestions — tips/advice that
 * followers can leave on someone's race. Race owners can accept or dismiss.
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';
import { isDemoRaceId } from '@/lib/demo/demoRaceData';

const logger = createLogger('FollowerSuggestionService');

// =============================================================================
// TYPES
// =============================================================================

export type SuggestionCategory =
  | 'strategy'
  | 'rig_tuning'
  | 'weather'
  | 'crew'
  | 'tactics'
  | 'equipment';

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed';

export type SuggestionTargetPhase = 'days_before' | 'on_water' | 'after_race';

export interface FollowerSuggestion {
  id: string;
  raceId: string;
  raceOwnerId: string;
  suggesterId: string;
  category: SuggestionCategory;
  message: string;
  status: SuggestionStatus;
  targetPhase: SuggestionTargetPhase;
  createdAt: string;
  updatedAt: string;
  /** Populated via join — suggester profile info */
  suggesterName?: string;
  suggesterAvatarEmoji?: string;
  suggesterAvatarColor?: string;
}

export interface CreateFollowerSuggestionInput {
  raceId: string;
  raceOwnerId: string;
  category: SuggestionCategory;
  message: string;
}

// =============================================================================
// CATEGORY → PHASE MAPPING
// =============================================================================

export const CATEGORY_PHASE_MAP: Record<SuggestionCategory, SuggestionTargetPhase> = {
  strategy: 'days_before',
  weather: 'days_before',
  crew: 'days_before',
  tactics: 'on_water',
  rig_tuning: 'days_before',
  equipment: 'days_before',
};

export const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  strategy: 'Strategy',
  rig_tuning: 'Rig Tuning',
  weather: 'Weather',
  crew: 'Crew',
  tactics: 'Tactics',
  equipment: 'Equipment',
};

export const CATEGORY_ICONS: Record<SuggestionCategory, string> = {
  strategy: 'compass-outline',
  rig_tuning: 'settings-outline',
  weather: 'cloudy-outline',
  crew: 'people-outline',
  tactics: 'navigate-outline',
  equipment: 'build-outline',
};

export const CATEGORY_COLORS: Record<SuggestionCategory, string> = {
  strategy: '#007AFF',
  rig_tuning: '#FF9500',
  weather: '#5AC8FA',
  crew: '#34C759',
  tactics: '#AF52DE',
  equipment: '#FF3B30',
};

// =============================================================================
// HELPERS
// =============================================================================

interface RawSuggestionRow {
  id: string;
  race_id: string;
  race_owner_id: string;
  suggester_id: string;
  category: SuggestionCategory;
  message: string;
  status: SuggestionStatus;
  target_phase: SuggestionTargetPhase;
  created_at: string;
  updated_at: string;
  users?: {
    full_name?: string;
  } | null;
}

function mapRow(row: RawSuggestionRow): FollowerSuggestion {
  return {
    id: row.id,
    raceId: row.race_id,
    raceOwnerId: row.race_owner_id,
    suggesterId: row.suggester_id,
    category: row.category,
    message: row.message,
    status: row.status,
    targetPhase: row.target_phase,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    suggesterName: row.users?.full_name ?? undefined,
  };
}

// =============================================================================
// SERVICE
// =============================================================================

export class FollowerSuggestionService {
  /**
   * Create a suggestion on someone's race.
   * target_phase is derived from the category.
   */
  static async createSuggestion(
    input: CreateFollowerSuggestionInput
  ): Promise<FollowerSuggestion | null> {
    // Cannot create suggestions on demo races
    if (isDemoRaceId(input.raceId)) {
      logger.warn('Cannot create suggestions on demo races');
      return null;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        logger.error('createSuggestion: not authenticated');
        return null;
      }

      const targetPhase = CATEGORY_PHASE_MAP[input.category];

      const { data, error } = await supabase
        .from('race_suggestions')
        .insert({
          race_id: input.raceId,
          race_owner_id: input.raceOwnerId,
          suggester_id: userData.user.id,
          category: input.category,
          message: input.message,
          target_phase: targetPhase,
        })
        .select('*, users:suggester_id(full_name)')
        .single();

      if (error) {
        logger.error('createSuggestion failed:', error);
        return null;
      }

      return mapRow(data as RawSuggestionRow);
    } catch (error) {
      logger.error('createSuggestion failed:', error);
      return null;
    }
  }

  /**
   * Get all suggestions for a race (race owner view).
   * Includes suggester profile info via join.
   */
  static async getSuggestionsForRace(raceId: string): Promise<FollowerSuggestion[]> {
    // Demo races don't have database entries - return empty array
    if (isDemoRaceId(raceId)) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('race_suggestions')
        .select('*, users:suggester_id(full_name)')
        .eq('race_id', raceId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('getSuggestionsForRace failed:', error);
        return [];
      }

      return (data as RawSuggestionRow[]).map(mapRow);
    } catch (error) {
      logger.error('getSuggestionsForRace failed:', error);
      return [];
    }
  }

  /**
   * Get count of pending suggestions for a race.
   */
  static async getPendingSuggestionCount(raceId: string): Promise<number> {
    // Demo races don't have database entries
    if (isDemoRaceId(raceId)) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('race_suggestions')
        .select('id', { count: 'exact', head: true })
        .eq('race_id', raceId)
        .eq('status', 'pending');

      if (error) {
        logger.error('getPendingSuggestionCount failed:', error);
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      logger.error('getPendingSuggestionCount failed:', error);
      return 0;
    }
  }

  /**
   * Accept a suggestion (race owner action).
   */
  static async acceptSuggestion(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestionId);

      if (error) {
        logger.error('acceptSuggestion failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('acceptSuggestion failed:', error);
      return false;
    }
  }

  /**
   * Dismiss a suggestion (race owner action).
   */
  static async dismissSuggestion(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_suggestions')
        .update({ status: 'dismissed' })
        .eq('id', suggestionId);

      if (error) {
        logger.error('dismissSuggestion failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('dismissSuggestion failed:', error);
      return false;
    }
  }

  /**
   * Get suggestions I've sent on a particular race.
   */
  static async getMySentSuggestions(raceId: string): Promise<FollowerSuggestion[]> {
    // Demo races don't have database entries
    if (isDemoRaceId(raceId)) {
      return [];
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return [];

      const { data, error } = await supabase
        .from('race_suggestions')
        .select('*, users:suggester_id(full_name)')
        .eq('race_id', raceId)
        .eq('suggester_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('getMySentSuggestions failed:', error);
        return [];
      }

      return (data as RawSuggestionRow[]).map(mapRow);
    } catch (error) {
      logger.error('getMySentSuggestions failed:', error);
      return [];
    }
  }
}

export default FollowerSuggestionService;
