import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RealtimeConnectionIndicator } from '@/components/ui/RealtimeConnectionIndicator';
import { useBookingRequests, useCoachingSessions } from '@/hooks/useCoachingSessions';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  // Real-time booking requests for coaches
  const { requests, unreadCount, loading: requestsLoading } = useBookingRequests(user?.id);

  // Real-time coaching sessions
  const { sessions, loading: sessionsLoading } = useCoachingSessions(user?.id);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helpers for sessions formatting
  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const getSessionDate = (s: any) => {
    // Legacy separate date/time
    if (s.session_date) return new Date(s.session_date);
    // Single timestamp
    if (s.scheduled_at) return new Date(s.scheduled_at);
    // Range start
    if (s.start_time) return new Date(s.start_time);
    return new Date();
  };

  const getSessionDateTime = (s: any) => {
    // Combine date and time if provided separately
    if (s.session_date && s.session_time) {
      return new Date(`${s.session_date}T${s.session_time}`);
    }
    if (s.scheduled_at) return new Date(s.scheduled_at);
    if (s.start_time) return new Date(s.start_time);
    return getSessionDate(s);
  };

  const formatSessionTime = (s: any) => {
    const dt = getSessionDateTime(s);
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionClientName = (s: any) => {
    return s?.sailor?.full_name || s?.sailor?.email || 'Client';
  };

  const formatSessionType = (t: string) => {
    if (!t) return 'Session';
    const map: Record<string, string> = {
      individual: 'Individual Session',
      small_group: 'Small Group',
      large_group: 'Large Group',
      on_water: 'On-Water Training',
      video_review: 'Video Review',
      strategy: 'Strategy Session',
      boat_setup: 'Boat Setup',
      fitness: 'Fitness Coaching',
      mental_coaching: 'Mental Coaching',
    };
    return map[t] || t.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Schedule</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Real-time Connection Status */}
        <View style={styles.connectionContainer}>
          <RealtimeConnectionIndicator variant="full" />
        </View>

        {/* Booking Requests Badge */}
        {unreadCount > 0 && (
          <View style={styles.notificationBanner}>
            <View style={styles.notificationContent}>
              <Ionicons name="notifications" size={24} color="#DC2626" />
              <ThemedText style={styles.notificationText}>
                {unreadCount} new booking {unreadCount === 1 ? 'request' : 'requests'}
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.dateHeader}>
          <TouchableOpacity style={styles.dateNav}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={styles.dateText}>{formatDate(selectedDate)}</ThemedText>
          <TouchableOpacity style={styles.dateNav}>
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Today's Sessions</ThemedText>

          {/* Loading state */}
          {sessionsLoading && (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}

          {/* Empty state */}
          {!sessionsLoading && sessions.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
              <ThemedText style={{ color: '#64748B', marginTop: 8 }}>
                No sessions scheduled yet
              </ThemedText>
            </View>
          )}

          {/* Real sessions for selected day */}
          {!sessionsLoading && sessions.length > 0 && (
            <>
              {sessions
                .filter((s) => isSameDay(getSessionDate(s), selectedDate))
                .sort((a, b) => getSessionDateTime(a).getTime() - getSessionDateTime(b).getTime())
                .map((s) => (
                  <TouchableOpacity key={s.id} style={styles.sessionCard}>
                    <View style={styles.timeBlock}>
                      <ThemedText style={styles.sessionTime}>{formatSessionTime(s)}</ThemedText>
                    </View>
                    <View style={styles.sessionInfo}>
                      <ThemedText style={styles.sessionClient}>{getSessionClientName(s)}</ThemedText>
                      <ThemedText style={styles.sessionType}>{formatSessionType(s.session_type as string)}</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Upcoming This Week</ThemedText>

          <View style={styles.weekOverview}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <View key={i} style={[styles.dayBlock, i === 2 && styles.dayBlockActive]}>
                <ThemedText style={[styles.dayText, i === 2 && styles.dayTextActive]}>{day}</ThemedText>
                <ThemedText style={[styles.dayCount, i === 2 && styles.dayCountActive]}>{i + 1}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.availabilitySection}>
          <ThemedText style={styles.sectionTitle}>Set Availability</ThemedText>
          <TouchableOpacity style={styles.availabilityButton}>
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.availabilityText}>Manage Availability</ThemedText>
          </TouchableOpacity>
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
  connectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  notificationBanner: {
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    padding: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  dateNav: {
    padding: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  timeBlock: {
    marginRight: 15,
    minWidth: 80,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  sessionType: {
    fontSize: 14,
    color: '#64748B',
  },
  weekOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBlock: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 2,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  dayBlockActive: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  dayCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayCountActive: {
    color: '#FFFFFF',
  },
  availabilitySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
});