/**
 * CoachingService
 *
 * Complete client management system for coaches including:
 * - Client relationships and tracking
 * - Session management and scheduling
 * - Progress metrics and analytics
 * - Feedback collection
 */

import { addDays } from 'date-fns';
import { supabase } from './supabase';
import type { CoachingFeedback, FrameworkScores } from '@/types/raceAnalysis';

export interface CoachProfile {
  id: string;
  user_id: string;
  display_name?: string | null;
  profile_photo_url?: string | null;
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

export interface SailorSummary {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  primary_boat_class?: string | null;
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
  start_time?: string;
  end_time?: string;
  started_at?: string;
  completed_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'confirmed' | 'pending';
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
  coach?: {
    id: string;
    display_name?: string | null;
    profile_photo_url?: string | null;
  } | null;
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
  recentRaceAnalysis?: SharedRaceAnalysisSummary[];
  recentRaceStrategies?: SharedRaceStrategySummary[];
}

export interface SharedRaceAnalysisSummary {
  id: string;
  race_id: string;
  race_name?: string;
  regatta_name?: string;
  created_at: string;
  overall_satisfaction?: number;
  key_learnings?: string[];
  ai_coaching_feedback?: CoachingFeedback[];
  framework_scores?: FrameworkScores | null;
}

export interface SharedRaceStrategySummary {
  regatta_id: string;
  regatta_name?: string;
  generated_at?: string;
  strategy_type?: string | null;
  favored_end?: string | null;
  wind_strategy?: string | null;
  confidence_score?: number | null;
  strategy_content?: any;
}

export type CoachTransactionStatus =
  | 'scheduled'
  | 'pending'
  | 'paid'
  | 'cancelled'
  | 'refunded'
  | 'requires_action';

export interface CoachEarningsTransaction {
  id: string;
  clientName: string;
  sessionType: string;
  status: CoachTransactionStatus;
  paymentStatus?: string | null;
  amount: number;
  currency: string;
  date: string | null;
  payoutDate?: string | null;
}

export interface PeriodEarningsStats {
  total: number;
  sessions: number;
  averagePerSession: number;
}

export interface CoachEarningsSummary {
  period: {
    week: { current: PeriodEarningsStats; previous: PeriodEarningsStats };
    month: { current: PeriodEarningsStats; previous: PeriodEarningsStats };
    year: { current: PeriodEarningsStats; previous: PeriodEarningsStats };
  };
  totals: {
    lifetime: number;
    sessions: number;
    averagePerSession: number;
    pendingPayouts: number;
    nextPayoutDate: string | null;
  };
  breakdown: Record<string, number>;
  transactions: CoachEarningsTransaction[];
  pendingTransactions: CoachEarningsTransaction[];
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

      // Average rating - get all feedback first, then filter by coach sessions
      supabase
        .from('session_feedback')
        .select('rating, session_id')
    ]);

    // WORKAROUND: Filter feedback by coach's sessions manually since JOIN doesn't work
    let averageRating: number | undefined = undefined;
    if (feedbackResult.data && feedbackResult.data.length > 0) {
      // Get session IDs for this coach
      const { data: coachSessions } = await supabase
        .from('coaching_sessions')
        .select('id')
        .eq('coach_id', coachId);

      const coachSessionIds = new Set(coachSessions?.map(s => s.id) || []);

      // Filter feedback to only include coach's sessions
      const coachFeedback = feedbackResult.data.filter(f =>
        coachSessionIds.has(f.session_id)
      );

      if (coachFeedback.length > 0) {
        averageRating = coachFeedback.reduce((sum, f) => sum + f.rating, 0) / coachFeedback.length;
      }
    }

    return {
      activeClients: clientsResult.count || 0,
      totalSessions: sessionsResult.count || 0,
      sessionsThisMonth: monthSessionsResult.count || 0,
      upcomingSessions: upcomingResult.count || 0,
      averageRating
    };
  }

  /**
   * Build an earnings + payouts snapshot for the earnings tab
   */
  async getCoachEarningsSummary(coachId: string): Promise<CoachEarningsSummary> {
    if (!coachId) {
      throw new Error('coachId is required to load earnings');
    }

    const { data: sessionRows, error } = await supabase
      .from('coaching_sessions')
      .select(`
        id,
        sailor_id,
        session_type,
        status,
        payment_status,
        fee_amount,
        total_amount,
        coach_payout,
        currency,
        scheduled_at,
        completed_at,
        created_at
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coach sessions for earnings summary:', error);
      throw error;
    }

    const amountOrZero = (value?: number | null, fallback?: number | null) => {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
      if (typeof fallback === 'number' && !Number.isNaN(fallback)) {
        return fallback;
      }
      return 0;
    };

    const computePlatformFee = (session: {
      platform_fee?: number | null;
      total_amount?: number | null;
      fee_amount?: number | null;
      coach_payout?: number | null;
    }) => {
      if (typeof session.platform_fee === 'number' && !Number.isNaN(session.platform_fee)) {
        return session.platform_fee;
      }
      const total = amountOrZero(session.total_amount, session.fee_amount);
      const payout = amountOrZero(session.coach_payout, total > 0 ? Math.round(total * 0.85) : undefined);
      const fee = total - payout;
      return fee > 0 ? fee : 0;
    };

    const sessions = (sessionRows || []).map(session => ({
      ...session,
      platform_fee: computePlatformFee(session),
    }));
    const sailorIds = Array.from(new Set(sessions.map(row => row.sailor_id).filter(Boolean))) as string[];

    let sailorMap = new Map<string, { id: string; full_name?: string | null; email?: string | null }>();
    if (sailorIds.length > 0) {
      const { data: sailors, error: sailorsError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', sailorIds);

      if (sailorsError) {
        console.warn('[CoachingService.getCoachEarningsSummary] Failed to fetch sailor details:', sailorsError.message);
      } else if (sailors) {
        sailorMap = new Map(sailors.map(s => [s.id, s]));
      }
    }

    const resolveDate = (value?: string | null) => (value ? new Date(value) : null);

    const paidStates = new Set(['captured', 'paid']);
    const now = new Date();

    const completedPaidSessions = sessions.filter(session =>
      paidStates.has(session.payment_status ?? '') && amountOrZero(session.coach_payout, session.fee_amount) > 0
    );

    const lifetimeEarnings = completedPaidSessions.reduce(
      (sum, session) => sum + amountOrZero(session.coach_payout, session.total_amount ? Math.round(session.total_amount * 0.85) : session.fee_amount),
      0
    );

    const lifetimeSessions = completedPaidSessions.length;
    const averagePerSession = lifetimeSessions > 0 ? lifetimeEarnings / lifetimeSessions : 0;

    const nextPayoutDate = (() => {
      const payout = new Date(now);
      const daysUntilFriday = ((5 - payout.getDay() + 7) % 7) || 7;
      payout.setDate(payout.getDate() + daysUntilFriday);
      payout.setHours(9, 0, 0, 0);
      return payout.toISOString();
    })();

    const makeStatsForRange = (start: Date, end: Date): PeriodEarningsStats => {
      const bucket = completedPaidSessions.filter(session => {
        const date = resolveDate(session.completed_at) || resolveDate(session.scheduled_at) || resolveDate(session.created_at);
        if (!date) return false;
        return date >= start && date < end;
      });

      const total = bucket.reduce((sum, session) => sum + amountOrZero(session.coach_payout, session.fee_amount), 0);
      const sessionsCount = bucket.length;

      return {
        total,
        sessions: sessionsCount,
        averagePerSession: sessionsCount > 0 ? total / sessionsCount : 0,
      };
    };

    const daysAgo = (days: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() - days);
      return date;
    };

    const weekStart = daysAgo(7);
    const prevWeekStart = daysAgo(14);
    const weekStats = makeStatsForRange(weekStart, now);
    const prevWeekStats = makeStatsForRange(prevWeekStart, weekStart);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStats = makeStatsForRange(monthStart, now);
    const prevMonthStats = makeStatsForRange(prevMonthStart, monthStart);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const yearStats = makeStatsForRange(yearStart, now);
    const prevYearStats = makeStatsForRange(prevYearStart, yearStart);

    const breakdown = sessions.reduce<Record<string, number>>((acc, session) => {
      const key = session.session_type || 'other';
      acc[key] = (acc[key] || 0) + amountOrZero(session.coach_payout, session.fee_amount);
      return acc;
    }, {});

    const deriveStatus = (session: any): CoachTransactionStatus => {
      if (session.payment_status === 'refunded') {
        return 'refunded';
      }
      if (session.status === 'cancelled') {
        return 'cancelled';
      }
      if (session.status === 'completed' && paidStates.has(session.payment_status ?? '')) {
        const completedDate = resolveDate(session.completed_at) || resolveDate(session.scheduled_at) || resolveDate(session.created_at);
        if (completedDate && (now.getTime() - completedDate.getTime()) > 7 * 24 * 60 * 60 * 1000) {
          return 'paid';
        }
        return 'pending';
      }
      if (session.payment_status === 'requires_action') {
        return 'requires_action';
      }
      return 'scheduled';
    };

    const buildTransaction = (session: any): CoachEarningsTransaction => {
      const sailor = session.sailor_id ? sailorMap.get(session.sailor_id) : null;
      const clientName = sailor?.full_name || sailor?.email || 'Unassigned Sailor';
      const status = deriveStatus(session);

      return {
        id: session.id,
        clientName,
        sessionType: session.session_type || 'Coaching Session',
        status,
        paymentStatus: session.payment_status,
        amount: amountOrZero(session.coach_payout, session.fee_amount),
        currency: session.currency || 'USD',
        date: session.completed_at || session.scheduled_at || session.created_at,
        payoutDate: status === 'pending' ? nextPayoutDate : null,
      };
    };

    const allTransactions = sessions.map(buildTransaction);
    const transactions: CoachEarningsTransaction[] = allTransactions.slice(0, 30);

    const pendingTransactions: CoachEarningsTransaction[] = allTransactions
      .filter(txn => txn.status === 'pending' || txn.status === 'requires_action')
      .slice(0, 20);

    const pendingPayouts = pendingTransactions
      .filter(txn => txn.status === 'pending')
      .reduce((sum, txn) => sum + txn.amount, 0);

    return {
      period: {
        week: { current: weekStats, previous: prevWeekStats },
        month: { current: monthStats, previous: prevMonthStats },
        year: { current: yearStats, previous: prevYearStats },
      },
      totals: {
        lifetime: lifetimeEarnings,
        sessions: lifetimeSessions,
        averagePerSession,
        pendingPayouts,
        nextPayoutDate,
      },
      breakdown,
      transactions,
      pendingTransactions,
    };
  }

  /**
   * Get all clients for a coach
   */
  async getClients(coachId: string, status?: 'active' | 'inactive' | 'completed'): Promise<CoachingClient[]> {
    // WORKAROUND: Until foreign keys are added to coaching_clients table,
    // fetch clients and users separately, then join in code
    console.log('[CoachingService.getClients] coachId:', coachId, 'status:', status);

    let clientsQuery = supabase
      .from('coaching_clients')
      .select('*')
      .eq('coach_id', coachId)
      .order('last_session_date', { ascending: false, nullsFirst: false });

    if (status) {
      clientsQuery = clientsQuery.eq('status', status);
    }

    const { data: clients, error: clientsError } = await clientsQuery;

    console.log('[CoachingService.getClients] clients query result:', { clientsCount: clients?.length, error: clientsError });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    if (!clients || clients.length === 0) {
      return [];
    }

    // Get sailor IDs
    const sailorIds = clients.map(c => c.sailor_id).filter(Boolean);

    if (sailorIds.length === 0) {
      return clients as CoachingClient[];
    }

    // Fetch sailor data separately
    console.log('[CoachingService.getClients] Fetching sailors for IDs:', sailorIds);
    const { data: sailors, error: sailorsError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', sailorIds);

    console.log('[CoachingService.getClients] sailors query result:', { sailorsCount: sailors?.length, error: sailorsError });

    if (sailorsError) {
      console.error('Error fetching sailors:', sailorsError);
      // Return clients without sailor data rather than failing
      return clients as CoachingClient[];
    }

    // Join in code
    const sailorMap = new Map(sailors?.map(s => [s.id, s]) || []);

    const result = clients.map(client => ({
      ...client,
      sailor: client.sailor_id ? sailorMap.get(client.sailor_id) : undefined,
    })) as CoachingClient[];

    console.log('[CoachingService.getClients] Returning', result.length, 'clients');
    return result;
  }

  /**
   * Get detailed client information with sessions and progress
   */
  async getClientDetails(clientId: string): Promise<ClientDetails | null> {
    const [clientResult, sessionsResult, metricsResult] = await Promise.all([
      // Client info (fetch sailor separately because FK isn't defined in Supabase)
      supabase
        .from('coaching_clients')
        .select('*')
        .eq('id', clientId)
        .single(),

      // All sessions (without JOINs for now - foreign keys not set up)
      supabase
        .from('coaching_sessions')
        .select('*')
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

    const rawClient = clientResult.data;

    if (!rawClient) {
      return null;
    }

    let clientSailor:
      | {
          id: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
        }
      | undefined;

    if (rawClient.sailor_id) {
      const { data: sailorData, error: sailorError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', rawClient.sailor_id)
        .maybeSingle();

      if (sailorError && sailorError.code !== 'PGRST116') {
        console.warn('[CoachingService] Failed to load sailor profile for client', sailorError);
      } else if (sailorData) {
        clientSailor = sailorData;
      }
    }

    const sessions = sessionsResult.error ? [] : (sessionsResult.data || []);
    if (sessionsResult.error) {
      console.warn('[CoachingService] Failed to load sessions for client', clientId, sessionsResult.error);
    }

    const progressMetrics = metricsResult.error ? [] : (metricsResult.data || []);
    if (metricsResult.error) {
      console.warn('[CoachingService] Failed to load progress metrics for client', clientId, metricsResult.error);
    }

    const completedSessions = sessions.filter((session: CoachingSession & { completed_at?: string }) => session.status === 'completed');
    const upcomingSessions = sessions.filter((session: CoachingSession & { scheduled_at?: string }) => session.status === 'scheduled' && new Date(session.scheduled_at || '') > new Date());

    const feedbacks = sessions
      .map((session: CoachingSession) => session.feedback)
      .filter((feedback): feedback is SessionFeedback => Boolean(feedback));
    const averageRating = feedbacks.length > 0
      ? feedbacks.reduce((sum: number, feedback: SessionFeedback) => sum + (feedback.rating || 0), 0) / feedbacks.length
      : undefined;

    const lastSession = completedSessions.find(s => s.completed_at);
    const nextSession = upcomingSessions.find(s => s.scheduled_at);

    let recentRaceAnalysis: SharedRaceAnalysisSummary[] = [];
    let recentRaceStrategies: SharedRaceStrategySummary[] = [];

    try {
      const sailorUserId = rawClient?.sailor_id;

      if (sailorUserId) {
        const { data: sailorProfile } = await supabase
          .from('sailor_profiles')
          .select('id')
          .eq('user_id', sailorUserId)
          .maybeSingle();

        if (sailorProfile?.id) {
          const { data: analysisRows } = await supabase
            .from('race_analysis')
            .select(`
              id,
              race_id,
              created_at,
              overall_satisfaction,
              key_learnings,
              ai_coaching_feedback,
              framework_scores
            `)
            .eq('sailor_id', sailorProfile.id)
            .order('created_at', { ascending: false })
            .limit(5);

          const raceIds = (analysisRows || []).map(row => row.race_id).filter(Boolean);
          let raceMeta = new Map<string, { race_name?: string; regatta_name?: string }>();

          if (raceIds.length > 0) {
            const { data: racesData } = await supabase
              .from('regatta_races')
              .select(`
                id,
                race_name,
                regatta:regatta_id(name)
              `)
              .in('id', raceIds);

            racesData?.forEach((race: any) => {
              raceMeta.set(race.id, {
                race_name: race.race_name,
                regatta_name: race.regatta?.name,
              });
            });
          }

          recentRaceAnalysis = (analysisRows || []).map(row => {
            const meta = raceMeta.get(row.race_id) || {};
            return {
              id: row.id,
              race_id: row.race_id,
              created_at: row.created_at,
              overall_satisfaction: row.overall_satisfaction,
              key_learnings: row.key_learnings || [],
              ai_coaching_feedback: row.ai_coaching_feedback || [],
              framework_scores: row.framework_scores || null,
              race_name: meta.race_name,
              regatta_name: meta.regatta_name,
            };
          });
        }

        const { data: strategyRows, error: strategyError } = await supabase
          .from('race_strategies')
          .select(`
            regatta_id,
            generated_at,
            strategy_type,
            favored_end,
            wind_strategy,
            confidence_score,
            strategy_content
          `)
          .eq('user_id', sailorUserId)
          .order('generated_at', { ascending: false })
          .limit(5);

        if (strategyError) {
          console.warn('[CoachingService] Failed to load race strategies for sailor', sailorUserId, strategyError);
        }

        if (!strategyError && strategyRows?.length) {
          const regattaIds = strategyRows.map((row: any) => row.regatta_id).filter(Boolean);
          let regattaMeta = new Map<string, string>();

          if (regattaIds.length > 0) {
            const { data: regattaRows } = await supabase
              .from('regattas')
              .select('id, name')
              .in('id', regattaIds);

            regattaRows?.forEach((regatta: any) => {
              regattaMeta.set(regatta.id, regatta.name);
            });
          }

          recentRaceStrategies = strategyRows.map((row: any) => ({
            regatta_id: row.regatta_id,
            regatta_name: regattaMeta.get(row.regatta_id) || undefined,
            generated_at: row.generated_at,
            strategy_type: row.strategy_type,
            favored_end: row.favored_end,
            wind_strategy: row.wind_strategy,
            confidence_score: row.confidence_score,
            strategy_content: row.strategy_content,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading shared race insights:', error);
    }

    return {
      ...rawClient,
      sailor: clientSailor,
      sessions,
      progressMetrics,
      stats: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        averageRating,
        lastSessionDate: lastSession?.completed_at,
        nextSessionDate: nextSession?.scheduled_at
      },
      recentRaceAnalysis,
      recentRaceStrategies,
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
   * Search for sailors by name or email to attach to a coach
   */
  async searchSailors(query: string): Promise<SailorSummary[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, primary_boat_class')
      .or(`email.ilike.%${cleanQuery}%,full_name.ilike.%${cleanQuery}%`)
      .limit(10);

    if (error) {
      console.error('Error searching sailors:', error);
      throw error;
    }

    return data || [];
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
    const baseQuery = supabase
      .from('coach_availability')
      .select('*')
      .eq('coach_id', coachId);

    let query = baseQuery;

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('end_time', endDate.toISOString());
    }

    query = query.order('start_time', { ascending: true });

    const { data, error } = await query;

    if (error) {
      // Column not found error (legacy schema without time-based slots)
      if (error.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await baseQuery;
        if (fallbackError) {
          console.error('Error fetching availability slots:', fallbackError);
          throw fallbackError;
        }
        return expandLegacyAvailabilitySlots(fallbackData || [], startDate, endDate);
      }

      console.error('Error fetching availability slots:', error);
      throw error;
    }

    if (data && data.length > 0 && !('start_time' in (data[0] || {}))) {
      return expandLegacyAvailabilitySlots(data, startDate, endDate);
    }

    const normalized = (data || []).filter((slot) => {
      if (!availableOnly) return true;
      if (typeof slot.is_available === 'boolean') {
        return slot.is_available;
      }
      return true;
    });

    return normalized;
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
   * Get coaching sessions for a sailor (confirmed/completed)
   */
  async getSailorSessions(status?: 'scheduled' | 'completed' | 'pending'): Promise<CoachingSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('coaching_sessions')
      .select(`
        *,
        coach:coach_profiles!coach_id (
          id,
          display_name,
          profile_photo_url
        )
      `)
      .eq('sailor_id', user.id)
      .order(status === 'scheduled' ? 'scheduled_at' : 'completed_at', { ascending: false, nullsFirst: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sailor sessions:', error);
      throw error;
    }

    return (data as CoachingSession[]) || [];
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

  /**
   * Notify all active coaches when a sailor shares a new race analysis
   */
  async notifyCoachesOfRaceAnalysis(params: {
    sailorUserId: string;
    sailorName?: string | null;
    raceId: string;
    raceName?: string;
    regattaName?: string;
    analysisSummary?: string | null;
    highlights?: string[];
  }): Promise<void> {
    try {
      const { data: clientRows, error: clientsError } = await supabase
        .from('coaching_clients')
        .select('id, status, coach_id')
        .eq('sailor_id', params.sailorUserId)
        .eq('status', 'active');

      if (clientsError) {
        throw clientsError;
      }

      if (!clientRows?.length) {
        return;
      }

      const coachIds = Array.from(
        new Set(
          clientRows
            .map((row: any) => row.coach_id)
            .filter((id: string | null | undefined): id is string => Boolean(id))
        )
      );

      if (coachIds.length === 0) {
        return;
      }

      const { data: coachProfiles, error: coachError } = await supabase
        .from('coach_profiles')
        .select(`
          id,
          display_name,
          user_id,
          users:coach_profiles_user_id_fkey (
            email,
            full_name
          )
        `)
        .in('id', coachIds);

      if (coachError) {
        throw coachError;
      }

      const coachesById = new Map(
        (coachProfiles || []).map((coach: any) => [coach.id, coach])
      );

      const activeCoaches = clientRows
        .map((row: any) => ({
          ...row,
          coach: coachesById.get(row.coach_id),
        }))
        .filter((row: any) => row.coach?.users?.email);

      if (activeCoaches.length === 0) {
        return;
      }

      const { emailService } = await import('./EmailService');

      await Promise.all(
        activeCoaches.map(async (row: any) => {
          const coachEmail = row.coach?.users?.email;
          if (!coachEmail) return;

          await emailService.sendCoachNotification({
            coach_name: row.coach?.display_name || row.coach?.users?.full_name || 'Coach',
            coach_email: coachEmail,
            notification_type: 'analysis_shared',
            sailor_name: params.sailorName || 'Sailor',
            race_name: params.raceName,
            regatta_name: params.regattaName,
            analysis_summary: params.analysisSummary || undefined,
            highlights: params.highlights,
          });
        })
      );
    } catch (error) {
      console.error('Error notifying coaches of shared race analysis:', error);
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

  // ============================================================================
  // RPC Helpers and View Mappers (NEW)
  // ============================================================================

  /**
   * Get complete coach dashboard data in a single RPC call
   * Uses the get_coach_dashboard_data RPC function for optimized data fetching
   */
  async getCoachDashboardData(coachId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_coach_dashboard_data', {
      p_coach_id: coachId,
    });

    if (error) {
      console.error('Error fetching coach dashboard data:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get sailor's coaching overview in a single RPC call
   * Uses the get_sailor_coaching_overview RPC function
   */
  async getSailorCoachingOverview(sailorId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_sailor_coaching_overview', {
      p_sailor_id: sailorId,
    });

    if (error) {
      console.error('Error fetching sailor coaching overview:', error);
      throw error;
    }

    return data;
  }

  /**
   * Search coaches with advanced filtering
   * Uses the search_coaches RPC function with ranking
   */
  async searchCoaches(params?: {
    specialties?: string[];
    minRating?: number;
    maxHourlyRate?: number;
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { data, error } = await supabase.rpc('search_coaches', {
      p_specialties: params?.specialties || null,
      p_min_rating: params?.minRating || null,
      p_max_hourly_rate: params?.maxHourlyRate || null,
      p_location: params?.location || null,
      p_limit: params?.limit || 20,
      p_offset: params?.offset || 0,
    });

    if (error) {
      console.error('Error searching coaches:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Query the coach_sailor_sessions_view directly
   * Provides access to the consolidated session view
   */
  async querySailorSessionsView(filters?: {
    coachId?: string;
    sailorId?: string;
    status?: string;
    limit?: number;
  }): Promise<any[]> {
    let query = supabase.from('coach_sailor_sessions_view').select('*');

    if (filters?.coachId) {
      query = query.eq('coach_id', filters.coachId);
    }

    if (filters?.sailorId) {
      query = query.eq('sailor_id', filters.sailorId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('scheduled_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error querying sailor sessions view:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get coach metrics from the aggregated view
   */
  async getCoachMetricsFromView(coachId: string): Promise<any> {
    const { data, error } = await supabase
      .from('coach_metrics_view')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    if (error) {
      console.error('Error fetching coach metrics:', error);
      return null;
    }

    return data;
  }

  /**
   * Get recent feedback from the feedback view
   */
  async getCoachFeedbackFromView(coachId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('coach_feedback_view')
      .select('*')
      .eq('coach_id', coachId)
      .order('feedback_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching coach feedback:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * DTO to view-model mapper for coaching sessions
   * Converts database DTOs to frontend-friendly view models
   */
  mapSessionToViewModel(session: any): any {
    return {
      id: session.session_id || session.id,
      coachId: session.coach_id,
      coachName: session.coach_name,
      coachPhoto: session.coach_photo,
      sailorId: session.sailor_id,
      sailorName: session.sailor_name,
      sailorEmail: session.sailor_email,
      sailorAvatar: session.sailor_avatar,
      type: session.session_type,
      duration: session.duration_minutes,
      scheduledAt: session.scheduled_at,
      completedAt: session.completed_at,
      status: session.status,
      location: session.location_notes,
      venueName: session.venue_name,
      venueLocation: session.venue_location,
      focusAreas: session.focus_areas || [],
      goals: session.goals,
      notes: session.session_notes,
      homework: session.homework,
      fee: {
        amount: session.fee_amount,
        currency: session.currency,
        paid: session.paid,
      },
      feedback: session.feedback_rating ? {
        rating: session.feedback_rating,
        text: session.feedback_text,
        skillImprovement: session.skill_improvement,
        wouldRecommend: session.would_recommend,
      } : null,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }

  /**
   * DTO to view-model mapper for coach profiles
   */
  mapCoachToViewModel(coach: any): any {
    return {
      id: coach.coach_id || coach.id,
      userId: coach.user_id,
      name: coach.display_name,
      photo: coach.profile_photo_url,
      bio: coach.bio,
      specialties: coach.specialties || [],
      hourlyRate: coach.hourly_rate,
      currency: coach.currency,
      location: coach.based_at,
      availableLocations: coach.available_locations || [],
      metrics: {
        rating: coach.average_rating,
        totalSessions: coach.total_sessions,
        totalClients: coach.total_clients,
        completedSessions: coach.total_completed_sessions,
        upcomingSessions: coach.upcoming_sessions,
      },
      verified: coach.verified,
      matchScore: coach.match_score,
    };
  }
}

export const coachingService = new CoachingService();

const LEGACY_DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const LEGACY_TIME_BLOCKS = [
  { key: 'morning', startHour: 8, endHour: 11 },
  { key: 'afternoon', startHour: 12, endHour: 16 },
  { key: 'evening', startHour: 17, endHour: 20 },
] as const;

function expandLegacyAvailabilitySlots(records: Record<string, any>[], startDate?: Date, endDate?: Date) {
  if (!records.length) {
    return [];
  }

  const windowStart = startDate ? new Date(startDate) : new Date();
  const windowEnd = endDate ? new Date(endDate) : addDays(windowStart, 14);
  const slots: any[] = [];

  records.forEach((record) => {
    const enabledBlocks = LEGACY_TIME_BLOCKS.filter((block) => record[block.key]);
    if (!enabledBlocks.length) {
      return;
    }

    for (let cursor = new Date(windowStart); cursor <= windowEnd; cursor = addDays(cursor, 1)) {
      const dayKey = LEGACY_DAY_KEYS[cursor.getDay()];
      if (!record[dayKey]) continue;

      enabledBlocks.forEach((block) => {
        const slotStart = new Date(cursor);
        slotStart.setHours(block.startHour, 0, 0, 0);

        const slotEnd = new Date(cursor);
        slotEnd.setHours(block.endHour, 0, 0, 0);

        slots.push({
          id: `${record.id}-${dayKey}-${block.key}-${slotStart.getTime()}`,
          coach_id: record.coach_id,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          is_available: true,
          notes: record.notes || null,
          recurring_pattern: 'legacy',
        });
      });
    }
  });

  return slots.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
}
