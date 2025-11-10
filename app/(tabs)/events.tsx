
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, { ClubEvent, EventRegistrationStats } from '@/services/eventService';

type Metric = {
  key: string;
  label: string;
  value: string;
  helper?: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const QUICK_ACTIONS = [
  {
    key: 'regatta',
    icon: 'boat',
    label: 'New Regatta',
    route: '/club/event/create?type=regatta',
  },
  {
    key: 'training',
    icon: 'school-outline',
    label: 'Training Session',
    route: '/club/event/create?type=training',
  },
  {
    key: 'social',
    icon: 'people-outline',
    label: 'Social Night',
    route: '/club/event/create?type=social',
  },
  {
    key: 'document',
    icon: 'document-outline',
    label: 'Upload NOR / SI',
    route: '/club/event/create',
    disabled: true,
  },
] as const;

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventStats, setEventStats] = useState<Record<string, EventRegistrationStats>>({});

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // For now, load public events. In production, filter by user's club
      const data = await EventService.getUpcomingEvents(20);
      setEvents(data);

      const statsPromises = data.map(async (event) => {
        try {
          const stats = await EventService.getRegistrationStats(event.id);
          return { id: event.id, stats };
        } catch (error) {
          return { id: event.id, stats: null };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, EventRegistrationStats> = {};
      statsResults.forEach(({ id, stats }) => {
        if (stats) statsMap[id] = stats;
      });
      setEventStats(statsMap);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return '#10B981';
      case 'registration_closed':
      case 'in_progress':
        return '#2563EB';
      case 'completed':
        return '#64748B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6366F1';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'registration_closed':
        return 'Registration Closed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'published':
        return 'Published';
      default:
        return 'Draft';
    }
  };

  const formatEventDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM dd, yyyy');
    }

    return `${format(start, 'MMM dd')} – ${format(end, 'MMM dd, yyyy')}`;
  };

  const now = new Date();
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.start_date) >= now)
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    [events, now]
  );

  const highlightEvent = upcomingEvents[0];

  const metrics = useMemo<Metric[]>(() => {
    if (!events.length) {
      return [
        {
          key: 'launch',
          label: 'Next Step',
          value: 'Create your first regatta',
          helper: 'Open registration, invite members, and publish docs.',
          icon: 'rocket-outline',
        },
        {
          key: 'payments',
          label: 'Payments',
          value: 'Connect Stripe',
          helper: 'Enable entry fees and automate payouts.',
          icon: 'card-outline',
        },
        {
          key: 'documents',
          label: 'Documents',
          value: 'Centralize NOR / SI',
          helper: 'Keep notices in one place for sailors.',
          icon: 'document-text-outline',
        },
      ];
    }

    const totalRegistrations = events.reduce((sum, event) => {
      const stats = eventStats[event.id];
      return sum + (stats?.approved_count ?? 0);
    }, 0);

    const openRegistration = events.filter((event) => event.status === 'registration_open').length;
    const publishedEvents = events.filter((event) => event.status === 'published').length;

    return [
      {
        key: 'upcoming',
        label: 'Upcoming',
        value: `${upcomingEvents.length}`,
        helper: 'Events scheduled for the next 60 days.',
        icon: 'calendar-outline',
      },
      {
        key: 'entries',
        label: 'Confirmed Entries',
        value: `${totalRegistrations}`,
        helper: 'Approved registrations across all events.',
        icon: 'people-outline',
      },
      {
        key: 'status',
        label: 'Live Status',
        value: `${openRegistration} open • ${publishedEvents} published`,
        helper: 'Keep registration momentum going.',
        icon: 'flag-outline',
      },
    ];
  }, [eventStats, events, upcomingEvents.length]);

  const operationsChecklist = [
    { key: 'collect-fees', label: 'Connect payouts & set entry fees' },
    { key: 'invite-team', label: 'Invite PRO / scorer to collaborate' },
    { key: 'publish-docs', label: 'Upload latest NOR & SIs' },
    { key: 'notify-sailors', label: 'Send kickoff email to entrants' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.heroTitle}>Club Operations HQ</ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              {highlightEvent
                ? `Next up: ${highlightEvent.title} ${formatDistanceToNow(
                    new Date(highlightEvent.start_date),
                    { addSuffix: true }
                  )}`
                : 'Launch your next regatta, publish documents, and track registrations in one place.'}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push('/club/event/create')}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <ThemedText style={styles.heroButtonText}>Create Event</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          {metrics.map((metric) => (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Ionicons name={metric.icon as any} size={18} color="#2563EB" />
              </View>
              <ThemedText style={styles.metricLabel}>{metric.label}</ThemedText>
              <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
              {metric.helper ? (
                <ThemedText style={styles.metricHelper}>{metric.helper}</ThemedText>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Quick actions</ThemedText>
            <ThemedText style={styles.sectionHelper}>Jump straight into common tasks</ThemedText>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.quickTile, action.disabled && styles.quickTileDisabled]}
                disabled={action.disabled}
                onPress={() => router.push(action.route)}
              >
                <Ionicons
                  name={action.icon as any}
                  size={22}
                  color={action.disabled ? '#94A3B8' : '#2563EB'}
                />
                <ThemedText
                  style={[styles.quickTileLabel, action.disabled && styles.quickTileLabelDisabled]}
                >
                  {action.label}
                </ThemedText>
                {action.disabled ? (
                  <ThemedText style={styles.quickTileHint}>Coming soon</ThemedText>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Upcoming events</ThemedText>
            <TouchableOpacity onPress={loadEvents} style={styles.inlineLink}>
              <Ionicons name="refresh" size={16} color="#2563EB" />
              <ThemedText style={styles.inlineLinkText}>Refresh</ThemedText>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <ThemedText style={styles.loadingText}>Syncing with RegattaFlow…</ThemedText>
            </View>
          ) : upcomingEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color="#2563EB" />
              </View>
              <ThemedText style={styles.emptyTitle}>No events on the horizon</ThemedText>
              <ThemedText style={styles.emptyBody}>
                Start a regatta or training block to populate your calendar and notify sailors.
              </ThemedText>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/club/event/create')}
              >
                <ThemedText style={styles.primaryButtonText}>Plan an Event</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingEvents.map((event) => {
              const stats = eventStats[event.id];
              const statusColor = getStatusColor(event.status);

              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/club/event/${event.id}`)}
                >
                  <View style={[styles.eventStatus, { backgroundColor: statusColor }]} />
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}
                      >
                        <Ionicons name="ellipse" size={10} color={statusColor} style={{ marginRight: 4 }} />
                        <ThemedText style={[styles.statusText, { color: statusColor }]}
                        >
                          {getStatusLabel(event.status)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.eventDate}>
                      {formatEventDateRange(event.start_date, event.end_date)}
                    </ThemedText>
                    <View style={styles.eventMeta}>
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="people-outline" size={16} color="#64748B" />
                        <ThemedText style={styles.eventMetaText}>
                          {stats?.approved_count ?? 0} confirmed
                          {event.max_participants ? ` • Cap ${event.max_participants}` : ''}
                        </ThemedText>
                      </View>
                      {event.registration_closes ? (
                        <View style={styles.eventMetaItem}>
                          <Ionicons name="time-outline" size={16} color="#64748B" />
                          <ThemedText style={styles.eventMetaText}>
                            Reg closes {format(new Date(event.registration_closes), 'MMM d')}
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.splitRow}>
          <View style={[styles.sectionCard, styles.splitCard]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Calendar</ThemedText>
              <ThemedText style={styles.sectionHelper}>Preview the month at a glance</ThemedText>
            </View>
            <View style={styles.calendarShell}>
              <View style={styles.calendarRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <ThemedText key={day} style={styles.calendarDayLabel}>
                    {day}
                  </ThemedText>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {Array.from({ length: 35 }).map((_, index) => {
                  const day = (index % 30) + 1;
                  const hasEvent = upcomingEvents.some(
                    (event) => new Date(event.start_date).getDate() === day
                  );
                  return (
                    <View
                      key={`${index}-${day}`}
                      style={[styles.calendarCell, hasEvent && styles.calendarCellActive]}
                    >
                      <ThemedText style={[styles.calendarDay, hasEvent && styles.calendarDayActive]}>
                        {day}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.calendarFooter}>
                <ThemedText style={styles.calendarLink}>Open full calendar</ThemedText>
                <Ionicons name="open-outline" size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionCard, styles.splitCard]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Operations checklist</ThemedText>
              <ThemedText style={styles.sectionHelper}>
                Keep race committee and members aligned
              </ThemedText>
            </View>
            {operationsChecklist.map((item, index) => (
              <View key={item.key} style={styles.checklistItem}>
                <View style={styles.checklistBadge}>
                  <ThemedText style={styles.checklistNumber}>{index + 1}</ThemedText>
                </View>
                <ThemedText style={styles.checklistLabel}>{item.label}</ThemedText>
              </View>
            ))}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/club/event/create')}
            >
              <Ionicons name="sparkles-outline" size={18} color="#2563EB" />
              <ThemedText style={styles.secondaryButtonText}>View onboarding guide</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  heroCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  heroCopy: {
    flex: 1,
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
  },
  heroButton: {
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 4,
  },
  metricHelper: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHelper: {
    fontSize: 13,
    color: '#64748B',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickTile: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-start',
    gap: 10,
  },
  quickTileDisabled: {
    backgroundColor: '#F1F5F9',
  },
  quickTileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  quickTileLabelDisabled: {
    color: '#94A3B8',
  },
  quickTileHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  inlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineLinkText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyBody: {
    textAlign: 'center',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  eventStatus: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  eventDate: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    color: '#475569',
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  splitCard: {
    flex: 1,
    minWidth: 260,
  },
  calendarShell: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  calendarRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellActive: {
    backgroundColor: '#DBEAFE',
  },
  calendarDay: {
    fontSize: 14,
    color: '#1F2937',
  },
  calendarDayActive: {
    fontWeight: '700',
    color: '#1D4ED8',
  },
  calendarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calendarLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  checklistBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  checklistLabel: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    fontWeight: '500',
  },
  secondaryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});
