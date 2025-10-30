/**
 * Bulk Race Creation Service
 * Create multiple races from calendar imports
 */

import { supabase } from '@/services/supabase';
import { CalendarRace } from './CalendarImportService';
import { RaceWeatherService } from './RaceWeatherService';
import { createLogger } from '@/lib/utils/logger';

export interface BulkCreationOptions {
  userId: string;
  boatId?: string;
  defaultVenue?: string;
  autoDetectVenue?: boolean;
  skipExisting?: boolean; // Skip races that already exist with same name+date
}

export interface BulkCreationResult {
  success: boolean;
  created: number;
  skipped: number;
  failed: number;
  races: Array<{
    id?: string;
    name: string;
    date: string;
    status: 'created' | 'skipped' | 'failed';
    reason?: string;
  }>;
  error?: string;
}

const logger = createLogger('BulkRaceCreationService');
export class BulkRaceCreationService {
  /**
   * Create multiple races from calendar data
   */
  static async createRacesFromCalendar(
    calendarRaces: CalendarRace[],
    options: BulkCreationOptions
  ): Promise<BulkCreationResult> {
    logger.debug(`[BulkRaceCreationService] Creating ${calendarRaces.length} races for user ${options.userId}`);

    if (!options.userId) {
      return {
        success: false,
        error: 'User ID is required',
        created: 0,
        skipped: 0,
        failed: 0,
        races: []
      };
    }

    const results: BulkCreationResult['races'] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    // Check for existing races if skipExisting is enabled
    let existingRaces: Set<string> = new Set();
    if (options.skipExisting) {
      try {
        const { data: existing } = await supabase
          .from('regattas')
          .select('name, start_date')
          .eq('created_by', options.userId);

        if (existing) {
          existingRaces = new Set(
            existing.map(r => `${r.name}|${r.start_date}`)
          );
          logger.debug(`[BulkRaceCreationService] Found ${existingRaces.size} existing races to skip`);
        }
      } catch (error) {
        console.error('[BulkRaceCreationService] Error checking existing races:', error);
        // Continue anyway - we'll handle duplicates individually
      }
    }

    // Create races one by one (batching could be added later for performance)
    for (const calendarRace of calendarRaces) {
      try {
        const raceName = calendarRace.subject.trim();
        const raceDate = calendarRace.startDate;
        const venue = calendarRace.location || options.defaultVenue || 'TBD';

        // Check if race already exists
        const existenceKey = `${raceName}|${raceDate}`;
        if (existingRaces.has(existenceKey)) {
          logger.debug(`[BulkRaceCreationService] Skipping existing race: ${raceName} on ${raceDate}`);
          results.push({
            name: raceName,
            date: raceDate,
            status: 'skipped',
            reason: 'Race already exists'
          });
          skipped++;
          continue;
        }

        // Fetch real-time weather data for the race
        logger.debug(`[BulkRaceCreationService] Fetching weather for ${raceName} at ${venue}...`);
        const weatherData = await RaceWeatherService.fetchWeatherByVenueName(
          venue,
          raceDate
        );

        // Prepare race data
        const raceData = {
          created_by: options.userId,
          name: raceName,
          start_date: raceDate,
          description: `Imported from calendar${calendarRace.location ? ` at ${calendarRace.location}` : ''}`,
          boat_id: options.boatId || null,
          metadata: {
            venue_name: venue,
            imported_from_calendar: true,
            import_timestamp: new Date().toISOString(),
            // Store real weather data if available, otherwise use defaults
            wind: weatherData?.wind || { direction: 'Variable', speedMin: 8, speedMax: 15 },
            tide: weatherData?.tide || { state: 'slack' as const, height: 1.0 },
            weather_provider: weatherData?.provider,
            weather_fetched_at: weatherData?.fetchedAt,
            weather_confidence: weatherData?.confidence,
          },
          status: 'planned' as const,

          // Default values for new races
          scoring_system: 'Low Point',
          penalty_system: '720°',
          preparatory_signal_minutes: 4,
          class_interval_minutes: 5,
          total_starts: 1,

          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Insert race
        const { data, error } = await supabase
          .from('regattas')
          .insert(raceData)
          .select('id')
          .single();

        if (error) {
          console.error(`[BulkRaceCreationService] Error creating race "${raceName}":`, error);
          results.push({
            name: raceName,
            date: raceDate,
            status: 'failed',
            reason: error.message
          });
          failed++;
          continue;
        }

        logger.debug(`[BulkRaceCreationService] Created race: ${raceName} (ID: ${data.id})`);
        results.push({
          id: data.id,
          name: raceName,
          date: raceDate,
          status: 'created'
        });
        created++;

      } catch (error: any) {
        console.error('[BulkRaceCreationService] Unexpected error creating race:', error);
        results.push({
          name: calendarRace.subject,
          date: calendarRace.startDate,
          status: 'failed',
          reason: error.message
        });
        failed++;
      }
    }

    logger.debug(`[BulkRaceCreationService] Bulk creation complete: ${created} created, ${skipped} skipped, ${failed} failed`);

    return {
      success: failed === 0,
      created,
      skipped,
      failed,
      races: results
    };
  }

  /**
   * Create a preview of races that will be created
   * Use this to show user what will be imported before actually creating
   */
  static async previewImport(
    calendarRaces: CalendarRace[],
    options: BulkCreationOptions
  ): Promise<{
    willCreate: CalendarRace[];
    willSkip: Array<{ race: CalendarRace; reason: string }>;
  }> {
    const willCreate: CalendarRace[] = [];
    const willSkip: Array<{ race: CalendarRace; reason: string }> = [];

    // Check for existing races
    let existingRaces: Set<string> = new Set();
    if (options.skipExisting) {
      try {
        const { data: existing } = await supabase
          .from('regattas')
          .select('name, start_date')
          .eq('created_by', options.userId);

        if (existing) {
          existingRaces = new Set(
            existing.map(r => `${r.name}|${r.start_date}`)
          );
        }
      } catch (error) {
        console.error('[BulkRaceCreationService] Error checking existing races:', error);
      }
    }

    for (const race of calendarRaces) {
      const existenceKey = `${race.subject}|${race.startDate}`;
      if (existingRaces.has(existenceKey)) {
        willSkip.push({
          race,
          reason: 'Race already exists'
        });
      } else {
        willCreate.push(race);
      }
    }

    return { willCreate, willSkip };
  }
}
