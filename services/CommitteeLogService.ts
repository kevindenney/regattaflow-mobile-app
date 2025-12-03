/**
 * Committee Boat Log Service
 * Manages official race event logging for documentation and appeals
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type LogCategory = 
  | 'signal'
  | 'course'
  | 'weather'
  | 'incident'
  | 'protest'
  | 'safety'
  | 'announcement'
  | 'timing'
  | 'penalty'
  | 'equipment'
  | 'committee'
  | 'general';

export interface LogEntry {
  id: string;
  regatta_id: string;
  race_number?: number;
  entry_number: number;
  log_time: string;
  recorded_at: string;
  category: LogCategory;
  event_type?: string;
  title: string;
  description?: string;
  flags_displayed?: string[];
  sound_signals?: number;
  related_entry_ids?: string[];
  related_protest_id?: string;
  related_start_sequence_id?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  wind_direction?: number;
  wind_speed?: number;
  weather_notes?: string;
  photo_urls?: string[];
  document_urls?: string[];
  logged_by?: string;
  logged_by_name?: string;
  logged_by_role?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  is_auto_logged: boolean;
  auto_log_source?: string;
  is_deleted: boolean;
}

export interface LogEntryInput {
  regatta_id: string;
  race_number?: number;
  log_time?: Date;
  category: LogCategory;
  event_type?: string;
  title: string;
  description?: string;
  flags_displayed?: string[];
  sound_signals?: number;
  related_entry_ids?: string[];
  related_protest_id?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  wind_direction?: number;
  wind_speed?: number;
  weather_notes?: string;
  photo_urls?: string[];
}

export interface LogTemplate {
  id: string;
  club_id?: string;
  name: string;
  category: LogCategory;
  event_type?: string;
  title_template: string;
  description_template?: string;
  flags_displayed?: string[];
  sound_signals?: number;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
}

export interface DailySummary {
  regatta_id: string;
  log_date: string;
  total_entries: number;
  signal_count: number;
  timing_count: number;
  incident_count: number;
  protest_count: number;
  safety_count: number;
  auto_logged_count: number;
  first_entry: string;
  last_entry: string;
}

export interface LogFilters {
  date?: Date;
  race_number?: number;
  category?: LogCategory;
  search?: string;
  includeAutoLogged?: boolean;
  includeDeleted?: boolean;
}

// ============================================================================
// COMMITTEE LOG SERVICE CLASS
// ============================================================================

class CommitteeLogService {

  // -------------------------------------------------------------------------
  // LOG ENTRIES
  // -------------------------------------------------------------------------

  /**
   * Create a new log entry
   */
  async createEntry(entry: LogEntryInput): Promise<LogEntry> {
    const { data: user } = await supabase.auth.getUser();
    
    // Get user's name and role
    let userName = 'Unknown';
    let userRole = 'staff';
    
    if (user.user?.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.user.id)
        .single();
      
      if (profile) {
        userName = profile.full_name;
      }

      // Get role from club members
      const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('user_id', user.user.id)
        .single();
      
      if (membership) {
        userRole = membership.role;
      }
    }

    const { data, error } = await supabase
      .from('committee_boat_log')
      .insert({
        ...entry,
        log_time: entry.log_time?.toISOString() || new Date().toISOString(),
        recorded_at: new Date().toISOString(),
        logged_by: user.user?.id,
        logged_by_name: userName,
        logged_by_role: userRole,
        is_auto_logged: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a log entry
   */
  async updateEntry(entryId: string, updates: Partial<LogEntryInput>): Promise<LogEntry> {
    const { data, error } = await supabase
      .from('committee_boat_log')
      .update({
        ...updates,
        log_time: updates.log_time?.toISOString(),
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Soft delete a log entry (preserves for audit trail)
   */
  async deleteEntry(entryId: string, reason?: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('committee_boat_log')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.user?.id,
        delete_reason: reason,
      })
      .eq('id', entryId);

    if (error) throw error;
  }

  /**
   * Get a single log entry
   */
  async getEntry(entryId: string): Promise<LogEntry | null> {
    const { data, error } = await supabase
      .from('committee_boat_log')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get log entries for a regatta with filters
   */
  async getEntries(regattaId: string, filters?: LogFilters): Promise<LogEntry[]> {
    let query = supabase
      .from('committee_boat_log')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('log_time', { ascending: false });

    // Apply filters
    if (!filters?.includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query
        .gte('log_time', startOfDay.toISOString())
        .lte('log_time', endOfDay.toISOString());
    }

    if (filters?.race_number !== undefined) {
      query = query.eq('race_number', filters.race_number);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.includeAutoLogged === false) {
      query = query.eq('is_auto_logged', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Apply text search filter client-side
    let entries = data || [];
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      entries = entries.filter(e => 
        e.title.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search)
      );
    }

    return entries;
  }

  /**
   * Get entries for a specific race
   */
  async getRaceEntries(regattaId: string, raceNumber: number): Promise<LogEntry[]> {
    return this.getEntries(regattaId, { race_number: raceNumber });
  }

  /**
   * Get today's entries
   */
  async getTodayEntries(regattaId: string): Promise<LogEntry[]> {
    return this.getEntries(regattaId, { date: new Date() });
  }

  // -------------------------------------------------------------------------
  // QUICK LOG METHODS
  // -------------------------------------------------------------------------

  /**
   * Quick log: Signal flag
   */
  async logSignal(
    regattaId: string,
    raceNumber: number | null,
    flagCode: string,
    meaning: string,
    soundSignals: number = 1
  ): Promise<LogEntry> {
    return this.createEntry({
      regatta_id: regattaId,
      race_number: raceNumber || undefined,
      category: 'signal',
      event_type: 'flag_signal',
      title: `${flagCode} Flag`,
      description: meaning,
      flags_displayed: [flagCode],
      sound_signals: soundSignals,
    });
  }

  /**
   * Quick log: Weather conditions
   */
  async logWeather(
    regattaId: string,
    windDirection: number,
    windSpeed: number,
    notes?: string
  ): Promise<LogEntry> {
    const directionName = this.getWindDirectionName(windDirection);
    
    return this.createEntry({
      regatta_id: regattaId,
      category: 'weather',
      event_type: 'conditions',
      title: `Weather: ${directionName} ${windSpeed}kts`,
      description: notes,
      wind_direction: windDirection,
      wind_speed: windSpeed,
      weather_notes: notes,
    });
  }

  /**
   * Quick log: Incident
   */
  async logIncident(
    regattaId: string,
    raceNumber: number | null,
    title: string,
    description: string,
    involvedEntryIds?: string[],
    location?: string
  ): Promise<LogEntry> {
    return this.createEntry({
      regatta_id: regattaId,
      race_number: raceNumber || undefined,
      category: 'incident',
      event_type: 'on_water_incident',
      title,
      description,
      related_entry_ids: involvedEntryIds,
      location,
    });
  }

  /**
   * Quick log: Announcement
   */
  async logAnnouncement(
    regattaId: string,
    message: string,
    raceNumber?: number
  ): Promise<LogEntry> {
    return this.createEntry({
      regatta_id: regattaId,
      race_number: raceNumber,
      category: 'announcement',
      event_type: 'public_announcement',
      title: 'Announcement',
      description: message,
    });
  }

  /**
   * Quick log: Race timing
   */
  async logTiming(
    regattaId: string,
    raceNumber: number,
    eventType: 'race_start' | 'race_finish' | 'first_finish' | 'last_finish',
    description?: string
  ): Promise<LogEntry> {
    const titles = {
      race_start: 'Race Started',
      race_finish: 'Race Finished',
      first_finish: 'First Finish',
      last_finish: 'Last Boat Finished',
    };

    return this.createEntry({
      regatta_id: regattaId,
      race_number: raceNumber,
      category: 'timing',
      event_type: eventType,
      title: titles[eventType],
      description,
    });
  }

  /**
   * Quick log: Course change
   */
  async logCourseChange(
    regattaId: string,
    raceNumber: number,
    changeType: 'shortened' | 'changed' | 'mark_moved',
    description: string
  ): Promise<LogEntry> {
    const config = {
      shortened: { title: 'Course Shortened', flags: ['S'], signals: 2 },
      changed: { title: 'Course Changed', flags: ['C'], signals: 1 },
      mark_moved: { title: 'Mark Repositioned', flags: [], signals: 0 },
    };

    return this.createEntry({
      regatta_id: regattaId,
      race_number: raceNumber,
      category: 'course',
      event_type: changeType,
      title: config[changeType].title,
      description,
      flags_displayed: config[changeType].flags,
      sound_signals: config[changeType].signals,
    });
  }

  /**
   * Quick log: Safety matter
   */
  async logSafety(
    regattaId: string,
    title: string,
    description: string,
    involvedEntryIds?: string[],
    location?: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<LogEntry> {
    return this.createEntry({
      regatta_id: regattaId,
      category: 'safety',
      event_type: 'safety_matter',
      title,
      description,
      related_entry_ids: involvedEntryIds,
      location,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
  }

  // -------------------------------------------------------------------------
  // TEMPLATES
  // -------------------------------------------------------------------------

  /**
   * Get available templates
   */
  async getTemplates(clubId?: string): Promise<LogTemplate[]> {
    let query = supabase
      .from('committee_log_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

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
   * Create entry from template
   */
  async createFromTemplate(
    templateId: string,
    regattaId: string,
    overrides?: Partial<LogEntryInput>
  ): Promise<LogEntry> {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('committee_log_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Increment use count
    await supabase
      .from('committee_log_templates')
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq('id', templateId);

    // Create entry
    return this.createEntry({
      regatta_id: regattaId,
      category: template.category,
      event_type: template.event_type,
      title: template.title_template,
      description: template.description_template,
      flags_displayed: template.flags_displayed,
      sound_signals: template.sound_signals,
      ...overrides,
    });
  }

  // -------------------------------------------------------------------------
  // VERIFICATION
  // -------------------------------------------------------------------------

  /**
   * Verify a log entry
   */
  async verifyEntry(entryId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('committee_boat_log')
      .update({
        verified: true,
        verified_by: user.user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', entryId);

    if (error) throw error;
  }

  /**
   * Unverify a log entry
   */
  async unverifyEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('committee_boat_log')
      .update({
        verified: false,
        verified_by: null,
        verified_at: null,
      })
      .eq('id', entryId);

    if (error) throw error;
  }

  // -------------------------------------------------------------------------
  // SUMMARIES & EXPORT
  // -------------------------------------------------------------------------

  /**
   * Get daily summary
   */
  async getDailySummary(regattaId: string, date?: Date): Promise<DailySummary | null> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('committee_log_daily_summary')
      .select('*')
      .eq('regatta_id', regattaId)
      .eq('log_date', dateStr)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all daily summaries for a regatta
   */
  async getAllDailySummaries(regattaId: string): Promise<DailySummary[]> {
    const { data, error } = await supabase
      .from('committee_log_daily_summary')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Export log to text format
   */
  async exportToText(regattaId: string, date?: Date): Promise<string> {
    const entries = date 
      ? await this.getEntries(regattaId, { date })
      : await this.getEntries(regattaId);

    const sorted = [...entries].sort((a, b) => 
      new Date(a.log_time).getTime() - new Date(b.log_time).getTime()
    );

    let output = `COMMITTEE BOAT LOG\n`;
    output += `${'='.repeat(60)}\n`;
    output += `Generated: ${new Date().toLocaleString()}\n\n`;

    let currentDate = '';
    for (const entry of sorted) {
      const entryDate = new Date(entry.log_time).toLocaleDateString();
      if (entryDate !== currentDate) {
        currentDate = entryDate;
        output += `\n${'-'.repeat(60)}\n`;
        output += `DATE: ${currentDate}\n`;
        output += `${'-'.repeat(60)}\n\n`;
      }

      const time = new Date(entry.log_time).toLocaleTimeString();
      output += `[${time}] #${entry.entry_number} - ${entry.category.toUpperCase()}\n`;
      output += `  ${entry.title}\n`;
      if (entry.description) {
        output += `  ${entry.description}\n`;
      }
      if (entry.flags_displayed?.length) {
        output += `  Flags: ${entry.flags_displayed.join(', ')}\n`;
      }
      if (entry.sound_signals) {
        output += `  Sound signals: ${entry.sound_signals}\n`;
      }
      if (entry.race_number) {
        output += `  Race: ${entry.race_number}\n`;
      }
      output += `  Logged by: ${entry.logged_by_name || 'Unknown'}\n`;
      if (entry.verified) {
        output += `  ✓ Verified\n`;
      }
      output += '\n';
    }

    return output;
  }

  /**
   * Export log to CSV format
   */
  exportToCSV(entries: LogEntry[]): string {
    const headers = [
      'Entry #',
      'Time',
      'Category',
      'Race',
      'Title',
      'Description',
      'Flags',
      'Signals',
      'Logged By',
      'Verified',
    ].join(',');

    const rows = entries.map(e => [
      e.entry_number,
      new Date(e.log_time).toISOString(),
      e.category,
      e.race_number || '',
      `"${e.title.replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${(e.flags_displayed || []).join(', ')}"`,
      e.sound_signals || 0,
      `"${e.logged_by_name || ''}"`,
      e.verified ? 'Yes' : 'No',
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  private getWindDirectionName(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Get category info
   */
  getCategoryInfo(category: LogCategory): { icon: string; color: string; label: string } {
    const categories: Record<LogCategory, { icon: string; color: string; label: string }> = {
      signal: { icon: '🚩', color: '#F59E0B', label: 'Signal' },
      course: { icon: '📍', color: '#3B82F6', label: 'Course' },
      weather: { icon: '🌤️', color: '#0EA5E9', label: 'Weather' },
      incident: { icon: '⚠️', color: '#EF4444', label: 'Incident' },
      protest: { icon: '⚖️', color: '#DC2626', label: 'Protest' },
      safety: { icon: '🚨', color: '#EF4444', label: 'Safety' },
      announcement: { icon: '📢', color: '#8B5CF6', label: 'Announcement' },
      timing: { icon: '⏱️', color: '#10B981', label: 'Timing' },
      penalty: { icon: '🔴', color: '#DC2626', label: 'Penalty' },
      equipment: { icon: '🔧', color: '#6B7280', label: 'Equipment' },
      committee: { icon: '👥', color: '#1F2937', label: 'Committee' },
      general: { icon: '📝', color: '#6B7280', label: 'General' },
    };
    return categories[category];
  }
}

// Export singleton
export const committeeLogService = new CommitteeLogService();
export default CommitteeLogService;

