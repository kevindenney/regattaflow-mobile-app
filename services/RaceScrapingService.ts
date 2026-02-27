/**
 * Race Scraping Service
 * Import races from club calendars and class association websites
 * Automatically import races when sailor joins clubs with auto_import_races enabled
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RaceScrapingService');

export interface ScrapedRace {
  name: string;
  start_date: string;
  end_date?: string;
  club_id?: string;
  venue_id?: string;
  class_id?: string;
  registration_url?: string;
  notice_of_race_url?: string;
  sailing_instructions_url?: string;
  external_id?: string; // For tracking duplicates
  source: 'yacht_club' | 'class_association' | 'racing_rules' | 'manual';
}

export interface ImportResult {
  success: boolean;
  imported_count: number;
  skipped_count: number;
  error?: string;
  races?: any[];
}

export class RaceScrapingService {
  private static normalizeRaceDate(value?: string): string | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  }

  private static mapExtractedRaceToScrapedRace(
    race: any,
    source: ScrapedRace['source'],
    defaults: {
      clubId?: string;
      classId?: string;
      sourceUrl?: string;
      venueId?: string;
    } = {}
  ): ScrapedRace | null {
    const name = race?.raceName || race?.name || race?.eventSeriesName;
    const startDate = this.normalizeRaceDate(race?.raceDate || race?.date || race?.startDate);
    if (!name || !startDate) return null;

    return {
      name: String(name).trim(),
      start_date: startDate,
      end_date: this.normalizeRaceDate(race?.endDate || race?.raceDate || race?.date) || undefined,
      club_id: defaults.clubId,
      venue_id: defaults.venueId,
      class_id: defaults.classId,
      registration_url: race?.registrationUrl || race?.entryUrl || defaults.sourceUrl,
      notice_of_race_url: race?.noticeOfRaceUrl || race?.norUrl || defaults.sourceUrl,
      sailing_instructions_url: race?.sailingInstructionsUrl || race?.siUrl || undefined,
      external_id: race?.externalId || undefined,
      source,
    };
  }

  private static async extractRacesFromSourceUrl(
    url: string,
    source: ScrapedRace['source'],
    defaults: {
      clubId?: string;
      classId?: string;
      sourceUrl?: string;
      venueId?: string;
    } = {}
  ): Promise<ScrapedRace[]> {
    const { data, error } = await supabase.functions.invoke('extract-race-details', {
      body: { url },
    });

    if (error) {
      throw new Error(error.message || 'Race extraction failed');
    }

    const extractedRaces = Array.isArray(data?.races)
      ? data.races
      : (data?.data ? [data.data] : []);

    return extractedRaces
      .map((race: any) =>
        this.mapExtractedRaceToScrapedRace(race, source, {
          ...defaults,
          sourceUrl: defaults.sourceUrl || url,
        })
      )
      .filter((race): race is ScrapedRace => Boolean(race));
  }

  /**
   * Import races from a yacht club calendar
   */
  static async importFromYachtClub(clubId: string): Promise<ImportResult> {
    try {
      // Get club details
      const { data: club, error: clubError } = await supabase
        .from('yacht_clubs')
        .select('name, website, venue_id')
        .eq('id', clubId)
        .single();

      if (clubError || !club) {
        return {
          success: false,
          imported_count: 0,
          skipped_count: 0,
          error: 'Club not found',
        };
      }

      if (!club.website) {
        return {
          success: false,
          imported_count: 0,
          skipped_count: 0,
          error: 'Club has no website URL configured for import',
        };
      }

      const scrapedRaces = await this.extractRacesFromSourceUrl(
        club.website,
        'yacht_club',
        {
          clubId,
          venueId: club.venue_id || undefined,
          sourceUrl: club.website,
        }
      );

      return await this.importRaces(scrapedRaces, 'yacht_club', clubId);
    } catch (error: any) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Import races from a class association
   */
  static async importFromClassAssociation(associationId: string): Promise<ImportResult> {
    try {
      // Get association details
      const { data: association, error: assocError } = await supabase
        .from('class_associations')
        .select('name, website, racing_rules_url, class_id')
        .eq('id', associationId)
        .single();

      if (assocError || !association) {
        return {
          success: false,
          imported_count: 0,
          skipped_count: 0,
          error: 'Association not found',
        };
      }

      const sourceUrl = association.website || association.racing_rules_url;
      if (!sourceUrl) {
        return {
          success: false,
          imported_count: 0,
          skipped_count: 0,
          error: 'Association has no source URL configured for import',
        };
      }

      const scrapedRaces = await this.extractRacesFromSourceUrl(
        sourceUrl,
        'class_association',
        {
          classId: association.class_id || undefined,
          sourceUrl,
        }
      );

      return await this.importRaces(scrapedRaces, 'class_association', undefined, associationId);
    } catch (error: any) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Import races from Racing Rules of Sailing
   */
  static async importFromRacingRules(
    _searchParams: {
      country?: string;
      region?: string;
      class_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ImportResult> {
    try {
      // TODO: Implement Racing Rules of Sailing API integration
      // Example: https://www.sailing.org/tools/calendar.php
      // Would fetch races matching search criteria

      const scrapedRaces: ScrapedRace[] = [];

      return await this.importRaces(scrapedRaces, 'racing_rules');
    } catch (error: any) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Auto-import races for a sailor based on their club memberships
   */
  static async autoImportForSailor(sailorId: string): Promise<ImportResult> {
    try {
      // Get clubs with auto_import_races enabled
      const { data: memberships, error: memberError } = await supabase
        .from('sailor_clubs')
        .select('*')
        .eq('sailor_id', sailorId)
        .eq('auto_import_races', true);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        return {
          success: true,
          imported_count: 0,
          skipped_count: 0,
        };
      }

      let totalImported = 0;
      let totalSkipped = 0;

      // Import from yacht clubs
      const clubImports = await Promise.all(
        memberships
          .filter((m) => m.club_type === 'yacht_club' && m.club_id)
          .map((m) => this.importFromYachtClub(m.club_id!))
      );

      // Import from class associations
      const assocImports = await Promise.all(
        memberships
          .filter((m) => m.club_type === 'class_association' && m.association_id)
          .map((m) => this.importFromClassAssociation(m.association_id!))
      );

      // Aggregate results
      [...clubImports, ...assocImports].forEach((result) => {
        if (result.success) {
          totalImported += result.imported_count;
          totalSkipped += result.skipped_count;
        }
      });

      return {
        success: true,
        imported_count: totalImported,
        skipped_count: totalSkipped,
      };
    } catch (error: any) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Core import logic - saves scraped races to database
   */
  private static async importRaces(
    races: ScrapedRace[],
    source: ScrapedRace['source'],
    clubId?: string,
    _associationId?: string
  ): Promise<ImportResult> {
    try {
      if (races.length === 0) {
        return {
          success: true,
          imported_count: 0,
          skipped_count: 0,
        };
      }

      let imported = 0;
      let skipped = 0;
      const importedRaces: any[] = [];

      for (const race of races) {
        // Check if race already exists (by external_id or name + date)
        const { data: existing } = await supabase
          .from('regattas')
          .select('id')
          .or(
            race.external_id
              ? `external_id.eq.${race.external_id}`
              : `and(name.eq.${race.name},start_date.eq.${race.start_date})`
          )
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Import the race
        const { data: newRace, error: insertError } = await supabase
          .from('regattas')
          .insert({
            name: race.name,
            start_date: race.start_date,
            end_date: race.end_date,
            club_id: race.club_id || clubId,
            venue_id: race.venue_id,
            class_id: race.class_id,
            registration_url: race.registration_url,
            notice_of_race_url: race.notice_of_race_url,
            sailing_instructions_url: race.sailing_instructions_url,
            external_id: race.external_id,
            import_source: source,
          })
          .select()
          .single();

        if (insertError) {
          logger.error(`Error importing race ${race.name}:`, insertError);
          skipped++;
        } else {
          imported++;
          importedRaces.push(newRace);
        }
      }

      return {
        success: true,
        imported_count: imported,
        skipped_count: skipped,
        races: importedRaces,
      };
    } catch (error: any) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Parse a URL to extract race information
   * Useful for manual race imports from URLs
   */
  static async importFromURL(url: string): Promise<ImportResult> {
    try {
      const scrapedRaces = await this.extractRacesFromSourceUrl(url, 'manual', {
        sourceUrl: url,
      });
      return await this.importRaces(scrapedRaces, 'manual');
    } catch (error: any) {
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get import history for a sailor
   */
  static async getImportHistory(
    sailorId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // Get races that were imported for this sailor's clubs
      const { data: memberships } = await supabase
        .from('sailor_clubs')
        .select('club_id, association_id')
        .eq('sailor_id', sailorId)
        .eq('auto_import_races', true);

      if (!memberships || memberships.length === 0) {
        return [];
      }

      const clubIds = memberships
        .filter((m) => m.club_id)
        .map((m) => m.club_id);

      const { data: races, error } = await supabase
        .from('regattas')
        .select('*')
        .in('club_id', clubIds)
        .not('import_source', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return races || [];
    } catch (error) {
      logger.error('Error getting import history:', error);
      return [];
    }
  }

  /**
   * Manually add a race from external source
   */
  static async manualImport(race: ScrapedRace): Promise<ImportResult> {
    return await this.importRaces([race], 'manual');
  }

  /**
   * Delete imported races (cleanup)
   */
  static async deleteImportedRaces(
    source: ScrapedRace['source'],
    clubId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('regattas')
        .delete()
        .eq('import_source', source);

      if (clubId) {
        query = query.eq('club_id', clubId);
      }

      const { error } = await query;

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting imported races:', error);
      return false;
    }
  }
}
