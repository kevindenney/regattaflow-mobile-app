/**
 * SailorCoachDashboard (View B)
 *
 * Shown when the sailor has one or more active coaching relationships.
 * Displays metrics, "Your Coaches" list, upcoming session highlight,
 * session history grouped by coach, quick actions, and resources.
 */

import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { TufteCoachRow } from '@/components/coaching/TufteCoachRow';
import { IOS_COLORS } from '@/components/cards/constants';
import { useCoachResources } from '@/hooks/useCoachData';
import {
  useSailorUpcomingSessions,
  useSailorRecentSessions,
  useSailorCoachingStats,
} from '@/hooks/useSailorCoachingSessions';
import { useCoachingStatus } from '@/hooks/useCoachingStatus';
import type { SailorCoachRelationship } from '@/hooks/useSailorCoachRelationships';
import { messagingService } from '@/services/MessagingService';
import { useAuth } from '@/providers/AuthProvider';

import { CoachProfileRecruitmentLink } from '@/components/learn/CoachRecruitmentBanner';
import {
  TufteSection,
  TufteSessionRow,
  TufteFeedbackRow,
  TufteResourceRow,
  MetricsRow,
  EmptyState,
  MOCK_RESOURCES,
  sessionScheduledDate,
  sessionCompletedDate,
  formatSessionType,
  styles as sharedStyles,
} from './shared';
import type { DashboardMetric } from './shared';

interface SailorCoachDashboardProps {
  relationships: SailorCoachRelationship[];
  toolbarOffset?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export function SailorCoachDashboard({
  relationships,
  toolbarOffset = 0,
  onScroll,
}: SailorCoachDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { relationship } = useCoachingStatus();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: upcomingSessionsData = [],
    refetch: refetchUpcoming,
  } = useSailorUpcomingSessions(8);

  const {
    data: recentSessionsData = [],
    refetch: refetchRecent,
  } = useSailorRecentSessions(6);

  const { data: statsData } = useSailorCoachingStats();
  const { data: resources = [] } = useCoachResources();

  // Upcoming sessions, sorted (already filtered by the hook, but sort for safety)
  const upcomingSessions = useMemo(() => {
    return [...upcomingSessionsData]
      .sort(
        (a, b) => sessionScheduledDate(a).getTime() - sessionScheduledDate(b).getTime()
      )
      .slice(0, 4);
  }, [upcomingSessionsData]);

  // Feedback items derived from completed sessions
  const feedbackItems = useMemo(() => {
    if (recentSessionsData.length === 0) return [];
    return recentSessionsData
      .map((session) => ({
        id: session.id,
        coach: session.coach?.display_name || 'Coach',
        sailor: session.sailor?.full_name || session.sailor?.email || 'Sailor',
        sessionType: formatSessionType(session.session_type || ''),
        summary: session.session_notes || 'Feedback shared with sailor.',
        rating: session.feedback?.rating ?? 5,
        date: format(sessionCompletedDate(session), 'MMM d'),
      }))
      .slice(0, 2);
  }, [recentSessionsData]);

  // Sessions grouped by coach (merges upcoming + recent for the "MY SESSIONS" section)
  const sessionsByCoach = useMemo(() => {
    const allSessions = [...upcomingSessionsData, ...recentSessionsData];
    const grouped = new Map<string, { coachName: string; sessions: typeof allSessions }>();

    for (const session of allSessions) {
      const coachId = session.coach_id || 'unknown';
      const coachName = session.coach?.display_name || 'Coach';
      if (!grouped.has(coachId)) {
        grouped.set(coachId, { coachName, sessions: [] });
      }
      grouped.get(coachId)!.sessions.push(session);
    }

    // Sort sessions within each group by date
    for (const group of grouped.values()) {
      group.sessions.sort(
        (a, b) => sessionScheduledDate(a).getTime() - sessionScheduledDate(b).getTime()
      );
    }

    return Array.from(grouped.entries()).map(([coachId, group]) => ({
      coachId,
      coachName: group.coachName,
      sessions: group.sessions,
    }));
  }, [upcomingSessionsData, recentSessionsData]);

  // Metrics from sailor-specific stats
  const metrics = useMemo<DashboardMetric[]>(() => {
    if (statsData) {
      return [
        { label: 'Coaches', value: `${relationships.length || statsData.coachCount}`, helper: 'active' },
        { label: 'Upcoming', value: `${statsData.upcomingSessions}`, helper: 'sessions' },
        { label: 'Completed', value: `${statsData.completedSessions}`, helper: 'total' },
        { label: 'Hours', value: `${statsData.totalHours}`, helper: 'total' },
      ];
    }

    return [
      { label: 'Coaches', value: `${relationships.length}`, helper: 'active' },
      { label: 'Upcoming', value: '0', helper: 'sessions' },
      { label: 'Completed', value: '0', helper: 'total' },
      { label: 'Hours', value: '0', helper: 'total' },
    ];
  }, [statsData, relationships]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUpcoming(), refetchRecent()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ paddingBottom: 120 }, toolbarOffset > 0 && { paddingTop: toolbarOffset }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={IOS_COLORS.blue} />
      }
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Metrics Row */}
      <MetricsRow metrics={metrics} />

      {/* Your Coaches */}
      <TufteSection
        title="YOUR COACHES"
        action="Find more"
        onActionPress={() => router.push('/coach/discover')}
      >
        <View style={sharedStyles.coachesContainer}>
          {relationships.map((rel, index) => {
            const profile = rel.coachProfile;
            return (
              <TufteCoachRow
                key={rel.id}
                name={profile?.display_name || 'Coach'}
                bio={profile?.bio}
                specialties={profile?.specialties}
                rating={profile?.average_rating}
                totalSessions={profile?.total_sessions}
                hourlyRate={profile?.hourly_rate}
                currency={profile?.currency}
                location={profile?.based_at || profile?.available_locations?.[0]}
                onPress={() => router.push(`/coach/${rel.coach_id}`)}
                onContact={async () => {
                  const coachUserId = rel.coachProfile?.user_id;
                  if (!user?.id || !coachUserId) return;
                  try {
                    const convoId = await messagingService.getOrCreateConversation(coachUserId, user.id);
                    router.push(`/coach/conversation/${convoId}` as any);
                  } catch {
                    router.push(`/coach/${rel.coach_id}?action=book`);
                  }
                }}
                isLast={index === relationships.length - 1}
              />
            );
          })}
        </View>
      </TufteSection>

      {/* Quick Actions */}
      <TufteSection
        title="QUICK ACTIONS"
        action="Manage"
        onActionPress={() => router.push('/coach/my-bookings')}
      >
        <View style={sharedStyles.quickActionsContainer}>
          <TouchableOpacity
            style={sharedStyles.quickActionRow}
            onPress={() => router.push('/coach/book')}
          >
            <View style={sharedStyles.quickActionLeft}>
              <Ionicons name="calendar-outline" size={18} color={IOS_COLORS.secondaryLabel} />
              <Text style={sharedStyles.quickActionLabel}>Book a session</Text>
            </View>
            <Text style={sharedStyles.quickActionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sharedStyles.quickActionRow}
            onPress={() => router.push('/coach/my-bookings')}
          >
            <View style={sharedStyles.quickActionLeft}>
              <Ionicons name="clipboard-outline" size={18} color={IOS_COLORS.secondaryLabel} />
              <Text style={sharedStyles.quickActionLabel}>Manage sessions</Text>
            </View>
            <Text style={sharedStyles.quickActionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sharedStyles.quickActionRow}
            onPress={() => router.push('/coach/book')}
          >
            <View style={sharedStyles.quickActionLeft}>
              <Ionicons name="cloud-upload-outline" size={18} color={IOS_COLORS.secondaryLabel} />
              <Text style={sharedStyles.quickActionLabel}>Upload race video</Text>
            </View>
            <Text style={sharedStyles.quickActionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[sharedStyles.quickActionRow, sharedStyles.quickActionRowLast]}
            onPress={() => router.push('/coach/confirmation')}
          >
            <View style={sharedStyles.quickActionLeft}>
              <Ionicons name="chatbubbles-outline" size={18} color={IOS_COLORS.secondaryLabel} />
              <Text style={sharedStyles.quickActionLabel}>Share feedback</Text>
            </View>
            <Text style={sharedStyles.quickActionChevron}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>
      </TufteSection>

      {/* Upcoming Sessions */}
      <TufteSection
        title="UPCOMING SESSIONS"
        action="Calendar"
        onActionPress={() => router.push('/coach/my-bookings')}
      >
        <View style={sharedStyles.sessionsContainer}>
          {upcomingSessions.map((session, index) => (
            <TufteSessionRow
              key={session.id}
              session={session}
              onPress={() => router.push('/coach/my-bookings')}
              isLast={index === upcomingSessions.length - 1}
            />
          ))}
          {upcomingSessions.length === 0 && (
            <EmptyState text="No upcoming sessions" />
          )}
        </View>
      </TufteSection>

      {/* My Sessions — grouped by coach */}
      <TufteSection title="MY SESSIONS">
        <View style={sharedStyles.sessionsContainer}>
          {sessionsByCoach.length > 0 ? (
            sessionsByCoach.map((group, groupIndex) => (
              <View key={group.coachId}>
                <Text style={localStyles.coachGroupHeader}>{group.coachName}</Text>
                {group.sessions.map((session, index) => (
                  <TufteSessionRow
                    key={session.id}
                    session={session}
                    onPress={() => router.push('/coach/my-bookings')}
                    isLast={
                      index === group.sessions.length - 1 &&
                      groupIndex === sessionsByCoach.length - 1
                    }
                  />
                ))}
              </View>
            ))
          ) : (
            <EmptyState text="No sessions yet" />
          )}
        </View>
      </TufteSection>

      {/* Find More Coaches CTA */}
      <View style={localStyles.findMoreSection}>
        <TouchableOpacity
          style={sharedStyles.secondaryCta}
          onPress={() => router.push('/coach/discover')}
        >
          <Ionicons name="search-outline" size={16} color={IOS_COLORS.blue} />
          <Text style={sharedStyles.secondaryCtaText}>Find More Coaches</Text>
        </TouchableOpacity>
      </View>

      {/* Resources */}
      <TufteSection
        title="RESOURCES"
        action="Library"
        onActionPress={() => router.push('/coach/discover-enhanced')}
      >
        <View style={sharedStyles.resourcesContainer}>
          {(resources.length > 0 ? resources : MOCK_RESOURCES).map((resource, index, arr) => (
            <TufteResourceRow
              key={resource.id}
              resource={resource}
              isLast={index === arr.length - 1}
            />
          ))}
        </View>
      </TufteSection>

      {/* Subtle "Interested in coaching others?" prompt - dismissable for 30 days */}
      <View style={sharedStyles.subtleCoachPrompt}>
        <CoachProfileRecruitmentLink />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  findMoreSection: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  coachGroupHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
