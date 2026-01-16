import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';
import type {
  RaceIntentions,
  RaceIntentionUpdate,
  ArrivalTimeIntention,
  SailSelectionIntention,
  RigIntentions,
  CourseSelectionIntention,
} from '@/types/raceIntentions';

const logger = createLogger('SailorRacePreparationService');

export interface RegulatoryAcknowledgements {
  cleanRegatta: boolean;
  signOn: boolean;
  safetyBriefing: boolean;
}

export interface RaceBriefData {
  id?: string;
  name?: string;
  series?: string;
  venue?: string;
  startTime?: string;
  warningSignal?: string;
  cleanRegatta?: boolean;
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
  };
  weatherSummary?: string;
  tideSummary?: string;
  lastUpdated?: string;
}

export interface SailorRacePreparation {
  id?: string;
  race_event_id: string;
  sailor_id: string;
  rig_notes?: string;
  selected_rig_preset_id?: string;
  regulatory_acknowledgements?: RegulatoryAcknowledgements;
  race_brief_data?: RaceBriefData;
  user_intentions?: RaceIntentions;
  created_at?: string;
  updated_at?: string;
}

class SailorRacePreparationService {
  /**
   * Validates if a string is a valid UUID format
   */
  private isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  /**
   * Get race preparation data for a specific sailor and race
   */
  async getPreparation(
    raceEventId: string,
    sailorId: string
  ): Promise<SailorRacePreparation | null> {
    // Skip queries for non-UUID race IDs (e.g., demo races)
    if (!this.isValidUUID(raceEventId)) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('*')
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching race preparation:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get race preparation:', error);
      return null;
    }
  }

  /**
   * Upsert (create or update) race preparation data
   */
  async upsertPreparation(
    preparation: SailorRacePreparation
  ): Promise<SailorRacePreparation | null> {
    // Validate that the race exists in regattas table before attempting upsert
    // Note: FK constraint references regattas table (not race_events)
    const { data: regattaExists } = await supabase
      .from('regattas')
      .select('id')
      .eq('id', preparation.race_event_id)
      .maybeSingle();

    if (!regattaExists) {
      logger.info(`Race ${preparation.race_event_id} does not exist in regattas, skipping upsert`);
      return null;
    }

    const { data, error } = await supabase
      .from('sailor_race_preparation')
      .upsert(
        {
          race_event_id: preparation.race_event_id,
          sailor_id: preparation.sailor_id,
          rig_notes: preparation.rig_notes,
          selected_rig_preset_id: preparation.selected_rig_preset_id,
          regulatory_acknowledgements: preparation.regulatory_acknowledgements,
          race_brief_data: preparation.race_brief_data,
          user_intentions: preparation.user_intentions,
        },
        {
          onConflict: 'race_event_id,sailor_id',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Error upserting race preparation:', error);
      throw error;
    }

    logger.info('Race preparation upserted successfully');
    return data;
  }

  /**
   * Update rig notes for a race
   */
  async updateRigNotes(
    raceEventId: string,
    sailorId: string,
    rigNotes: string
  ): Promise<boolean> {
    try {
      // Validate that the race_event exists before attempting upsert
      const { data: raceEventExists, error: raceEventError } = await supabase
        .from('race_events')
        .select('id')
        .eq('id', raceEventId)
        .maybeSingle();

      if (raceEventError) {
        logger.error('Error checking race event existence:', raceEventError);
        throw raceEventError;
      }

      if (!raceEventExists) {
        logger.info(`Race event ${raceEventId} does not exist, skipping rig notes update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            rig_notes: rigNotes,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating rig notes:', error);
        throw error;
      }

      logger.info('Rig notes updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update rig notes:', error);
      return false;
    }
  }

  /**
   * Update selected rig preset for a race
   */
  async updateRigPreset(
    raceEventId: string,
    sailorId: string,
    rigPresetId: string
  ): Promise<boolean> {
    try {
      // Validate that the race_event exists before attempting upsert
      const { data: raceEventExists, error: raceEventError } = await supabase
        .from('race_events')
        .select('id')
        .eq('id', raceEventId)
        .maybeSingle();

      if (raceEventError) {
        logger.error('Error checking race event existence:', raceEventError);
        throw raceEventError;
      }

      if (!raceEventExists) {
        logger.info(`Race event ${raceEventId} does not exist, skipping rig preset update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            selected_rig_preset_id: rigPresetId,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating rig preset:', error);
        throw error;
      }

      logger.info('Rig preset updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update rig preset:', error);
      return false;
    }
  }

  /**
   * Update regulatory acknowledgements for a race
   */
  async updateAcknowledgements(
    raceEventId: string,
    sailorId: string,
    acknowledgements: RegulatoryAcknowledgements
  ): Promise<boolean> {
    try {
      // Validate that the race_event exists before attempting upsert
      const { data: raceEventExists, error: raceEventError } = await supabase
        .from('race_events')
        .select('id')
        .eq('id', raceEventId)
        .maybeSingle();

      if (raceEventError) {
        logger.error('Error checking race event existence:', raceEventError);
        throw raceEventError;
      }

      if (!raceEventExists) {
        logger.info(`Race event ${raceEventId} does not exist, skipping acknowledgements update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            regulatory_acknowledgements: acknowledgements,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating acknowledgements:', error);
        throw error;
      }

      logger.info('Acknowledgements updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update acknowledgements:', error);
      return false;
    }
  }

  /**
   * Update race brief data for AI context
   */
  async updateRaceBrief(
    raceEventId: string,
    sailorId: string,
    raceBriefData: RaceBriefData
  ): Promise<boolean> {
    try {
      // Validate that the race_event exists before attempting upsert
      const { data: raceEventExists, error: raceEventError } = await supabase
        .from('race_events')
        .select('id')
        .eq('id', raceEventId)
        .maybeSingle();

      if (raceEventError) {
        logger.error('Error checking race event existence:', raceEventError);
        throw raceEventError;
      }

      if (!raceEventExists) {
        logger.info(`Race event ${raceEventId} does not exist, skipping race brief update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            race_brief_data: raceBriefData,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating race brief:', error);
        throw error;
      }

      logger.info('Race brief updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update race brief:', error);
      return false;
    }
  }

  /**
   * Delete race preparation data
   */
  async deletePreparation(
    raceEventId: string,
    sailorId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .delete()
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId);

      if (error) {
        logger.error('Error deleting race preparation:', error);
        throw error;
      }

      logger.info('Race preparation deleted successfully');
      return true;
    } catch (error) {
      logger.error('Failed to delete race preparation:', error);
      return false;
    }
  }

  /**
   * Get all race preparations for a sailor
   */
  async getSailorPreparations(sailorId: string): Promise<SailorRacePreparation[]> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('*')
        .eq('sailor_id', sailorId)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Error fetching sailor preparations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get sailor preparations:', error);
      return [];
    }
  }

  /**
   * Toggle a specific acknowledgement
   */
  async toggleAcknowledgement(
    raceEventId: string,
    sailorId: string,
    key: keyof RegulatoryAcknowledgements
  ): Promise<boolean> {
    try {
      // First, get the current acknowledgements
      const current = await this.getPreparation(raceEventId, sailorId);

      const currentAcknowledgements = current?.regulatory_acknowledgements || {
        cleanRegatta: false,
        signOn: false,
        safetyBriefing: false,
      };

      // Toggle the specific key
      const updatedAcknowledgements = {
        ...currentAcknowledgements,
        [key]: !currentAcknowledgements[key],
      };

      // Update in database
      return await this.updateAcknowledgements(
        raceEventId,
        sailorId,
        updatedAcknowledgements
      );
    } catch (error) {
      logger.error('Failed to toggle acknowledgement:', error);
      return false;
    }
  }

  // ============================================================
  // User Intentions Methods
  // ============================================================

  /**
   * Get user intentions for a race
   */
  async getIntentions(
    raceEventId: string,
    sailorId: string
  ): Promise<RaceIntentions | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('user_intentions')
        .eq('race_event_id', raceEventId)
        .eq('sailor_id', sailorId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching intentions:', error);
        throw error;
      }

      return data?.user_intentions || null;
    } catch (error) {
      logger.error('Failed to get intentions:', error);
      return null;
    }
  }

  /**
   * Update full user intentions object
   */
  async updateIntentions(
    raceEventId: string,
    sailorId: string,
    intentions: RaceIntentionUpdate
  ): Promise<boolean> {
    try {
      // Validate that the race_event exists
      const { data: raceEventExists, error: raceEventError } = await supabase
        .from('race_events')
        .select('id')
        .eq('id', raceEventId)
        .maybeSingle();

      if (raceEventError) {
        logger.error('Error checking race event existence:', raceEventError);
        throw raceEventError;
      }

      if (!raceEventExists) {
        logger.info(`Race event ${raceEventId} does not exist, skipping intentions update`);
        return false;
      }

      // Get current intentions to merge
      const current = await this.getIntentions(raceEventId, sailorId);
      const mergedIntentions: RaceIntentions = {
        ...current,
        ...intentions,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            race_event_id: raceEventId,
            sailor_id: sailorId,
            user_intentions: mergedIntentions,
          },
          {
            onConflict: 'race_event_id,sailor_id',
          }
        );

      if (error) {
        logger.error('Error updating intentions:', error);
        throw error;
      }

      logger.info('Intentions updated successfully');
      return true;
    } catch (error) {
      logger.error('Failed to update intentions:', error);
      return false;
    }
  }

  /**
   * Update arrival time intention
   */
  async updateArrivalIntention(
    raceEventId: string,
    sailorId: string,
    arrivalTime: ArrivalTimeIntention
  ): Promise<boolean> {
    return this.updateIntentions(raceEventId, sailorId, { arrivalTime });
  }

  /**
   * Update sail selection intention
   */
  async updateSailSelection(
    raceEventId: string,
    sailorId: string,
    sailSelection: SailSelectionIntention
  ): Promise<boolean> {
    return this.updateIntentions(raceEventId, sailorId, { sailSelection });
  }

  /**
   * Update rig intentions
   */
  async updateRigIntentions(
    raceEventId: string,
    sailorId: string,
    rigIntentions: RigIntentions
  ): Promise<boolean> {
    return this.updateIntentions(raceEventId, sailorId, { rigIntentions });
  }

  /**
   * Update course selection intention
   */
  async updateCourseSelection(
    raceEventId: string,
    sailorId: string,
    courseSelection: CourseSelectionIntention
  ): Promise<boolean> {
    return this.updateIntentions(raceEventId, sailorId, { courseSelection });
  }
}

export const sailorRacePreparationService = new SailorRacePreparationService();
