/**
 * Time Limit Service
 * RRS-compliant race time limit tracking with auto-DNF
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type TimeLimitStatus = 
  | 'pending'
  | 'racing'
  | 'first_finished'
  | 'time_expired'
  | 'window_expired'
  | 'completed';

export interface TimeLimit {
  id: string;
  regatta_id: string;
  race_number: number;
  fleet_id?: string;
  
  // Configuration
  race_time_limit_minutes?: number;
  first_mark_limit_minutes?: number;
  finishing_window_minutes: number;
  
  // Actual times
  race_start_time?: string;
  first_mark_time?: string;
  first_finish_time?: string;
  
  // Calculated deadlines
  race_time_deadline?: string;
  first_mark_deadline?: string;
  finishing_deadline?: string;
  
  // Status
  status: TimeLimitStatus;
  warning_sent_at?: string;
  one_minute_warning_at?: string;
  limit_expired_at?: string;
  
  // Auto-DNF
  auto_dnf_enabled: boolean;
  auto_dnf_applied_at?: string;
  boats_dnf_count: number;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveTimeLimit extends TimeLimit {
  regatta_name?: string;
  fleet_name?: string;
  minutes_remaining?: number;
  current_deadline?: string;
  boats_finished: number;
  boats_still_racing: number;
}

export interface TimeLimitTemplate {
  id: string;
  club_id?: string;
  name: string;
  description?: string;
  race_time_limit_minutes?: number;
  first_mark_limit_minutes?: number;
  finishing_window_minutes: number;
  auto_dnf_enabled: boolean;
  race_type?: string;
  is_default: boolean;
}

export interface TimeLimitConfig {
  race_time_limit_minutes?: number;
  first_mark_limit_minutes?: number;
  finishing_window_minutes?: number;
  auto_dnf_enabled?: boolean;
}

export interface TimeLimitAlert {
  type: 'warning' | 'one_minute' | 'expired';
  timeLimit: ActiveTimeLimit;
  message: string;
}

// ============================================================================
// TIME LIMIT SERVICE CLASS
// ============================================================================

class TimeLimitService {
  private alertCallbacks: ((alert: TimeLimitAlert) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  // -------------------------------------------------------------------------
  // TIME LIMIT MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Create a time limit for a race
   */
  async createTimeLimit(
    regattaId: string,
    raceNumber: number,
    config: TimeLimitConfig,
    fleetId?: string
  ): Promise<TimeLimit> {
    const { data, error } = await supabase
      .from('race_time_limits')
      .insert({
        regatta_id: regattaId,
        race_number: raceNumber,
        fleet_id: fleetId,
        race_time_limit_minutes: config.race_time_limit_minutes,
        first_mark_limit_minutes: config.first_mark_limit_minutes,
        finishing_window_minutes: config.finishing_window_minutes ?? 30,
        auto_dnf_enabled: config.auto_dnf_enabled ?? true,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create time limit from template
   */
  async createFromTemplate(
    templateId: string,
    regattaId: string,
    raceNumber: number,
    fleetId?: string
  ): Promise<TimeLimit> {
    const { data: template, error: templateError } = await supabase
      .from('time_limit_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    return this.createTimeLimit(regattaId, raceNumber, {
      race_time_limit_minutes: template.race_time_limit_minutes,
      first_mark_limit_minutes: template.first_mark_limit_minutes,
      finishing_window_minutes: template.finishing_window_minutes,
      auto_dnf_enabled: template.auto_dnf_enabled,
    }, fleetId);
  }

  /**
   * Update time limit configuration
   */
  async updateTimeLimit(
    timeLimitId: string,
    updates: Partial<TimeLimitConfig>
  ): Promise<TimeLimit> {
    const { data, error } = await supabase
      .from('race_time_limits')
      .update(updates)
      .eq('id', timeLimitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get time limit for a race
   */
  async getTimeLimit(
    regattaId: string,
    raceNumber: number,
    fleetId?: string
  ): Promise<TimeLimit | null> {
    let query = supabase
      .from('race_time_limits')
      .select('*')
      .eq('regatta_id', regattaId)
      .eq('race_number', raceNumber);

    if (fleetId) {
      query = query.eq('fleet_id', fleetId);
    } else {
      query = query.is('fleet_id', null);
    }

    const { data, error } = await query.single();
    if (error) return null;
    return data;
  }

  /**
   * Get time limit by ID
   */
  async getTimeLimitById(id: string): Promise<TimeLimit | null> {
    const { data, error } = await supabase
      .from('race_time_limits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all active time limits for a regatta
   */
  async getActiveTimeLimits(regattaId: string): Promise<ActiveTimeLimit[]> {
    const { data, error } = await supabase
      .from('active_time_limits')
      .select('*')
      .eq('regatta_id', regattaId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all time limits for a regatta
   */
  async getAllTimeLimits(regattaId: string): Promise<TimeLimit[]> {
    const { data, error } = await supabase
      .from('race_time_limits')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('race_number');

    if (error) throw error;
    return data || [];
  }

  // -------------------------------------------------------------------------
  // RACE EVENTS
  // -------------------------------------------------------------------------

  /**
   * Record race start - starts the time limit countdown
   */
  async recordRaceStart(
    timeLimitId: string,
    startTime?: Date
  ): Promise<TimeLimit> {
    const time = startTime || new Date();
    
    const { data, error } = await supabase
      .from('race_time_limits')
      .update({
        race_start_time: time.toISOString(),
        status: 'racing',
      })
      .eq('id', timeLimitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Record first mark rounding
   */
  async recordFirstMark(
    timeLimitId: string,
    markTime?: Date
  ): Promise<TimeLimit> {
    const time = markTime || new Date();
    
    const { data, error } = await supabase
      .from('race_time_limits')
      .update({
        first_mark_time: time.toISOString(),
      })
      .eq('id', timeLimitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Record first finish - starts finishing window countdown
   */
  async recordFirstFinish(
    timeLimitId: string,
    finishTime?: Date
  ): Promise<TimeLimit> {
    const time = finishTime || new Date();
    
    const { data, error } = await supabase
      .from('race_time_limits')
      .update({
        first_finish_time: time.toISOString(),
        status: 'first_finished',
      })
      .eq('id', timeLimitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Manually expire the time limit
   */
  async expireTimeLimit(timeLimitId: string): Promise<TimeLimit> {
    const timeLimit = await this.getTimeLimitById(timeLimitId);
    if (!timeLimit) throw new Error('Time limit not found');

    const newStatus = timeLimit.first_finish_time ? 'window_expired' : 'time_expired';

    const { data, error } = await supabase
      .from('race_time_limits')
      .update({
        status: newStatus,
        limit_expired_at: new Date().toISOString(),
      })
      .eq('id', timeLimitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark time limit as completed
   */
  async completeTimeLimit(timeLimitId: string): Promise<TimeLimit> {
    const { data, error } = await supabase
      .from('race_time_limits')
      .update({
        status: 'completed',
      })
      .eq('id', timeLimitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // -------------------------------------------------------------------------
  // AUTO-DNF
  // -------------------------------------------------------------------------

  /**
   * Apply auto-DNF to unfinished boats
   */
  async applyAutoDNF(timeLimitId: string): Promise<number> {
    const { data, error } = await supabase.rpc('auto_dnf_unfinished_boats', {
      p_time_limit_id: timeLimitId,
    });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Toggle auto-DNF setting
   */
  async setAutoDNF(timeLimitId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('race_time_limits')
      .update({ auto_dnf_enabled: enabled })
      .eq('id', timeLimitId);

    if (error) throw error;
  }

  // -------------------------------------------------------------------------
  // REAL-TIME MONITORING
  // -------------------------------------------------------------------------

  /**
   * Calculate time remaining for a time limit
   */
  calculateTimeRemaining(timeLimit: TimeLimit): {
    minutes: number;
    seconds: number;
    isExpired: boolean;
    deadline: Date | null;
  } {
    let deadline: Date | null = null;

    if (timeLimit.status === 'racing' && timeLimit.race_time_deadline) {
      deadline = new Date(timeLimit.race_time_deadline);
    } else if (timeLimit.status === 'first_finished' && timeLimit.finishing_deadline) {
      deadline = new Date(timeLimit.finishing_deadline);
    }

    if (!deadline) {
      return { minutes: 0, seconds: 0, isExpired: false, deadline: null };
    }

    const now = new Date();
    const remainingMs = deadline.getTime() - now.getTime();
    const isExpired = remainingMs <= 0;

    if (isExpired) {
      return { minutes: 0, seconds: 0, isExpired: true, deadline };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return { minutes, seconds, isExpired, deadline };
  }

  /**
   * Check if warning should be sent
   */
  shouldSendWarning(
    timeLimit: TimeLimit,
    warningMinutes: number = 5
  ): boolean {
    if (timeLimit.warning_sent_at) return false;
    
    const remaining = this.calculateTimeRemaining(timeLimit);
    return remaining.minutes <= warningMinutes && remaining.minutes > 1;
  }

  /**
   * Check if one-minute warning should be sent
   */
  shouldSendOneMinuteWarning(timeLimit: TimeLimit): boolean {
    if (timeLimit.one_minute_warning_at) return false;
    
    const remaining = this.calculateTimeRemaining(timeLimit);
    return remaining.minutes <= 1 && !remaining.isExpired;
  }

  /**
   * Record that warning was sent
   */
  async recordWarningSent(
    timeLimitId: string,
    type: 'warning' | 'one_minute'
  ): Promise<void> {
    const update = type === 'warning'
      ? { warning_sent_at: new Date().toISOString() }
      : { one_minute_warning_at: new Date().toISOString() };

    const { error } = await supabase
      .from('race_time_limits')
      .update(update)
      .eq('id', timeLimitId);

    if (error) throw error;
  }

  /**
   * Start monitoring time limits for a regatta
   */
  startMonitoring(
    regattaId: string,
    onAlert: (alert: TimeLimitAlert) => void,
    checkIntervalMs: number = 10000
  ): void {
    this.alertCallbacks.push(onAlert);

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        const activeLimits = await this.getActiveTimeLimits(regattaId);
        
        for (const limit of activeLimits) {
          // Check for 5-minute warning
          if (this.shouldSendWarning(limit as TimeLimit)) {
            await this.recordWarningSent(limit.id, 'warning');
            this.emitAlert({
              type: 'warning',
              timeLimit: limit,
              message: `Race ${limit.race_number}: 5 minutes remaining!`,
            });
          }

          // Check for 1-minute warning
          if (this.shouldSendOneMinuteWarning(limit as TimeLimit)) {
            await this.recordWarningSent(limit.id, 'one_minute');
            this.emitAlert({
              type: 'one_minute',
              timeLimit: limit,
              message: `Race ${limit.race_number}: 1 minute remaining!`,
            });
          }

          // Check for expiration
          const remaining = this.calculateTimeRemaining(limit as TimeLimit);
          if (remaining.isExpired && !limit.limit_expired_at) {
            await this.expireTimeLimit(limit.id);
            this.emitAlert({
              type: 'expired',
              timeLimit: limit,
              message: `Race ${limit.race_number}: Time limit expired!`,
            });

            // Auto-DNF if enabled
            if (limit.auto_dnf_enabled) {
              const dnfCount = await this.applyAutoDNF(limit.id);
              if (dnfCount > 0) {
                this.emitAlert({
                  type: 'expired',
                  timeLimit: limit,
                  message: `Race ${limit.race_number}: ${dnfCount} boat(s) marked DNF`,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking time limits:', error);
      }
    }, checkIntervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.alertCallbacks = [];
  }

  private emitAlert(alert: TimeLimitAlert): void {
    for (const callback of this.alertCallbacks) {
      callback(alert);
    }
  }

  // -------------------------------------------------------------------------
  // TEMPLATES
  // -------------------------------------------------------------------------

  /**
   * Get available templates
   */
  async getTemplates(clubId?: string): Promise<TimeLimitTemplate[]> {
    let query = supabase
      .from('time_limit_templates')
      .select('*')
      .order('is_default', { ascending: false });

    if (clubId) {
      query = query.or(`club_id.eq.${clubId},club_id.is.null`);
    } else {
      query = query.is('club_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Create custom template
   */
  async createTemplate(
    clubId: string,
    name: string,
    config: TimeLimitConfig & { description?: string; race_type?: string }
  ): Promise<TimeLimitTemplate> {
    const { data, error } = await supabase
      .from('time_limit_templates')
      .insert({
        club_id: clubId,
        name,
        description: config.description,
        race_time_limit_minutes: config.race_time_limit_minutes,
        first_mark_limit_minutes: config.first_mark_limit_minutes,
        finishing_window_minutes: config.finishing_window_minutes ?? 30,
        auto_dnf_enabled: config.auto_dnf_enabled ?? true,
        race_type: config.race_type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  /**
   * Format time remaining for display
   */
  formatTimeRemaining(minutes: number, seconds: number): string {
    const m = String(Math.floor(minutes)).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * Get status display info
   */
  getStatusInfo(status: TimeLimitStatus): {
    label: string;
    color: string;
    bgColor: string;
  } {
    const statusMap: Record<TimeLimitStatus, { label: string; color: string; bgColor: string }> = {
      pending: { label: 'Pending', color: '#6B7280', bgColor: '#F3F4F6' },
      racing: { label: 'Racing', color: '#059669', bgColor: '#D1FAE5' },
      first_finished: { label: 'Finishing', color: '#D97706', bgColor: '#FEF3C7' },
      time_expired: { label: 'Expired', color: '#DC2626', bgColor: '#FEE2E2' },
      window_expired: { label: 'Window Closed', color: '#DC2626', bgColor: '#FEE2E2' },
      completed: { label: 'Complete', color: '#6B7280', bgColor: '#F3F4F6' },
    };
    return statusMap[status];
  }
}

// Export singleton
export const timeLimitService = new TimeLimitService();
export default TimeLimitService;

