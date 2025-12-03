/**
 * Start Scheduler Service
 * Multi-class rolling start sequence management
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type SequenceType = '5-4-1-go' | '3-2-1-go' | '5-1-go' | 'custom';
export type ScheduleStatus = 'draft' | 'ready' | 'in_progress' | 'completed' | 'abandoned';
export type FleetStartStatus = 
  | 'pending'
  | 'warning'
  | 'preparatory'
  | 'one_minute'
  | 'started'
  | 'general_recall'
  | 'individual_recall'
  | 'postponed'
  | 'abandoned';

export interface StartSchedule {
  id: string;
  regatta_id: string;
  name: string;
  scheduled_date: string;
  start_interval_minutes: number;
  sequence_type: SequenceType;
  warning_minutes?: number;
  preparatory_minutes?: number;
  one_minute_signal: boolean;
  first_warning_time?: string;
  actual_first_warning?: string;
  status: ScheduleStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FleetStartEntry {
  id: string;
  schedule_id: string;
  fleet_id?: string;
  fleet_name: string;
  class_flag?: string;
  start_order: number;
  race_number: number;
  planned_warning_time?: string;
  planned_prep_time?: string;
  planned_start_time?: string;
  actual_warning_time?: string;
  actual_prep_time?: string;
  actual_start_time?: string;
  status: FleetStartStatus;
  recall_count: number;
  last_recall_at?: string;
  recall_notes?: string;
  custom_interval_minutes?: number;
  start_sequence_id?: string;
  time_limit_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleStatusSummary {
  schedule_id: string;
  regatta_id: string;
  schedule_name: string;
  scheduled_date: string;
  schedule_status: ScheduleStatus;
  first_warning_time?: string;
  start_interval_minutes: number;
  sequence_type: SequenceType;
  total_fleets: number;
  fleets_started: number;
  fleets_pending: number;
  fleets_in_sequence: number;
  fleets_recalled: number;
  next_warning_time?: string;
  next_fleet?: string;
}

export interface TimelineEntry extends FleetStartEntry {
  regatta_id: string;
  schedule_name: string;
  effective_warning_time?: string;
  effective_start_time?: string;
  timeline_status: 'pending' | 'upcoming' | 'active' | 'completed' | string;
}

export interface CreateScheduleInput {
  regatta_id: string;
  name: string;
  scheduled_date: string;
  start_interval_minutes?: number;
  sequence_type?: SequenceType;
  first_warning_time?: string;
  warning_minutes?: number;
  preparatory_minutes?: number;
  notes?: string;
}

export interface FleetEntry {
  fleet_id?: string;
  fleet_name: string;
  class_flag?: string;
  race_number: number;
  custom_interval_minutes?: number;
}

// ============================================================================
// START SCHEDULER SERVICE CLASS
// ============================================================================

class StartSchedulerService {
  private countdownCallbacks: Map<string, (data: CountdownData) => void> = new Map();
  private countdownInterval: NodeJS.Timeout | null = null;

  // -------------------------------------------------------------------------
  // SCHEDULE MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Create a new start schedule
   */
  async createSchedule(input: CreateScheduleInput): Promise<StartSchedule> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('race_start_schedules')
      .insert({
        regatta_id: input.regatta_id,
        name: input.name,
        scheduled_date: input.scheduled_date,
        start_interval_minutes: input.start_interval_minutes ?? 5,
        sequence_type: input.sequence_type ?? '5-4-1-go',
        first_warning_time: input.first_warning_time,
        warning_minutes: input.warning_minutes,
        preparatory_minutes: input.preparatory_minutes,
        notes: input.notes,
        status: 'draft',
        created_by: user.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<CreateScheduleInput>
  ): Promise<StartSchedule> {
    const { data, error } = await supabase
      .from('race_start_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('race_start_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
  }

  /**
   * Get a schedule by ID
   */
  async getSchedule(scheduleId: string): Promise<StartSchedule | null> {
    const { data, error } = await supabase
      .from('race_start_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all schedules for a regatta
   */
  async getSchedules(regattaId: string): Promise<StartSchedule[]> {
    const { data, error } = await supabase
      .from('race_start_schedules')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get schedule status summary
   */
  async getScheduleStatus(scheduleId: string): Promise<ScheduleStatusSummary | null> {
    const { data, error } = await supabase
      .from('schedule_status')
      .select('*')
      .eq('schedule_id', scheduleId)
      .single();

    if (error) return null;
    return data;
  }

  // -------------------------------------------------------------------------
  // FLEET ENTRIES
  // -------------------------------------------------------------------------

  /**
   * Add fleets to a schedule
   */
  async addFleets(
    scheduleId: string,
    fleets: FleetEntry[]
  ): Promise<FleetStartEntry[]> {
    // Get current max order
    const { data: existing } = await supabase
      .from('fleet_start_entries')
      .select('start_order')
      .eq('schedule_id', scheduleId)
      .order('start_order', { ascending: false })
      .limit(1);

    let startOrder = (existing?.[0]?.start_order ?? 0) + 1;

    const entries = fleets.map((fleet, index) => ({
      schedule_id: scheduleId,
      fleet_id: fleet.fleet_id,
      fleet_name: fleet.fleet_name,
      class_flag: fleet.class_flag,
      race_number: fleet.race_number,
      start_order: startOrder + index,
      custom_interval_minutes: fleet.custom_interval_minutes,
      status: 'pending',
    }));

    const { data, error } = await supabase
      .from('fleet_start_entries')
      .insert(entries)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Remove a fleet from schedule
   */
  async removeFleet(fleetEntryId: string): Promise<void> {
    const { data: entry } = await supabase
      .from('fleet_start_entries')
      .select('schedule_id, start_order')
      .eq('id', fleetEntryId)
      .single();

    if (!entry) throw new Error('Fleet entry not found');

    // Delete the entry
    const { error: deleteError } = await supabase
      .from('fleet_start_entries')
      .delete()
      .eq('id', fleetEntryId);

    if (deleteError) throw deleteError;

    // Reorder remaining fleets
    const { data: remaining, error: fetchError } = await supabase
      .from('fleet_start_entries')
      .select('id, start_order')
      .eq('schedule_id', entry.schedule_id)
      .gt('start_order', entry.start_order)
      .order('start_order');

    if (fetchError) throw fetchError;

    // Update orders
    for (const fleet of remaining || []) {
      await supabase
        .from('fleet_start_entries')
        .update({ start_order: fleet.start_order - 1 })
        .eq('id', fleet.id);
    }
  }

  /**
   * Reorder fleets
   */
  async reorderFleets(
    scheduleId: string,
    fleetIds: string[]
  ): Promise<FleetStartEntry[]> {
    // Update each fleet with new order
    const updates = fleetIds.map((id, index) =>
      supabase
        .from('fleet_start_entries')
        .update({ start_order: index + 1 })
        .eq('id', id)
        .eq('schedule_id', scheduleId)
    );

    await Promise.all(updates);

    // Return updated entries
    return this.getFleetEntries(scheduleId);
  }

  /**
   * Get fleet entries for a schedule
   */
  async getFleetEntries(scheduleId: string): Promise<FleetStartEntry[]> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('start_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get timeline view
   */
  async getTimeline(scheduleId: string): Promise<TimelineEntry[]> {
    const { data, error } = await supabase
      .from('start_timeline')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('start_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update fleet entry
   */
  async updateFleetEntry(
    entryId: string,
    updates: Partial<FleetEntry & { class_flag: string }>
  ): Promise<FleetStartEntry> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // -------------------------------------------------------------------------
  // START SEQUENCE CONTROL
  // -------------------------------------------------------------------------

  /**
   * Mark schedule as ready
   */
  async markReady(scheduleId: string): Promise<StartSchedule> {
    const { data, error } = await supabase
      .from('race_start_schedules')
      .update({ status: 'ready' })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Start the sequence (begin first fleet warning)
   */
  async startSequence(scheduleId: string): Promise<FleetStartEntry> {
    // Update schedule status
    await supabase
      .from('race_start_schedules')
      .update({
        status: 'in_progress',
        actual_first_warning: new Date().toISOString(),
      })
      .eq('id', scheduleId);

    // Get first pending fleet
    const { data: firstFleet, error } = await supabase
      .from('fleet_start_entries')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('status', 'pending')
      .order('start_order')
      .limit(1)
      .single();

    if (error) throw error;

    // Signal warning
    return this.signalWarning(firstFleet.id);
  }

  /**
   * Signal warning for a fleet
   */
  async signalWarning(fleetEntryId: string): Promise<FleetStartEntry> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'warning',
        actual_warning_time: new Date().toISOString(),
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log to committee boat log
    await this.logToCommitteeLog(data, 'warning');

    return data;
  }

  /**
   * Signal preparatory for a fleet
   */
  async signalPreparatory(fleetEntryId: string): Promise<FleetStartEntry> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'preparatory',
        actual_prep_time: new Date().toISOString(),
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log to committee boat log
    await this.logToCommitteeLog(data, 'preparatory');

    return data;
  }

  /**
   * Signal one minute
   */
  async signalOneMinute(fleetEntryId: string): Promise<FleetStartEntry> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'one_minute',
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log to committee boat log
    await this.logToCommitteeLog(data, 'one_minute');

    return data;
  }

  /**
   * Signal start for a fleet
   */
  async signalStart(fleetEntryId: string): Promise<FleetStartEntry> {
    const entry = await this.getFleetEntry(fleetEntryId);
    if (!entry) throw new Error('Fleet entry not found');

    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'started',
        actual_start_time: new Date().toISOString(),
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log to committee boat log
    await this.logToCommitteeLog(data, 'start');

    // Check if this was the last fleet
    await this.checkScheduleComplete(entry.schedule_id);

    // Auto-start next fleet warning if applicable
    await this.autoAdvanceNextFleet(entry.schedule_id);

    return data;
  }

  /**
   * Get a single fleet entry
   */
  async getFleetEntry(entryId: string): Promise<FleetStartEntry | null> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Handle general recall - moves fleet to end of sequence
   */
  async generalRecall(fleetEntryId: string, notes?: string): Promise<void> {
    const { error } = await supabase.rpc('handle_general_recall', {
      p_fleet_entry_id: fleetEntryId,
      p_notes: notes,
    });

    if (error) throw error;
  }

  /**
   * Handle individual recall (race continues)
   */
  async individualRecall(
    fleetEntryId: string,
    boatIdentifiers: string[]
  ): Promise<FleetStartEntry> {
    const entry = await this.getFleetEntry(fleetEntryId);
    if (!entry) throw new Error('Fleet entry not found');

    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'individual_recall',
        recall_notes: `Individual recall: ${boatIdentifiers.join(', ')}`,
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log to committee boat log
    const { data: schedule } = await supabase
      .from('race_start_schedules')
      .select('regatta_id')
      .eq('id', entry.schedule_id)
      .single();

    if (schedule) {
      await supabase.from('committee_boat_log').insert({
        regatta_id: schedule.regatta_id,
        race_number: entry.race_number,
        log_time: new Date().toISOString(),
        category: 'signal',
        event_type: 'individual_recall',
        title: `Individual Recall: ${entry.fleet_name}`,
        description: `Individual recall for boats: ${boatIdentifiers.join(', ')}`,
        flags_displayed: ['X'],
        sound_signals: 1,
        is_auto_logged: true,
        auto_log_source: 'start_scheduler',
      });
    }

    return data;
  }

  /**
   * Postpone a fleet start
   */
  async postponeFleet(fleetEntryId: string, reason?: string): Promise<FleetStartEntry> {
    const entry = await this.getFleetEntry(fleetEntryId);
    if (!entry) throw new Error('Fleet entry not found');

    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'postponed',
        actual_warning_time: null,
        actual_prep_time: null,
        actual_start_time: null,
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log to committee boat log
    await this.logToCommitteeLog(data, 'postponed', reason);

    return data;
  }

  /**
   * Abandon a fleet start
   */
  async abandonFleet(fleetEntryId: string, reason?: string): Promise<FleetStartEntry> {
    const { data, error } = await supabase
      .from('fleet_start_entries')
      .update({
        status: 'abandoned',
      })
      .eq('id', fleetEntryId)
      .select()
      .single();

    if (error) throw error;

    await this.logToCommitteeLog(data, 'abandoned', reason);

    return data;
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  private async checkScheduleComplete(scheduleId: string): Promise<void> {
    const { data: pending } = await supabase
      .from('fleet_start_entries')
      .select('id')
      .eq('schedule_id', scheduleId)
      .neq('status', 'started')
      .neq('status', 'abandoned')
      .limit(1);

    if (!pending || pending.length === 0) {
      await supabase
        .from('race_start_schedules')
        .update({ status: 'completed' })
        .eq('id', scheduleId);
    }
  }

  private async autoAdvanceNextFleet(scheduleId: string): Promise<void> {
    // Get schedule settings
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) return;

    // Get next pending fleet
    const { data: nextFleet } = await supabase
      .from('fleet_start_entries')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('status', 'pending')
      .order('start_order')
      .limit(1)
      .single();

    // If there's a next fleet and we're using rolling starts,
    // the warning for next fleet happens at current fleet's start
    if (nextFleet) {
      // Auto-signal warning for next fleet
      await this.signalWarning(nextFleet.id);
    }
  }

  private async logToCommitteeLog(
    entry: FleetStartEntry,
    eventType: string,
    notes?: string
  ): Promise<void> {
    const { data: schedule } = await supabase
      .from('race_start_schedules')
      .select('regatta_id')
      .eq('id', entry.schedule_id)
      .single();

    if (!schedule) return;

    const eventConfig: Record<string, {
      title: string;
      flags?: string[];
      signals: number;
    }> = {
      warning: {
        title: `Warning Signal: ${entry.fleet_name}`,
        flags: [entry.class_flag || 'Class'],
        signals: 1,
      },
      preparatory: {
        title: `Preparatory Signal: ${entry.fleet_name}`,
        flags: ['P'],
        signals: 1,
      },
      one_minute: {
        title: `One Minute: ${entry.fleet_name}`,
        flags: [],
        signals: 0,
      },
      start: {
        title: `Race Start: ${entry.fleet_name}`,
        flags: [],
        signals: 1,
      },
      postponed: {
        title: `Postponed: ${entry.fleet_name}`,
        flags: ['AP'],
        signals: 2,
      },
      abandoned: {
        title: `Abandoned: ${entry.fleet_name}`,
        flags: ['N'],
        signals: 3,
      },
    };

    const config = eventConfig[eventType];
    if (!config) return;

    await supabase.from('committee_boat_log').insert({
      regatta_id: schedule.regatta_id,
      race_number: entry.race_number,
      log_time: new Date().toISOString(),
      category: eventType === 'start' ? 'timing' : 'signal',
      event_type: eventType,
      title: config.title,
      description: notes || `Race ${entry.race_number} - ${entry.fleet_name}`,
      flags_displayed: config.flags,
      sound_signals: config.signals,
      is_auto_logged: true,
      auto_log_source: 'start_scheduler',
    });
  }

  // -------------------------------------------------------------------------
  // SEQUENCE TIMING HELPERS
  // -------------------------------------------------------------------------

  /**
   * Get sequence intervals based on type
   */
  getSequenceIntervals(type: SequenceType, custom?: {
    warning?: number;
    preparatory?: number;
  }): { warning: number; preparatory: number; oneMinute: boolean } {
    const sequences: Record<SequenceType, { warning: number; preparatory: number; oneMinute: boolean }> = {
      '5-4-1-go': { warning: 5, preparatory: 4, oneMinute: true },
      '3-2-1-go': { warning: 3, preparatory: 2, oneMinute: true },
      '5-1-go': { warning: 5, preparatory: 0, oneMinute: true },
      'custom': {
        warning: custom?.warning ?? 5,
        preparatory: custom?.preparatory ?? 4,
        oneMinute: true,
      },
    };
    return sequences[type];
  }

  /**
   * Calculate countdown for current fleet
   */
  calculateCountdown(entry: FleetStartEntry, sequenceType: SequenceType): {
    phase: 'warning' | 'preparatory' | 'final' | 'start';
    secondsRemaining: number;
    totalSeconds: number;
  } | null {
    const intervals = this.getSequenceIntervals(sequenceType);
    const now = Date.now();

    if (!entry.actual_warning_time) {
      return null;
    }

    const warningTime = new Date(entry.actual_warning_time).getTime();
    const elapsedSeconds = Math.floor((now - warningTime) / 1000);
    const totalSeconds = intervals.warning * 60;

    if (elapsedSeconds >= totalSeconds) {
      return { phase: 'start', secondsRemaining: 0, totalSeconds };
    }

    const secondsRemaining = totalSeconds - elapsedSeconds;

    // Determine phase
    let phase: 'warning' | 'preparatory' | 'final' | 'start' = 'warning';
    if (intervals.preparatory > 0 && secondsRemaining <= intervals.preparatory * 60) {
      phase = 'preparatory';
    }
    if (secondsRemaining <= 60) {
      phase = 'final';
    }

    return { phase, secondsRemaining, totalSeconds };
  }

  /**
   * Get status color and label
   */
  getStatusDisplay(status: FleetStartStatus): {
    label: string;
    color: string;
    bgColor: string;
  } {
    const displays: Record<FleetStartStatus, { label: string; color: string; bgColor: string }> = {
      pending: { label: 'Pending', color: '#6B7280', bgColor: '#F3F4F6' },
      warning: { label: 'Warning', color: '#D97706', bgColor: '#FEF3C7' },
      preparatory: { label: 'Prep', color: '#2563EB', bgColor: '#DBEAFE' },
      one_minute: { label: '1 Minute', color: '#DC2626', bgColor: '#FEE2E2' },
      started: { label: 'Started', color: '#059669', bgColor: '#D1FAE5' },
      general_recall: { label: 'Recall', color: '#DC2626', bgColor: '#FEE2E2' },
      individual_recall: { label: 'Ind. Recall', color: '#F59E0B', bgColor: '#FEF3C7' },
      postponed: { label: 'Postponed', color: '#6B7280', bgColor: '#F3F4F6' },
      abandoned: { label: 'Abandoned', color: '#DC2626', bgColor: '#FEE2E2' },
    };
    return displays[status];
  }
}

// Countdown data for real-time updates
interface CountdownData {
  fleetEntryId: string;
  phase: string;
  secondsRemaining: number;
  totalSeconds: number;
}

// Export singleton
export const startSchedulerService = new StartSchedulerService();
export default StartSchedulerService;

