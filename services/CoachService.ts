// Coach Marketplace Service Layer
import { supabase } from './supabase';
import {
  CoachProfile,
  CoachService,
  CoachAvailability,
  CoachingSession,
  SessionReview,
  CoachSearchFilters,
  CoachSearchResult,
  CoachRegistrationForm,
  CoachProfileResponse,
  SearchResponse,
  CoachDashboardData,
  StudentDashboardData,
  SailingSpecialty,
  SailorProfile
} from '../types/coach';

export class CoachMarketplaceService {
  // ===== COACH PROFILE MANAGEMENT =====

  /**
   * Register a new coach with complete profile
   */
  static async registerCoach(formData: CoachRegistrationForm, userId: string): Promise<CoachProfile> {
    try {
      // 1. Create coach profile
      const coachProfileData = {
        user_id: userId,
        ...formData.personal_info,
        ...formData.credentials,
        ...formData.expertise,
        status: 'pending' as const,
        currency: 'USD',
      };

      const { data: coach, error: profileError } = await supabase
        .from('coach_profiles')
        .insert(coachProfileData)
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Create services
      if (formData.services.length > 0) {
        const servicesData = formData.services.map(service => ({
          ...service,
          coach_id: coach.id,
        }));

        const { error: servicesError } = await supabase
          .from('coach_services')
          .insert(servicesData);

        if (servicesError) throw servicesError;
      }

      // 3. Create availability slots
      if (formData.availability.length > 0) {
        const availabilityData = formData.availability.map(slot => ({
          ...slot,
          coach_id: coach.id,
        }));

        const { error: availabilityError } = await supabase
          .from('coach_availability')
          .insert(availabilityData);

        if (availabilityError) throw availabilityError;
      }

      return coach;
    } catch (error) {
      console.error('Error registering coach:', error);
      throw error;
    }
  }

  /**
   * Get the sailor profile associated with a user
   */
  static async getSailorProfile(userId: string): Promise<SailorProfile | null> {
    try {
      const { data, error } = await supabase
        .from('sailor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return (data as SailorProfile) ?? null;
    } catch (error) {
      console.error('Error fetching sailor profile:', error);
      return null;
    }
  }

  /**
   * Get coach profile with all related data
   */
  static async getCoachProfile(coachId: string): Promise<CoachProfileResponse> {
    try {
      // Get coach profile
      const { data: coach, error: coachError } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('id', coachId)
        .single();

      if (coachError) throw coachError;

      // Get services
      const { data: services, error: servicesError } = await supabase
        .from('coach_services')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Get availability
      const { data: availability, error: availabilityError } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', coachId);

      if (availabilityError) throw availabilityError;

      // Get recent reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('session_reviews')
        .select(`
          *,
          coaching_sessions!inner(coach_id)
        `)
        .eq('coaching_sessions.coach_id', coachId)
        .eq('reviewer_type', 'student')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;

      return {
        coach,
        services: services || [],
        availability: availability || [],
        reviews: reviews || []
      };
    } catch (error) {
      console.error('Error getting coach profile:', error);
      throw error;
    }
  }

  /**
   * Update coach profile
   */
  static async updateCoachProfile(coachId: string, updates: Partial<CoachProfile>): Promise<CoachProfile> {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .update(updates)
        .eq('id', coachId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating coach profile:', error);
      throw error;
    }
  }

  // ===== COACH SEARCH AND DISCOVERY =====

  /**
   * Search coaches with filters
   */
  static async searchCoaches(
    filters: CoachSearchFilters = {},
    page: number = 1,
    perPage: number = 20
  ): Promise<SearchResponse> {
    try {
      let query = supabase
        .from('coach_profiles')
        .select(`
          *,
          coach_services!inner(*)
        `)
        .eq('status', 'active');

      // Apply filters
      if (filters.boat_classes?.length) {
        query = query.overlaps('boat_classes', filters.boat_classes);
      }

      if (filters.specialties?.length) {
        query = query.overlaps('specialties', filters.specialties);
      }

      if (filters.skill_levels?.length) {
        query = query.overlaps('skill_levels', filters.skill_levels);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.languages?.length) {
        query = query.overlaps('languages', filters.languages);
      }

      if (filters.rating) {
        query = query.gte('average_rating', filters.rating);
      }

      // Time zone filter
      if (filters.time_zone) {
        query = query.eq('time_zone', filters.time_zone);
      }

      // Apply price range filter on services
      if (filters.price_range) {
        query = query.gte('coach_services.base_price', filters.price_range[0])
                    .lte('coach_services.base_price', filters.price_range[1]);
      }

      // Session type filter - filter coaches who offer specific service types
      if (filters.session_types?.length) {
        query = query.in('coach_services.service_type', filters.session_types);
      }

      // Pagination
      const offset = (page - 1) * perPage;
      query = query.range(offset, offset + perPage - 1);

      // Order by rating and total reviews
      query = query.order('average_rating', { ascending: false })
                  .order('total_reviews', { ascending: false });

      const { data: coaches, error, count } = await query;

      if (error) throw error;

      // Transform data to include services and calculate next available slot
      let searchResults: CoachSearchResult[] = await Promise.all(
        (coaches || []).map(async (coach: any) => {
          const services = coach.coach_services || [];
          delete coach.coach_services; // Remove nested services from coach object

          return {
            ...coach,
            services,
            next_available: await this.getNextAvailableSlot(coach.id),
            match_score: this.calculateMatchScore(coach, filters)
          };
        })
      );

      // Apply minimum match score filter if specified
      if (filters.min_match_score !== undefined) {
        searchResults = searchResults.filter(
          coach => (coach.match_score || 0) >= filters.min_match_score!
        );
      }

      return {
        coaches: searchResults,
        total_count: searchResults.length, // Update count after filtering
        page,
        per_page: perPage,
        filters_applied: filters
      };
    } catch (error) {
      console.error('Error searching coaches:', error);
      throw error;
    }
  }

  /**
   * Get next available time slot for a coach
   */
  static async getNextAvailableSlot(coachId: string): Promise<string | undefined> {
    try {
      // Get coach availability
      const { data: availability } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', coachId)
        .eq('is_recurring', true);

      if (!availability?.length) return undefined;

      // Get existing bookings for next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { data: bookings } = await supabase
        .from('coaching_sessions')
        .select('scheduled_start, scheduled_end')
        .eq('coach_id', coachId)
        .gte('scheduled_start', startDate.toISOString())
        .lte('scheduled_start', endDate.toISOString())
        .in('status', ['confirmed', 'pending']);

      // Simple algorithm to find next available slot
      // In a production system, this would be more sophisticated
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        const dayOfWeek = checkDate.getDay();

        const dayAvailability = availability.filter(slot => slot.day_of_week === dayOfWeek);

        for (const slot of dayAvailability) {
          const slotStart = new Date(checkDate);
          const [startHour, startMinute] = slot.start_time.split(':');
          slotStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

          // Check if this slot is not booked
          const isBooked = bookings?.some(booking => {
            const bookingStart = new Date(booking.scheduled_start);
            const bookingEnd = new Date(booking.scheduled_end);
            return slotStart >= bookingStart && slotStart < bookingEnd;
          });

          if (!isBooked && slotStart > now) {
            return slotStart.toISOString();
          }
        }
      }

      return undefined;
    } catch (error) {
      console.error('Error getting next available slot:', error);
      return undefined;
    }
  }

  /**
   * Calculate match score for coach based on search filters
   */
  private static calculateMatchScore(coach: CoachProfile, filters: CoachSearchFilters): number {
    let score = 0;
    let maxScore = 0;

    // Boat class match
    if (filters.boat_classes?.length) {
      maxScore += 30;
      const matchingClasses = coach.boat_classes.filter(cls =>
        filters.boat_classes!.includes(cls)
      );
      score += (matchingClasses.length / filters.boat_classes.length) * 30;
    }

    // Specialty match
    if (filters.specialties?.length) {
      maxScore += 25;
      const matchingSpecialties = coach.specialties.filter(spec =>
        filters.specialties!.includes(spec)
      );
      score += (matchingSpecialties.length / filters.specialties.length) * 25;
    }

    // Rating weight
    maxScore += 20;
    score += (coach.average_rating / 5) * 20;

    // Experience weight
    maxScore += 15;
    score += Math.min(coach.years_coaching / 10, 1) * 15;

    // Location preference
    if (filters.location) {
      maxScore += 10;
      if (coach.location.toLowerCase().includes(filters.location.toLowerCase())) {
        score += 10;
      }
    }

    return maxScore > 0 ? score / maxScore : 0.5;
  }

  // ===== SESSION MANAGEMENT =====

  /**
   * Book a coaching session
   */
  static async bookSession(sessionData: Partial<CoachingSession>): Promise<CoachingSession> {
    try {
      const { data, error } = await supabase
        .from('coaching_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error booking session:', error);
      throw error;
    }
  }

  /**
   * Get coaching sessions for a user
   */
  static async getUserSessions(userId: string, role: 'student' | 'coach'): Promise<CoachingSession[]> {
    try {
      let query = supabase
        .from('coaching_sessions')
        .select(`
          *,
          coach_profiles!coaching_sessions_coach_id_fkey(first_name, last_name, profile_photo_url),
          student:auth.users!coaching_sessions_student_id_fkey(email)
        `);

      if (role === 'student') {
        query = query.eq('student_id', userId);
      } else {
        query = query
          .select(`
            *,
            coach_profiles!coaching_sessions_coach_id_fkey(first_name, last_name, profile_photo_url),
            student:auth.users!coaching_sessions_student_id_fkey(email)
          `)
          .eq('coach_profiles.user_id', userId);
      }

      const { data, error } = await query.order('scheduled_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(sessionId: string, status: CoachingSession['status'], notes?: string): Promise<CoachingSession> {
    try {
      const updateData: any = { status };
      if (notes) updateData.session_notes = notes;
      if (status === 'in_progress') updateData.actual_start = new Date().toISOString();
      if (status === 'completed') updateData.actual_end = new Date().toISOString();

      const { data, error } = await supabase
        .from('coaching_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  // ===== REVIEW SYSTEM =====

  /**
   * Submit a session review
   */
  static async submitReview(reviewData: Partial<SessionReview>): Promise<SessionReview> {
    try {
      const { data, error } = await supabase
        .from('session_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  // ===== DASHBOARD DATA =====

  /**
   * Get coach dashboard data
   */
  static async getCoachDashboard(coachId: string): Promise<CoachDashboardData> {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('id', coachId)
        .single();

      // Get upcoming sessions
      const { data: upcoming_sessions } = await supabase
        .from('coaching_sessions')
        .select('*, student:auth.users!coaching_sessions_student_id_fkey(email)')
        .eq('coach_id', coachId)
        .gte('scheduled_start', new Date().toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_start')
        .limit(10);

      // Get monthly stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthly_sessions } = await supabase
        .from('coaching_sessions')
        .select('status, total_amount')
        .eq('coach_id', coachId)
        .gte('created_at', startOfMonth.toISOString());

      const monthly_earnings = monthly_sessions
        ?.filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.total_amount * 0.85), 0) || 0; // 15% platform fee

      const session_stats = {
        total_this_month: monthly_sessions?.length || 0,
        completed_this_month: monthly_sessions?.filter(s => s.status === 'completed').length || 0,
        avg_rating_this_month: profile?.average_rating || 0
      };

      // Get pending reviews
      const { data: pending_reviews } = await supabase
        .from('session_reviews')
        .select(`
          *,
          coaching_sessions!inner(coach_id, student_id)
        `)
        .eq('coaching_sessions.coach_id', coachId)
        .eq('reviewer_type', 'student')
        .eq('moderation_status', 'pending')
        .limit(10);

      // Get recent reviews
      const { data: recent_reviews } = await supabase
        .from('session_reviews')
        .select(`
          *,
          coaching_sessions!inner(coach_id, student_id)
        `)
        .eq('coaching_sessions.coach_id', coachId)
        .eq('reviewer_type', 'student')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        profile: profile!,
        upcoming_sessions: upcoming_sessions || [],
        pending_reviews: pending_reviews || [],
        monthly_earnings,
        session_stats,
        recent_reviews: recent_reviews || []
      };
    } catch (error) {
      console.error('Error getting coach dashboard:', error);
      throw error;
    }
  }

  /**
   * Get student dashboard data
   */
  static async getStudentDashboard(userId: string): Promise<StudentDashboardData> {
    try {
      // Get upcoming sessions
      const { data: upcoming_sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          coach_profiles!coaching_sessions_coach_id_fkey(first_name, last_name, profile_photo_url)
        `)
        .eq('student_id', userId)
        .gte('scheduled_start', new Date().toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('scheduled_start')
        .limit(10);

      // Get recent sessions
      const { data: recent_sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          coach_profiles!coaching_sessions_coach_id_fkey(first_name, last_name, profile_photo_url)
        `)
        .eq('student_id', userId)
        .lt('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: false })
        .limit(5);

      // Get favorite coaches (coaches with multiple sessions)
      const { data: sessions_by_coach } = await supabase
        .from('coaching_sessions')
        .select('coach_id, coach_profiles!coaching_sessions_coach_id_fkey(*)')
        .eq('student_id', userId)
        .eq('status', 'completed');

      const coachCounts = sessions_by_coach?.reduce((acc: any, session: any) => {
        acc[session.coach_id] = (acc[session.coach_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const favorite_coaches = Object.entries(coachCounts)
        .filter(([_, count]) => (count as number) >= 2)
        .map(([coachId, _]) =>
          sessions_by_coach?.find(s => s.coach_id === coachId)?.coach_profiles
        )
        .filter(Boolean)
        .slice(0, 5);

      // Get pending reviews
      const { data: pending_reviews } = await supabase
        .from('coaching_sessions')
        .select('id, coach_id')
        .eq('student_id', userId)
        .eq('status', 'completed')
        .not('id', 'in', `(
          SELECT session_id FROM session_reviews WHERE reviewer_id = '${userId}'
        )`)
        .limit(5);

      return {
        upcoming_sessions: upcoming_sessions || [],
        recent_sessions: recent_sessions || [],
        favorite_coaches: favorite_coaches || [],
        recommended_coaches: [], // TODO: Implement AI recommendations
        pending_reviews: pending_reviews || []
      };
    } catch (error) {
      console.error('Error getting student dashboard:', error);
      throw error;
    }
  }

  // ===== UTILITIES =====

  /**
   * Get all sailing specialties
   */
  static async getSailingSpecialties(): Promise<SailingSpecialty[]> {
    try {
      const { data, error } = await supabase
        .from('sailing_specialties')
        .select('*')
        .order('category, name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting sailing specialties:', error);
      return [];
    }
  }
}
