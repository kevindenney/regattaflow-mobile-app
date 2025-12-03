/**
 * Rule 42 Service
 * Track propulsion infractions (Rule 42 - Propulsion)
 * SAILTI-competitive feature for umpire/observer logging
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type Rule42InfractionType =
  | 'pumping'
  | 'rocking'
  | 'ooching'
  | 'sculling'
  | 'repeated_tacks'
  | 'repeated_gybes'
  | 'torquing'
  | 'other';

export type Rule42PenaltyType =
  | 'warning'           // Yellow flag
  | 'one_turn'          // 360° penalty
  | 'two_turns'         // 720° penalty
  | 'scoring_penalty'   // % penalty on position
  | 'dsq'              // Disqualification
  | 'none';            // No penalty (dismissed)

export interface Rule42Infraction {
  id: string;
  regatta_id: string;
  race_number: number;
  entry_id: string;
  sail_number?: string;
  infraction_type: Rule42InfractionType;
  infraction_time: string;
  leg_of_course?: string;
  is_warning: boolean;
  penalty_type?: Rule42PenaltyType;
  penalty_taken: boolean;
  penalty_taken_at?: string;
  observer_id?: string;
  observer_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  entry?: {
    sail_number: string;
    boat_name?: string;
    skipper_name?: string;
  };
}

export interface Rule42FormData {
  regatta_id: string;
  race_number: number;
  entry_id: string;
  infraction_type: Rule42InfractionType;
  infraction_time?: string;
  leg_of_course?: string;
  is_warning: boolean;
  notes?: string;
}

export interface Rule42Summary {
  entry_id: string;
  sail_number: string;
  boat_name?: string;
  total_infractions: number;
  warnings: number;
  penalties: number;
  dsqs: number;
}

export interface Rule42RaceSummary {
  race_number: number;
  total_infractions: number;
  warnings_given: number;
  penalties_given: number;
  boats_flagged: string[];
}

// ============================================================================
// RULE 42 SERVICE CLASS
// ============================================================================

class Rule42Service {
  
  // -------------------------------------------------------------------------
  // INFRACTION LOGGING
  // -------------------------------------------------------------------------

  /**
   * Log a Rule 42 infraction
   */
  async logInfraction(data: Rule42FormData): Promise<Rule42Infraction> {
    const { data: user } = await supabase.auth.getUser();
    
    // Get the entry's sail number for convenience
    const { data: entry } = await supabase
      .from('race_entries')
      .select('sail_number')
      .eq('id', data.entry_id)
      .single();

    // Count existing infractions for this entry in this race
    const { count } = await supabase
      .from('rule42_infractions')
      .select('*', { count: 'exact', head: true })
      .eq('regatta_id', data.regatta_id)
      .eq('race_number', data.race_number)
      .eq('entry_id', data.entry_id);

    // Determine penalty based on warning count
    const existingWarnings = count || 0;
    const isWarning = data.is_warning || existingWarnings === 0;
    
    // If already warned in this race, subsequent infractions are penalties
    let penaltyType: Rule42PenaltyType = 'none';
    if (!isWarning && existingWarnings > 0) {
      penaltyType = 'scoring_penalty'; // Default penalty
    }

    const { data: infraction, error } = await supabase
      .from('rule42_infractions')
      .insert({
        regatta_id: data.regatta_id,
        race_number: data.race_number,
        entry_id: data.entry_id,
        sail_number: entry?.sail_number,
        infraction_type: data.infraction_type,
        infraction_time: data.infraction_time || new Date().toISOString(),
        leg_of_course: data.leg_of_course,
        is_warning: isWarning,
        penalty_type: penaltyType,
        penalty_taken: false,
        observer_id: user.user?.id,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return infraction;
  }

  /**
   * Quick log - minimal data entry for on-water umpires
   */
  async quickLog(
    regattaId: string,
    raceNumber: number,
    sailNumber: string,
    infractionType: Rule42InfractionType,
    isWarning: boolean = true
  ): Promise<Rule42Infraction> {
    // Find entry by sail number
    const { data: entry, error: entryError } = await supabase
      .from('race_entries')
      .select('id')
      .eq('regatta_id', regattaId)
      .eq('sail_number', sailNumber)
      .single();

    if (entryError || !entry) {
      throw new Error(`Boat ${sailNumber} not found in regatta`);
    }

    return this.logInfraction({
      regatta_id: regattaId,
      race_number: raceNumber,
      entry_id: entry.id,
      infraction_type: infractionType,
      is_warning: isWarning,
    });
  }

  /**
   * Update infraction (e.g., confirm penalty taken)
   */
  async updateInfraction(
    infractionId: string,
    updates: Partial<Pick<Rule42Infraction, 'penalty_type' | 'penalty_taken' | 'notes'>>
  ): Promise<Rule42Infraction> {
    const updateData: any = { ...updates };
    
    if (updates.penalty_taken) {
      updateData.penalty_taken_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('rule42_infractions')
      .update(updateData)
      .eq('id', infractionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an infraction (undo)
   */
  async deleteInfraction(infractionId: string): Promise<void> {
    const { error } = await supabase
      .from('rule42_infractions')
      .delete()
      .eq('id', infractionId);

    if (error) throw error;
  }

  // -------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------

  /**
   * Get all infractions for a regatta
   */
  async getRegattaInfractions(regattaId: string): Promise<Rule42Infraction[]> {
    const { data, error } = await supabase
      .from('rule42_infractions')
      .select(`
        *,
        entry:entry_id (
          sail_number,
          boat_name,
          skipper_name
        )
      `)
      .eq('regatta_id', regattaId)
      .order('race_number')
      .order('infraction_time');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get infractions for a specific race
   */
  async getRaceInfractions(
    regattaId: string,
    raceNumber: number
  ): Promise<Rule42Infraction[]> {
    const { data, error } = await supabase
      .from('rule42_infractions')
      .select(`
        *,
        entry:entry_id (
          sail_number,
          boat_name,
          skipper_name
        )
      `)
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .order('infraction_time');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get infractions for a specific entry
   */
  async getEntryInfractions(
    regattaId: string,
    entryId: string
  ): Promise<Rule42Infraction[]> {
    const { data, error } = await supabase
      .from('rule42_infractions')
      .select('*')
      .eq('regatta_id', regattaId)
      .eq('entry_id', entryId)
      .order('race_number')
      .order('infraction_time');

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if entry has been warned in this race
   */
  async hasWarningInRace(
    regattaId: string,
    raceNumber: number,
    entryId: string
  ): Promise<boolean> {
    const { count } = await supabase
      .from('rule42_infractions')
      .select('*', { count: 'exact', head: true })
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .eq('entry_id', entryId)
      .eq('is_warning', true);

    return (count || 0) > 0;
  }

  // -------------------------------------------------------------------------
  // SUMMARIES & REPORTS
  // -------------------------------------------------------------------------

  /**
   * Get summary by competitor for a regatta
   */
  async getCompetitorSummary(regattaId: string): Promise<Rule42Summary[]> {
    const infractions = await this.getRegattaInfractions(regattaId);

    const summaryMap = new Map<string, Rule42Summary>();

    for (const inf of infractions) {
      const existing = summaryMap.get(inf.entry_id) || {
        entry_id: inf.entry_id,
        sail_number: inf.entry?.sail_number || inf.sail_number || '',
        boat_name: inf.entry?.boat_name,
        total_infractions: 0,
        warnings: 0,
        penalties: 0,
        dsqs: 0,
      };

      existing.total_infractions++;
      if (inf.is_warning) {
        existing.warnings++;
      } else if (inf.penalty_type === 'dsq') {
        existing.dsqs++;
      } else if (inf.penalty_type && inf.penalty_type !== 'none') {
        existing.penalties++;
      }

      summaryMap.set(inf.entry_id, existing);
    }

    return Array.from(summaryMap.values())
      .sort((a, b) => b.total_infractions - a.total_infractions);
  }

  /**
   * Get summary by race
   */
  async getRaceSummary(regattaId: string): Promise<Rule42RaceSummary[]> {
    const infractions = await this.getRegattaInfractions(regattaId);

    const summaryMap = new Map<number, Rule42RaceSummary>();

    for (const inf of infractions) {
      const existing = summaryMap.get(inf.race_number) || {
        race_number: inf.race_number,
        total_infractions: 0,
        warnings_given: 0,
        penalties_given: 0,
        boats_flagged: [],
      };

      existing.total_infractions++;
      if (inf.is_warning) {
        existing.warnings_given++;
      } else if (inf.penalty_type && inf.penalty_type !== 'none') {
        existing.penalties_given++;
      }

      const sailNumber = inf.entry?.sail_number || inf.sail_number;
      if (sailNumber && !existing.boats_flagged.includes(sailNumber)) {
        existing.boats_flagged.push(sailNumber);
      }

      summaryMap.set(inf.race_number, existing);
    }

    return Array.from(summaryMap.values())
      .sort((a, b) => a.race_number - b.race_number);
  }

  /**
   * Get total stats for a regatta
   */
  async getRegattaStats(regattaId: string): Promise<{
    totalInfractions: number;
    totalWarnings: number;
    totalPenalties: number;
    totalDSQs: number;
    boatsFlagged: number;
    racesWithInfractions: number;
  }> {
    const infractions = await this.getRegattaInfractions(regattaId);

    const boats = new Set<string>();
    const races = new Set<number>();
    let warnings = 0;
    let penalties = 0;
    let dsqs = 0;

    for (const inf of infractions) {
      boats.add(inf.entry_id);
      races.add(inf.race_number);

      if (inf.is_warning) {
        warnings++;
      } else if (inf.penalty_type === 'dsq') {
        dsqs++;
      } else if (inf.penalty_type && inf.penalty_type !== 'none') {
        penalties++;
      }
    }

    return {
      totalInfractions: infractions.length,
      totalWarnings: warnings,
      totalPenalties: penalties,
      totalDSQs: dsqs,
      boatsFlagged: boats.size,
      racesWithInfractions: races.size,
    };
  }

  // -------------------------------------------------------------------------
  // REPORT GENERATION
  // -------------------------------------------------------------------------

  /**
   * Generate Rule 42 report document
   */
  generateReport(
    regattaName: string,
    infractions: Rule42Infraction[],
    competitorSummary: Rule42Summary[]
  ): string {
    const byRace = new Map<number, Rule42Infraction[]>();
    for (const inf of infractions) {
      const raceInf = byRace.get(inf.race_number) || [];
      raceInf.push(inf);
      byRace.set(inf.race_number, raceInf);
    }

    let report = `
RULE 42 REPORT
==============

Regatta: ${regattaName}
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Infractions: ${infractions.length}
Warnings Issued: ${infractions.filter(i => i.is_warning).length}
Penalties Applied: ${infractions.filter(i => !i.is_warning && i.penalty_type !== 'none').length}
Boats Flagged: ${competitorSummary.length}

`;

    // By competitor
    if (competitorSummary.length > 0) {
      report += `
COMPETITOR BREAKDOWN
--------------------
`;
      for (const summary of competitorSummary) {
        report += `${summary.sail_number.padEnd(10)} - Infractions: ${summary.total_infractions}, Warnings: ${summary.warnings}, Penalties: ${summary.penalties}\n`;
      }
    }

    // By race
    report += `
RACE-BY-RACE LOG
----------------
`;
    for (const [raceNum, raceInfractions] of Array.from(byRace.entries()).sort((a, b) => a[0] - b[0])) {
      report += `\nRace ${raceNum}:\n`;
      for (const inf of raceInfractions) {
        const sailNum = inf.entry?.sail_number || inf.sail_number || 'Unknown';
        const time = inf.infraction_time ? new Date(inf.infraction_time).toLocaleTimeString() : 'N/A';
        const type = inf.infraction_type.replace('_', ' ');
        const penalty = inf.is_warning ? 'WARNING (Yellow Flag)' : (inf.penalty_type?.toUpperCase() || 'PENALTY');
        
        report += `  ${time} - ${sailNum.padEnd(8)} - ${type.padEnd(15)} - ${penalty}\n`;
      }
    }

    return report.trim();
  }
}

// Export singleton
export const rule42Service = new Rule42Service();
export default Rule42Service;

