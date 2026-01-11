import { CoachDashboard } from '@/components/coaching/CoachDashboard';
import { TufteCoachRow } from '@/components/coaching/TufteCoachRow';
import {
    useCoachMetrics,
    useCoachResources,
    useCoachSpotlights,
    useRecentCoachSessions,
    useUpcomingCoachSessions,
} from '@/hooks/useCoachData';
import { useAuth } from '@/providers/AuthProvider';
import { CoachProfile, CoachingSession } from '@/services/CoachingService';
import { coachStrategyService } from '@/services/CoachStrategyService';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type DiscoverCoach = CoachProfile & {
  hourly_rate_usd?: number | null;
  rating?: number | null;
};

type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type QuickAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type SpotlightProgram = {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  focus: string[];
  color: string;
};

type FeedbackItem = {
  id: string;
  coach: string;
  sailor: string;
  sessionType: string;
  summary: string;
  highlight: string;
  rating: number;
  date: string;
};

type ResourceItem = {
  id: string;
  title: string;
  category: string;
  readTime: string;
};

const MOCK_SESSIONS: CoachingSession[] = [
  {
    id: 'mock-session-1',
    coach_id: 'coach_emily',
    sailor_id: 'sailor_ava',
    session_type: 'strategy',
    duration_minutes: 75,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
    status: 'confirmed',
    location_notes: 'Royal HKYC • Dock C briefing room',
    focus_areas: ['start_line', 'wind_shifts', 'mark_rounding'],
    goals: 'Build pre-start routine for oscillating breeze',
    currency: 'USD',
    paid: true,
    fee_amount: 22000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coach: {
      id: 'coach_emily',
      display_name: 'Emily Carter',
      profile_photo_url:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=60',
    },
  },
  {
    id: 'mock-session-2',
    coach_id: 'coach_luke',
    sailor_id: 'sailor_mateo',
    session_type: 'video_review',
    duration_minutes: 60,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 54).toISOString(),
    status: 'scheduled',
    location_notes: 'Zoom • Screen share enabled',
    focus_areas: ['downwind_modes', 'overtaking'],
    homework: 'Pull mark rounding clips from last regatta',
    currency: 'USD',
    paid: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coach: {
      id: 'coach_luke',
      display_name: 'Luke Anders',
      profile_photo_url:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=320&q=60',
    },
  },
  {
    id: 'mock-session-3',
    coach_id: 'coach_sophia',
    sailor_id: 'sailor_hannah',
    session_type: 'boat_setup',
    duration_minutes: 90,
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: 'pending',
    location_notes: 'Dockside tuning • Etchells HK-112',
    focus_areas: ['rig_tension', 'mast_rake'],
    goals: 'Baseline rig tune for 18-22kt NE breeze',
    currency: 'USD',
    paid: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coach: {
      id: 'coach_sophia',
      display_name: 'Sophia Lin',
      profile_photo_url:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=320&q=60',
    },
  },
] as CoachingSession[];

const MOCK_COACHES: DiscoverCoach[] = [
  {
    id: 'coach_emily',
    user_id: 'user_emily',
    display_name: 'Emily Carter',
    profile_photo_url:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=60',
    bio: 'Olympic campaign strategist specialising in match racing & one-design keelboats.',
    specialties: ['pre-starts', 'match_racing', 'race_strategy', 'mental_game'],
    experience_years: 12,
    certifications: ['World Sailing L3 Coach', 'RegattaFlow Playbook Performance'],
    available_for_sessions: true,
    hourly_rate: 24000,
    currency: 'USD',
    based_at: 'Royal Hong Kong Yacht Club',
    available_locations: ['Asia Pacific', 'Remote'],
    total_sessions: 318,
    total_clients: 64,
    average_rating: 4.9,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hourly_rate_usd: 24000,
    rating: 4.9,
  },
  {
    id: 'coach_luke',
    user_id: 'user_luke',
    display_name: 'Luke Anders',
    profile_photo_url:
      'https://images.unsplash.com/photo-1542144582-1ba00456b5d5?auto=format&fit=crop&w=320&q=60',
    bio: 'AC40 flight controller turned performance coach. Downwind VMG obsessive.',
    specialties: ['downwind_modes', 'foiling', 'video_analysis'],
    experience_years: 8,
    certifications: ['US Sailing L2 Coach'],
    available_for_sessions: true,
    hourly_rate: 20000,
    currency: 'USD',
    based_at: 'SailGP Inspire Programme',
    available_locations: ['Remote', 'San Francisco', 'Sydney'],
    total_sessions: 204,
    total_clients: 51,
    average_rating: 4.8,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hourly_rate_usd: 20000,
    rating: 4.8,
  },
  {
    id: 'coach_sophia',
    user_id: 'user_sophia',
    display_name: 'Sophia Lin',
    profile_photo_url:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=60',
    bio: 'Former Volvo Ocean Race bow, now tuning & boat-speed coach for Etchells and J/70 teams.',
    specialties: ['boat_speed', 'rig_tune', 'sail_shape', 'heavy_air'],
    experience_years: 15,
    certifications: ['RYA High Performance', 'RegattaFlow Playbook Rigging'],
    available_for_sessions: true,
    hourly_rate: 22000,
    currency: 'USD',
    based_at: 'Aberdeen Boat Club',
    available_locations: ['Hong Kong', 'Singapore', 'Remote'],
    total_sessions: 412,
    total_clients: 83,
    average_rating: 5,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hourly_rate_usd: 22000,
    rating: 5,
  },
];

const MOCK_PROGRAMS: SpotlightProgram[] = [
  {
    id: 'program_start-line',
    title: 'Elite Start Line Mastery',
    subtitle: 'Six-week micro-season for one-design keelboats',
    duration: '6 weeks · 9 sessions',
    focus: ['time & distance', 'mixed-fleet tactics', 'accelerations'],
    color: '#DBEAFE',
  },
  {
    id: 'program_downwind',
    title: 'Downwind VMG Accelerator',
    subtitle: 'Foiling & planing playbook with video-driven progression',
    duration: '4 weeks · 8 sessions',
    focus: ['mode transitions', 'apparent wind', 'pressure mapping'],
    color: '#DCFCE7',
  },
  {
    id: 'program_regatta',
    title: 'Championship Regatta Blueprint',
    subtitle: 'Full campaign support from venue research to post-race analytics',
    duration: 'Customised',
    focus: ['venue intel', 'pack management', 'replays'],
    color: '#FDE68A',
  },
];

const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: 'feedback-1',
    coach: 'Emily Carter',
    sailor: 'Ava Thompson • J/70 Pacifico',
    sessionType: 'Race Strategy',
    summary: 'Shift recognition routine locked in during San Diego practice set.',
    highlight: 'Converted 6° lifts into 3+ boat lengths consistently – team now calling puffs earlier.',
    rating: 5,
    date: format(new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), 'MMM d'),
  },
  {
    id: 'feedback-2',
    coach: 'Luke Anders',
    sailor: 'Mateo Ruiz • WASZP #1145',
    sessionType: 'Video Review',
    summary: 'Downwind mode selection breakthrough during Garda training block.',
    highlight: 'Used VMG overlays to cut unforced gybes by 40% in 18-22kt breeze.',
    rating: 4,
    date: format(new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), 'MMM d'),
  },
];

const MOCK_RESOURCES: ResourceItem[] = [
  {
    id: 'resource-1',
    title: 'Five drills to teach start line time-on-distance intuition',
    category: 'Training Plans',
    readTime: '7 min read',
  },
  {
    id: 'resource-2',
    title: 'Using polar overlays to accelerate heavy-air coaching blocks',
    category: 'Analytics Playbook',
    readTime: '5 min read',
  },
  {
    id: 'resource-3',
    title: 'Checklist: Post-regatta debrief templates that drive retention',
    category: 'Client Success',
    readTime: '4 min read',
  },
];

const MOCK_METRICS: DashboardMetric[] = [
  {
    label: 'Upcoming sessions',
    value: '3',
    helper: 'Next 7 days',
    icon: 'calendar-outline',
  },
  {
    label: 'Active coaches',
    value: '6',
    helper: 'Shortlisted experts',
    icon: 'people-outline',
  },
  {
    label: 'Avg. feedback',
    value: '4.8★',
    helper: 'Last 10 sessions',
    icon: 'star-outline',
  },
  {
    label: 'Hours scheduled',
    value: '11.5h',
    helper: 'This month',
    icon: 'time-outline',
  },
];

export default function CoachingHubScreen() {
  // === ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ===

  // 1. Router and auth
  const router = useRouter();
  const { user } = useAuth();

  // 2. All useState hooks
  const [isCoach, setIsCoach] = useState(false);
  const [checkingCoachStatus, setCheckingCoachStatus] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 3. All useEffect hooks
  useEffect(() => {
    async function checkCoachStatus() {
      if (!user?.id) {
        setCheckingCoachStatus(false);
        return;
      }

      const profile = await coachStrategyService.getCoachProfileByUserId(user.id);
      setIsCoach(!!profile);
      setCheckingCoachStatus(false);
    }

    checkCoachStatus();
  }, [user?.id]);

  // 4. All data-fetching hooks (React Query) - must be called unconditionally
  const {
    data: upcomingSessionsData = [],
    isLoading: loadingUpcomingSessions,
    error: upcomingSessionsError,
    refetch: refetchUpcomingSessions,
  } = useUpcomingCoachSessions(8);

  const {
    data: recentSessionsData = [],
    isLoading: loadingRecentSessions,
    error: recentSessionsError,
    refetch: refetchRecentSessions,
  } = useRecentCoachSessions(6);

  const {
    data: coaches = [],
    isLoading: loadingCoaches,
    error: coachesError,
    refetch: refetchCoaches,
  } = useCoachSpotlights({
    minRating: 4,
    availability: 'next_30_days',
  });

  const {
    data: metricsData,
    isLoading: loadingMetrics,
  } = useCoachMetrics();

  const {
    data: resources = [],
  } = useCoachResources();

  // 5. Derived values (not hooks, just computations)
  const loading = loadingUpcomingSessions || loadingRecentSessions || loadingCoaches || loadingMetrics;
  const error = upcomingSessionsError || recentSessionsError || coachesError;

  const upcomingSource =
    upcomingSessionsData.length > 0 ? upcomingSessionsData : MOCK_SESSIONS;
  const recentSource =
    recentSessionsData.length > 0 ? recentSessionsData : upcomingSessionsData.length > 0 ? upcomingSessionsData : MOCK_SESSIONS;
  const coachesToUse = coaches.length > 0
    ? coaches.map((coach) => ({
        ...coach,
        hourly_rate_usd: coach.hourly_rate ?? null,
        rating: coach.average_rating ?? null,
      }))
    : MOCK_COACHES;

  // Combine sessions for metrics computation
  const allSessionsData = [...upcomingSessionsData, ...recentSessionsData];

  // 6. All useMemo hooks - must be called unconditionally
  const upcomingSessions = useMemo(() => {
    return (upcomingSource || [])
      .filter((session) =>
        ['scheduled', 'confirmed', 'pending'].includes((session.status || '').toLowerCase())
      )
      .sort(
        (a, b) => sessionScheduledDate(a).getTime() - sessionScheduledDate(b).getTime()
      )
      .slice(0, 4);
  }, [upcomingSource]);

  const feedbackItems = useMemo(() => {
    const completed = (recentSource || []).filter(
      (session) => (session.status || '').toLowerCase() === 'completed'
    );
    if (completed.length === 0) {
      return MOCK_FEEDBACK;
    }
    return completed
      .map((session) => ({
        id: session.id,
        coach: session.coach?.display_name || 'Coach',
        sailor: session.sailor?.full_name || session.sailor?.email || 'Sailor',
        sessionType: formatSessionType(session.session_type || ''),
        summary: session.session_notes || 'Detailed feedback was shared with the sailor.',
        highlight:
          session.homework ||
          session.goals ||
          'Session marked as complete with action items logged.',
        rating: session.feedback?.rating ?? 5,
        date: format(sessionCompletedDate(session), 'MMM d'),
      }))
      .slice(0, 2);
  }, [recentSource]);

  const metrics = useMemo<DashboardMetric[]>(() => {
    // Prefer metrics from the API if available
    if (metricsData) {
      return [
        {
          label: 'Upcoming sessions',
          value: `${metricsData.upcomingSessions || 0}`,
          helper: 'Next 14 days',
          icon: 'calendar-outline',
        },
        {
          label: 'Active coaches',
          value: `${metricsData.activeClients || 0}`,
          helper: 'In your roster',
          icon: 'people-outline',
        },
        {
          label: 'Avg. feedback',
          value: metricsData.averageRating ? `${metricsData.averageRating.toFixed(1)}★` : 'N/A',
          helper: 'Across recent sessions',
          icon: 'star-outline',
        },
        {
          label: 'Hours scheduled',
          value: `${((metricsData.sessionsThisMonth || 0) * 60 / 60).toFixed(1)}h`,
          helper: 'This month',
          icon: 'time-outline',
        },
      ];
    }

    // Fallback to computed metrics from sessions
    if (!allSessionsData || allSessionsData.length === 0) {
      return MOCK_METRICS;
    }

    const scheduled = upcomingSessions.length;
    const uniqueCoaches = new Set(
      allSessionsData.map((session) => session.coach?.id || session.coach_id).filter(Boolean)
    ).size;
    const totalMinutes = allSessionsData.reduce(
      (sum, session) => sum + (session.duration_minutes || 0),
      0
    );
    const averageRating = allSessionsData
      .filter((session) => session.feedback?.rating)
      .map((session) => session.feedback?.rating || 0);
    const rating =
      averageRating.length > 0
        ? `${(averageRating.reduce((a, b) => a + b, 0) / averageRating.length).toFixed(1)}★`
        : MOCK_METRICS[2].value;

    return [
      {
        label: 'Upcoming sessions',
        value: `${scheduled}`,
        helper: 'Next 14 days',
        icon: 'calendar-outline',
      },
      {
        label: 'Active coaches',
        value: `${Math.max(uniqueCoaches, 1)}`,
        helper: 'In your roster',
        icon: 'people-outline',
      },
      {
        label: 'Avg. feedback',
        value: rating,
        helper: 'Across recent sessions',
        icon: 'star-outline',
      },
      {
        label: 'Hours scheduled',
        value: `${(totalMinutes / 60).toFixed(1)}h`,
        helper: 'This month',
        icon: 'time-outline',
      },
    ];
  }, [metricsData, allSessionsData, upcomingSessions]);

  // 7. Callbacks
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchUpcomingSessions(),
      refetchRecentSessions(),
      refetchCoaches(),
    ]);
    setRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      label: 'Discover coaches',
      icon: 'search-outline',
      onPress: () => router.push('/coach/discover'),
    },
    {
      label: 'Manage sessions',
      icon: 'clipboard-outline',
      onPress: () => router.push('/coach/my-bookings'),
    },
    {
      label: 'Upload race video',
      icon: 'cloud-upload-outline',
      onPress: () => router.push('/coach/book'),
    },
    {
      label: 'Share feedback',
      icon: 'chatbubbles-outline',
      onPress: () => router.push('/coach/confirmation'),
    },
  ];

  // === EARLY RETURNS - NOW SAFE BECAUSE ALL HOOKS HAVE BEEN CALLED ===

  if (checkingCoachStatus) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isCoach) {
    return <CoachDashboard />;
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F5F7FB]">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-3">Loading your coaching workspace…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F7FB]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        <LinearGradient
          colors={['#1E40AF', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 24,
            marginBottom: 20,
            ...Platform.select({
              web: {
                boxShadow: '0px 10px 20px rgba(30, 58, 138, 0.18)',
              },
              default: {
                shadowColor: '#1E3A8A',
                shadowOpacity: 0.18,
                shadowOffset: { width: 0, height: 10 },
                shadowRadius: 20,
              },
            }),
          }}
        >
          <Text className="text-white/70 text-sm uppercase tracking-widest mb-2">
            Coaching workspace
          </Text>
          <Text className="text-white text-3xl font-semibold leading-snug mb-3">
            Craft elite race outcomes with world-class coaches
          </Text>
          <Text className="text-white/80 text-base leading-6 mb-6">
            Compare availability, book sessions, capture feedback, and share video in one place.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="bg-white/95 px-4 py-3 rounded-xl"
              onPress={() => router.push('/coach/discover-enhanced')}
            >
              <Text className="text-blue-700 font-semibold">Open Coach Marketplace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border border-white/40 px-4 py-3 rounded-xl"
              onPress={() => router.push('/coach/my-bookings')}
            >
              <Text className="text-white font-medium">Upcoming Sessions</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {error && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4">
            <Text className="text-amber-700 text-sm">
              {error instanceof Error ? error.message : 'Showing sample coaching data while we reconnect…'}
            </Text>
          </View>
        )}

        <View className="flex-row flex-wrap justify-between gap-4 mb-20">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </View>

        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-gray-900">Quick actions</Text>
            <TouchableOpacity onPress={() => router.push('/coach/profile')}>
              <Text className="text-blue-600 font-medium">Manage profile</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-12 pr-4">
              {quickActions.map((action) => (
                <QuickActionButton key={action.label} action={action} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-gray-900">Your next sessions</Text>
            <TouchableOpacity onPress={() => router.push('/coach/my-bookings')}>
              <Text className="text-blue-600 font-medium">View calendar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4 pr-2">
              {upcomingSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() => router.push(`/coach/session/${session.id}`)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Coach Spotlights - Tufte Style */}
        <View className="mb-10">
          <View className="flex-row items-center justify-between px-4 pt-6 pb-2">
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: '#8E8E93' }}>
              FEATURED COACHES
            </Text>
            <TouchableOpacity onPress={() => router.push('/coach/discover')}>
              <Text className="text-blue-600 font-medium text-sm">See all</Text>
            </TouchableOpacity>
          </View>
          <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E7EB' }}>
            {coachesToUse.slice(0, 4).map((coach, index) => (
              <TufteCoachRow
                key={coach.id}
                name={coach.display_name || 'Coach'}
                bio={coach.bio}
                specialties={coach.specialties}
                rating={coach.average_rating}
                totalSessions={coach.total_sessions}
                hourlyRate={coach.hourly_rate}
                currency={coach.currency}
                location={coach.based_at || coach.available_locations?.[0]}
                onPress={() => router.push(`/coach/${coach.id}`)}
                onContact={() => router.push(`/coach/${coach.id}?action=book`)}
                isLast={index === Math.min(coachesToUse.length, 4) - 1}
              />
            ))}
          </View>
        </View>

        <View className="mb-10">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-gray-900">Structured programs</Text>
            <TouchableOpacity onPress={() => router.push('/coach/book')}>
              <Text className="text-blue-600 font-medium">Build custom plan</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4 pr-2">
              {MOCK_PROGRAMS.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="mb-10">
          <Text className="text-xl font-semibold text-gray-900 mb-4">Latest coach feedback</Text>
          {feedbackItems.map((item) => (
            <FeedbackCard key={item.id} feedback={item} />
          ))}
        </View>

        <View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-gray-900">Resources & playbooks</Text>
            <TouchableOpacity onPress={() => router.push('/coach/discover-enhanced')}>
              <Text className="text-blue-600 font-medium">Library</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4 pr-2">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const MetricCard = ({ metric }: { metric: DashboardMetric }) => (
  <View className="bg-white rounded-2xl px-5 py-4 w-[calc(50%-12px)] shadow-sm">
    <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mb-3">
      <Ionicons name={metric.icon} size={20} color="#1D4ED8" />
    </View>
    <Text className="text-2xl font-semibold text-gray-900 mb-1">{metric.value}</Text>
    <Text className="text-sm font-medium text-gray-600 mb-1">{metric.label}</Text>
    <Text className="text-xs text-gray-400">{metric.helper}</Text>
  </View>
);

const QuickActionButton = ({ action }: { action: QuickAction }) => (
  <TouchableOpacity
    className="bg-white rounded-2xl px-4 py-5 w-40 shadow-sm"
    onPress={action.onPress}
    activeOpacity={0.9}
  >
    <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-4">
      <Ionicons name={action.icon} size={22} color="#2563EB" />
    </View>
    <Text className="text-sm font-semibold text-gray-900">{action.label}</Text>
    <Text className="text-xs text-gray-400 mt-1">
      {action.label === 'Discover coaches'
        ? 'Browse verified experts'
        : action.label === 'Manage sessions'
        ? 'Track bookings & notes'
        : action.label === 'Upload race video'
        ? 'Share footage for review'
        : 'Capture session learnings'}
    </Text>
  </TouchableOpacity>
);

const SessionCard = ({
  session,
  onPress,
}: {
  session: CoachingSession;
  onPress: () => void;
}) => {
  const scheduledDate = sessionScheduledDate(session);
  const coachName = session.coach?.display_name || 'Coach pending';
  const focusTags = (session.focus_areas || []).slice(0, 3);

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl px-4 py-5 w-72 shadow-sm"
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3 overflow-hidden">
            {session.coach?.profile_photo_url ? (
              <Image
                source={{ uri: session.coach.profile_photo_url }}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Ionicons name="person" size={22} color="#2563EB" />
            )}
          </View>
          <View>
            <Text className="text-sm font-semibold text-gray-900">{coachName}</Text>
            <Text className="text-xs text-gray-500">
              {format(scheduledDate, 'EEE, MMM d • h:mm a')}
            </Text>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full bg-blue-50">
          <Text className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            {formatSessionType(session.session_type)}
          </Text>
        </View>
      </View>
      {session.location_notes && (
        <Text className="text-xs text-gray-500 mb-3" numberOfLines={1}>
          📍 {session.location_notes}
        </Text>
      )}
      {focusTags.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {focusTags.map((focus) => (
            <View key={focus} className="px-3 py-1 rounded-full bg-indigo-50">
              <Text className="text-xs font-medium text-indigo-700">
                {focus.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const CoachSpotlightCard = ({
  coach,
  onView,
  onBook,
}: {
  coach: DiscoverCoach;
  onView: () => void;
  onBook: () => void;
}) => {
  const coachName = coach.display_name || 'Coach';
  const location =
    coach.based_at || coach.available_locations?.[0] || 'Worldwide availability';
  const price =
    typeof coach.hourly_rate === 'number'
      ? `$${Math.round(coach.hourly_rate / 100)} / hr`
      : 'Contact for pricing';
  const specialties = coach.specialties.slice(0, 3);

  return (
    <View className="bg-white rounded-2xl px-5 py-5 mb-4 shadow-sm">
      <View className="flex-row">
        <View className="mr-4">
          <View className="w-16 h-16 rounded-2xl bg-blue-100 items-center justify-center overflow-hidden">
            {coach.profile_photo_url ? (
              <Image
                source={{ uri: coach.profile_photo_url }}
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <Ionicons name="person-outline" size={28} color="#2563EB" />
            )}
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{coachName}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{location}</Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="text-sm text-gray-600 ml-1">
              {coach.average_rating ? coach.average_rating.toFixed(1) : 'New coach'}
            </Text>
            <Text className="text-sm text-gray-400 ml-3">
              {coach.total_sessions} sessions • {coach.total_clients} clients
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-sm text-gray-600 mt-3" numberOfLines={3}>
        {coach.bio ||
          'Performance-focused coaching with detailed analytics, video review, and tactical debriefs.'}
      </Text>

      {specialties.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {specialties.map((specialty) => (
            <View key={specialty} className="bg-blue-50 px-3 py-1.5 rounded-full">
              <Text className="text-xs font-semibold text-blue-700">
                {specialty.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 mt-4">
        <Text className="text-blue-600 font-semibold text-lg">{price}</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity className="border border-blue-200 px-3 py-2 rounded-xl" onPress={onView}>
            <Text className="text-blue-600 font-medium">View profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-xl" onPress={onBook}>
            <Text className="text-white font-semibold">Book session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ProgramCard = ({ program }: { program: SpotlightProgram }) => (
  <View
    className="rounded-2xl px-5 py-5 w-72"
    style={{
      backgroundColor: program.color,
    }}
  >
    <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
      {program.duration}
    </Text>
    <Text className="text-lg font-semibold text-gray-900 mb-1">{program.title}</Text>
    <Text className="text-sm text-gray-600 mb-3">{program.subtitle}</Text>
    <View className="flex-row flex-wrap gap-2">
      {program.focus.map((focus) => (
        <View key={focus} className="bg-white/70 px-3 py-1 rounded-full">
          <Text className="text-xs font-medium text-gray-700">{focus}</Text>
        </View>
      ))}
    </View>
  </View>
);

const FeedbackCard = ({ feedback }: { feedback: FeedbackItem }) => (
  <View className="bg-white rounded-2xl px-5 py-5 mb-3 shadow-sm">
    <View className="flex-row items-center justify-between">
      <Text className="text-sm font-semibold text-gray-900">{feedback.coach}</Text>
      <View className="flex-row items-center">
        <Ionicons name="star" size={16} color="#F59E0B" />
        <Text className="text-sm text-gray-600 ml-1">{feedback.rating.toFixed(1)}</Text>
        <Text className="text-xs text-gray-400 uppercase ml-3">{feedback.date}</Text>
      </View>
    </View>
    <Text className="text-xs text-gray-500 mt-1">{feedback.sailor}</Text>
    <Text className="text-xs font-semibold text-blue-600 uppercase mt-3">
      {feedback.sessionType}
    </Text>
    <Text className="text-sm text-gray-700 mt-2">{feedback.summary}</Text>
    <View className="bg-blue-50 px-3 py-2 rounded-xl mt-3">
      <Text className="text-xs font-semibold text-blue-700 uppercase">Coaching impact</Text>
      <Text className="text-sm text-blue-900 mt-1">{feedback.highlight}</Text>
    </View>
  </View>
);

const ResourceCard = ({ resource }: { resource: ResourceItem }) => (
  <View className="bg-white rounded-2xl px-5 py-4 w-64 shadow-sm">
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        {resource.category}
      </Text>
      <Text className="text-xs text-gray-400">{resource.readTime}</Text>
    </View>
    <Text className="text-sm font-semibold text-gray-900" numberOfLines={3}>
      {resource.title}
    </Text>
    <TouchableOpacity className="flex-row items-center mt-4">
      <Text className="text-blue-600 font-medium text-sm">Open playbook</Text>
      <Ionicons name="arrow-forward" size={14} color="#2563EB" style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  </View>
);

const sessionScheduledDate = (session: CoachingSession) => {
  if (session.scheduled_at) return new Date(session.scheduled_at);
  if (session.start_time) return new Date(session.start_time);
  if ((session as any).session_date) return new Date((session as any).session_date);
  return new Date();
};

const sessionCompletedDate = (session: CoachingSession) => {
  if (session.completed_at) return new Date(session.completed_at);
  if ((session as any).updated_at) return new Date((session as any).updated_at);
  return sessionScheduledDate(session);
};

const formatSessionType = (type: string) => {
  const mapping: Record<string, string> = {
    on_water: 'On-Water Training',
    video_review: 'Video Review',
    strategy: 'Race Strategy',
    boat_setup: 'Boat Setup',
    fitness: 'Fitness Coaching',
    mental_coaching: 'Mental Coaching',
    one_on_one: 'One-on-One Session',
    group: 'Group Session',
    race_debrief: 'Race Debrief',
  };
  return mapping[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
};
