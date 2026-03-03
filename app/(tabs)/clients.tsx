import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCoachWorkspace } from '@/hooks/useCoachWorkspace';
import { useCoachHomeData } from '@/hooks/useCoachHomeData';
import { useWorkspaceDomain } from '@/hooks/useWorkspaceDomain';
import { coachingService, CoachingClient, ClientStats } from '@/services/CoachingService';
import { buildAssessmentsDrillDownHref, buildLearnerProgressHref, buildProgramAssessmentHref } from '@/lib/assessments/drillDown';
import { formatDistanceToNow } from 'date-fns';

export default function ClientsScreen() {
  const router = useRouter();
  const { coachId, loading: personaLoading, refresh: refreshPersonaContext } = useCoachWorkspace();
  const { isSailingDomain } = useWorkspaceDomain();
  const {
    counts: coachHomeCounts,
    assignedProgramsPreview,
    competencyTrends,
    refresh: refreshCoachHome,
    markThreadsSeen,
  } = useCoachHomeData();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<CoachingClient[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    activeClients: 0,
    totalSessions: 0,
    sessionsThisMonth: 0,
    upcomingSessions: 0
  });

  useEffect(() => {
    if (coachId) {
      loadData(coachId);
    } else if (!personaLoading) {
      setLoading(false);
    }
  }, [coachId, personaLoading]);

  const loadData = async (targetCoachId: string) => {
    if (!targetCoachId) return;

    try {
      if (!refreshing) {
        setLoading(true);
      }
      const [clientsData, statsData] = await Promise.all([
        coachingService.getClients(targetCoachId, 'active'),
        coachingService.getCoachStats(targetCoachId)
      ]);

      setClients(clientsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void refreshCoachHome();
    if (coachId) {
      loadData(coachId);
    } else {
      setRefreshing(false);
    }
  };

  const handleClientPress = (clientId: string) => {
    router.push(`/coach/client/${clientId}`);
  };

  const formatLastSession = (date?: string) => {
    if (!date) return 'No sessions yet';
    return `Last session: ${formatDistanceToNow(new Date(date), { addSuffix: true })}`;
  };

  const formatTrendDelta = (delta: number | null) => {
    if (delta === null || !Number.isFinite(delta)) return 'No prior period';
    if (delta > 0) return `+${delta.toFixed(2)} vs prior`;
    if (delta < 0) return `${delta.toFixed(2)} vs prior`;
    return 'No change vs prior';
  };

  const trendColorForDelta = (delta: number | null) => {
    if (delta === null || !Number.isFinite(delta) || delta === 0) return '#64748B';
    return delta > 0 ? '#15803D' : '#B91C1C';
  };

  const handleTrendPress = (trend: (typeof competencyTrends)[number]) => {
    const firstPoint = trend.points?.[0];
    const href = buildAssessmentsDrillDownHref({
      competencyId: trend.competency_id,
      competencyTitle: trend.competency_title,
      periodStartIso: firstPoint?.periodStart || null,
    });
    router.push(href as any);
  };

  if (personaLoading || loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  if (!coachId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.missingContainer}>
          <Ionicons name="school-outline" size={48} color="#94A3B8" />
          <ThemedText style={styles.missingTitle}>Connect Your Coach Workspace</ThemedText>
          <ThemedText style={styles.missingDescription}>
            Client management becomes available after coach onboarding. Refresh your connection or finish onboarding to continue.
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={refreshPersonaContext}>
            <ThemedText style={styles.retryButtonText}>Retry Connection</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryLink} onPress={() => router.push('/(tabs)/profile')}>
            <ThemedText style={styles.secondaryLinkText}>Back to Dashboard</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.coachHomeSection}>
          <View style={styles.coachHomeHeader}>
            <ThemedText style={styles.sectionTitle}>Coach Home</ThemedText>
            <TouchableOpacity onPress={() => void markThreadsSeen()}>
              <ThemedText style={styles.markSeenText}>Mark Threads Seen</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/programs/assign' as any)}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.statValue}>{coachHomeCounts.assignedPrograms}</ThemedText>
              <ThemedText style={styles.statLabel}>Assigned Programs</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/assessments?status=all&focus=all' as any)}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.statValue}>{coachHomeCounts.dueAssessments}</ThemedText>
              <ThemedText style={styles.statLabel}>Due Assessments</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/communications?focus=unread' as any)}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.statValue}>{coachHomeCounts.unreadThreads}</ThemedText>
              <ThemedText style={styles.statLabel}>Unread Threads</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.coachHomeLinksRow}>
            <TouchableOpacity
              style={styles.coachHomeLinkChip}
              onPress={() => router.push('/assessments?status=all&focus=due_today' as any)}
            >
              <ThemedText style={styles.coachHomeLinkChipText}>
                Due today: {coachHomeCounts.dueTodayAssessments}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.coachHomeLinkChip, styles.coachHomeLinkChipWarn]}
              onPress={() => router.push('/assessments?status=all&focus=overdue' as any)}
            >
              <ThemedText style={[styles.coachHomeLinkChipText, styles.coachHomeLinkChipWarnText]}>
                Overdue: {coachHomeCounts.overdueAssessments}
              </ThemedText>
            </TouchableOpacity>
          </View>
          {assignedProgramsPreview.length > 0 ? (
            <View style={styles.programPreviewSection}>
              <ThemedText style={styles.programPreviewTitle}>Assigned Programs</ThemedText>
              {assignedProgramsPreview.map((program) => (
                <TouchableOpacity
                  key={program.id}
                  style={styles.programPreviewRow}
                  onPress={() =>
                    router.push(
                      buildProgramAssessmentHref({
                        programId: program.id,
                        programTitle: program.title,
                      }) as any
                    )
                  }
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.programPreviewName}>{program.title}</ThemedText>
                    <ThemedText style={styles.programPreviewMeta}>
                      {String(program.status || '').replace('_', ' ')}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          <View style={styles.programPreviewSection}>
            <ThemedText style={styles.programPreviewTitle}>Competency Progress (8 weeks)</ThemedText>
            {competencyTrends.length > 0 ? (
              competencyTrends.map((trend) => (
                <TouchableOpacity
                  key={trend.competency_id}
                  style={styles.competencyTrendRow}
                  onPress={() => handleTrendPress(trend)}
                  activeOpacity={0.8}
                  testID={`coach-trend-row-${trend.competency_id}`}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.programPreviewName}>{trend.competency_title}</ThemedText>
                    <ThemedText style={styles.programPreviewMeta}>
                      {trend.total_assessments} assessment{trend.total_assessments === 1 ? '' : 's'}
                    </ThemedText>
                  </View>
                  <View style={styles.competencyTrendScoreBlock}>
                    <ThemedText style={styles.competencyTrendScore}>{trend.latest_average_score.toFixed(2)}</ThemedText>
                    <ThemedText
                      style={[
                        styles.competencyTrendDelta,
                        { color: trendColorForDelta(trend.delta_from_previous) },
                      ]}
                    >
                      {formatTrendDelta(trend.delta_from_previous)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.competencyTrendEmpty}>
                <ThemedText style={styles.programPreviewMeta}>
                  No scored competency assessments yet.
                </ThemedText>
              </View>
            )}
          </View>
        </View>

          <View style={styles.header}>
          <ThemedText style={styles.title}>{isSailingDomain ? 'My Clients' : 'My Learners'}</ThemedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/coach/client/new')}
          >
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.activeClients}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Clients</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{stats.sessionsThisMonth}</ThemedText>
            <ThemedText style={styles.statLabel}>Sessions This Month</ThemedText>
          </View>
        </View>

        {stats.upcomingSessions > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{stats.upcomingSessions}</ThemedText>
              <ThemedText style={styles.statLabel}>Upcoming Sessions</ThemedText>
            </View>
            {stats.averageRating && (
              <View style={styles.statCard}>
                <ThemedText style={styles.statValue}>{stats.averageRating.toFixed(1)} ⭐</ThemedText>
                <ThemedText style={styles.statLabel}>Average Rating</ThemedText>
              </View>
            )}
          </View>
        )}

        {clients.length > 0 ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Active Clients</ThemedText>

            {clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.clientCard}
                onPress={() => handleClientPress(client.id)}
              >
                <View style={styles.clientAvatar}>
                  {client.sailor?.avatar_url ? (
                    <Image
                      source={{ uri: client.sailor.avatar_url }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                  ) : (
                    <Ionicons name="person-circle" size={50} color="#CBD5E1" />
                  )}
                </View>
                <View style={styles.clientInfo}>
                  <ThemedText style={styles.clientName}>
                    {client.sailor?.full_name || client.sailor?.email || 'Unknown Client'}
                  </ThemedText>
                  <ThemedText style={styles.clientDetail}>
                    {isSailingDomain
                      ? `${client.primary_boat_class || 'No boat class'} • ${client.skill_level || 'Unknown level'}`
                      : `${client.skill_level || 'Unknown level'} coach track`}
                  </ThemedText>
                  <ThemedText style={styles.clientDetail}>
                    {formatLastSession(client.last_session_date)}
                  </ThemedText>
                  <ThemedText style={styles.clientDetail}>
                    {client.total_sessions} session{client.total_sessions !== 1 ? 's' : ''} completed
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.progressLink}
                    onPress={() =>
                      router.push(
                        buildLearnerProgressHref({
                          participantUserId: client.sailor_id,
                          participantName: client.sailor?.full_name || client.sailor?.email || null,
                        }) as any
                      )
                    }
                  >
                    <ThemedText style={styles.progressLinkText}>Open learner progress</ThemedText>
                  </TouchableOpacity>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <ThemedText style={styles.emptyText}>
              {isSailingDomain ? 'Start building your client base' : 'Start building your learner roster'}
            </ThemedText>
            <TouchableOpacity style={styles.ctaButton}>
              <ThemedText style={styles.ctaButtonText}>
                {isSailingDomain ? 'Find Sailors' : 'Invite Learners'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  coachHomeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  coachHomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  markSeenText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  coachHomeLinksRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -6,
    marginBottom: 14,
  },
  coachHomeLinkChip: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  coachHomeLinkChipWarn: {
    backgroundColor: '#FEE2E2',
  },
  coachHomeLinkChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  coachHomeLinkChipWarnText: {
    color: '#B91C1C',
  },
  programPreviewSection: {
    marginBottom: 20,
  },
  programPreviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  programPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    boxShadow: '0px 1px',
    elevation: 1,
  },
  competencyTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 12,
    boxShadow: '0px 1px',
    elevation: 1,
  },
  competencyTrendEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    boxShadow: '0px 1px',
    elevation: 1,
  },
  competencyTrendScoreBlock: {
    alignItems: 'flex-end',
  },
  competencyTrendScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  competencyTrendDelta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  programPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  programPreviewMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  clientAvatar: {
    marginRight: 15,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  progressLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  progressLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  missingDescription: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryLink: {
    marginTop: 16,
  },
  secondaryLinkText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
