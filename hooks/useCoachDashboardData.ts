import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface CoachClient {
  id: string;
  sailor_id: string;
  name: string;
  email: string;
  avatar?: string;
  skill_level: string;
  status: 'active' | 'inactive' | 'completed';
  primary_boat_class?: string;
  goals?: string;
  last_session_date?: string;
  total_sessions: number;
  coach_notes?: string;
}

interface CoachSession {
  id: string;
  sailor_id: string;
  sailor_name: string;
  sailor_avatar?: string;
  session_type: string;
  scheduled_at: string;
  completed_at?: string;
  duration_minutes: number;
  status: 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  fee_amount: number;
  currency: string;
  paid: boolean;
  payment_status?: string;
  session_notes?: string;
  homework?: string;
}

interface SessionFeedbackEntry {
  id: string;
  session_id: string;
  rating: number;
  feedback_text?: string;
  created_at: string;
}

interface EarningsData {
  monthly: {
    current: number;
    previous: number;
    projected: number;
  };
  weekly: {
    current: number;
    previous: number;
  };
  totalOutstanding: number;
  currency: string;
}

export interface CoachDashboardData {
  coachProfileId: string | null;
  clients: CoachClient[];
  sessions: CoachSession[];
  feedback: SessionFeedbackEntry[];
  earnings: EarningsData;
  averageRating: number | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfPreviousMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return d;
}

function endOfPreviousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}

function oneWeekAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

function twoWeeksAgo(): Date {
  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCoachDashboardData(): CoachDashboardData {
  const { user } = useAuth();

  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);
  const [clients, setClients] = useState<CoachClient[]>([]);
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [feedback, setFeedback] = useState<SessionFeedbackEntry[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>({
    monthly: { current: 0, previous: 0, projected: 0 },
    weekly: { current: 0, previous: 0 },
    totalOutstanding: 0,
    currency: 'USD',
  });
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual refetch trigger
  const [refetchKey, setRefetchKey] = useState(0);
  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Get coach profile id
        const { data: coachProfile, error: profileError } = await supabase
          .from('coach_profiles')
          .select('id, hourly_rate, currency, average_rating')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          throw new Error(`Failed to load coach profile: ${profileError.message}`);
        }

        if (!coachProfile) {
          if (!cancelled) {
            setCoachProfileId(null);
            setClients([]);
            setSessions([]);
            setFeedback([]);
            setAverageRating(null);
            setLoading(false);
            setError('No coach profile found. Please complete your coach onboarding.');
          }
          return;
        }

        const coachId = coachProfile.id;
        if (!cancelled) {
          setCoachProfileId(coachId);
          setAverageRating(coachProfile.average_rating ?? null);
        }

        const defaultCurrency = coachProfile.currency || 'USD';

        // 2. Fetch clients, sessions, and feedback in parallel
        const [clientsResult, sessionsResult] = await Promise.all([
          // Coaching clients with user info
          supabase
            .from('coaching_clients')
            .select(`
              id,
              sailor_id,
              status,
              goals,
              skill_level,
              primary_boat_class,
              total_sessions,
              last_session_date,
              coach_notes,
              sailor:users!coaching_clients_sailor_id_fkey (
                id,
                full_name,
                email,
                avatar_url
              )
            `)
            .eq('coach_id', coachId),

          // Coaching sessions with sailor info
          supabase
            .from('coaching_sessions')
            .select(`
              id,
              sailor_id,
              session_type,
              scheduled_at,
              completed_at,
              duration_minutes,
              status,
              fee_amount,
              currency,
              paid,
              payment_status,
              session_notes,
              homework,
              sailor:users!coaching_sessions_sailor_id_fkey (
                id,
                full_name,
                email,
                avatar_url
              )
            `)
            .eq('coach_id', coachId)
            .order('scheduled_at', { ascending: false }),
        ]);

        if (cancelled) return;

        // Handle clients
        if (clientsResult.error) {
          console.warn('Error fetching coaching clients:', clientsResult.error.message);
        }

        const processedClients: CoachClient[] = (clientsResult.data ?? []).map((row: any) => {
          const sailorUser = row.sailor;
          return {
            id: row.id,
            sailor_id: row.sailor_id,
            name: sailorUser?.full_name || 'Unknown',
            email: sailorUser?.email || '',
            avatar: sailorUser?.avatar_url || undefined,
            skill_level: row.skill_level || 'beginner',
            status: row.status || 'active',
            primary_boat_class: row.primary_boat_class || undefined,
            goals: row.goals || undefined,
            last_session_date: row.last_session_date || undefined,
            total_sessions: row.total_sessions ?? 0,
            coach_notes: row.coach_notes || undefined,
          };
        });

        // Handle sessions
        if (sessionsResult.error) {
          console.warn('Error fetching coaching sessions:', sessionsResult.error.message);
        }

        const rawSessions = sessionsResult.data ?? [];

        const processedSessions: CoachSession[] = rawSessions.map((row: any) => {
          const sailorUser = row.sailor;
          return {
            id: row.id,
            sailor_id: row.sailor_id,
            sailor_name: sailorUser?.full_name || 'Unknown',
            sailor_avatar: sailorUser?.avatar_url || undefined,
            session_type: row.session_type || 'general',
            scheduled_at: row.scheduled_at,
            completed_at: row.completed_at || undefined,
            duration_minutes: row.duration_minutes ?? 60,
            status: row.status || 'pending',
            fee_amount: row.fee_amount ?? 0,
            currency: row.currency || defaultCurrency,
            paid: row.paid ?? false,
            payment_status: row.payment_status || undefined,
            session_notes: row.session_notes || undefined,
            homework: row.homework || undefined,
          };
        });

        // 3. Fetch session feedback for this coach's sessions
        const sessionIds = rawSessions.map((s: any) => s.id);
        let processedFeedback: SessionFeedbackEntry[] = [];

        if (sessionIds.length > 0) {
          const { data: feedbackData, error: feedbackError } = await supabase
            .from('session_feedback')
            .select('id, session_id, rating, feedback_text, created_at')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false });

          if (feedbackError) {
            console.warn('Error fetching session feedback:', feedbackError.message);
          }

          processedFeedback = (feedbackData ?? []).map((fb: any) => ({
            id: fb.id,
            session_id: fb.session_id,
            rating: fb.rating,
            feedback_text: fb.feedback_text || undefined,
            created_at: fb.created_at,
          }));
        }

        if (cancelled) return;

        // 4. Calculate earnings from completed sessions
        const now = new Date();
        const monthStart = startOfMonth(now).toISOString();
        const prevMonthStart = startOfPreviousMonth(now).toISOString();
        const prevMonthEnd = endOfPreviousMonth(now).toISOString();
        const weekAgo = oneWeekAgo().toISOString();
        const twoWeekAgo = twoWeeksAgo().toISOString();

        const completedPaidSessions = rawSessions.filter(
          (s: any) => s.status === 'completed' && s.paid === true
        );

        // Current month earnings
        const currentMonthEarnings = completedPaidSessions
          .filter((s: any) => s.completed_at && s.completed_at >= monthStart)
          .reduce((sum: number, s: any) => sum + (s.fee_amount ?? 0), 0);

        // Previous month earnings
        const previousMonthEarnings = completedPaidSessions
          .filter(
            (s: any) =>
              s.completed_at &&
              s.completed_at >= prevMonthStart &&
              s.completed_at <= prevMonthEnd
          )
          .reduce((sum: number, s: any) => sum + (s.fee_amount ?? 0), 0);

        // Current week earnings
        const currentWeekEarnings = completedPaidSessions
          .filter((s: any) => s.completed_at && s.completed_at >= weekAgo)
          .reduce((sum: number, s: any) => sum + (s.fee_amount ?? 0), 0);

        // Previous week earnings
        const previousWeekEarnings = completedPaidSessions
          .filter(
            (s: any) =>
              s.completed_at &&
              s.completed_at >= twoWeekAgo &&
              s.completed_at < weekAgo
          )
          .reduce((sum: number, s: any) => sum + (s.fee_amount ?? 0), 0);

        // Outstanding: completed but not paid
        const totalOutstanding = rawSessions
          .filter((s: any) => s.status === 'completed' && !s.paid)
          .reduce((sum: number, s: any) => sum + (s.fee_amount ?? 0), 0);

        // Simple projection: if we have a partial month, extrapolate linearly
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const projectedMonthly =
          dayOfMonth > 0
            ? Math.round((currentMonthEarnings / dayOfMonth) * daysInMonth)
            : 0;

        // Compute average rating from feedback if profile rating not set
        let computedRating = coachProfile.average_rating ?? null;
        if (computedRating === null && processedFeedback.length > 0) {
          const sum = processedFeedback.reduce((acc, fb) => acc + fb.rating, 0);
          computedRating = Math.round((sum / processedFeedback.length) * 10) / 10;
        }

        if (!cancelled) {
          setClients(processedClients);
          setSessions(processedSessions);
          setFeedback(processedFeedback);
          setAverageRating(computedRating);
          setEarnings({
            monthly: {
              current: currentMonthEarnings,
              previous: previousMonthEarnings,
              projected: projectedMonthly,
            },
            weekly: {
              current: currentWeekEarnings,
              previous: previousWeekEarnings,
            },
            totalOutstanding,
            currency: defaultCurrency,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching coach dashboard data:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refetchKey]);

  return {
    coachProfileId,
    clients,
    sessions,
    feedback,
    earnings,
    averageRating,
    loading,
    error,
    refetch,
  };
}
