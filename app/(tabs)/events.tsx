import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService, { ClubEvent, EventRegistrationStats } from '@/services/eventService';
import { format } from 'date-fns';

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

      // Load stats for each event
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
        return '#007AFF';
      case 'completed':
        return '#64748B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#F59E0B';
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

  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM dd, yyyy');
    }

    return `${format(start, 'MMM dd')}-${format(end, 'dd, yyyy')}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Events</ThemedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/club/event/create')}
          >
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/club/event/create?type=regatta')}
          >
            <Ionicons name="sailboat" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>New Regatta</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/club/event/create?type=training')}
          >
            <Ionicons name="school-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>Training</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/club/event/create?type=social')}
          >
            <Ionicons name="people-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>Social</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Upcoming Events</ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
              <ThemedText style={styles.emptyText}>No upcoming events</ThemedText>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/club/event/create')}
              >
                <ThemedText style={styles.createButtonText}>Create Event</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            events.map((event) => {
              const stats = eventStats[event.id];
              const statusColor = getStatusColor(event.status);

              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => router.push(`/club/event/${event.id}`)}
                >
                  <View style={[styles.eventStatus, { backgroundColor: statusColor }]} />
                  <View style={styles.eventInfo}>
                    <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                    <ThemedText style={styles.eventDate}>
                      {formatEventDate(event.start_date, event.end_date)}
                    </ThemedText>
                    <View style={styles.eventMeta}>
                      <View style={styles.eventMetaItem}>
                        <Ionicons name="people-outline" size={16} color="#64748B" />
                        <ThemedText style={styles.eventMetaText}>
                          {stats?.approved_count || 0} registered
                          {event.max_participants && ` / ${event.max_participants}`}
                        </ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                          {getStatusLabel(event.status)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Event Calendar</ThemedText>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.calendarNav}>
                <Ionicons name="chevron-back" size={24} color="#007AFF" />
              </TouchableOpacity>
              <ThemedText style={styles.calendarMonth}>March 2024</ThemedText>
              <TouchableOpacity style={styles.calendarNav}>
                <Ionicons name="chevron-forward" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <ThemedText key={i} style={styles.calendarDayHeader}>{day}</ThemedText>
              ))}
              {Array.from({ length: 35 }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.calendarDay,
                    (i === 14 || i === 21 || i === 29) && styles.calendarDayWithEvent
                  ]}
                >
                  <ThemedText style={[
                    styles.calendarDayText,
                    i < 7 && styles.calendarDayTextFaded,
                    (i === 14 || i === 21 || i === 29) && styles.calendarDayTextEvent
                  ]}>
                    {i < 7 ? 25 + i : i - 6}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Event Statistics</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>12</ThemedText>
              <ThemedText style={styles.statLabel}>Events This Year</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>248</ThemedText>
              <ThemedText style={styles.statLabel}>Total Participants</ThemedText>
            </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
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
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    marginBottom: 12,
    boxShadow: '0px 1px',
    elevation: 2,
    overflow: 'hidden',
  },
  eventStatus: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
  },
  eventInfo: {
    flex: 1,
    padding: 16,
    paddingLeft: 20,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNav: {
    padding: 4,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  calendarDay: {
    width: '14.28%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  calendarDayWithEvent: {
    backgroundColor: '#007AFF',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1E293B',
  },
  calendarDayTextFaded: {
    color: '#CBD5E1',
  },
  calendarDayTextEvent: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});