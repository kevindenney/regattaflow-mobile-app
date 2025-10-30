/**
 * CoachingService
 *
 * Complete client management system for coaches including:
 * - Client relationships and tracking
 * - Session management and scheduling
 * - Progress metrics and analytics
 * - Feedback collection
 */

import { supabase } from './supabase';

export interface CoachProfile {
  id: string;
  user_id: string;
  bio?: string;
  specialties: string[];
  experience_years?: number;
  certifications: string[];
  available_for_sessions: boolean;
  hourly_rate?: number;
  currency: string;
  based_at?: string;
  available_locations?: string[];
  total_sessions: number;
  total_clients: number;
  average_rating?: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachingClient {
  id: string;
  coach_id: string;
  sailor_id: string;
  status: 'active' | 'inactive' | 'completed';
  goals?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primary_boat_class?: string;
  first_session_date?: string;
  last_session_date?: string;
  total_sessions: number;
  coach_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  sailor?: {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CoachingSession {
  id: string;
  coach_id: string;
  sailor_id: string;
  client_id?: string;
  session_type: 'on_water' | 'video_review' | 'strategy' | 'boat_setup' | 'fitness' | 'mental_coaching';
  duration_minutes: number;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  venue_id?: string;
  location_notes?: string;
  focus_areas?: string[];
  goals?: string;
  pre_session_notes?: string;
  session_notes?: string;
  homework?: string;
  video_urls?: string[];
  document_ids?: string[];
  fee_amount?: number;
  currency: string;
  paid: boolean;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  sailor?: {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
  };
  venue?: {
    id: string;
    name: string;
  };
  feedback?: SessionFeedback;
}

export interface SessionFeedback {
  id: string;
  session_id: string;
  rating: number;
  feedback_text?: string;
  communication_rating?: number;
  expertise_rating?: number;
  value_rating?: number;
  skill_improvement?: 'significant' | 'moderate' | 'slight' | 'none';
  confidence_change?: 'increased' | 'same' | 'decreased';
  would_recommend?: boolean;
  public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientProgressMetric {
  id: string;
  client_id: string;
  session_id?: string;
  metric_type: 'race_result' | 'skill_assessment' | 'boat_handling' | 'tactics' | 'starts' | 'boat_speed' | 'fitness';
  score: number;
  raw_value?: any;
  notes?: string;
  benchmark?: string;
  recorded_at: string;
  created_at: string;
}

export interface ClientStats {
  activeClients: number;
  totalSessions: number;
  sessionsThisMonth: number;
  upcomingSessions: number;
  averageRating?: number;
}

export interface ClientDetails extends CoachingClient {
  sessions: CoachingSession[];
  progressMetrics: ClientProgressMetric[];
  stats: {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    averageRating?: number;
    lastSessionDate?: string;
    nextSessionDate?: string;
  };
}

class CoachingService {
  /**
   * Get coach profile for current user
   */
  async getCoachProfile(userId: string): Promise<CoachProfile | null> {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching coach profile:', error);
      return null;
    }

    return data;
  }

  /**
   * Get coach statistics
   */
  async getCoachStats(coachId: string): Promise<ClientStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [clientsResult, sessionsResult, monthSessionsResult, upcomingResult, feedbackResult] = await Promise.all([
      // Active clients count
      supabase
        .from('coaching_clients')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'active'),

      // Total sessions
      supabase
        .from('coaching_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'completed'),

      // Sessions this month
      supabase
        .from('coaching_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth.toISOString()),

      // Upcoming sessions
      supabase
        .from('coaching_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString()),

      // Average rating
      supabase
        .from('session_feedback')
        .select('rating, session:coaching_sessions!inner(coach_id)')
        .eq('session.coach_id', coachId)
    ]);

    const averageRating = feedbackResult.data && feedbackResult.data.length > 0
      ? feedbackResult.data.reduce((sum, f) => sum + f.rating, 0) / feedbackResult.data.length
      : undefined;

    return {
      activeClients: clientsResult.count || 0,
      totalSessions: sessionsResult.count || 0,
      sessionsThisMonth: monthSessionsResult.count || 0,
      upcomingSessions: upcomingResult.count || 0,
      averageRating
    };
  }

  /**
   * Get all clients for a coach
   */
  async getClients(coachId: string, status?: 'active' | 'inactive' | 'completed'): Promise<CoachingClient[]> {
    let query = supabase
      .from('coaching_clients')
      .select(`
        *,
        sailor:sailor_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('coach_id', coachId)
      .order('last_session_date', { ascending: false, nullsFirst: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get detailed client information with sessions and progress
   */
  async getClientDetails(clientId: string): Promise<ClientDetails | null> {
    const [clientResult, sessionsResult, metricsResult] = await Promise.all([
      // Client info
      supabase
        .from('coaching_clients')
        .select(`
          *,
          sailor:sailor_id (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('id', clientId)
        .single(),

      // All sessions
      supabase
        .from('coaching_sessions')
        .select(`
          *,
          sailor:sailor_id (
            id,
            email,
            full_name,
            avatar_url
          ),
          venue:sailing_venues (
            id,
            name
          ),
          feedback:session_feedback (*)
        `)
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false }),

      // Progress metrics
      supabase
        .from('client_progress_metrics')
        .select('*')
        .eq('client_id', clientId)
        .order('recorded_at', { ascending: false })
    ]);

    if (clientResult.error) {
      console.error('Error fetching client:', clientResult.error);
      return null;
    }

    const sessions = sessionsResult.data || [];
    const completedSessions = sessions.filter((session: CoachingSession & { completed_at?: string }) => session.status === 'completed');
    const upcomingSessions = sessions.filter((session: CoachingSession & { scheduled_at?: string }) => session.status === 'scheduled' && new Date(session.scheduled_at || '') > new Date());

    const feedbacks = sessions
      .map((session: CoachingSession & { feedback?: { rating?: number } }) => session.feedback)
      .filter((feedback): feedback is { rating?: number } => Boolean(feedback));
    const averageRating = feedbacks.length > 0
      ? feedbacks.reduce((sum: number, feedback) => sum + (feedback.rating || 0), 0) / feedbacks.length
      : undefined;

    const lastSession = completedSessions.find(s => s.completed_at);
    const nextSession = upcomingSessions.find(s => s.scheduled_at);

    return {
      ...clientResult.data,
      sessions,
      progressMetrics: metricsResult.data || [],
      stats: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        averageRating,
        lastSessionDate: lastSession?.completed_at,
        nextSessionDate: nextSession?.scheduled_at
      }
    };
  }

  /**
   * Get sessions for a client
   */
  async getClientSessions(
    clientId: string,
    options?: {
      status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
      limit?: number;
    }
  ): Promise<CoachingSession[]> {
    let query = supabase
      .from('coaching_sessions')
      .select(`
        *,
        sailor:sailor_id (
          id,
          email,
          full_name,
          avatar_url
        ),
        venue:sailing_venues (
          id,
          name
        ),
        feedback:session_feedback (*)
      `)
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new client relationship
   */
  async createClient(
    coachId: string,
    sailorId: string,
    details: Partial<CoachingClient>
  ): Promise<CoachingClient> {
    const { data, error } = await supabase
      .from('coaching_clients')
      .insert({
        coach_id: coachId,
        sailor_id: sailorId,
        ...details
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update client details
   */
  async updateClient(clientId: string, updates: Partial<CoachingClient>): Promise<CoachingClient> {
    const { data, error } = await supabase
      .from('coaching_clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new coaching session
   */
  async createSession(sessionData: Partial<CoachingSession>): Promise<CoachingSession> {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update coaching session
   */
  async updateSession(sessionId: string, updates: Partial<CoachingSession>): Promise<CoachingSession> {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Add session feedback
   */
  async addSessionFeedback(
    sessionId: string,
    feedback: Partial<SessionFeedback>
  ): Promise<SessionFeedback> {
    const { data, error } = await supabase
      .from('session_feedback')
      .insert({
        session_id: sessionId,
        ...feedback
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }

    return data;
  }

  /**
   * Add progress metric for a client
   */
  async addProgressMetric(
    clientId: string,
    metric: Partial<ClientProgressMetric>
  ): Promise<ClientProgressMetric> {
    const { data, error } = await supabase
      .from('client_progress_metrics')
      .insert({
        client_id: clientId,
        ...metric
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding progress metric:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get progress metrics for a client
   */
  async getClientProgress(
    clientId: string,
    metricType?: string
  ): Promise<ClientProgressMetric[]> {
    let query = supabase
      .from('client_progress_metrics')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: true });

    if (metricType) {
      query = query.eq('metric_type', metricType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching progress metrics:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get upcoming sessions for coach
   */
  async getUpcomingSessions(coachId: string, limit: number = 10): Promise<CoachingSession[]> {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        sailor:sailor_id (
          id,
          email,
          full_name,
          avatar_url
        ),
        venue:sailing_venues (
          id,
          name
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get recent sessions for coach
   */
  async getRecentSessions(coachId: string, limit: number = 10): Promise<CoachingSession[]> {
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        sailor:sailor_id (
          id,
          email,
          full_name,
          avatar_url
        ),
        venue:sailing_venues (
          id,
          name
        ),
        feedback:session_feedback (*)
      `)
      .eq('coach_id', coachId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent sessions:', error);
      throw error;
    }

    return data || [];
  }

  // ============================================================================
  // Coach Availability Management (NEW)
  // ============================================================================

  /**
   * Create availability slot for coach
   */
  async createAvailabilitySlot(
    coachId: string,
    startTime: Date,
    endTime: Date,
    options?: {
      recurringPattern?: 'none' | 'weekly' | 'biweekly' | 'monthly';
      notes?: string;
    }
  ): Promise<any> {
    const { data, error } = await supabase
      .from('coach_availability')
      .insert({
        coach_id: coachId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        is_available: true,
        recurring_pattern: options?.recurringPattern || 'none',
        notes: options?.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating availability slot:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get coach availability slots
   */
  async getAvailabilitySlots(
    coachId: string,
    startDate?: Date,
    endDate?: Date,
    availableOnly: boolean = true
  ): Promise<any[]> {
    let query = supabase
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId)
      .order('start_time', { ascending: true });

    if (availableOnly) {
      query = query.eq('is_available', true);
    }

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('end_time', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching availability slots:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update availability slot
   */
  async updateAvailabilitySlot(
    slotId: string,
    updates: {
      startTime?: Date;
      endTime?: Date;
      isAvailable?: boolean;
      notes?: string;
    }
  ): Promise<any> {
    const updateData: any = {};

    if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
    if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
    if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('coach_availability')
      .update(updateData)
      .eq('id', slotId)
      .select()
      .single();

    if (error) {
      console.error('Error updating availability slot:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete availability slot
   */
  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    const { error } = await supabase
      .from('coach_availability')
      .delete()
      .eq('id', slotId);

    if (error) {
      console.error('Error deleting availability slot:', error);
      throw error;
    }
  }

  // ============================================================================
  // Session Booking Management (NEW)
  // ============================================================================

  /**
   * Create booking request (Sailor side)
   */
  async createBookingRequest(
    coachId: string,
    requestedStartTime: Date,
    requestedEndTime: Date,
    options: {
      sessionType: 'one_on_one' | 'group' | 'video_analysis' | 'race_debrief';
      message?: string;
      availabilitySlotId?: string;
      totalAmountCents: number;
    }
  ): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('session_bookings')
      .insert({
        sailor_id: user.id,
        coach_id: coachId,
        requested_start_time: requestedStartTime.toISOString(),
        requested_end_time: requestedEndTime.toISOString(),
        session_type: options.sessionType,
        sailor_message: options.message,
        availability_slot_id: options.availabilitySlotId,
        total_amount_cents: options.totalAmountCents,
        status: 'pending',
      })
      .select(`
        *,
        coach:coach_profiles!coach_id (
          display_name,
          user_id,
          users!coach_profiles_user_id_fkey (
            email,
            full_name
          )
        ),
        sailor:users!sailor_id (
          email,
          full_name
        )
      `)
      .single();

    if (error) {
      console.error('Error creating booking request:', error);
      throw error;
    }

    // Send notification to coach
    if (data?.coach?.users?.email) {
      const { emailService } = await import('./EmailService');
      await emailService.sendCoachNotification({
        coach_name: data.coach.users.full_name || data.coach.display_name || 'Coach',
        coach_email: data.coach.users.email,
        notification_type: 'new_booking',
        sailor_name: data.sailor?.full_name || 'Sailor',
        session_date: requestedStartTime.toISOString(),
        message: options.message,
      });
    }

    return data;
  }

  /**
   * Get booking requests for sailor
   */
  async getSailorBookingRequests(status?: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('session_bookings')
      .select(`
        *,
        coach:coach_profiles!coach_id (
          id,
          display_name,
          profile_photo_url,
          hourly_rate_usd
        )
      `)
      .eq('sailor_id', user.id)
      .order('requested_start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sailor booking requests:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get booking requests for coach
   */
  async getCoachBookingRequests(coachId: string, status?: string): Promise<any[]> {
    let query = supabase
      .from('session_bookings')
      .select(`
        *,
        sailor:auth.users!sailor_id (
          id,
          email
        )
      `)
      .eq('coach_id', coachId)
      .order('requested_start_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching coach booking requests:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Accept booking request (Coach side)
   */
  async acceptBookingRequest(bookingId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get booking details before accepting
    const { data: booking } = await supabase
      .from('session_bookings')
      .select(`
        *,
        coach:coach_profiles!coach_id (
          display_name,
          user_id,
          users!coach_profiles_user_id_fkey (
            email
          )
        ),
        sailor:users!sailor_id (
          email,
          full_name
        )
      `)
      .eq('id', bookingId)
      .single();

    const { data, error } = await supabase.rpc('accept_booking', {
      p_booking_id: bookingId,
      p_coach_user_id: user.id,
    });

    if (error) {
      console.error('Error accepting booking:', error);
      throw error;
    }

    // Send confirmation emails to both sailor and coach
    if (booking) {
      const { emailService } = await import('./EmailService');
      const { calendarService } = await import('./CalendarService');

      // Generate calendar file
      const calendarFile = calendarService.generateCoachingSessionCalendar({
        coachName: booking.coach?.display_name || 'Coach',
        coachEmail: booking.coach?.users?.email || '',
        sailorName: booking.sailor?.full_name || 'Sailor',
        sailorEmail: booking.sailor?.email || '',
        sessionType: booking.session_type,
        scheduledDate: booking.requested_start_time,
        durationMinutes: Math.round((new Date(booking.requested_end_time).getTime() - new Date(booking.requested_start_time).getTime()) / 60000),
        location: booking.location || 'TBD',
      });

      const emailData = {
        sailor_name: booking.sailor?.full_name || 'Sailor',
        sailor_email: booking.sailor?.email || '',
        coach_name: booking.coach?.display_name || 'Coach',
        coach_email: booking.coach?.users?.email || '',
        session_type: booking.session_type,
        scheduled_date: booking.requested_start_time,
        duration_minutes: Math.round((new Date(booking.requested_end_time).getTime() - new Date(booking.requested_start_time).getTime()) / 60000),
        location: booking.location || 'TBD',
        fee_amount: booking.total_amount_cents / 100,
        currency: 'USD',
        calendar_attachment: calendarFile,
      };

      // Send to sailor
      await emailService.sendCoachBookingConfirmationToSailor(emailData);

      // Send to coach
      await emailService.sendCoachBookingConfirmationToCoach(emailData);
    }

    return data; // Returns session ID
  }

  /**
   * Reject booking request (Coach side)
   */
  async rejectBookingRequest(bookingId: string, response: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.rpc('reject_booking', {
      p_booking_id: bookingId,
      p_coach_user_id: user.id,
      p_response: response,
    });

    if (error) {
      console.error('Error rejecting booking:', error);
      throw error;
    }
  }

  /**
   * Cancel booking request (Sailor side)
   */
  async cancelBookingRequest(bookingId: string, reason?: string): Promise<void> {
    // Get booking details
    const { data: booking } = await supabase
      .from('session_bookings')
      .select(`
        *,
        coach:coach_profiles!coach_id (
          display_name,
          user_id,
          users!coach_profiles_user_id_fkey (
            email,
            full_name
          )
        ),
        sailor:users!sailor_id (
          email,
          full_name
        )
      `)
      .eq('id', bookingId)
      .single();

    const { error } = await supabase
      .from('session_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }

    // Notify coach of cancellation
    if (booking?.coach?.users?.email) {
      const { emailService } = await import('./EmailService');
      await emailService.sendCoachNotification({
        coach_name: booking.coach.users.full_name || booking.coach.display_name || 'Coach',
        coach_email: booking.coach.users.email,
        notification_type: 'cancellation',
        sailor_name: booking.sailor?.full_name || 'Sailor',
        session_date: booking.requested_start_time,
        message: reason,
      });
    }
  }

  // ============================================================================
  // Coach Discovery (NEW)
  // ============================================================================

  /**
   * Discover coaches with filters
   */
  async discoverCoaches(filters?: {
    location?: string;
    specializations?: string[];
    minRating?: number;
    maxHourlyRate?: number;
    languages?: string[];
    boatClass?: string;
    timezone?: string;
    availability?: 'next_7_days' | 'next_30_days' | 'flexible';
    sessionType?: string;
  }): Promise<CoachProfile[]> {
    let query = supabase
      .from('coach_profiles')
      .select('*')
      .eq('verification_status', 'verified')
      .eq('available_for_sessions', true)
      .order('rating', { ascending: false });

    if (filters?.location) {
      query = query.or(`based_at.eq.${filters.location},available_locations.cs.{${filters.location}}`);
    }

    if (filters?.minRating) {
      query = query.gte('average_rating', filters.minRating);
    }

    if (filters?.maxHourlyRate) {
      query = query.lte('hourly_rate', filters.maxHourlyRate);
    }

    if (filters?.specializations && filters.specializations.length > 0) {
      query = query.contains('specialties', filters.specializations);
    }

    if (filters?.boatClass) {
      query = query.contains('boat_classes_coached', [filters.boatClass]);
    }

    if (filters?.timezone) {
      query = query.eq('timezone', filters.timezone);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error discovering coaches:', error);
      throw error;
    }

    let coaches = data || [];

    // Filter by availability window
    if (filters?.availability) {
      const now = new Date();
      let endDate: Date;

      if (filters.availability === 'next_7_days') {
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (filters.availability === 'next_30_days') {
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      } else {
        // 'flexible' - check for availability in next 90 days
        endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      }

      // For each coach, check if they have availability in the time window
      const coachesWithAvailability = await Promise.all(
        coaches.map(async (coach: CoachProfile) => {
          const slots = await this.getAvailabilitySlots(coach.id, now, endDate, true);
          return slots.length > 0 ? coach : null;
        })
      );

      coaches = coachesWithAvailability.filter((coach): coach is CoachProfile => coach !== null);
    }

    return coaches;
  }

  /**
   * Get coach public profile with availability
   */
  async getCoachPublicProfile(coachId: string): Promise<any> {
    const [profileResult, availabilityResult] = await Promise.all([
      supabase
        .from('coach_profiles')
        .select('*')
        .eq('id', coachId)
        .eq('verification_status', 'verified')
        .single(),

      supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_available', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10),
    ]);

    if (profileResult.error) {
      console.error('Error fetching coach profile:', profileResult.error);
      throw profileResult.error;
    }

    return {
      ...profileResult.data,
      availableSlots: availabilityResult.data || [],
    };
  }

  // ============================================================================
  // Payment-Integrated Booking Flow (NEW)
  // ============================================================================

  /**
   * Get coach availability with booked slots filtered out
   */
  async getCoachAvailability(
    coachId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // Get availability slots
    const { data: slots, error: slotsError } = await supabase
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_available', true)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true });

    if (slotsError) throw slotsError;

    // Get booked sessions in this timeframe
    const { data: bookedSessions, error: sessionsError } = await supabase
      .from('coaching_sessions')
      .select('scheduled_at, duration_minutes')
      .eq('coach_id', coachId)
      .in('status', ['confirmed', 'pending', 'scheduled'])
      .gte('scheduled_at', startDate.toISOString())
      .lte('scheduled_at', endDate.toISOString());

    if (sessionsError) throw sessionsError;

    // Filter out slots that overlap with booked sessions
    const availableSlots = (slots || []).filter(slot => {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);

      // Check if any booked session overlaps with this slot
      const hasOverlap = (bookedSessions || []).some(session => {
        const sessionStart = new Date(session.scheduled_at);
        const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);

        // Check for overlap
        return sessionStart < slotEnd && sessionEnd > slotStart;
      });

      return !hasOverlap;
    });

    return availableSlots;
  }

  /**
   * Book a coaching session with Stripe payment
   */
  async bookSession(booking: {
    coachId: string;
    sailorId: string;
    scheduledAt: Date;
    durationMinutes: number;
    sessionType: string;
    notes?: string;
  }): Promise<{
    session: CoachingSession;
    paymentIntentId: string;
    clientSecret: string;
  }> {
    // Get coach pricing
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('hourly_rate, stripe_account_id, user:users(full_name)')
      .eq('user_id', booking.coachId)
      .single();

    if (coachError || !coach) throw new Error('Coach not found');
    if (!coach.stripe_account_id) throw new Error('Coach has not set up payments');

    // Calculate price
    const priceAmount = (coach.hourly_rate * booking.durationMinutes) / 60;
    const platformFee = priceAmount * 0.15; // 15% platform fee

    // Create Stripe payment intent via Edge Function
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) throw new Error('Not authenticated');

    const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-coaching-payment`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authSession.access_token}`,
      },
      body: JSON.stringify({
        amount: Math.round(priceAmount * 100), // Convert to cents
        coachStripeAccountId: coach.stripe_account_id,
        platformFee: Math.round(platformFee * 100),
        metadata: {
          coachId: booking.coachId,
          sailorId: booking.sailorId,
          sessionType: booking.sessionType,
        },
      }),
    });

    const paymentData = await response.json();
    if (!response.ok) {
      throw new Error(paymentData.error || 'Failed to create payment intent');
    }

    // Create session record (payment pending)
    const { data: session, error: sessionError } = await supabase
      .from('coaching_sessions')
      .insert({
        coach_id: booking.coachId,
        sailor_id: booking.sailorId,
        scheduled_at: booking.scheduledAt.toISOString(),
        duration_minutes: booking.durationMinutes,
        session_type: booking.sessionType,
        status: 'pending',
        fee_amount: priceAmount,
        currency: 'usd',
        stripe_payment_intent_id: paymentData.paymentIntentId,
        pre_session_notes: booking.notes,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    return {
      session,
      paymentIntentId: paymentData.paymentIntentId,
      clientSecret: paymentData.clientSecret,
    };
  }

  /**
   * Confirm session after successful payment
   */
  async confirmSessionPayment(
    sessionId: string,
    paymentIntentId: string
  ): Promise<void> {
    // Verify payment with Stripe via Edge Function
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) throw new Error('Not authenticated');

    const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-payment-intent`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authSession.access_token}`,
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    const { status } = await response.json();
    if (!response.ok || status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    // Update session status
    const { error } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'confirmed',
        paid: true,
        payment_date: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) throw error;

    // Send confirmation emails
    await this.sendSessionConfirmationEmails(sessionId);
  }

  /**
   * Cancel session with refund logic
   */
  async cancelSession(
    sessionId: string,
    cancelledBy: 'coach' | 'sailor',
    reason?: string
  ): Promise<void> {
    const { data: session, error: fetchError } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach:users!coach_id(id, email, full_name),
        sailor:users!sailor_id(id, email, full_name)
      `)
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) throw new Error('Session not found');

    // Calculate refund based on cancellation policy
    const hoursUntilSession = (
      new Date(session.scheduled_at).getTime() - Date.now()
    ) / (1000 * 60 * 60);

    let refundAmount = 0;
    if (hoursUntilSession >= 24) {
      refundAmount = session.fee_amount; // Full refund
    } else if (hoursUntilSession >= 12) {
      refundAmount = session.fee_amount * 0.5; // 50% refund
    }
    // No refund if < 12 hours

    // Process refund if applicable
    if (refundAmount > 0 && session.stripe_payment_intent_id) {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error('Not authenticated');

      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/refund-payment`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          paymentIntentId: session.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100), // Convert to cents
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process refund');
      }
    }

    // Update session
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
        refund_amount: refundAmount,
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    // Send cancellation notifications
    await this.sendCancellationEmails(sessionId, refundAmount);
  }

  /**
   * Send session confirmation emails to both parties
   */
  private async sendSessionConfirmationEmails(sessionId: string): Promise<void> {
    const { data: session } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach:users!coach_id(email, full_name),
        sailor:users!sailor_id(email, full_name)
      `)
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // In production, integrate with EmailService
  }

  /**
   * Send cancellation emails to both parties
   */
  private async sendCancellationEmails(sessionId: string, refundAmount: number): Promise<void> {
    const { data: session } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach:users!coach_id(email, full_name),
        sailor:users!sailor_id(email, full_name)
      `)
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // In production, integrate with EmailService
  }

  // ============================================================================
  // Session Completion Management (NEW)
  // ============================================================================

  /**
   * Complete a coaching session with notes and trigger payout
   */
  async completeSession(
    sessionId: string,
    completionData: {
      sessionNotes?: string;
      homework?: string;
      rating?: number;
    }
  ): Promise<void> {
    const { data: session, error: sessionError } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach:coach_profiles!coach_id (
          id,
          display_name,
          stripe_account_id,
          user_id,
          users!coach_profiles_user_id_fkey (
            email,
            full_name
          )
        ),
        sailor:users!sailor_id (
          email,
          full_name
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Update session to completed
    const { error: updateError } = await supabase
      .from('coaching_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        session_notes: completionData.sessionNotes,
        homework: completionData.homework,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error completing session:', updateError);
      throw updateError;
    }

    // Note: Trigger for updating coach stats already exists in migration

    // Send completion email to sailor
    try {
      const { emailService } = await import('./EmailService');
      await emailService.sendSessionCompletionNotification({
        sailor_name: session.sailor?.full_name || 'Sailor',
        sailor_email: session.sailor?.email || '',
        coach_name: session.coach?.display_name || 'Coach',
        session_type: session.session_type,
        session_date: session.scheduled_at || session.started_at || '',
        session_notes: completionData.sessionNotes,
        homework: completionData.homework,
      });

      // Request feedback from sailor
      await emailService.sendFeedbackRequest({
        sailor_name: session.sailor?.full_name || 'Sailor',
        sailor_email: session.sailor?.email || '',
        coach_name: session.coach?.display_name || 'Coach',
        session_id: sessionId,
      });
    } catch (emailError) {
      console.error('Error sending completion emails:', emailError);
      // Don't throw - session is already marked complete
    }
  }

  /**
   * Get sessions requiring completion (for coach dashboard)
   */
  async getSessionsRequiringCompletion(coachId: string): Promise<CoachingSession[]> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('coaching_sessions')
      .select(`
        *,
        sailor:users!sailor_id (
          id,
          email,
          full_name,
          avatar_url
        ),
        venue:sailing_venues (
          id,
          name
        )
      `)
      .eq('coach_id', coachId)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now.toISOString())
      .gte('scheduled_at', oneDayAgo.toISOString())
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions requiring completion:', error);
      throw error;
    }

    return data || [];
  }
}

export const coachingService = new CoachingService();
