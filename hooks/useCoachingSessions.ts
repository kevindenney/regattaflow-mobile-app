import { createChannelName, realtimeService } from '@/services/RealtimeService';
import { supabase } from '@/services/supabase';
import { useCallback, useEffect, useState } from 'react';

export interface CoachingSession {
  id: string;
  coach_id: string;
  sailor_id: string | null;
  // Legacy fields (older schema)
  session_date?: string;
  session_time?: string;
  // Current schema variants
  scheduled_at?: string; // single timestamp
  start_time?: string; // range start
  end_time?: string; // range end
  duration_minutes: number;
  // Session types across schemas
  session_type?:
    | 'individual'
    | 'small_group'
    | 'large_group'
    | 'on_water'
    | 'video_review'
    | 'strategy'
    | 'boat_setup'
    | 'fitness'
    | 'mental_coaching';
  location?: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'scheduled' | null;
  notes?: string | null;
  price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  // Optional joined sailor info
  sailor?: {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string | null;
  } | null;
}

export interface BookingRequest {
  id: string;
  session_id: string;
  coach_id: string;
  sailor_id: string;
  requested_date: string;
  requested_time: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  created_at: string;
  updated_at: string;
  session?: CoachingSession;
}

/**
 * Hook for real-time coaching session updates
 * For coaches to monitor their sessions
 */
export function useCoachingSessions(coachId?: string) {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSessions = useCallback(async () => {
    if (!coachId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('coaching_sessions')
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
        // Prefer current schema order fields; fallback-compatible if missing
        .order('scheduled_at', { ascending: true, nullsFirst: false });

      if (queryError) throw queryError;
      setSessions((data as CoachingSession[]) || []);
    } catch (err) {
      console.error('[useCoachingSessions] Error loading sessions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;

    loadSessions();

    const channelName = createChannelName('coach-sessions', coachId);

    // Subscribe to session updates for this coach
    realtimeService.subscribe(
      channelName,
      {
        table: 'coaching_sessions',
        filter: `coach_id=eq.${coachId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setSessions((prev) => [...prev, payload.new as CoachingSession]);
        } else if (payload.eventType === 'UPDATE') {
          setSessions((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as CoachingSession) : s))
          );
        } else if (payload.eventType === 'DELETE') {
          setSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      }
    );

    return () => {
      realtimeService.unsubscribe(channelName);
    };
  }, [coachId, loadSessions]);

  return {
    sessions,
    loading,
    error,
    refresh: loadSessions,
  };
}

/**
 * Hook for real-time booking request updates
 * For coaches to monitor incoming booking requests
 */
export function useBookingRequests(coachId?: string) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRequests = useCallback(async () => {
    if (!coachId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('booking_requests')
        .select(`
          *,
          session:coaching_sessions(*)
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const bookingRequests = data || [];
      setRequests(bookingRequests);

      // Count unread/pending requests
      const pending = bookingRequests.filter((r: BookingRequest) => r.status === 'pending');
      setUnreadCount(pending.length);
    } catch (err) {
      console.error('[useBookingRequests] Error loading requests:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;

    loadRequests();

    const channelName = createChannelName('booking-requests', coachId);

    // Subscribe to booking request updates for this coach
    realtimeService.subscribe(
      channelName,
      {
        table: 'booking_requests',
        filter: `coach_id=eq.${coachId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRequest = payload.new as BookingRequest;
          setRequests((prev) => [newRequest, ...prev]);
          if (newRequest.status === 'pending') {
            setUnreadCount((prev) => prev + 1);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedRequest = payload.new as BookingRequest;
          setRequests((prev) =>
            prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r))
          );

          // Recalculate unread count
          setRequests((currentRequests) => {
            const pending = currentRequests.filter((r) => r.status === 'pending');
            setUnreadCount(pending.length);
            return currentRequests;
          });
        } else if (payload.eventType === 'DELETE') {
          setRequests((prev) => {
            const filtered = prev.filter((r) => r.id !== payload.old.id);
            const pending = filtered.filter((r) => r.status === 'pending');
            setUnreadCount(pending.length);
            return filtered;
          });
        }
      }
    );

    return () => {
      realtimeService.unsubscribe(channelName);
    };
  }, [coachId, loadRequests]);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
    } catch (err) {
      console.error('[useBookingRequests] Error accepting request:', err);
      throw err;
    }
  }, []);

  const declineRequest = useCallback(async (requestId: string, message?: string) => {
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({
          status: 'declined',
          message: message || 'Request declined'
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (err) {
      console.error('[useBookingRequests] Error declining request:', err);
      throw err;
    }
  }, []);

  return {
    requests,
    unreadCount,
    loading,
    error,
    refresh: loadRequests,
    acceptRequest,
    declineRequest,
  };
}

/**
 * Hook for sailors to monitor their own booking requests and sessions
 */
export function useSailorSessions(sailorId?: string) {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [myRequests, setMyRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!sailorId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Load sessions
      const { data: sessionsData } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('sailor_id', sailorId)
        .order('session_date', { ascending: true });

      setSessions(sessionsData || []);

      // Load booking requests
      const { data: requestsData } = await supabase
        .from('booking_requests')
        .select(`
          *,
          session:coaching_sessions(*)
        `)
        .eq('sailor_id', sailorId)
        .order('created_at', { ascending: false });

      setMyRequests(requestsData || []);
    } catch (err) {
      console.error('[useSailorSessions] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [sailorId]);

  useEffect(() => {
    if (!sailorId) return;

    loadData();

    // Subscribe to sessions
    const sessionsChannel = createChannelName('sailor-sessions', sailorId);
    realtimeService.subscribe(
      sessionsChannel,
      {
        table: 'coaching_sessions',
        filter: `sailor_id=eq.${sailorId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setSessions((prev) => [...prev, payload.new as CoachingSession]);
        } else if (payload.eventType === 'UPDATE') {
          setSessions((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as CoachingSession) : s))
          );
        } else if (payload.eventType === 'DELETE') {
          setSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      }
    );

    // Subscribe to booking requests
    const requestsChannel = createChannelName('sailor-requests', sailorId);
    realtimeService.subscribe(
      requestsChannel,
      {
        table: 'booking_requests',
        filter: `sailor_id=eq.${sailorId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setMyRequests((prev) => [payload.new as BookingRequest, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setMyRequests((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as BookingRequest) : r))
          );
        } else if (payload.eventType === 'DELETE') {
          setMyRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      }
    );

    return () => {
      realtimeService.unsubscribe(sessionsChannel);
      realtimeService.unsubscribe(requestsChannel);
    };
  }, [sailorId, loadData]);

  return {
    sessions,
    myRequests,
    loading,
    refresh: loadData,
  };
}
