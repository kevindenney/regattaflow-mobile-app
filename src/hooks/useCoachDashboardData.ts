import { useState, useEffect } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

interface CoachClient {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'active' | 'inactive' | 'trial';
  next_session?: {
    id: string;
    date: string;
    type: 'live_session' | 'race_support' | 'program_review';
    venue?: string;
  };
  performance_trend: 'improving' | 'stable' | 'declining';
  last_session_date?: string;
  total_sessions: number;
}

interface CoachSession {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar?: string;
  type: 'live_session' | 'race_support' | 'program_review' | 'strategy_session';
  date: string;
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  preparation_status: 'not_started' | 'in_progress' | 'ready';
  venue?: string;
  notes?: string;
  earnings: number;
}

interface MarketplaceLead {
  id: string;
  client_name: string;
  client_email: string;
  service_requested: 'live_session' | 'program' | 'race_support';
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  budget_range: string;
  venue_preference?: string;
  message: string;
  created_at: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'declined';
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
  transactions: Array<{
    id: string;
    client: string;
    service: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  breakdown: {
    sessions: number;
    programs: number;
    raceDaySupport: number;
    other: number;
  };
}

interface Resource {
  id: string;
  title: string;
  type: 'template' | 'guide' | 'video' | 'document';
  description: string;
  category: string;
  downloads: number;
  lastUsed?: string;
}

export interface CoachDashboardData {
  clients: CoachClient[];
  sessions: CoachSession[];
  leads: MarketplaceLead[];
  earnings: EarningsData;
  resources: Resource[];
  loading: boolean;
  error: string | null;
}

export function useCoachDashboardData(): CoachDashboardData {
  const { user } = useAuth();
  const [data, setData] = useState<CoachDashboardData>({
    clients: [],
    sessions: [],
    leads: [],
    earnings: {
      monthly: { current: 0, previous: 0, projected: 0 },
      weekly: { current: 0, previous: 0 },
      transactions: [],
      breakdown: { sessions: 0, programs: 0, raceDaySupport: 0, other: 0 },
    },
    resources: [],
    loading: true,
    error: null,
  });

  const fetchCoachData = async () => {
    if (!user) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Skip coach clients query since table doesn't exist
      const clientsData = null;
      const clientsError = null;

      // Skip coaching sessions query since table doesn't exist
      const sessionsData = null;
      const sessionsError = null;

      // Skip marketplace leads query since table doesn't exist
      const leadsData = null;
      const leadsError = null;

      // Skip coach earnings query since table doesn't exist
      const earningsData = null;
      const earningsError = null;

      // Skip coaching resources query since table doesn't exist
      const resourcesData = null;
      const resourcesError = null;

      // Process clients data
      const processedClients: CoachClient[] = clientsData?.map(client => ({
        id: client.id,
        name: client.user?.name || 'Unknown Client',
        email: client.user?.email || '',
        avatar: client.user?.avatar_url,
        skill_level: client.skill_level || 'beginner',
        status: client.status || 'active',
        next_session: client.next_session ? {
          id: client.next_session.id,
          date: client.next_session.date,
          type: client.next_session.type,
          venue: client.next_session.venue,
        } : undefined,
        performance_trend: client.performance?.trend || 'stable',
        last_session_date: client.last_session_date,
        total_sessions: client.session_count?.[0]?.count || 0,
      })) || [];

      // Process sessions data
      const processedSessions: CoachSession[] = sessionsData?.map(session => ({
        id: session.id,
        client_id: session.client_id,
        client_name: session.client?.name || 'Unknown Client',
        client_avatar: session.client?.avatar_url,
        type: session.type,
        date: session.date,
        duration: session.duration || 60,
        status: new Date(session.date) > new Date() ? 'upcoming' :
                session.status || 'completed',
        preparation_status: session.preparation_status || 'not_started',
        venue: session.venue,
        notes: session.notes,
        earnings: session.fee || 0,
      })) || [];

      // Process leads data
      const processedLeads: MarketplaceLead[] = leadsData?.map(lead => ({
        id: lead.id,
        client_name: lead.client_name,
        client_email: lead.client_email,
        service_requested: lead.service_requested,
        skill_level: lead.skill_level,
        budget_range: lead.budget_range || 'Not specified',
        venue_preference: lead.venue_preference,
        message: lead.message || '',
        created_at: lead.created_at,
        status: lead.status || 'new',
      })) || [];

      // Process earnings data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyEarnings = earningsData?.filter(earning => {
        const earningDate = new Date(earning.date);
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      }).reduce((sum, earning) => sum + earning.amount, 0) || 0;

      const previousMonthEarnings = earningsData?.filter(earning => {
        const earningDate = new Date(earning.date);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return earningDate.getMonth() === prevMonth && earningDate.getFullYear() === prevYear;
      }).reduce((sum, earning) => sum + earning.amount, 0) || 0;

      const weeklyEarnings = earningsData?.filter(earning => {
        const earningDate = new Date(earning.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return earningDate >= weekAgo;
      }).reduce((sum, earning) => sum + earning.amount, 0) || 0;

      const previousWeekEarnings = earningsData?.filter(earning => {
        const earningDate = new Date(earning.date);
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return earningDate >= twoWeeksAgo && earningDate < weekAgo;
      }).reduce((sum, earning) => sum + earning.amount, 0) || 0;

      // Calculate breakdown by service type
      const breakdown = earningsData?.reduce((acc, earning) => {
        switch (earning.service_type) {
          case 'live_session':
            acc.sessions += earning.amount;
            break;
          case 'program':
            acc.programs += earning.amount;
            break;
          case 'race_support':
            acc.raceDaySupport += earning.amount;
            break;
          default:
            acc.other += earning.amount;
        }
        return acc;
      }, { sessions: 0, programs: 0, raceDaySupport: 0, other: 0 }) ||
      { sessions: 0, programs: 0, raceDaySupport: 0, other: 0 };

      const transactions = earningsData?.slice(0, 10).map(earning => ({
        id: earning.id,
        client: earning.client_name || 'Unknown Client',
        service: earning.service_type || 'Session',
        amount: earning.amount,
        date: earning.date,
        status: earning.status || 'paid' as 'paid' | 'pending' | 'overdue',
      })) || [];

      // Process resources data
      const processedResources: Resource[] = resourcesData?.map(resource => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        description: resource.description || '',
        category: resource.category || 'General',
        downloads: resource.download_count || 0,
        lastUsed: resource.last_used,
      })) || [];

      setData(prev => ({
        ...prev,
        clients: processedClients,
        sessions: processedSessions,
        leads: processedLeads,
        earnings: {
          monthly: {
            current: monthlyEarnings,
            previous: previousMonthEarnings,
            projected: Math.round(monthlyEarnings * 1.15), // Simple projection
          },
          weekly: {
            current: weeklyEarnings,
            previous: previousWeekEarnings,
          },
          transactions,
          breakdown,
        },
        resources: processedResources,
        loading: false,
      }));

    } catch (error) {
      console.error('Error fetching coach dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, [user]);

  return data;
}