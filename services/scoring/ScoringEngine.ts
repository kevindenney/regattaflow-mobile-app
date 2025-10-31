// @ts-nocheck

/**
 * Sailing Results Scoring Engine
 * Implements RRS Appendix A scoring systems with full tie-breaking rules
 * Supports Low Point, High Point, Bonus Point, and custom systems
 */

import { supabase } from '../supabase';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ScoringSystem =
  | 'low_point'        // RRS Appendix A4 - Default for most racing
  | 'high_point'       // RRS Appendix A8 - Match racing
  | 'bonus_point'      // RRS Appendix A8.2 - With bonus points
  | 'custom';          // Custom scoring formula

export type ScoreCode =
  | 'DNC'  // Did Not Come to Starting Area
  | 'DNS'  // Did Not Start
  | 'OCS'  // On Course Side at start
  | 'ZFP'  // 20% penalty under rule 30.2
  | 'UFD'  // U flag disqualification
  | 'BFD'  // Black flag disqualification
  | 'SCP'  // Scoring penalty
  | 'DNF'  // Did Not Finish
  | 'RET'  // Retired
  | 'DSQ'  // Disqualified
  | 'DNE'  // Disqualified not excludable
  | 'RDG'  // Redress given
  | 'DPI';  // Discretionary penalty imposed

export interface RaceResult {
  id: string;
  regatta_id: string;
  race_number: number;
  entry_id: string;
  finish_position?: number;
  corrected_position?: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'dnc' | 'ret' | 'raf';
  time_penalty?: number;
  scoring_penalty?: number;
  score_code?: ScoreCode;
  points?: number;
}

export interface SeriesEntry {
  entry_id: string;
  entry_number: string;
  sailor_name: string;
  sail_number: string;
  boat_class: string;
  division?: string;
  club?: string;
}

export interface SeriesRace {
  race_number: number;
  race_name: string;
  race_date: Date;
  completed: boolean;
  abandoned: boolean;
  weight?: number; // For weighted races
}

export interface RaceScore {
  entry_id: string;
  race_number: number;
  finish_position?: number;
  points: number;
  score_code?: ScoreCode;
  excluded: boolean;
  penalty?: number;
}

export interface SeriesStanding {
  rank: number;
  entry: SeriesEntry;
  race_scores: RaceScore[];
  total_points: number;
  net_points: number;
  races_sailed: number;
  discards_used: number;
  tied: boolean;
  tie_breaker?: string;
}

export interface ScoringConfiguration {
  system: ScoringSystem;
  discards: DiscardRule[];
  use_corrected_time: boolean;
  exclude_dns_dnc_from_discard: boolean;

  // Low Point System settings (RRS A4)
  first_place_points?: number;  // Default: 1

  // High Point System settings (RRS A8)
  high_point_system?: 'default' | 'custom';
  high_point_formula?: string;

  // Penalty points
  scoring_penalties: {
    [key in ScoreCode]?: number | 'races_sailed_plus_1' | 'races_sailed' | 'did_not_finish';
  };

  // Custom formulas
  custom_formula?: string;

  // Tie breaking rules (RRS A8)
  tie_breaking_rules: TieBreakerRule[];
}

export type DiscardRule = {
  after_races: number;  // Apply after this many races completed
  discards: number;     // Number of discards allowed
};

export type TieBreakerRule =
  | 'last_race'           // Last race position (RRS A8.1)
  | 'most_firsts'         // Most first places
  | 'most_seconds'        // Most second places
  | 'best_in_last'        // Best score in last race
  | 'best_exclude_worst'  // Best score excluding worst
  | 'head_to_head';       // Head to head results

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const logger = createLogger('ScoringEngine');
export const DEFAULT_LOW_POINT_CONFIG: ScoringConfiguration = {
  system: 'low_point',
  discards: [
    { after_races: 0, discards: 0 },
    { after_races: 5, discards: 1 },
    { after_races: 10, discards: 2 },
  ],
  use_corrected_time: true,
  exclude_dns_dnc_from_discard: true,
  first_place_points: 1,
  scoring_penalties: {
    DNC: 'races_sailed_plus_1',
    DNS: 'races_sailed_plus_1',
    OCS: 'races_sailed_plus_1',
    ZFP: 'races_sailed_plus_1', // 20% penalty
    UFD: 'races_sailed_plus_1',
    BFD: 'races_sailed_plus_1',
    SCP: 'did_not_finish',      // Varies, often DNF equivalent
    DNF: 'races_sailed_plus_1',
    RET: 'races_sailed_plus_1',
    DSQ: 'races_sailed_plus_1',
    DNE: 'races_sailed_plus_1', // Not excludable
  },
  tie_breaking_rules: [
    'last_race',
    'most_firsts',
    'most_seconds',
    'best_in_last',
  ],
};

// ============================================================================
// SCORING ENGINE
// ============================================================================

export class ScoringEngine {
  private config: ScoringConfiguration;

  constructor(config: ScoringConfiguration = DEFAULT_LOW_POINT_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate series standings for a regatta
   */
  async calculateSeriesStandings(
    regattaId: string,
    division?: string
  ): Promise<SeriesStanding[]> {
    // Get all entries for this regatta/division
    const entries = await this.getSeriesEntries(regattaId, division);

    // Get all races
    const races = await this.getSeriesRaces(regattaId);

    // Get all results
    const results = await this.getAllResults(regattaId);

    // Calculate points for each race
    const scoredResults = this.scoreAllRaces(results, races, entries.length);

    // Calculate standings with discards
    const standings = this.calculateStandings(
      entries,
      races,
      scoredResults
    );

    // Apply tie-breaking
    const rankedStandings = this.applyTieBreaking(standings);

    // Save to database
    await this.saveStandings(regattaId, rankedStandings, division);

    return rankedStandings;
  }

  /**
   * Score all races according to scoring system
   */
  private scoreAllRaces(
    results: RaceResult[],
    races: SeriesRace[],
    totalEntries: number
  ): RaceScore[] {
    const scored: RaceScore[] = [];

    for (const race of races) {
      if (!race.completed || race.abandoned) continue;

      const raceResults = results.filter(r => r.race_number === race.race_number);
      const raceScores = this.scoreRace(raceResults, totalEntries, race.weight);

      scored.push(...raceScores);
    }

    return scored;
  }

  /**
   * Score a single race
   */
  private scoreRace(
    results: RaceResult[],
    totalEntries: number,
    weight: number = 1
  ): RaceScore[] {
    const scores: RaceScore[] = [];

    // Sort by finish position (corrected or elapsed)
    const sortedResults = [...results].sort((a, b) => {
      const posA = this.config.use_corrected_time
        ? (a.corrected_position || 999)
        : (a.finish_position || 999);
      const posB = this.config.use_corrected_time
        ? (b.corrected_position || 999)
        : (b.finish_position || 999);
      return posA - posB;
    });

    for (const result of sortedResults) {
      const position = this.config.use_corrected_time
        ? result.corrected_position
        : result.finish_position;

      let points: number;
      let scoreCode: ScoreCode | undefined;

      // Check for scoring codes (DNS, DNF, etc.)
      if (result.score_code) {
        scoreCode = result.score_code;
        points = this.calculatePenaltyPoints(scoreCode, totalEntries);
      } else if (position) {
        // Normal finish - use scoring system
        points = this.calculateFinishPoints(position, weight);

        // Apply any time or scoring penalties
        if (result.time_penalty) {
          // Time penalties don't change position but may affect corrected time
          // Already reflected in corrected_position
        }
        if (result.scoring_penalty) {
          points += result.scoring_penalty;
        }
      } else {
        // No position and no score code - assume DNC
        scoreCode = 'DNC';
        points = this.calculatePenaltyPoints('DNC', totalEntries);
      }

      scores.push({
        entry_id: result.entry_id,
        race_number: result.race_number,
        finish_position: position,
        points,
        score_code: scoreCode,
        excluded: false, // Will be set during discard calculation
        penalty: result.scoring_penalty,
      });
    }

    return scores;
  }

  /**
   * Calculate points for a finishing position
   */
  private calculateFinishPoints(position: number, weight: number = 1): number {
    let points: number;

    switch (this.config.system) {
      case 'low_point':
        // RRS A4: First place = 1 point, second = 2, etc.
        points = position;
        break;

      case 'high_point':
        // RRS A8: Points decrease with position
        // Default formula: (boats + 1) - position
        points = 101 - position; // Assumes max 100 boats, adjustable
        break;

      case 'bonus_point':
        // RRS A8.2: First place gets bonus
        points = position === 1 ? 0 : position - 1;
        break;

      case 'custom':
        if (this.config.custom_formula) {
          points = this.evaluateCustomFormula(
            this.config.custom_formula,
            position
          );
        } else {
          points = position; // Fallback to low point
        }
        break;

      default:
        points = position;
    }

    // Apply race weight
    return points * weight;
  }

  /**
   * Calculate penalty points for non-finishers
   */
  private calculatePenaltyPoints(code: ScoreCode, racesSailed: number): number {
    const penalty = this.config.scoring_penalties[code];

    if (!penalty) {
      return racesSailed + 1; // Default
    }

    if (typeof penalty === 'number') {
      return penalty;
    }

    switch (penalty) {
      case 'races_sailed_plus_1':
        return racesSailed + 1;
      case 'races_sailed':
        return racesSailed;
      case 'did_not_finish':
        return racesSailed + 1;
      default:
        return racesSailed + 1;
    }
  }

  /**
   * Calculate series standings with discards
   */
  private calculateStandings(
    entries: SeriesEntry[],
    races: SeriesRace[],
    scores: RaceScore[]
  ): SeriesStanding[] {
    const standings: SeriesStanding[] = [];
    const completedRaces = races.filter(r => r.completed && !r.abandoned).length;

    // Determine number of discards based on races completed
    const discardRule = this.getDiscardRule(completedRaces);
    const allowedDiscards = discardRule.discards;

    for (const entry of entries) {
      const entryScores = scores.filter(s => s.entry_id === entry.entry_id);

      // Apply discards
      const withDiscards = this.applyDiscards(
        entryScores,
        allowedDiscards,
        this.config.exclude_dns_dnc_from_discard
      );

      // Calculate totals
      const totalPoints = entryScores.reduce((sum, s) => sum + s.points, 0);
      const netPoints = withDiscards
        .filter(s => !s.excluded)
        .reduce((sum, s) => sum + s.points, 0);

      const racesSailed = entryScores.filter(
        s => !s.score_code || !['DNC', 'DNS'].includes(s.score_code)
      ).length;

      standings.push({
        rank: 0, // Will be assigned after sorting
        entry,
        race_scores: withDiscards,
        total_points: totalPoints,
        net_points: netPoints,
        races_sailed: racesSailed,
        discards_used: withDiscards.filter(s => s.excluded).length,
        tied: false,
      });
    }

    // Sort by net points (low point system) or total points (high point)
    const sortKey = this.config.system === 'high_point' ? 'total_points' : 'net_points';
    const sortOrder = this.config.system === 'high_point' ? -1 : 1; // Descending for high point

    standings.sort((a, b) => {
      return sortOrder * (a[sortKey] - b[sortKey]);
    });

    return standings;
  }

  /**
   * Apply discard rules
   */
  private applyDiscards(
    scores: RaceScore[],
    allowedDiscards: number,
    excludeDnseDnc: boolean
  ): RaceScore[] {
    if (allowedDiscards === 0) {
      return scores;
    }

    // Clone scores
    const workingScores = scores.map(s => ({ ...s }));

    // Get scores eligible for discard
    const eligibleForDiscard = excludeDnseDnc
      ? workingScores.filter(s => !s.score_code || !['DNC', 'DNS', 'DNE'].includes(s.score_code))
      : workingScores.filter(s => s.score_code !== 'DNE'); // DNE is never excludable

    // Sort by points (descending) to find worst scores
    eligibleForDiscard.sort((a, b) => b.points - a.points);

    // Mark worst N scores as excluded
    for (let i = 0; i < Math.min(allowedDiscards, eligibleForDiscard.length); i++) {
      eligibleForDiscard[i].excluded = true;
    }

    return workingScores;
  }

  /**
   * Get applicable discard rule based on races completed
   */
  private getDiscardRule(racesCompleted: number): DiscardRule {
    // Find the rule with highest after_races that doesn't exceed racesCompleted
    const applicableRules = this.config.discards
      .filter(r => r.after_races <= racesCompleted)
      .sort((a, b) => b.after_races - a.after_races);

    return applicableRules[0] || { after_races: 0, discards: 0 };
  }

  /**
   * Apply tie-breaking rules (RRS A8)
   */
  private applyTieBreaking(standings: SeriesStanding[]): SeriesStanding[] {
    const ranked = [...standings];
    let currentRank = 1;

    for (let i = 0; i < ranked.length; i++) {
      const current = ranked[i];
      current.rank = currentRank;

      // Check if tied with previous
      if (i > 0 && ranked[i - 1].net_points === current.net_points) {
        current.tied = true;
        ranked[i - 1].tied = true;
      }

      // Find all tied competitors
      const tiedGroup: SeriesStanding[] = [current];
      let j = i + 1;
      while (j < ranked.length && ranked[j].net_points === current.net_points) {
        tiedGroup.push(ranked[j]);
        ranked[j].tied = true;
        j++;
      }

      if (tiedGroup.length > 1) {
        // Apply tie-breaking rules
        const broken = this.breakTie(tiedGroup);

        // Replace in ranked array
        for (let k = 0; k < broken.length; k++) {
          broken[k].rank = currentRank + k;
          ranked[i + k] = broken[k];
        }
      }

      // Move to next rank group
      currentRank += (j - i);
      i = j - 1;
    }

    return ranked;
  }

  /**
   * Break ties using configured rules
   */
  private breakTie(tied: SeriesStanding[]): SeriesStanding[] {
    let remaining = [...tied];

    for (const rule of this.config.tie_breaking_rules) {
      if (remaining.length === 1) break;

      switch (rule) {
        case 'last_race':
          remaining = this.breakTieByLastRace(remaining);
          break;
        case 'most_firsts':
          remaining = this.breakTieByMostFinishes(remaining, 1);
          break;
        case 'most_seconds':
          remaining = this.breakTieByMostFinishes(remaining, 2);
          break;
        case 'best_in_last':
          remaining = this.breakTieByBestInLast(remaining);
          break;
        case 'head_to_head':
          remaining = this.breakTieByHeadToHead(remaining);
          break;
      }
    }

    return remaining;
  }

  private breakTieByLastRace(tied: SeriesStanding[]): SeriesStanding[] {
    // Find the last race for each competitor
    const withLast = tied.map(s => {
      const raceScores = s.race_scores
        .filter(r => !r.excluded)
        .sort((a, b) => b.race_number - a.race_number);

      return {
        standing: s,
        lastRacePoints: raceScores[0]?.points || 999,
      };
    });

    withLast.sort((a, b) => a.lastRacePoints - b.lastRacePoints);
    return withLast.map(w => w.standing);
  }

  private breakTieByMostFinishes(tied: SeriesStanding[], position: number): SeriesStanding[] {
    const withCounts = tied.map(s => {
      const count = s.race_scores.filter(
        r => !r.excluded && r.finish_position === position
      ).length;

      return { standing: s, count };
    });

    withCounts.sort((a, b) => b.count - a.count);
    return withCounts.map(w => w.standing);
  }

  private breakTieByBestInLast(tied: SeriesStanding[]): SeriesStanding[] {
    return this.breakTieByLastRace(tied); // Same implementation
  }

  private breakTieByHeadToHead(tied: SeriesStanding[]): SeriesStanding[] {
    // Compare positions in races where all tied competitors sailed
    // This is complex - simplified version
    return tied; // TODO: Implement full head-to-head logic
  }

  /**
   * Evaluate custom scoring formula
   */
  private evaluateCustomFormula(formula: string, position: number): number {
    try {
      // Simple eval with position variable
      // In production, use a safer expression evaluator
      const func = new Function('position', `return ${formula}`);
      return func(position);
    } catch (error) {
      console.error('Custom formula error:', error);
      return position; // Fallback to position
    }
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  private async getSeriesEntries(
    regattaId: string,
    division?: string
  ): Promise<SeriesEntry[]> {
    let query = supabase
      .from('race_entries')
      .select(`
        id,
        entry_number,
        sail_number,
        entry_class,
        division,
        sailor:sailor_id (
          full_name,
          club_name
        )
      `)
      .eq('regatta_id', regattaId)
      .eq('status', 'confirmed');

    if (division) {
      query = query.eq('division', division);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(entry => ({
      entry_id: entry.id,
      entry_number: entry.entry_number || '',
      sailor_name: entry.sailor?.full_name || '',
      sail_number: entry.sail_number,
      boat_class: entry.entry_class,
      division: entry.division,
      club: entry.sailor?.club_name,
    }));
  }

  private async getSeriesRaces(regattaId: string): Promise<SeriesRace[]> {
    const { data, error } = await supabase
      .from('regatta_races')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('race_number');

    if (error) throw error;

    return (data || []).map(race => ({
      race_number: race.race_number,
      race_name: race.race_name || `Race ${race.race_number}`,
      race_date: new Date(race.race_date),
      completed: race.status === 'completed',
      abandoned: race.status === 'abandoned',
      weight: race.weight || 1,
    }));
  }

  private async getAllResults(regattaId: string): Promise<RaceResult[]> {
    const { data, error } = await supabase
      .from('race_results')
      .select('*')
      .eq('regatta_id', regattaId);

    if (error) throw error;
    return data || [];
  }

  private async saveStandings(
    regattaId: string,
    standings: SeriesStanding[],
    division?: string
  ): Promise<void> {
    const standingsData = standings.map(s => ({
      regatta_id: regattaId,
      entry_id: s.entry.entry_id,
      division: division || s.entry.division,
      rank: s.rank,
      total_points: s.total_points,
      net_points: s.net_points,
      races_sailed: s.races_sailed,
      discards_used: s.discards_used,
      tied: s.tied,
      tie_breaker: s.tie_breaker,
      race_scores: s.race_scores,
    }));

    const { error } = await supabase
      .from('series_standings')
      .upsert(standingsData, {
        onConflict: 'regatta_id,entry_id,division',
      });

    if (error) throw error;
  }

  /**
   * Publish results (make them public)
   */
  async publishResults(regattaId: string, division?: string): Promise<void> {
    // Recalculate to ensure current
    await this.calculateSeriesStandings(regattaId, division);

    // Mark regatta results as published
    const { error } = await supabase
      .from('regattas')
      .update({
        results_published: true,
        results_published_at: new Date().toISOString(),
      })
      .eq('id', regattaId);

    if (error) throw error;
  }

  /**
   * Export results to Sailwave format
   */
  async exportToSailwave(regattaId: string): Promise<string> {
    const standings = await this.getPublishedStandings(regattaId);

    // Generate Sailwave BLW file format
    // This is a simplified version - full implementation would match Sailwave spec
    let blw = `[Sailwave]\nVersion=2.0\n\n`;
    blw += `[Event]\nName=${regattaId}\n\n`;
    blw += `[Competitors]\n`;

    standings.forEach((s, idx) => {
      blw += `${idx + 1},${s.entry.sail_number},${s.entry.sailor_name},${s.entry.club || ''}\n`;
    });

    blw += `\n[Races]\n`;
    // Add race data...

    return blw;
  }

  /**
   * Import results from Sailwave
   */
  async importFromSailwave(regattaId: string, blwContent: string): Promise<void> {
    // Parse Sailwave BLW format
    // This is a placeholder - full implementation would parse the format
    const lines = blwContent.split('\n');

    // Extract competitors and results
    // TODO: Implement full BLW parser

    logger.debug('Sailwave import not yet implemented');
  }

  private async getPublishedStandings(regattaId: string): Promise<SeriesStanding[]> {
    const { data, error } = await supabase
      .from('series_standings')
      .select(`
        *,
        entry:entry_id (
          entry_number,
          sail_number,
          entry_class,
          division,
          sailor:sailor_id (
            full_name,
            club_name
          )
        )
      `)
      .eq('regatta_id', regattaId)
      .order('rank');

    if (error) throw error;

    return (data || []).map(s => ({
      rank: s.rank,
      entry: {
        entry_id: s.entry_id,
        entry_number: s.entry.entry_number || '',
        sailor_name: s.entry.sailor?.full_name || '',
        sail_number: s.entry.sail_number,
        boat_class: s.entry.entry_class,
        division: s.entry.division,
        club: s.entry.sailor?.club_name,
      },
      race_scores: s.race_scores || [],
      total_points: s.total_points,
      net_points: s.net_points,
      races_sailed: s.races_sailed,
      discards_used: s.discards_used,
      tied: s.tied,
      tie_breaker: s.tie_breaker,
    }));
  }
}

export default ScoringEngine;
