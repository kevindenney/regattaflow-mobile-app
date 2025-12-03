/**
 * Protest Service
 * Manages the complete protest hearing workflow
 * From filing through hearing to decision and penalty application
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type ProtestType = 
  | 'boat_vs_boat'
  | 'boat_vs_rc'
  | 'rc_vs_boat'
  | 'redress_request'
  | 'equipment_inspection'
  | 'measurement';

export type ProtestStatus = 
  | 'filed'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'heard'
  | 'decided'
  | 'appealed';

export type HearingStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'cancelled';

export type DecisionType = 
  | 'protest_upheld'
  | 'protest_dismissed'
  | 'protest_withdrawn'
  | 'no_protest_valid'
  | 'redress_granted'
  | 'redress_denied'
  | 'request_withdrawn'
  | 'measurement_failed'
  | 'measurement_passed';

export type PenaltyType = 
  | 'dsq'
  | 'dns'
  | 'dnf'
  | 'scoring_penalty'
  | 'time_penalty'
  | 'warning'
  | 'fine'
  | 'other'
  | 'none';

export interface Protest {
  id: string;
  regatta_id: string;
  race_number: number;
  protest_number: string;
  protest_type: ProtestType;
  protestor_entry_id?: string;
  protestee_entry_ids?: string[];
  rule_infringed?: string;
  incident_time?: string;
  incident_location?: string;
  description: string;
  status: ProtestStatus;
  hail_given: boolean;
  red_flag_displayed: boolean;
  informed_protestee: boolean;
  time_limit_validated: boolean;
  hearing_time?: string;
  hearing_location?: string;
  filed_by?: string;
  filed_at: string;
  evidence_urls?: string[];
  diagrams_urls?: string[];
  protestor_entry?: {
    sail_number: string;
    boat_name?: string;
    skipper_name?: string;
  };
}

export interface ProtestFormData {
  regatta_id: string;
  race_number: number;
  protest_type: ProtestType;
  protestor_entry_id?: string;
  protestee_entry_ids?: string[];
  rule_infringed?: string;
  incident_time?: string;
  incident_location?: string;
  description: string;
  hail_given: boolean;
  red_flag_displayed: boolean;
  informed_protestee: boolean;
}

export interface Hearing {
  id: string;
  protest_id: string;
  regatta_id: string;
  hearing_number: number;
  scheduled_time: string;
  estimated_duration: string;
  actual_start_time?: string;
  actual_end_time?: string;
  room_name?: string;
  room_location?: string;
  is_virtual: boolean;
  virtual_meeting_url?: string;
  status: HearingStatus;
  postpone_reason?: string;
  notes?: string;
  protest?: Protest;
  panel?: PanelMember[];
}

export interface PanelMember {
  id: string;
  name: string;
  role: 'chair' | 'member' | 'scribe';
  is_international_judge: boolean;
  is_national_judge: boolean;
}

export interface PCMember {
  id: string;
  regatta_id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  is_international_judge: boolean;
  is_national_judge: boolean;
  is_regional_judge: boolean;
  certifications?: string[];
  role: 'chair' | 'vice_chair' | 'member' | 'alternate';
  is_available: boolean;
  conflicted_entries?: string[];
}

export interface Evidence {
  id: string;
  protest_id: string;
  evidence_type: 'diagram' | 'photo' | 'video' | 'document' | 'track_data' | 'witness_statement' | 'official_statement' | 'other';
  title: string;
  description?: string;
  file_url?: string;
  submitted_by: 'protestor' | 'protestee' | 'race_committee' | 'protest_committee' | 'witness';
  submitted_at: string;
  is_admitted: boolean;
}

export interface Witness {
  id: string;
  protest_id: string;
  name: string;
  entry_id?: string;
  role: 'participant' | 'race_official' | 'spectator' | 'other';
  called_by: 'protestor' | 'protestee' | 'protest_committee';
  testified: boolean;
  testimony_summary?: string;
}

export interface Decision {
  id: string;
  protest_id: string;
  hearing_id?: string;
  decision_type: DecisionType;
  facts_found: string;
  conclusions: string;
  rules_applied: string[];
  penalty_type?: PenaltyType;
  penalty_details?: string;
  affected_entry_ids?: string[];
  redress_type?: string;
  redress_value?: string;
  is_appealable: boolean;
  appeal_deadline?: string;
  decision_document_url?: string;
  signed_by_chair: boolean;
  signed_at?: string;
  decided_at: string;
}

export interface DecisionFormData {
  decision_type: DecisionType;
  facts_found: string;
  conclusions: string;
  rules_applied: string[];
  penalty_type?: PenaltyType;
  penalty_details?: string;
  affected_entry_ids?: string[];
  redress_type?: string;
  redress_value?: string;
}

export interface HearingRoom {
  id: string;
  regatta_id: string;
  name: string;
  location?: string;
  capacity?: number;
  has_video: boolean;
  has_whiteboard: boolean;
  is_active: boolean;
}

// ============================================================================
// PROTEST SERVICE CLASS
// ============================================================================

class ProtestService {
  
  // -------------------------------------------------------------------------
  // PROTEST FILING
  // -------------------------------------------------------------------------

  /**
   * File a new protest
   */
  async fileProtest(data: ProtestFormData): Promise<Protest> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data: protest, error } = await supabase
      .from('race_protests')
      .insert({
        ...data,
        filed_by: user.user?.id,
        filed_at: new Date().toISOString(),
        status: 'filed',
      })
      .select()
      .single();

    if (error) throw error;
    return protest;
  }

  /**
   * Get protest time limit for a race
   */
  async getProtestDeadline(regattaId: string, raceNumber: number): Promise<{
    deadline: Date | null;
    isExpired: boolean;
    minutesRemaining: number | null;
  }> {
    const { data, error } = await supabase
      .from('regatta_races')
      .select('protest_deadline, protest_time_limit')
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber)
      .single();

    if (error || !data?.protest_deadline) {
      return { deadline: null, isExpired: false, minutesRemaining: null };
    }

    const deadline = new Date(data.protest_deadline);
    const now = new Date();
    const minutesRemaining = Math.floor((deadline.getTime() - now.getTime()) / 60000);

    return {
      deadline,
      isExpired: now > deadline,
      minutesRemaining: minutesRemaining > 0 ? minutesRemaining : 0,
    };
  }

  /**
   * Get all protests for a regatta
   */
  async getRegattaProtests(regattaId: string): Promise<Protest[]> {
    const { data, error } = await supabase
      .from('race_protests')
      .select(`
        *,
        protestor_entry:protestor_entry_id (
          sail_number,
          boat_name,
          skipper_name
        )
      `)
      .eq('regatta_id', regattaId)
      .order('filed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single protest with full details
   */
  async getProtest(protestId: string): Promise<Protest & {
    evidence: Evidence[];
    witnesses: Witness[];
    hearings: Hearing[];
    decision?: Decision;
  }> {
    const { data: protest, error } = await supabase
      .from('race_protests')
      .select(`
        *,
        protestor_entry:protestor_entry_id (
          sail_number,
          boat_name,
          skipper_name
        )
      `)
      .eq('id', protestId)
      .single();

    if (error) throw error;

    // Get related data
    const [evidence, witnesses, hearings, decision] = await Promise.all([
      this.getProtestEvidence(protestId),
      this.getProtestWitnesses(protestId),
      this.getProtestHearings(protestId),
      this.getProtestDecision(protestId),
    ]);

    return {
      ...protest,
      evidence,
      witnesses,
      hearings,
      decision,
    };
  }

  /**
   * Update protest status
   */
  async updateProtestStatus(protestId: string, status: ProtestStatus): Promise<void> {
    const { error } = await supabase
      .from('race_protests')
      .update({ status })
      .eq('id', protestId);

    if (error) throw error;
  }

  /**
   * Withdraw a protest
   */
  async withdrawProtest(protestId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('race_protests')
      .update({
        status: 'withdrawn',
        decision: `Withdrawn${reason ? ': ' + reason : ''}`,
        decision_made_at: new Date().toISOString(),
      })
      .eq('id', protestId);

    if (error) throw error;
  }

  // -------------------------------------------------------------------------
  // EVIDENCE MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Add evidence to a protest
   */
  async addEvidence(protestId: string, evidence: Omit<Evidence, 'id' | 'submitted_at'>): Promise<Evidence> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('protest_evidence')
      .insert({
        ...evidence,
        protest_id: protestId,
        submitted_by_user_id: user.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all evidence for a protest
   */
  async getProtestEvidence(protestId: string): Promise<Evidence[]> {
    const { data, error } = await supabase
      .from('protest_evidence')
      .select('*')
      .eq('protest_id', protestId)
      .order('submitted_at');

    if (error) throw error;
    return data || [];
  }

  // -------------------------------------------------------------------------
  // WITNESS MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Add a witness
   */
  async addWitness(protestId: string, witness: Omit<Witness, 'id'>): Promise<Witness> {
    const { data, error } = await supabase
      .from('protest_witnesses')
      .insert({
        ...witness,
        protest_id: protestId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all witnesses for a protest
   */
  async getProtestWitnesses(protestId: string): Promise<Witness[]> {
    const { data, error } = await supabase
      .from('protest_witnesses')
      .select('*')
      .eq('protest_id', protestId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Record witness testimony
   */
  async recordTestimony(witnessId: string, summary: string): Promise<void> {
    const { error } = await supabase
      .from('protest_witnesses')
      .update({
        testified: true,
        testimony_summary: summary,
      })
      .eq('id', witnessId);

    if (error) throw error;
  }

  // -------------------------------------------------------------------------
  // HEARING MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Schedule a hearing
   */
  async scheduleHearing(data: {
    protest_id: string;
    regatta_id: string;
    scheduled_time: Date;
    room_name?: string;
    room_location?: string;
    is_virtual?: boolean;
    virtual_meeting_url?: string;
    estimated_duration?: string;
  }): Promise<Hearing> {
    const { data: user } = await supabase.auth.getUser();
    
    // Get next hearing number for the day
    const dayStart = new Date(data.scheduled_time);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const { count } = await supabase
      .from('protest_hearings')
      .select('*', { count: 'exact', head: true })
      .eq('regatta_id', data.regatta_id)
      .gte('scheduled_time', dayStart.toISOString())
      .lt('scheduled_time', dayEnd.toISOString());

    const { data: hearing, error } = await supabase
      .from('protest_hearings')
      .insert({
        ...data,
        hearing_number: (count || 0) + 1,
        scheduled_time: data.scheduled_time.toISOString(),
        scheduled_by: user.user?.id,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Update protest with hearing info
    await supabase
      .from('race_protests')
      .update({
        hearing_time: data.scheduled_time.toISOString(),
        hearing_location: data.room_name || data.room_location,
        status: 'accepted',
      })
      .eq('id', data.protest_id);

    return hearing;
  }

  /**
   * Get hearings for a regatta
   */
  async getRegattaHearings(regattaId: string, date?: Date): Promise<Hearing[]> {
    let query = supabase
      .from('protest_hearings')
      .select(`
        *,
        protest:protest_id (
          protest_number,
          protest_type,
          protestor_entry:protestor_entry_id (
            sail_number,
            boat_name
          )
        )
      `)
      .eq('regatta_id', regattaId)
      .order('scheduled_time');

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      query = query
        .gte('scheduled_time', dayStart.toISOString())
        .lt('scheduled_time', dayEnd.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get hearings for a specific protest
   */
  async getProtestHearings(protestId: string): Promise<Hearing[]> {
    const { data, error } = await supabase
      .from('protest_hearings')
      .select('*')
      .eq('protest_id', protestId)
      .order('scheduled_time');

    if (error) throw error;
    return data || [];
  }

  /**
   * Start a hearing
   */
  async startHearing(hearingId: string): Promise<void> {
    const { error } = await supabase
      .from('protest_hearings')
      .update({
        status: 'in_progress',
        actual_start_time: new Date().toISOString(),
      })
      .eq('id', hearingId);

    if (error) throw error;
  }

  /**
   * End a hearing
   */
  async endHearing(hearingId: string): Promise<void> {
    const { error } = await supabase
      .from('protest_hearings')
      .update({
        status: 'completed',
        actual_end_time: new Date().toISOString(),
      })
      .eq('id', hearingId);

    if (error) throw error;
  }

  /**
   * Postpone a hearing
   */
  async postponeHearing(hearingId: string, reason: string, newTime?: Date): Promise<void> {
    const updates: any = {
      status: 'postponed',
      postpone_reason: reason,
    };

    const { error } = await supabase
      .from('protest_hearings')
      .update(updates)
      .eq('id', hearingId);

    if (error) throw error;

    // If rescheduling, create a new hearing
    if (newTime) {
      const { data: oldHearing } = await supabase
        .from('protest_hearings')
        .select('*')
        .eq('id', hearingId)
        .single();

      if (oldHearing) {
        const newHearing = await this.scheduleHearing({
          protest_id: oldHearing.protest_id,
          regatta_id: oldHearing.regatta_id,
          scheduled_time: newTime,
          room_name: oldHearing.room_name,
          room_location: oldHearing.room_location,
          is_virtual: oldHearing.is_virtual,
        });

        // Link old hearing to new
        await supabase
          .from('protest_hearings')
          .update({ rescheduled_to: newHearing.id })
          .eq('id', hearingId);
      }
    }
  }

  // -------------------------------------------------------------------------
  // PANEL MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Get PC members for a regatta
   */
  async getPCMembers(regattaId: string): Promise<PCMember[]> {
    const { data, error } = await supabase
      .from('protest_committee_members')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('role');

    if (error) throw error;
    return data || [];
  }

  /**
   * Add a PC member
   */
  async addPCMember(member: Omit<PCMember, 'id'>): Promise<PCMember> {
    const { data, error } = await supabase
      .from('protest_committee_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Assign panel to a hearing
   */
  async assignPanel(hearingId: string, members: { memberId: string; role: 'chair' | 'member' | 'scribe' }[]): Promise<void> {
    // Remove existing assignments
    await supabase
      .from('hearing_panel_assignments')
      .delete()
      .eq('hearing_id', hearingId);

    // Add new assignments
    const assignments = members.map(m => ({
      hearing_id: hearingId,
      member_id: m.memberId,
      role: m.role,
    }));

    const { error } = await supabase
      .from('hearing_panel_assignments')
      .insert(assignments);

    if (error) throw error;
  }

  /**
   * Get panel for a hearing
   */
  async getHearingPanel(hearingId: string): Promise<PanelMember[]> {
    const { data, error } = await supabase
      .from('hearing_panel_assignments')
      .select(`
        role,
        member:member_id (
          id,
          name,
          is_international_judge,
          is_national_judge
        )
      `)
      .eq('hearing_id', hearingId);

    if (error) throw error;
    
    return (data || []).map((d: any) => ({
      id: d.member.id,
      name: d.member.name,
      role: d.role,
      is_international_judge: d.member.is_international_judge,
      is_national_judge: d.member.is_national_judge,
    }));
  }

  // -------------------------------------------------------------------------
  // DECISIONS
  // -------------------------------------------------------------------------

  /**
   * Enter a decision
   */
  async enterDecision(protestId: string, hearingId: string | null, decision: DecisionFormData): Promise<Decision> {
    const { data: user } = await supabase.auth.getUser();
    
    // Calculate appeal deadline (typically 24 hours)
    const appealDeadline = new Date();
    appealDeadline.setHours(appealDeadline.getHours() + 24);

    const { data, error } = await supabase
      .from('protest_decisions')
      .insert({
        protest_id: protestId,
        hearing_id: hearingId,
        ...decision,
        is_appealable: true,
        appeal_deadline: appealDeadline.toISOString(),
        decided_by: user.user?.id,
        decided_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // The database trigger will auto-apply penalties
    return data;
  }

  /**
   * Get decision for a protest
   */
  async getProtestDecision(protestId: string): Promise<Decision | null> {
    const { data, error } = await supabase
      .from('protest_decisions')
      .select('*')
      .eq('protest_id', protestId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  /**
   * Sign a decision (chair approval)
   */
  async signDecision(decisionId: string): Promise<void> {
    const { error } = await supabase
      .from('protest_decisions')
      .update({
        signed_by_chair: true,
        signed_at: new Date().toISOString(),
      })
      .eq('id', decisionId);

    if (error) throw error;
  }

  // -------------------------------------------------------------------------
  // HEARING ROOMS
  // -------------------------------------------------------------------------

  /**
   * Get hearing rooms for a regatta
   */
  async getHearingRooms(regattaId: string): Promise<HearingRoom[]> {
    const { data, error } = await supabase
      .from('hearing_rooms')
      .select('*')
      .eq('regatta_id', regattaId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Add a hearing room
   */
  async addHearingRoom(room: Omit<HearingRoom, 'id'>): Promise<HearingRoom> {
    const { data, error } = await supabase
      .from('hearing_rooms')
      .insert(room)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // -------------------------------------------------------------------------
  // DOCUMENT GENERATION
  // -------------------------------------------------------------------------

  /**
   * Generate decision document content
   */
  generateDecisionDocument(protest: Protest, decision: Decision, panel: PanelMember[]): string {
    const chairName = panel.find(p => p.role === 'chair')?.name || 'Unknown';
    const memberNames = panel.filter(p => p.role === 'member').map(p => p.name).join(', ');

    return `
PROTEST DECISION
================

Protest Number: ${protest.protest_number}
Race: ${protest.race_number}
Date: ${new Date().toLocaleDateString()}

PROTEST COMMITTEE
-----------------
Chair: ${chairName}
Members: ${memberNames}

PARTIES
-------
Protestor: ${protest.protestor_entry?.sail_number || 'Race Committee'}
Protestee: ${protest.protestee_entry_ids?.join(', ') || 'N/A'}

INCIDENT
--------
Time: ${protest.incident_time ? new Date(protest.incident_time).toLocaleTimeString() : 'Not specified'}
Location: ${protest.incident_location || 'Not specified'}
Rule Alleged: ${protest.rule_infringed || 'Not specified'}

FACTS FOUND
-----------
${decision.facts_found}

CONCLUSIONS
-----------
${decision.conclusions}

RULES APPLIED
-------------
${decision.rules_applied.join(', ')}

DECISION
--------
${this.formatDecisionType(decision.decision_type)}

${decision.penalty_type && decision.penalty_type !== 'none' ? `
PENALTY
-------
${decision.penalty_type.toUpperCase()}
${decision.penalty_details || ''}
` : ''}

${decision.is_appealable ? `
APPEAL
------
This decision may be appealed within 24 hours.
Appeal Deadline: ${decision.appeal_deadline ? new Date(decision.appeal_deadline).toLocaleString() : 'N/A'}
` : 'This decision is not appealable.'}

Signed: ________________________
        ${chairName}, Protest Committee Chair
        ${decision.signed_at ? new Date(decision.signed_at).toLocaleString() : ''}
`.trim();
  }

  private formatDecisionType(type: DecisionType): string {
    const labels: Record<DecisionType, string> = {
      protest_upheld: 'PROTEST UPHELD',
      protest_dismissed: 'PROTEST DISMISSED',
      protest_withdrawn: 'PROTEST WITHDRAWN',
      no_protest_valid: 'NO VALID PROTEST',
      redress_granted: 'REDRESS GRANTED',
      redress_denied: 'REDRESS DENIED',
      request_withdrawn: 'REQUEST WITHDRAWN',
      measurement_failed: 'FAILED MEASUREMENT',
      measurement_passed: 'PASSED MEASUREMENT',
    };
    return labels[type] || type;
  }

  // -------------------------------------------------------------------------
  // STATISTICS
  // -------------------------------------------------------------------------

  /**
   * Get protest statistics for a regatta
   */
  async getRegattaProtestStats(regattaId: string): Promise<{
    total: number;
    byStatus: Record<ProtestStatus, number>;
    byType: Record<ProtestType, number>;
    pendingHearings: number;
    completedHearings: number;
  }> {
    const { data: protests } = await supabase
      .from('race_protests')
      .select('status, protest_type')
      .eq('regatta_id', regattaId);

    const { data: hearings } = await supabase
      .from('protest_hearings')
      .select('status')
      .eq('regatta_id', regattaId);

    const byStatus: Record<ProtestStatus, number> = {
      filed: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
      heard: 0,
      decided: 0,
      appealed: 0,
    };

    const byType: Record<ProtestType, number> = {
      boat_vs_boat: 0,
      boat_vs_rc: 0,
      rc_vs_boat: 0,
      redress_request: 0,
      equipment_inspection: 0,
      measurement: 0,
    };

    (protests || []).forEach(p => {
      byStatus[p.status as ProtestStatus]++;
      byType[p.protest_type as ProtestType]++;
    });

    const pendingHearings = (hearings || []).filter(
      h => h.status === 'scheduled' || h.status === 'in_progress'
    ).length;

    const completedHearings = (hearings || []).filter(
      h => h.status === 'completed'
    ).length;

    return {
      total: protests?.length || 0,
      byStatus,
      byType,
      pendingHearings,
      completedHearings,
    };
  }
}

// Export singleton
export const protestService = new ProtestService();
export default ProtestService;

