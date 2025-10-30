/**
 * External Racing Results Service
 * Integrates with major sailing organizations to automatically fetch and sync race results
 * Supports multiple data sources and provides unified result data across platforms
 */

import { supabase } from '../supabase';
import { SailingVenue } from '@/types/venues';
import { createLogger } from '@/lib/utils/logger';

export interface ExternalResultSource {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  supportedRegions: string[];
  resultFormats: string[];
  pollInterval: number; // minutes
  active: boolean;
}

export interface RaceResult {
  id: string;
  regattaId: string;
  regattaName: string;
  venue: string;
  raceNumber: number;
  raceDate: Date;
  sailorName: string;
  sailNumber: string;
  boatClass: string;
  position: number;
  points: number;
  finishTime?: Date;
  dnf?: boolean;
  dsq?: boolean;
  ocs?: boolean;
  sourceId: string;
  sourceUrl: string;
  lastUpdated: Date;
}

export interface RegattaInfo {
  id: string;
  name: string;
  venue: string;
  venueId?: string;
  startDate: Date;
  endDate: Date;
  boatClasses: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  entryCount: number;
  raceCount: number;
  sourceId: string;
  sourceUrl: string;
  officialResults?: boolean;
}

export interface PollingStatus {
  sourceId: string;
  lastPollTime: Date;
  lastSuccessTime: Date;
  errorCount: number;
  isActive: boolean;
  nextPollTime: Date;
}

const logger = createLogger('ExternalResultsService');
export class ExternalResultsService {
  private static sources: ExternalResultSource[] = [
    {
      id: 'sailwave',
      name: 'Sailwave Results',
      baseUrl: 'https://www.sailwave.com',
      supportedRegions: ['global'],
      resultFormats: ['sailwave', 'html'],
      pollInterval: 30,
      active: true,
    },
    {
      id: 'regattanetwork',
      name: 'Regatta Network',
      baseUrl: 'https://www.regattanetwork.com',
      supportedRegions: ['north-america', 'europe'],
      resultFormats: ['json', 'html'],
      pollInterval: 15,
      active: true,
    },
    {
      id: 'isaf_results',
      name: 'World Sailing Results',
      baseUrl: 'https://www.sailing.org',
      supportedRegions: ['global'],
      resultFormats: ['json', 'xml'],
      pollInterval: 60,
      active: true,
    },
    {
      id: 'yacht_scoring',
      name: 'Yacht Scoring',
      baseUrl: 'https://yachtscoring.com',
      supportedRegions: ['global'],
      resultFormats: ['json', 'html'],
      pollInterval: 20,
      active: true,
    },
    {
      id: 'raceqs',
      name: 'RaceQs',
      baseUrl: 'https://raceqs.com',
      supportedRegions: ['global'],
      resultFormats: ['json'],
      pollInterval: 10,
      active: true,
    },
    {
      id: 'manage2sail',
      name: 'Manage2Sail',
      baseUrl: 'https://www.manage2sail.com',
      supportedRegions: ['europe', 'oceania'],
      resultFormats: ['json', 'html'],
      pollInterval: 25,
      active: true,
    }
  ];

  /**
   * Start polling for race results from all active sources
   */
  static async startPolling(): Promise<void> {
    logger.debug('Starting external results polling system...');

    for (const source of this.sources.filter(s => s.active)) {
      this.pollSource(source);

      // Set up recurring polls
      setInterval(() => {
        this.pollSource(source);
      }, source.pollInterval * 60 * 1000);
    }
  }

  /**
   * Poll a specific source for new results
   */
  private static async pollSource(source: ExternalResultSource): Promise<void> {
    try {
      logger.debug(`Polling ${source.name} for results...`);

      await this.updatePollingStatus(source.id, 'started');

      // Get recent regattas to check for updates
      const recentRegattas = await this.getRecentRegattas(source.id);

      for (const regatta of recentRegattas) {
        await this.pollRegattaResults(source, regatta);
      }

      // Discover new regattas
      await this.discoverNewRegattas(source);

      await this.updatePollingStatus(source.id, 'success');
    } catch (error) {
      console.error(`Error polling ${source.name}:`, error);
      await this.updatePollingStatus(source.id, 'error');
    }
  }

  /**
   * Poll results for a specific regatta
   */
  private static async pollRegattaResults(
    source: ExternalResultSource,
    regatta: RegattaInfo
  ): Promise<void> {
    try {
      const results = await this.fetchRegattaResults(source, regatta);

      if (results.length > 0) {
        await this.saveResults(results);
        logger.debug(`Saved ${results.length} results from ${regatta.name}`);
      }
    } catch (error) {
      console.error(`Error fetching results for ${regatta.name}:`, error);
    }
  }

  /**
   * Fetch results for a specific regatta from external source
   */
  private static async fetchRegattaResults(
    source: ExternalResultSource,
    regatta: RegattaInfo
  ): Promise<RaceResult[]> {
    // This would be implemented based on each source's API
    // For now, return simulated data structure
    const simulatedResults: RaceResult[] = [];

    switch (source.id) {
      case 'sailwave':
        return this.fetchSailwaveResults(regatta);
      case 'regattanetwork':
        return this.fetchRegattaNetworkResults(regatta);
      case 'yacht_scoring':
        return this.fetchYachtScoringResults(regatta);
      case 'raceqs':
        return this.fetchRaceQsResults(regatta);
      default:
        return simulatedResults;
    }
  }

  /**
   * Fetch results from Sailwave (HTML scraping)
   */
  private static async fetchSailwaveResults(regatta: RegattaInfo): Promise<RaceResult[]> {
    try {
      // In production, this would scrape Sailwave HTML results
      // Sailwave typically publishes HTML tables that need parsing
      const response = await fetch(regatta.sourceUrl);
      const html = await response.text();

      // Parse HTML and extract results
      return this.parseSailwaveHTML(html, regatta);
    } catch (error) {
      console.error('Error fetching Sailwave results:', error);
      return [];
    }
  }

  /**
   * Fetch results from Regatta Network (API)
   */
  private static async fetchRegattaNetworkResults(regatta: RegattaInfo): Promise<RaceResult[]> {
    try {
      // Regatta Network typically has JSON APIs
      const apiUrl = `${regatta.sourceUrl}/api/results`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      return this.parseRegattaNetworkData(data, regatta);
    } catch (error) {
      console.error('Error fetching Regatta Network results:', error);
      return [];
    }
  }

  /**
   * Fetch results from Yacht Scoring
   */
  private static async fetchYachtScoringResults(regatta: RegattaInfo): Promise<RaceResult[]> {
    try {
      // Yacht Scoring has JSON API endpoints
      const eventId = this.extractYachtScoringEventId(regatta.sourceUrl);
      const apiUrl = `https://yachtscoring.com/emenu.cfm?eID=${eventId}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      return this.parseYachtScoringData(data, regatta);
    } catch (error) {
      console.error('Error fetching Yacht Scoring results:', error);
      return [];
    }
  }

  /**
   * Fetch results from RaceQs
   */
  private static async fetchRaceQsResults(regatta: RegattaInfo): Promise<RaceResult[]> {
    try {
      // RaceQs has REST API
      const regattaId = this.extractRaceQsId(regatta.sourceUrl);
      const apiUrl = `https://api.raceqs.com/v1/regattas/${regattaId}/results`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      return this.parseRaceQsData(data, regatta);
    } catch (error) {
      console.error('Error fetching RaceQs results:', error);
      return [];
    }
  }

  /**
   * Discover new regattas from external sources
   */
  private static async discoverNewRegattas(source: ExternalResultSource): Promise<void> {
    try {
      const newRegattas = await this.fetchRecentRegattas(source);

      for (const regatta of newRegattas) {
        await this.saveRegattaInfo(regatta);
      }
    } catch (error) {
      console.error(`Error discovering regattas from ${source.name}:`, error);
    }
  }

  /**
   * Fetch list of recent regattas from source
   */
  private static async fetchRecentRegattas(source: ExternalResultSource): Promise<RegattaInfo[]> {
    // Implementation would vary by source
    // Return empty array for now
    return [];
  }

  /**
   * Save race results to database
   */
  private static async saveResults(results: RaceResult[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('external_race_results')
        .upsert(results, {
          onConflict: 'id'
        });

      if (error) throw error;

      // Also update sailor performance tracking
      await this.updateSailorPerformance(results);
    } catch (error) {
      console.error('Error saving results:', error);
      throw error;
    }
  }

  /**
   * Save regatta information to database
   */
  private static async saveRegattaInfo(regatta: RegattaInfo): Promise<void> {
    try {
      const { error } = await supabase
        .from('external_regattas')
        .upsert(regatta, {
          onConflict: 'id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving regatta info:', error);
      throw error;
    }
  }

  /**
   * Update sailor performance tracking with new results
   */
  private static async updateSailorPerformance(results: RaceResult[]): Promise<void> {
    for (const result of results) {
      try {
        // Find sailor profile by name or sail number
        const { data: sailor } = await supabase
          .from('sailor_profiles')
          .select('id')
          .or(`full_name.eq.${result.sailorName},sail_number.eq.${result.sailNumber}`)
          .single();

        if (sailor) {
          // Update performance record
          await supabase
            .from('sailor_performance')
            .upsert({
              sailor_id: sailor.id,
              regatta_id: result.regattaId,
              race_number: result.raceNumber,
              position: result.position,
              points: result.points,
              boat_class: result.boatClass,
              race_date: result.raceDate,
              source: 'external',
              source_id: result.sourceId
            });
        }
      } catch (error) {
        console.error(`Error updating performance for ${result.sailorName}:`, error);
      }
    }
  }

  /**
   * Get recent regattas that need polling
   */
  private static async getRecentRegattas(sourceId: string): Promise<RegattaInfo[]> {
    try {
      const { data, error } = await supabase
        .from('external_regattas')
        .select('*')
        .eq('source_id', sourceId)
        .in('status', ['ongoing', 'completed'])
        .gte('end_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent regattas:', error);
      return [];
    }
  }

  /**
   * Update polling status for a source
   */
  private static async updatePollingStatus(
    sourceId: string,
    status: 'started' | 'success' | 'error'
  ): Promise<void> {
    try {
      const now = new Date();
      const updateData: any = {
        last_poll_time: now,
        source_id: sourceId
      };

      if (status === 'success') {
        updateData.last_success_time = now;
        updateData.error_count = 0;
        updateData.is_active = true;
      } else if (status === 'error') {
        // Increment error count, deactivate if too many errors
        const { data: currentStatus } = await supabase
          .from('polling_status')
          .select('error_count')
          .eq('source_id', sourceId)
          .single();

        const errorCount = (currentStatus?.error_count || 0) + 1;
        updateData.error_count = errorCount;
        updateData.is_active = errorCount < 5; // Deactivate after 5 consecutive errors
      }

      // Calculate next poll time
      const source = this.sources.find(s => s.id === sourceId);
      if (source) {
        updateData.next_poll_time = new Date(now.getTime() + source.pollInterval * 60 * 1000);
      }

      await supabase
        .from('polling_status')
        .upsert(updateData, { onConflict: 'source_id' });
    } catch (error) {
      console.error('Error updating polling status:', error);
    }
  }

  /**
   * Get current polling status for all sources
   */
  static async getPollingStatus(): Promise<PollingStatus[]> {
    try {
      const { data, error } = await supabase
        .from('polling_status')
        .select('*')
        .order('last_poll_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting polling status:', error);
      return [];
    }
  }

  /**
   * Search for sailor results across all sources
   */
  static async searchSailorResults(
    sailorName: string,
    sailNumber?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<RaceResult[]> {
    try {
      let query = supabase
        .from('external_race_results')
        .select('*')
        .ilike('sailor_name', `%${sailorName}%`);

      if (sailNumber) {
        query = query.eq('sail_number', sailNumber);
      }

      if (dateRange) {
        query = query
          .gte('race_date', dateRange.start.toISOString())
          .lte('race_date', dateRange.end.toISOString());
      }

      const { data, error } = await query
        .order('race_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching sailor results:', error);
      return [];
    }
  }

  /**
   * Get regatta results by venue
   */
  static async getRegattaResultsByVenue(
    venueId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<RegattaInfo[]> {
    try {
      let query = supabase
        .from('external_regattas')
        .select('*')
        .eq('venue_id', venueId);

      if (dateRange) {
        query = query
          .gte('start_date', dateRange.start.toISOString())
          .lte('end_date', dateRange.end.toISOString());
      }

      const { data, error } = await query
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting regatta results by venue:', error);
      return [];
    }
  }

  /**
   * Get active sources
   */
  static getActiveSources(): ExternalResultSource[] {
    return this.sources.filter(s => s.active);
  }

  /**
   * Manual poll trigger for testing
   */
  static async triggerManualPoll(sourceId?: string): Promise<void> {
    const sourcesToPoll = sourceId
      ? this.sources.filter(s => s.id === sourceId)
      : this.sources.filter(s => s.active);

    for (const source of sourcesToPoll) {
      await this.pollSource(source);
    }
  }

  // Private helper methods for parsing different formats

  private static parseSailwaveHTML(html: string, regatta: RegattaInfo): RaceResult[] {
    // Parse Sailwave HTML tables
    // This would use a HTML parser like cheerio in a real implementation
    return [];
  }

  private static parseRegattaNetworkData(data: any, regatta: RegattaInfo): RaceResult[] {
    // Parse Regatta Network JSON format
    return [];
  }

  private static parseYachtScoringData(data: any, regatta: RegattaInfo): RaceResult[] {
    // Parse Yacht Scoring JSON format
    return [];
  }

  private static parseRaceQsData(data: any, regatta: RegattaInfo): RaceResult[] {
    // Parse RaceQs JSON format
    return [];
  }

  private static extractYachtScoringEventId(url: string): string {
    // Extract event ID from Yacht Scoring URL
    const match = url.match(/eID=(\d+)/);
    return match ? match[1] : '';
  }

  private static extractRaceQsId(url: string): string {
    // Extract regatta ID from RaceQs URL
    const match = url.match(/\/regattas\/(\d+)/);
    return match ? match[1] : '';
  }
}

export default ExternalResultsService;