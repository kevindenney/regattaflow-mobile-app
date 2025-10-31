import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import {
  coachingService,
  CoachProfile,
  CoachingSession,
} from '@/services/CoachingService';

type DiscoverCoach = CoachProfile & {
  hourly_rate_usd?: number | null;
  rating?: number | null;
};

export default function CoachingHubScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coaches, setCoaches] = useState<DiscoverCoach[]>([]);
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      const [sessionResults, coachResults] = await Promise.all([
        coachingService.getSailorSessions(),
        coachingService.discoverCoaches({
          minRating: 4,
          availability: 'next_30_days',
        }),
      ]);

      setSessions(sessionResults || []);
      const formattedCoaches: DiscoverCoach[] = (coachResults || [])
        .slice(0, 6)
        .map((coach) => ({
          ...coach,
          hourly_rate_usd: coach.hourly_rate ?? null,
          rating: coach.average_rating ?? null,
        }));

      setCoaches(formattedCoaches);
    } catch (err: any) {
      console.error('Error loading coaching data:', err);
      setError('Unable to load coaching data right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const upcomingSessions = useMemo(() => {
    return (sessions || [])
      .filter((session) =>
        ['scheduled', 'confirmed', 'pending'].includes((session.status || '').toLowerCase())
      )
      .sort((a, b) => sessionScheduledDate(a).getTime() - sessionScheduledDate(b).getTime())
      .slice(0, 3);
  }, [sessions]);

  const recentFeedback = useMemo(() => {
    return (sessions || [])
      .filter((session) => (session.status || '').toLowerCase() === 'completed')
      .sort((a, b) => sessionCompletedDate(b).getTime() - sessionCompletedDate(a).getTime())
      .slice(0, 2);
  }, [sessions]);

  const handleDiscover = () => {
    router.push('/coach/discover');
  };

  const handleBookings = () => {
    router.push('/coach/my-bookings');
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-3">Loading your coaching hub…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="chevron-back" size={26} color="#1F2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-gray-900">Coaching Hub</Text>
            <Text className="text-gray-500 text-sm">Find coaches and manage your sessions</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Upcoming Sessions</Text>
          <TouchableOpacity onPress={handleBookings}>
            <Text className="text-blue-600 font-medium">Manage bookings</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl p-4 mb-5 shadow-sm">
          {upcomingSessions.length === 0 ? (
            <EmptyState
              title="No sessions scheduled"
              subtitle="Book a coach session to get personalised feedback."
              actionLabel="Find a coach"
              onAction={handleDiscover}
            />
          ) : (
            upcomingSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                className="border border-gray-100 rounded-xl p-3 mb-3 active:bg-gray-50"
                onPress={() => router.push(`/coach/session/${session.id}`)}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base font-semibold text-gray-900">
                    {formatSessionType(session.session_type || '')}
                  </Text>
                  <Text className="text-sm text-blue-600 font-medium">
                    {format(sessionScheduledDate(session), 'MMM d • h:mm a')}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600">
                  With {session.coach?.display_name || 'Coach'}
                </Text>
                {session.location_notes && (
                  <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                    📍 {session.location_notes}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {recentFeedback.length > 0 && (
          <View className="bg-white rounded-xl p-4 mb-5 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Recent Coach Feedback</Text>
            {recentFeedback.map((session) => (
              <View key={session.id} className="border border-gray-100 rounded-xl p-3 mb-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {session.coach?.display_name || 'Coach'}
                  </Text>
                  <Text className="text-xs text-gray-500 uppercase">
                    {format(sessionCompletedDate(session), 'MMM d')}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600">
                  {formatSessionType(session.session_type || '')}
                </Text>
                {session.session_notes && (
                  <View className="bg-blue-50 rounded-lg p-2 mt-3">
                    <Text className="text-xs font-semibold text-blue-600 uppercase">Coach Notes</Text>
                    <Text className="text-sm text-blue-800 mt-1">{session.session_notes}</Text>
                  </View>
                )}
                {session.homework && (
                  <View className="bg-amber-50 rounded-lg p-2 mt-2">
                    <Text className="text-xs font-semibold text-amber-600 uppercase">Homework</Text>
                    <Text className="text-sm text-amber-800 mt-1">{session.homework}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-900">Recommended Coaches</Text>
          <TouchableOpacity onPress={handleDiscover}>
            <Text className="text-blue-600 font-medium">See all</Text>
          </TouchableOpacity>
        </View>

        {coaches.length === 0 ? (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <EmptyState
              title="No coaches available"
              subtitle="Check back soon or adjust filters in the marketplace."
              actionLabel="Open marketplace"
              onAction={handleDiscover}
            />
          </View>
        ) : (
          coaches.map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onView={() => router.push(`/coach/${coach.id}`)}
              onBook={() => router.push(`/coach/${coach.id}?action=book`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
  return mapping[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};

const EmptyState = ({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) => (
  <View className="items-center py-6 px-4">
    <Ionicons name="compass-outline" size={40} color="#CBD5E1" />
    <Text className="text-base font-semibold text-gray-900 mt-3">{title}</Text>
    <Text className="text-sm text-gray-500 text-center mt-1">{subtitle}</Text>
    <TouchableOpacity className="bg-blue-600 px-5 py-2.5 rounded-lg mt-4" onPress={onAction}>
      <Text className="text-white font-semibold">{actionLabel}</Text>
    </TouchableOpacity>
  </View>
);

const CoachCard = ({
  coach,
  onView,
  onBook,
}: {
  coach: DiscoverCoach;
  onView: () => void;
  onBook: () => void;
}) => {
  const coachName =
    (coach as any).display_name ||
    (coach as any).full_name ||
    `${(coach as any).first_name || ''} ${(coach as any).last_name || ''}`.trim() ||
    'Coach';
  const location =
    (coach as any).based_at ||
    (coach as any).available_locations?.[0] ||
    (coach as any).timezone ||
    'Available remotely';
  const specialties: string[] = Array.isArray((coach as any).specialties)
    ? (coach as any).specialties.slice(0, 2)
    : [];
  const rating =
    (coach as any).average_rating ??
    (coach as any).rating ??
    null;
  const sessionsCount =
    (coach as any).total_sessions ??
    (coach as any).sessions_completed ??
    null;
  const rateCents =
    typeof (coach as any).hourly_rate_usd === 'number'
      ? (coach as any).hourly_rate_usd
      : typeof (coach as any).hourly_rate === 'number'
      ? (coach as any).hourly_rate
      : null;
  const priceText =
    typeof rateCents === 'number' && rateCents > 0
      ? `$${Math.round(rateCents / 100)} / hr`
      : 'Contact for pricing';

  return (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <View className="flex-row items-start">
        <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-3 overflow-hidden">
          {coach.profile_photo_url ? (
            <Image source={{ uri: coach.profile_photo_url }} style={{ width: 64, height: 64 }} />
          ) : (
            <Ionicons name="person" size={30} color="#2563EB" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{coachName}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{location}</Text>
          <View className="flex-row items-center mt-1.5">
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text className="text-sm text-gray-600 ml-1">
              {rating ? rating.toFixed(1) : 'New coach'}
            </Text>
            {sessionsCount ? (
              <Text className="text-sm text-gray-400 ml-3">{sessionsCount} sessions</Text>
            ) : null}
          </View>
        </View>
      </View>

      {specialties.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {specialties.map((specialty) => (
            <View key={specialty} className="bg-blue-50 px-3 py-1.5 rounded-full">
              <Text className="text-xs font-medium text-blue-700">{specialty.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-3 mt-4">
        <Text className="text-blue-600 font-semibold text-lg">{priceText}</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity className="border border-blue-200 px-3 py-2 rounded-lg" onPress={onView}>
            <Text className="text-blue-600 font-medium">View profile</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg" onPress={onBook}>
            <Text className="text-white font-semibold">Book session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
