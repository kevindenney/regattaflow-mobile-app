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
import type { SSIExtraction, UserClubDocument } from '@/types/ssi';
import { userDocumentService } from './UserDocumentService';

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
  regatta_id: string;
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
   * Get race preparation data for a specific sailor and regatta
   */
  async getPreparation(
    regattaId: string,
    sailorId: string
  ): Promise<SailorRacePreparation | null> {
    // Skip queries for non-UUID race IDs (e.g., demo races)
    if (!this.isValidUUID(regattaId)) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('*')
        .eq('regatta_id', regattaId)
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
    // Skip if regatta_id is not a valid UUID
    if (!this.isValidUUID(preparation.regatta_id)) {
      logger.info(`Regatta ${preparation.regatta_id} is not a valid UUID, skipping upsert`);
      return null;
    }

    // Validate that the regatta exists before attempting upsert
    const { data: regattaExists, error: regattaCheckError } = await supabase
      .from('regattas')
      .select('id')
      .eq('id', preparation.regatta_id)
      .maybeSingle();

    if (regattaCheckError) {
      console.error('[SailorRacePreparationService] Error checking regatta existence:', regattaCheckError);
      logger.error('Error checking regatta existence:', regattaCheckError);
      return null;
    }

    if (!regattaExists) {
      console.warn('[SailorRacePreparationService] Regatta does not exist:', preparation.regatta_id);
      logger.info(`Regatta ${preparation.regatta_id} does not exist, skipping upsert`);
      return null;
    }

    logger.info('Upserting race preparation', { regattaId: preparation.regatta_id, sailorId: preparation.sailor_id });
    console.log('[SailorRacePreparationService] Upserting:', {
      regattaId: preparation.regatta_id,
      sailorId: preparation.sailor_id,
      hasUserIntentions: !!preparation.user_intentions,
      checklistKeys: preparation.user_intentions?.checklistCompletions
        ? Object.keys(preparation.user_intentions.checklistCompletions)
        : [],
    });

    const { data, error } = await supabase
      .from('sailor_race_preparation')
      .upsert(
        {
          regatta_id: preparation.regatta_id,
          sailor_id: preparation.sailor_id,
          rig_notes: preparation.rig_notes,
          selected_rig_preset_id: preparation.selected_rig_preset_id,
          regulatory_acknowledgements: preparation.regulatory_acknowledgements,
          race_brief_data: preparation.race_brief_data,
          user_intentions: preparation.user_intentions,
        },
        {
          onConflict: 'regatta_id,sailor_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[SailorRacePreparationService] Supabase upsert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      logger.error('Error upserting race preparation:', error);
      throw error;
    }

    console.log('[SailorRacePreparationService] Upsert succeeded:', {
      id: data.id,
      regattaId: data.regatta_id,
      hasUserIntentions: !!data.user_intentions,
    });
    logger.info('Race preparation upserted successfully');
    return data;
  }

  /**
   * Update rig notes for a regatta
   */
  async updateRigNotes(
    regattaId: string,
    sailorId: string,
    rigNotes: string
  ): Promise<boolean> {
    try {
      // Validate that the regatta exists before attempting upsert
      const { data: regattaExists, error: regattaError } = await supabase
        .from('regattas')
        .select('id')
        .eq('id', regattaId)
        .maybeSingle();

      if (regattaError) {
        logger.error('Error checking regatta existence:', regattaError);
        throw regattaError;
      }

      if (!regattaExists) {
        logger.info(`Regatta ${regattaId} does not exist, skipping rig notes update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            regatta_id: regattaId,
            sailor_id: sailorId,
            rig_notes: rigNotes,
          },
          {
            onConflict: 'regatta_id,sailor_id',
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
   * Update selected rig preset for a regatta
   */
  async updateRigPreset(
    regattaId: string,
    sailorId: string,
    rigPresetId: string
  ): Promise<boolean> {
    try {
      // Validate that the regatta exists before attempting upsert
      const { data: regattaExists, error: regattaError } = await supabase
        .from('regattas')
        .select('id')
        .eq('id', regattaId)
        .maybeSingle();

      if (regattaError) {
        logger.error('Error checking regatta existence:', regattaError);
        throw regattaError;
      }

      if (!regattaExists) {
        logger.info(`Regatta ${regattaId} does not exist, skipping rig preset update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            regatta_id: regattaId,
            sailor_id: sailorId,
            selected_rig_preset_id: rigPresetId,
          },
          {
            onConflict: 'regatta_id,sailor_id',
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
   * Update regulatory acknowledgements for a regatta
   */
  async updateAcknowledgements(
    regattaId: string,
    sailorId: string,
    acknowledgements: RegulatoryAcknowledgements
  ): Promise<boolean> {
    try {
      // Validate that the regatta exists before attempting upsert
      const { data: regattaExists, error: regattaError } = await supabase
        .from('regattas')
        .select('id')
        .eq('id', regattaId)
        .maybeSingle();

      if (regattaError) {
        logger.error('Error checking regatta existence:', regattaError);
        throw regattaError;
      }

      if (!regattaExists) {
        logger.info(`Regatta ${regattaId} does not exist, skipping acknowledgements update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            regatta_id: regattaId,
            sailor_id: sailorId,
            regulatory_acknowledgements: acknowledgements,
          },
          {
            onConflict: 'regatta_id,sailor_id',
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
    regattaId: string,
    sailorId: string,
    raceBriefData: RaceBriefData
  ): Promise<boolean> {
    try {
      // Validate that the regatta exists before attempting upsert
      const { data: regattaExists, error: regattaError } = await supabase
        .from('regattas')
        .select('id')
        .eq('id', regattaId)
        .maybeSingle();

      if (regattaError) {
        logger.error('Error checking regatta existence:', regattaError);
        throw regattaError;
      }

      if (!regattaExists) {
        logger.info(`Regatta ${regattaId} does not exist, skipping race brief update`);
        return false;
      }

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            regatta_id: regattaId,
            sailor_id: sailorId,
            race_brief_data: raceBriefData,
          },
          {
            onConflict: 'regatta_id,sailor_id',
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
    regattaId: string,
    sailorId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_race_preparation')
        .delete()
        .eq('regatta_id', regattaId)
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
    regattaId: string,
    sailorId: string,
    key: keyof RegulatoryAcknowledgements
  ): Promise<boolean> {
    try {
      // First, get the current acknowledgements
      const current = await this.getPreparation(regattaId, sailorId);

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
        regattaId,
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
   * Get user intentions for a regatta
   */
  async getIntentions(
    regattaId: string,
    sailorId: string
  ): Promise<RaceIntentions | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_race_preparation')
        .select('user_intentions')
        .eq('regatta_id', regattaId)
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
    regattaId: string,
    sailorId: string,
    intentions: RaceIntentionUpdate
  ): Promise<boolean> {
    try {
      // Validate that the regatta exists
      const { data: regattaExists, error: regattaError } = await supabase
        .from('regattas')
        .select('id')
        .eq('id', regattaId)
        .maybeSingle();

      if (regattaError) {
        logger.error('Error checking regatta existence:', regattaError);
        throw regattaError;
      }

      if (!regattaExists) {
        logger.info(`Regatta ${regattaId} does not exist, skipping intentions update`);
        return false;
      }

      // Get current intentions to merge
      const current = await this.getIntentions(regattaId, sailorId);
      const mergedIntentions: RaceIntentions = {
        ...current,
        ...intentions,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('sailor_race_preparation')
        .upsert(
          {
            regatta_id: regattaId,
            sailor_id: sailorId,
            user_intentions: mergedIntentions,
          },
          {
            onConflict: 'regatta_id,sailor_id',
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
    regattaId: string,
    sailorId: string,
    arrivalTime: ArrivalTimeIntention
  ): Promise<boolean> {
    return this.updateIntentions(regattaId, sailorId, { arrivalTime });
  }

  /**
   * Update sail selection intention
   */
  async updateSailSelection(
    regattaId: string,
    sailorId: string,
    sailSelection: SailSelectionIntention
  ): Promise<boolean> {
    return this.updateIntentions(regattaId, sailorId, { sailSelection });
  }

  /**
   * Update rig intentions
   */
  async updateRigIntentions(
    regattaId: string,
    sailorId: string,
    rigIntentions: RigIntentions
  ): Promise<boolean> {
    return this.updateIntentions(regattaId, sailorId, { rigIntentions });
  }

  /**
   * Update course selection intention
   */
  async updateCourseSelection(
    regattaId: string,
    sailorId: string,
    courseSelection: CourseSelectionIntention
  ): Promise<boolean> {
    return this.updateIntentions(regattaId, sailorId, { courseSelection });
  }

  // ============================================================
  // SSI Document Methods
  // ============================================================

  /**
   * Get SSI extraction data for a race
   * Returns user's own SSI for race → shared club SSI → null
   *
   * @param raceId - The race/regatta ID
   * @param clubId - Optional club ID for fallback to shared club SSI
   * @returns SSI extraction data and document info, or null if not found
   */
  async getSSIForRace(
    raceId: string,
    clubId?: string
  ): Promise<{ document: UserClubDocument; extraction: SSIExtraction } | null> {
    try {
      return await userDocumentService.getSSIForRace(raceId, clubId);
    } catch (error) {
      logger.error('Error getting SSI for race:', error);
      return null;
    }
  }
}

export const sailorRacePreparationService = new SailorRacePreparationService();
