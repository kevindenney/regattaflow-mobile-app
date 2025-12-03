/**
 * Scoring Service
 * High-level service for race scoring operations
 * Wraps ScoringEngine with convenient methods for UI components
 */

import { supabase } from './supabase';
import { 
  ScoringEngine, 
  ScoringConfiguration, 
  DEFAULT_LOW_POINT_CONFIG,
  SeriesStanding,
  RaceScore,
  ScoreCode,
} from './scoring/ScoringEngine';

// Types
export interface RegattaScoring {
  regattaId: string;
  regattaName: string;
  config: ScoringConfiguration;
  standings: SeriesStanding[];
  racesCompleted: number;
  currentDiscards: number;
  resultsStatus: 'draft' | 'provisional' | 'final';
  resultsPublished: boolean;
  lastCalculated: Date | null;
}

export interface QuickResult {
  entryId: string;
  sailNumber: string;
  position?: number;
  scoreCode?: ScoreCode;
}

export interface RaceResultEntry {
  entry_id: string;
  finish_position?: number;
  corrected_position?: number;
  score_code?: ScoreCode;
  elapsed_time?: string;
  corrected_time?: string;
  scoring_penalty?: number;
}

class ScoringService {
  private engine: ScoringEngine;

  constructor(config?: ScoringConfiguration) {
    this.engine = new ScoringEngine(config || DEFAULT_LOW_POINT_CONFIG);
  }

  /**
   * Get full scoring data for a regatta
   */
  async getRegattaScoring(regattaId: string): Promise<RegattaScoring> {
    // Get regatta info
    const { data: regatta, error: regattaError } = await supabase
      .from('regattas')
      .select('*')
      .eq('id', regattaId)
      .single();

    if (regattaError) throw regattaError;

    // Get race count
    const { data: races, error: racesError } = await supabase
      .from('regatta_races')
      .select('race_number, status')
      .eq('regatta_id', regattaId);

    if (racesError) throw racesError;

    const racesCompleted = (races || []).filter(r => r.status === 'completed').length;

    // Get existing standings
    const { data: standings, error: standingsError } = await supabase
      .from('series_standings')
      .select(`
        *,
        race_entries (
          sail_number,
          entry_number,
          boat_name,
          skipper_name,
          entry_class
        )
      `)
      .eq('regatta_id', regattaId)
      .order('rank');

    if (standingsError) throw standingsError;

    // Format standings
    const formattedStandings: SeriesStanding[] = (standings || []).map((s: any) => ({
      rank: s.rank,
      entry: {
        entry_id: s.entry_id,
        entry_number: s.race_entries?.entry_number || '',
        sailor_name: s.race_entries?.skipper_name || '',
        sail_number: s.race_entries?.sail_number || '',
        boat_class: s.race_entries?.entry_class || '',
        division: s.division,
      },
      race_scores: s.race_scores || [],
      total_points: s.total_points,
      net_points: s.net_points,
      races_sailed: s.races_sailed,
      discards_used: s.discards_used,
      tied: s.tied,
      tie_breaker: s.tie_breaker,
    }));

    // Calculate current discards
    const config = regatta.scoring_config || DEFAULT_LOW_POINT_CONFIG;
    const discardRule = config.discards
      .filter((d: any) => d.after_races <= racesCompleted)
      .sort((a: any, b: any) => b.after_races - a.after_races)[0];

    return {
      regattaId,
      regattaName: regatta.name,
      config,
      standings: formattedStandings,
      racesCompleted,
      currentDiscards: discardRule?.discards || 0,
      resultsStatus: regatta.results_status || 'draft',
      resultsPublished: regatta.results_published || false,
      lastCalculated: standings?.length ? new Date(standings[0].calculated_at) : null,
    };
  }

  /**
   * Calculate and save standings for a regatta
   */
  async calculateStandings(
    regattaId: string, 
    config?: ScoringConfiguration,
    division?: string
  ): Promise<SeriesStanding[]> {
    // Update config if provided
    if (config) {
      this.engine = new ScoringEngine(config);
      
      // Save config to regatta
      await supabase
        .from('regattas')
        .update({ scoring_config: config })
        .eq('id', regattaId);
    }

    // Calculate using engine
    const standings = await this.engine.calculateSeriesStandings(regattaId, division);
    return standings;
  }

  /**
   * Quick entry of race results
   */
  async enterRaceResults(
    regattaId: string,
    raceNumber: number,
    results: QuickResult[]
  ): Promise<void> {
    // Ensure race exists
    await supabase
      .from('regatta_races')
      .upsert({
        regatta_id: regattaId,
        race_number: raceNumber,
        status: 'completed',
      }, {
        onConflict: 'regatta_id,race_number',
      });

    // Prepare result records
    const resultRecords = results.map((r, index) => ({
      regatta_id: regattaId,
      race_number: raceNumber,
      entry_id: r.entryId,
      finish_position: r.position || (index + 1),
      status: r.scoreCode ? this.scoreCodeToStatus(r.scoreCode) : 'finished',
      score_code: r.scoreCode,
    }));

    // Upsert results
    const { error } = await supabase
      .from('race_results')
      .upsert(resultRecords, {
        onConflict: 'regatta_id,race_number,entry_id',
      });

    if (error) throw error;
  }

  /**
   * Update a single result
   */
  async updateResult(
    regattaId: string,
    raceNumber: number,
    entryId: string,
    updates: Partial<RaceResultEntry>
  ): Promise<void> {
    const { error } = await supabase
      .from('race_results')
      .update({
        ...updates,
        status: updates.score_code 
          ? this.scoreCodeToStatus(updates.score_code)
          : 'finished',
      })
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .eq('entry_id', entryId);

    if (error) throw error;

    // Log the change
    await this.logResultChange(regattaId, raceNumber, entryId, 'position', null, updates);
  }

  /**
   * Apply scoring penalty
   */
  async applyPenalty(
    regattaId: string,
    raceNumber: number,
    entryId: string,
    scoreCode: ScoreCode,
    reason?: string
  ): Promise<void> {
    // Get current result
    const { data: current } = await supabase
      .from('race_results')
      .select('*')
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .eq('entry_id', entryId)
      .single();

    // Update with penalty
    const { error } = await supabase
      .from('race_results')
      .update({
        score_code: scoreCode,
        status: this.scoreCodeToStatus(scoreCode),
      })
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .eq('entry_id', entryId);

    if (error) throw error;

    // Log the change
    await this.logResultChange(
      regattaId, 
      raceNumber, 
      entryId, 
      'penalty', 
      { score_code: current?.score_code },
      { score_code: scoreCode },
      reason
    );
  }

  /**
   * Grant redress to a competitor
   */
  async grantRedress(
    regattaId: string,
    raceNumber: number,
    entryId: string,
    redressPosition: number,
    reason: string
  ): Promise<void> {
    const { error } = await supabase
      .from('race_results')
      .update({
        finish_position: redressPosition,
        score_code: 'RDG',
      })
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .eq('entry_id', entryId);

    if (error) throw error;

    await this.logResultChange(
      regattaId,
      raceNumber,
      entryId,
      'redress',
      null,
      { position: redressPosition, score_code: 'RDG' },
      reason
    );
  }

  /**
   * Publish results
   */
  async publishResults(
    regattaId: string, 
    status: 'provisional' | 'final'
  ): Promise<void> {
    // Recalculate first
    await this.calculateStandings(regattaId);

    // Update publication status
    const { error } = await supabase
      .from('regattas')
      .update({
        results_published: true,
        results_published_at: new Date().toISOString(),
        results_status: status,
      })
      .eq('id', regattaId);

    if (error) throw error;
  }

  /**
   * Unpublish results
   */
  async unpublishResults(regattaId: string): Promise<void> {
    const { error } = await supabase
      .from('regattas')
      .update({
        results_published: false,
        results_status: 'draft',
      })
      .eq('id', regattaId);

    if (error) throw error;
  }

  /**
   * Export standings to CSV
   */
  exportToCSV(standings: SeriesStanding[], regattaName: string): string {
    const header = 'Position,Sail Number,Boat,Skipper,Class,Net Points,Total Points,Races Sailed,Discards\n';
    
    const rows = standings.map(s => {
      const raceScores = s.race_scores
        .map(rs => rs.score_code || rs.points.toString())
        .join(',');
      
      return [
        s.rank,
        `"${s.entry.sail_number}"`,
        `"${s.entry.entry_number || ''}"`,
        `"${s.entry.sailor_name}"`,
        `"${s.entry.boat_class}"`,
        s.net_points,
        s.total_points,
        s.races_sailed,
        s.discards_used,
      ].join(',');
    }).join('\n');

    return header + rows;
  }

  /**
   * Get race-by-race breakdown for a competitor
   */
  async getCompetitorBreakdown(
    regattaId: string,
    entryId: string
  ): Promise<RaceScore[]> {
    const { data: results, error } = await supabase
      .from('race_results')
      .select('*')
      .eq('regatta_id', regattaId)
      .eq('entry_id', entryId)
      .order('race_number');

    if (error) throw error;

    return (results || []).map(r => ({
      entry_id: r.entry_id,
      race_number: r.race_number,
      finish_position: r.finish_position,
      points: r.points || r.finish_position || 0,
      score_code: r.score_code,
      excluded: false,
      penalty: r.scoring_penalty,
    }));
  }

  /**
   * Get change history for results
   */
  async getResultsHistory(regattaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('results_change_log')
      .select(`
        *,
        users:changed_by (
          full_name
        )
      `)
      .eq('regatta_id', regattaId)
      .order('changed_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  // Private helpers

  private scoreCodeToStatus(code: ScoreCode): string {
    const mapping: Record<ScoreCode, string> = {
      DNC: 'dnc',
      DNS: 'dns',
      OCS: 'ocs',
      ZFP: 'finished',
      UFD: 'dsq',
      BFD: 'dsq',
      SCP: 'finished',
      DNF: 'dnf',
      RET: 'ret',
      DSQ: 'dsq',
      DNE: 'dsq',
      RDG: 'finished',
      DPI: 'finished',
    };
    return mapping[code] || 'finished';
  }

  private async logResultChange(
    regattaId: string,
    raceNumber: number,
    entryId: string,
    changeType: string,
    oldValue: any,
    newValue: any,
    reason?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('results_change_log')
        .insert({
          regatta_id: regattaId,
          race_number: raceNumber,
          entry_id: entryId,
          change_type: changeType,
          old_value: oldValue,
          new_value: newValue,
          reason,
          changed_by: user?.id,
        });
    } catch (error) {
      console.error('Failed to log result change:', error);
    }
  }
}

// Export singleton instance
export const scoringService = new ScoringService();
export default ScoringService;

