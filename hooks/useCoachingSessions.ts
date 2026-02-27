import { createChannelName, realtimeService } from '@/services/RealtimeService';
import { supabase } from '@/services/supabase';
import { coachingService } from '@/services/CoachingService';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useCoachingSessions');

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
  session_id?: string | null;
  coach_id: string;
  sailor_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  requested_start_time?: string | null;
  requested_end_time?: string | null;
  session_type?: string | null;
  sailor_message?: string | null;
  coach_response?: string | null;
  total_amount_cents?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  expires_at?: string | null;
  expiration_warning_sent?: boolean;
  message?: string | null; // legacy field fallback
  session?: CoachingSession | null;
}

/**
 * Hook for real-time coaching session updates
 * For coaches to monitor their sessions
 */
export function useCoachingSessions(coachId?: string) {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const realtimeRunIdRef = useRef(0);
  const activeCoachIdRef = useRef<string | undefined>(coachId);

  useEffect(() => {
    activeCoachIdRef.current = coachId;
  }, [coachId]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadRunIdRef.current += 1;
      realtimeRunIdRef.current += 1;
    };
  }, []);

  const loadSessions = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const targetCoachId = coachId;
    const canCommit = () =>
      mountedRef.current &&
      runId === loadRunIdRef.current &&
      activeCoachIdRef.current === targetCoachId;

    if (!targetCoachId) {
      if (!canCommit()) return;
      setSessions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('coach_id', targetCoachId)
        .order('scheduled_at', { ascending: true, nullsFirst: false });

      if (queryError) throw queryError;
      if (!canCommit()) return;
      setSessions((data as CoachingSession[]) || []);
    } catch (err) {
      logger.error('Error loading sessions', err);
      if (!canCommit()) return;
      setError(err as Error);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;
    const runId = ++realtimeRunIdRef.current;
    const targetCoachId = coachId;
    const canCommit = () =>
      mountedRef.current &&
      runId === realtimeRunIdRef.current &&
      activeCoachIdRef.current === targetCoachId;

    void loadSessions();

    const channelName = createChannelName('coach-sessions', coachId);
    const onSessionPayload = (payload: any) => {
      if (!canCommit()) return;
      if (payload.eventType === 'INSERT') {
        setSessions((prev) => [...prev, payload.new as CoachingSession]);
      } else if (payload.eventType === 'UPDATE') {
        setSessions((prev) =>
          prev.map((s) => (s.id === payload.new.id ? (payload.new as CoachingSession) : s))
        );
      } else if (payload.eventType === 'DELETE') {
        setSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
      }
    };

    let subscribed = false;
    try {
      realtimeService.subscribe(
        channelName,
        {
          table: 'coaching_sessions',
          filter: `coach_id=eq.${coachId}`,
        },
        onSessionPayload
      );
      subscribed = true;
    } catch (err) {
      logger.error('Error setting up coaching_sessions realtime subscription', err);
      setError(new Error('Realtime coaching updates unavailable. Pull to refresh.'));
    }

    return () => {
      if (realtimeRunIdRef.current === runId) {
        realtimeRunIdRef.current += 1;
      }
      if (subscribed) {
        void realtimeService.unsubscribe(channelName, onSessionPayload);
      }
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
  const mountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const realtimeRunIdRef = useRef(0);
  const activeCoachIdRef = useRef<string | undefined>(coachId);

  useEffect(() => {
    activeCoachIdRef.current = coachId;
  }, [coachId]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadRunIdRef.current += 1;
      realtimeRunIdRef.current += 1;
    };
  }, []);

  const loadRequests = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const targetCoachId = coachId;
    const canCommit = () =>
      mountedRef.current &&
      runId === loadRunIdRef.current &&
      activeCoachIdRef.current === targetCoachId;

    if (!targetCoachId) {
      if (!canCommit()) return;
      setRequests([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('session_bookings')
        .select('*')
        .eq('coach_id', targetCoachId)
        .order('requested_start_time', { ascending: true });

      if (queryError) throw queryError;

      const bookingRequests = (data as BookingRequest[]) || [];
      if (!canCommit()) return;
      setRequests(bookingRequests);

      // Count unread/pending requests
      setUnreadCount(bookingRequests.filter((r) => r.status === 'pending').length);
    } catch (err) {
      logger.error('Error loading booking requests', err);
      if (!canCommit()) return;
      setError(err as Error);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    if (!coachId) return;
    const runId = ++realtimeRunIdRef.current;
    const targetCoachId = coachId;
    const canCommit = () =>
      mountedRef.current &&
      runId === realtimeRunIdRef.current &&
      activeCoachIdRef.current === targetCoachId;

    void loadRequests();

    const channelName = createChannelName('booking-requests', coachId);
    const onBookingPayload = (payload: any) => {
      if (!canCommit()) return;
      if (payload.eventType === 'INSERT') {
        const newRequest = payload.new as BookingRequest;
        setRequests((prev) => {
          const updated = [newRequest, ...prev];
          setUnreadCount(updated.filter((r) => r.status === 'pending').length);
          return updated;
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedRequest = payload.new as BookingRequest;
        setRequests((prev) => {
          const updated = prev.map((r) => (r.id === updatedRequest.id ? updatedRequest : r));
          setUnreadCount(updated.filter((r) => r.status === 'pending').length);
          return updated;
        });
      } else if (payload.eventType === 'DELETE') {
        setRequests((prev) => {
          const filtered = prev.filter((r) => r.id !== payload.old.id);
          setUnreadCount(filtered.filter((r) => r.status === 'pending').length);
          return filtered;
        });
      }
    };

    let subscribed = false;
    try {
      realtimeService.subscribe(
        channelName,
        {
          table: 'session_bookings',
          filter: `coach_id=eq.${coachId}`,
        },
        onBookingPayload
      );
      subscribed = true;
    } catch (err) {
      logger.error('Error setting up session_bookings realtime subscription', err);
      setError(new Error('Realtime booking updates unavailable. Pull to refresh.'));
    }

    return () => {
      if (realtimeRunIdRef.current === runId) {
        realtimeRunIdRef.current += 1;
      }
      if (subscribed) {
        void realtimeService.unsubscribe(channelName, onBookingPayload);
      }
    };
  }, [coachId, loadRequests]);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      await coachingService.acceptBookingRequest(requestId);
    } catch (err) {
      logger.error('Error accepting booking request', err);
      throw err;
    }
  }, []);

  const declineRequest = useCallback(async (requestId: string, message?: string) => {
    try {
      await coachingService.rejectBookingRequest(requestId, message || 'Request declined by coach');
    } catch (err) {
      logger.error('Error declining booking request', err);
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
  const mountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const realtimeRunIdRef = useRef(0);
  const activeSailorIdRef = useRef<string | undefined>(sailorId);

  useEffect(() => {
    activeSailorIdRef.current = sailorId;
  }, [sailorId]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      loadRunIdRef.current += 1;
      realtimeRunIdRef.current += 1;
    };
  }, []);

  const loadData = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const targetSailorId = sailorId;
    const canCommit = () =>
      mountedRef.current &&
      runId === loadRunIdRef.current &&
      activeSailorIdRef.current === targetSailorId;

    if (!targetSailorId) {
      if (!canCommit()) return;
      setSessions([]);
      setMyRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Load sessions
      const { data: sessionsData } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('sailor_id', targetSailorId)
        .order('session_date', { ascending: true });

      if (!canCommit()) return;
      setSessions(sessionsData || []);

      // Load booking requests
      const { data: requestsData } = await supabase
        .from('session_bookings')
        .select('*')
        .eq('sailor_id', targetSailorId)
        .order('requested_start_time', { ascending: true });

      if (!canCommit()) return;
      setMyRequests(requestsData || []);
    } catch (err) {
      logger.error('Error loading sailor sessions data', err);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [sailorId]);

  useEffect(() => {
    if (!sailorId) return;
    const runId = ++realtimeRunIdRef.current;
    const targetSailorId = sailorId;
    const canCommit = () =>
      mountedRef.current &&
      runId === realtimeRunIdRef.current &&
      activeSailorIdRef.current === targetSailorId;

    void loadData();

    // Subscribe to sessions
    const sessionsChannel = createChannelName('sailor-sessions', sailorId);
    const onSailorSessionsPayload = (payload: any) => {
      if (!canCommit()) return;
      if (payload.eventType === 'INSERT') {
        setSessions((prev) => [...prev, payload.new as CoachingSession]);
      } else if (payload.eventType === 'UPDATE') {
        setSessions((prev) =>
          prev.map((s) => (s.id === payload.new.id ? (payload.new as CoachingSession) : s))
        );
      } else if (payload.eventType === 'DELETE') {
        setSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
      }
    };
    let sessionsSubscribed = false;
    try {
      realtimeService.subscribe(
        sessionsChannel,
        {
          table: 'coaching_sessions',
          filter: `sailor_id=eq.${sailorId}`,
        },
        onSailorSessionsPayload
      );
      sessionsSubscribed = true;
    } catch (err) {
      logger.error('Error setting up sailor coaching_sessions realtime subscription', err);
    }

    // Subscribe to booking requests
    const requestsChannel = createChannelName('sailor-requests', sailorId);
    const onSailorRequestsPayload = (payload: any) => {
      if (!canCommit()) return;
      if (payload.eventType === 'INSERT') {
        setMyRequests((prev) => [payload.new as BookingRequest, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setMyRequests((prev) =>
          prev.map((r) => (r.id === payload.new.id ? (payload.new as BookingRequest) : r))
        );
      } else if (payload.eventType === 'DELETE') {
        setMyRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
      }
    };
    let requestsSubscribed = false;
    try {
      realtimeService.subscribe(
        requestsChannel,
        {
          table: 'session_bookings',
          filter: `sailor_id=eq.${sailorId}`,
        },
        onSailorRequestsPayload
      );
      requestsSubscribed = true;
    } catch (err) {
      logger.error('Error setting up sailor session_bookings realtime subscription', err);
    }

    return () => {
      if (realtimeRunIdRef.current === runId) {
        realtimeRunIdRef.current += 1;
      }
      if (sessionsSubscribed) {
        void realtimeService.unsubscribe(sessionsChannel, onSailorSessionsPayload);
      }
      if (requestsSubscribed) {
        void realtimeService.unsubscribe(requestsChannel, onSailorRequestsPayload);
      }
    };
  }, [sailorId, loadData]);

  return {
    sessions,
    myRequests,
    loading,
    refresh: loadData,
  };
}
