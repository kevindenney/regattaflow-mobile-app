import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

interface ClubEvent {
  id: string;
  name: string;
  type: 'regatta' | 'race' | 'training' | 'social' | 'maintenance';
  date: string;
  end_date?: string;
  status: 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'in_progress' | 'completed' | 'cancelled';
  participants: number;
  capacity: number;
  venue: string;
  race_officer?: string;
  weather_outlook?: string;
}

interface ClubMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  membership_type: 'full' | 'associate' | 'youth' | 'family';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joined_date: string;
  last_activity?: string;
  skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  volunteer_hours: number;
  dues_status: 'current' | 'overdue' | 'exempt';
}

interface ClubFacility {
  id: string;
  name: string;
  type: 'dock' | 'boat_house' | 'club_house' | 'storage' | 'launch_ramp' | 'parking';
  status: 'operational' | 'maintenance' | 'closed' | 'reserved';
  capacity: number;
  current_usage: number;
  maintenance_due?: string;
  notes?: string;
}

interface VolunteerPosition {
  id: string;
  role: string;
  event_id: string;
  event_name: string;
  date: string;
  required_count: number;
  filled_count: number;
  volunteers: Array<{
    id: string;
    name: string;
    email: string;
    status: 'confirmed' | 'tentative' | 'declined';
  }>;
}

interface ClubFinancials {
  monthly_revenue: number;
  monthly_expenses: number;
  outstanding_dues: number;
  event_revenue: number;
  membership_revenue: number;
  facility_costs: number;
  insurance_costs: number;
  recent_transactions: Array<{
    id: string;
    type: 'revenue' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

interface ClubActivity {
  id: string;
  type: 'member_joined' | 'event_created' | 'race_completed' | 'facility_updated' | 'volunteer_signup';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

export interface ClubDashboardData {
  events: ClubEvent[];
  members: ClubMember[];
  facilities: ClubFacility[];
  volunteers: VolunteerPosition[];
  financials: ClubFinancials;
  recentActivity: ClubActivity[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    upcomingEvents: number;
    facilitiesOperational: number;
    memberGrowth: number;
    eventAttendance: number;
    revenueGrowth: number;
    volunteerFillRate: number;
  };
  loading: boolean;
  error: string | null;
}

export function useClubDashboardData(): ClubDashboardData {
  const { user } = useAuth();
  const [data, setData] = useState<ClubDashboardData>({
    events: [],
    members: [],
    facilities: [],
    volunteers: [],
    financials: {
      monthly_revenue: 0,
      monthly_expenses: 0,
      outstanding_dues: 0,
      event_revenue: 0,
      membership_revenue: 0,
      facility_costs: 0,
      insurance_costs: 0,
      recent_transactions: [],
    },
    recentActivity: [],
    stats: {
      totalMembers: 0,
      activeMembers: 0,
      upcomingEvents: 0,
      facilitiesOperational: 0,
      memberGrowth: 0,
      eventAttendance: 0,
      revenueGrowth: 0,
      volunteerFillRate: 0,
    },
    loading: true,
    error: null,
  });

  const fetchClubData = async () => {
    if (!user) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch club events (using regattas table as events)
      const { data: eventsData, error: eventsError } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', user.id)
        .gte('start_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Skip club members query since table doesn't exist and foreign key relationships are missing
      const membersData: any[] | null = null;
      const membersError = null;

      // Skip club facilities query since table doesn't exist
      const facilitiesData: any[] | null = null;
      const facilitiesError = null;

      // Skip volunteer positions query since table doesn't exist
      const volunteersData: any[] | null = null;
      const volunteersError = null;

      // Skip club financials query since table doesn't exist
      const financialsData: any[] | null = null;
      const financialsError = null;

      // Skip club activity query since table doesn't exist
      const activityData: any[] | null = null;
      const activityError = null;

      // Process events data
      const processedEvents: ClubEvent[] = eventsData?.map(event => ({
        id: event.id,
        name: event.name,
        type: event.type,
        date: event.date,
        end_date: event.end_date,
        status: event.status,
        participants: event.registrations?.[0]?.count || 0,
        capacity: event.capacity || 50,
        venue: event.venue || 'Club Waters',
        race_officer: event.race_officer?.name,
        weather_outlook: event.weather_outlook,
      })) || [];

      // Process members data
      const processedMembers: ClubMember[] = membersData?.map((member: any) => ({
        id: member.id,
        name: member.user?.name || 'Unknown Member',
        email: member.user?.email || '',
        avatar: member.user?.avatar_url,
        membership_type: member.membership_type || 'full',
        status: member.status || 'active',
        joined_date: member.joined_date,
        last_activity: member.activity?.last_activity,
        skill_level: member.skill_level,
        volunteer_hours: member.volunteer_hours || 0,
        dues_status: member.dues?.status || 'current',
      })) || [];

      // Process facilities data
      const processedFacilities: ClubFacility[] = facilitiesData?.map((facility: any) => ({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        status: facility.status || 'operational',
        capacity: facility.capacity || 0,
        current_usage: facility.current_usage || 0,
        maintenance_due: facility.maintenance_due,
        notes: facility.notes,
      })) || [];

      // Process volunteer data
      const processedVolunteers: VolunteerPosition[] = volunteersData?.map((position: any) => ({
        id: position.id,
        role: position.role,
        event_id: position.event_id,
        event_name: position.event?.name || 'Unknown Event',
        date: position.event?.date || '',
        required_count: position.required_count || 1,
        filled_count: position.assignments?.length || 0,
        volunteers: position.assignments?.map((assignment: any) => ({
          id: assignment.id,
          name: assignment.user?.name || 'Unknown',
          email: assignment.user?.email || '',
          status: assignment.status || 'confirmed',
        })) || [],
      })) || [];

      // Process financial data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyRevenue = financialsData?.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth &&
               itemDate.getFullYear() === currentYear &&
               item.type === 'revenue';
      }).reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

      const monthlyExpenses = financialsData?.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth &&
               itemDate.getFullYear() === currentYear &&
               item.type === 'expense';
      }).reduce((sum: number, item: any) => sum + item.amount, 0) || 0;

      const outstandingDues = membersData?.filter((member: any) => member.dues?.status === 'overdue')
        .reduce((sum: number, member: any) => sum + (member.dues?.amount || 0), 0) || 0;

      // Process recent activity
      const processedActivity: ClubActivity[] = activityData?.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp,
        user: activity.user ? {
          name: activity.user.name,
          avatar: activity.user.avatar_url,
        } : undefined,
        metadata: activity.metadata,
      })) || [];

      // Calculate statistics
      const totalMembers = processedMembers.length;
      const activeMembers = processedMembers.filter(m => m.status === 'active').length;
      const upcomingEvents = processedEvents.filter(e => new Date(e.date) > new Date()).length;
      const facilitiesOperational = processedFacilities.filter(f => f.status === 'operational').length;

      // Calculate growth metrics (simplified)
      const memberGrowth = Math.round((activeMembers / Math.max(totalMembers - activeMembers, 1)) * 100);
      const volunteerFillRate = processedVolunteers.length > 0
        ? Math.round(processedVolunteers.reduce((sum, pos) => sum + pos.filled_count, 0) /
                    processedVolunteers.reduce((sum, pos) => sum + pos.required_count, 1) * 100)
        : 0;

      setData(prev => ({
        ...prev,
        events: processedEvents,
        members: processedMembers,
        facilities: processedFacilities,
        volunteers: processedVolunteers,
        financials: {
          monthly_revenue: monthlyRevenue,
          monthly_expenses: monthlyExpenses,
          outstanding_dues: outstandingDues,
          event_revenue: financialsData?.filter((item: any) => item.category === 'events' && item.type === 'revenue')
            .reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          membership_revenue: financialsData?.filter((item: any) => item.category === 'membership' && item.type === 'revenue')
            .reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          facility_costs: financialsData?.filter((item: any) => item.category === 'facilities' && item.type === 'expense')
            .reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          insurance_costs: financialsData?.filter((item: any) => item.category === 'insurance' && item.type === 'expense')
            .reduce((sum: number, item: any) => sum + item.amount, 0) || 0,
          recent_transactions: financialsData?.slice(0, 10).map((item: any) => ({
            id: item.id,
            type: item.type,
            category: item.category,
            amount: item.amount,
            date: item.date,
            description: item.description || item.category,
          })) || [],
        },
        recentActivity: processedActivity,
        stats: {
          totalMembers,
          activeMembers,
          upcomingEvents,
          facilitiesOperational,
          memberGrowth,
          eventAttendance: Math.round(processedEvents.reduce((sum, event) =>
            sum + (event.participants / Math.max(event.capacity, 1)), 0) / Math.max(processedEvents.length, 1) * 100),
          revenueGrowth: 5, // Placeholder
          volunteerFillRate,
        },
        loading: false,
      }));

    } catch (error) {
      console.error('Error fetching club dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [user]);

  return data;
}