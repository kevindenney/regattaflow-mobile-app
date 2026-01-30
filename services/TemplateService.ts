/**
 * TemplateService
 *
 * Service for applying race preparation templates:
 * - Copy race with full preparation to user's timeline
 * - Apply another sailor's setup (strategy, rig, sails) to existing race
 */

import { supabase } from './supabase';
import { sailorRacePreparationService, SailorRacePreparation } from './SailorRacePreparationService';
import { RaceIntentions } from '@/types/raceIntentions';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TemplateService');

/**
 * Race data subset needed for copying
 */
interface RaceTemplateData {
  id: string;
  name: string;
  race_series?: string;
  start_date: string;
  venue_name?: string;
  boat_class?: string;
  prep_notes?: string;
  tuning_settings?: Record<string, any>;
  post_race_notes?: string;
  lessons_learned?: string[];
  metadata?: Record<string, any>;
  race_type?: string;
  class_id?: string;
  status?: string;
  vhf_channel?: string;
  boat_class?: string;
}

/**
 * Result from template operations
 */
interface TemplateResult {
  success: boolean;
  raceId?: string;
  error?: string;
}

class TemplateService {
  /**
   * Copy a race with all preparation data to user's timeline
   *
   * Creates a new race and copies:
   * - Race details (name, date, venue, etc.)
   * - Prep notes and tuning settings
   * - Sailor race preparation (rig settings, intentions, etc.)
   */
  async copyRaceWithPreparation(
    userId: string,
    sourceRaceId: string,
    sourceOwnerId: string,
    raceData: RaceTemplateData,
    preparation: SailorRacePreparation | null,
    intentions: RaceIntentions | null
  ): Promise<TemplateResult> {
    logger.info('[TemplateService] copyRaceWithPreparation called', {
      userId,
      sourceRaceId,
      sourceOwnerId,
    });

    try {
      // Use passed race data instead of re-fetching to avoid permission issues with select('*')
        if (!raceData) {
          return { success: false, error: 'Source race data missing' };
        }

        const sourceRace = raceData as any; // Cast to access all fields

        // Step 2: Create new race with modified ownership
        // Construct the object explicitly to avoid copying unwanted fields
        const newRaceData: any = {
          name: sourceRace.name,
          event_series_name: sourceRace.race_series || sourceRace.event_series_name,
          start_date: sourceRace.start_date,
          start_time: sourceRace.start_time,
          race_type: sourceRace.race_type || 'fleet',
          class_id: sourceRace.class_id,
          status: 'planned', // Always start as planned
          vhf_channel: sourceRace.vhf_channel,

          created_by: userId,
          content_visibility: 'private',

          // Don't copy boat_id - user might not own it. Let them select their own boat later.
          boat_id: null,

          // Copy prep notes and tuning settings from source race
          prep_notes: sourceRace.prep_notes,
          tuning_settings: sourceRace.tuning_settings,

          metadata: {
            ...(sourceRace.metadata || {}),
            venue_name: sourceRace.venue_name || sourceRace.metadata?.venue_name,
            class_name: sourceRace.boat_class || sourceRace.metadata?.class_name,
            copied_from_race: sourceRaceId,
            copied_from_sailor: sourceOwnerId,
            copied_at: new Date().toISOString(),
            template_source: 'sailor_journey',
            is_sample: false, // Ensure copy is NOT marked as sample
          },
        };

        // Ensure we have at least minimal data
        if (!newRaceData.name) newRaceData.name = 'Copied Race';
        if (!newRaceData.start_date) newRaceData.start_date = new Date().toISOString();

        const { data: newRace, error: createError } = await supabase
          .from('regattas')
          .insert(newRaceData)
          .select('id')
          .single();

        if (createError || !newRace) {
          logger.error('Failed to create race copy:', createError);
          return { success: false, error: 'Failed to create race copy' };
        }

        const newRaceId = newRace.id;
        logger.info('[TemplateService] Race copied', { newRaceId });

        // Step 3: Copy preparation data
        // Also handle cases where prep_notes exists on race but no formal preparation data
        const hasPrepNotes = Boolean(sourceRace.prep_notes);
        const hasTuningSettings = Boolean(sourceRace.tuning_settings);
        const shouldCopyPrep = preparation || intentions || hasPrepNotes || hasTuningSettings;

        if (shouldCopyPrep) {
          try {
            // Build intentions - merge formal intentions with race.prep_notes fallback
            let mergedIntentions: RaceIntentions | undefined = undefined;

            if (intentions || hasPrepNotes) {
              mergedIntentions = {
                ...(intentions || {}),
                checklistCompletions: {}, // Clear completions
                updatedAt: new Date().toISOString(),
              };

              // If no strategyBrief intention but prep_notes exists, use prep_notes
              if (!intentions?.strategyBrief?.raceIntention && hasPrepNotes) {
                mergedIntentions.strategyBrief = {
                  ...(mergedIntentions.strategyBrief || {}),
                  raceIntention: sourceRace.prep_notes,
                  intentionUpdatedAt: new Date().toISOString(),
                };
              }
            }

            const newPreparation: SailorRacePreparation = {
              regatta_id: newRaceId,
              sailor_id: userId,
              rig_notes: preparation?.rig_notes,
              selected_rig_preset_id: preparation?.selected_rig_preset_id,
              // Don't copy acknowledgements - user needs to do these themselves
              regulatory_acknowledgements: {
                cleanRegatta: false,
                signOn: false,
                safetyBriefing: false,
              },
              race_brief_data: preparation?.race_brief_data,
              user_intentions: mergedIntentions,
            };

            await sailorRacePreparationService.upsertPreparation(newPreparation);
            logger.info('[TemplateService] Preparation copied', { newRaceId });
          } catch (prepError) {
            logger.error('Failed to copy preparation (non-fatal):', prepError);
            // Don't fail the whole operation if prep copy fails
          }
        }

        return { success: true, raceId: newRaceId };
    } catch (error) {
      logger.error('Copy race with preparation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply another sailor's template to an existing race
   *
   * Updates the target race with:
   * - Strategy notes and intentions
   * - Rig settings and notes
   * - Sail selection
   * - Course notes
   *
   * Does NOT overwrite:
   * - Checklist completions
   * - Regulatory acknowledgements
   * - Post-race analysis
   */
  async applyTemplateToRace(
      userId: string,
      targetRaceId: string,
      sourceOwnerId: string,
      sourcePreparation: SailorRacePreparation | null,
      sourceIntentions: RaceIntentions | null,
      sourceRaceData ?: Partial<RaceTemplateData>
    ): Promise < TemplateResult > {
      logger.info('[TemplateService] applyTemplateToRace called', {
        userId,
        targetRaceId,
        sourceOwnerId,
      });

      try {
        // Get target race to verify ownership
        const { data: targetRace, error: targetError } = await supabase
          .from('regattas')
          .select('id, created_by')
          .eq('id', targetRaceId)
          .single();

        if(targetError || !targetRace) {
      return { success: false, error: 'Target race not found' };
    }

    if (targetRace.created_by !== userId) {
      return { success: false, error: 'You can only apply templates to your own races' };
    }

    // Update race with template data (tuning settings, prep notes)
    if (sourceRaceData?.tuning_settings || sourceRaceData?.prep_notes) {
      const updateData: Record<string, any> = {
        metadata: {
          template_applied_from: sourceOwnerId,
          template_applied_at: new Date().toISOString(),
        },
      };

      if (sourceRaceData.tuning_settings) {
        updateData.tuning_settings = sourceRaceData.tuning_settings;
      }
      if (sourceRaceData.prep_notes) {
        updateData.prep_notes = sourceRaceData.prep_notes;
      }

      const { error: updateError } = await supabase
        .from('regattas')
        .update(updateData)
        .eq('id', targetRaceId);

      if (updateError) {
        logger.error('Failed to update race with template:', updateError);
      }
    }

    // Get existing preparation for this race
    const existingPrep = await sailorRacePreparationService.getPreparation(
      targetRaceId,
      userId
    );

    const existingIntentions = existingPrep?.user_intentions;

    // Merge source intentions with existing (preserve checklist completions)
    const mergedIntentions: RaceIntentions = {
      // Keep existing completions and acknowledgement-related data
      checklistCompletions: existingIntentions?.checklistCompletions || {},
      preStartSpecifications: existingIntentions?.preStartSpecifications,
      // Apply template data
      strategyBrief: sourceIntentions?.strategyBrief,
      strategyNotes: sourceIntentions?.strategyNotes,
      sailSelection: sourceIntentions?.sailSelection,
      rigIntentions: sourceIntentions?.rigIntentions,
      courseSelection: sourceIntentions?.courseSelection,
      forecastCheck: sourceIntentions?.forecastCheck,
      // Keep arrival time from existing if not in template
      arrivalTime: sourceIntentions?.arrivalTime || existingIntentions?.arrivalTime,
      // Update timestamp
      updatedAt: new Date().toISOString(),
    };

    // Update preparation
    const newPreparation: SailorRacePreparation = {
      regatta_id: targetRaceId,
      sailor_id: userId,
      rig_notes: sourcePreparation?.rig_notes || existingPrep?.rig_notes,
      selected_rig_preset_id:
        sourcePreparation?.selected_rig_preset_id || existingPrep?.selected_rig_preset_id,
      regulatory_acknowledgements:
        existingPrep?.regulatory_acknowledgements || {
          cleanRegatta: false,
          signOn: false,
          safetyBriefing: false,
        },
      race_brief_data: existingPrep?.race_brief_data,
      user_intentions: mergedIntentions,
    };

    await sailorRacePreparationService.upsertPreparation(newPreparation);

    logger.info('[TemplateService] Template applied successfully', { targetRaceId });

    return { success: true, raceId: targetRaceId };
  } catch(error) {
    logger.error('Apply template failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
}

export const templateService = new TemplateService();
export default TemplateService;
