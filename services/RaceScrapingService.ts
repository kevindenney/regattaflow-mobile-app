/**
 * Race Scraping Service
 * Import races from club calendars and class association websites
 * Automatically import races when sailor joins clubs with auto_import_races enabled
 */

import { supabase } from './supabase';

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

      // TODO: Implement actual scraping logic based on club website
      // For now, return a placeholder response
      // In production, this would:
      // 1. Fetch the club's race calendar page
      // 2. Parse HTML to extract race data
      // 3. Convert to ScrapedRace format
      // 4. Import to database

      const scrapedRaces: ScrapedRace[] = [];

      // Example: If club has structured calendar API
      // const response = await fetch(`${club.website}/api/calendar`);
      // const data = await response.json();
      // scrapedRaces = data.races.map(race => ({ ... }));

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

      // TODO: Implement actual scraping logic based on association website
      // Many class associations use standard calendar formats
      // Dragon Class example: https://intdragon.net/calendar
      // Would parse event listings and import regattas

      const scrapedRaces: ScrapedRace[] = [];

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
    searchParams: {
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
        .select(`
          *,
          yacht_clubs(id, name, website),
          class_associations(id, name, website)
        `)
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
    associationId?: string
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
          console.error(`Error importing race ${race.name}:`, insertError);
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
      // TODO: Implement URL parsing logic
      // Would detect the type of URL (club, association, notice of race)
      // And extract race information accordingly

      // For now, return placeholder
      return {
        success: false,
        imported_count: 0,
        skipped_count: 0,
        error: 'URL parsing not yet implemented',
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
      console.error('Error getting import history:', error);
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
      console.error('Error deleting imported races:', error);
      return false;
    }
  }
}
