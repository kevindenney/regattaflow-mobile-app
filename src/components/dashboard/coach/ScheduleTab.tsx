import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSection } from '../shared';

interface ScheduleEvent {
  id: string;
  type: 'session' | 'available' | 'blocked';
  title: string;
  client?: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface ScheduleTabProps {
  events: ScheduleEvent[];
  onEventPress: (eventId: string) => void;
  onAddAvailability: () => void;
  onBlockTime: () => void;
}

export function ScheduleTab({
  events,
  onEventPress,
  onAddAvailability,
  onBlockTime
}: ScheduleTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getEventColor = (type: string, status?: string) => {
    if (status === 'cancelled') return '#EF4444';
    switch (type) {
      case 'session': return '#3B82F6';
      case 'available': return '#10B981';
      case 'blocked': return '#6B7280';
      default: return '#64748B';
    }
  };

  const todaysEvents = events.filter(event => event.date === selectedDate);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <DashboardSection
        title="📅 Coaching Schedule"
        subtitle="Manage your availability and sessions"
        headerAction={{
          label: 'Add Availability',
          onPress: onAddAvailability,
          icon: 'add-circle-outline'
        }}
        showBorder={false}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={onAddAvailability}>
            <Ionicons name="calendar-outline" size={20} color="#10B981" />
            <Text style={styles.quickActionText}>Add Available Time</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={onBlockTime}>
            <Ionicons name="ban-outline" size={20} color="#EF4444" />
            <Text style={styles.quickActionText}>Block Time</Text>
          </TouchableOpacity>
        </View>
      </DashboardSection>

      <DashboardSection title={`Today's Schedule - ${selectedDate}`}>
        {todaysEvents.length > 0 ? (
          todaysEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => onEventPress(event.id)}
            >
              <View style={styles.eventHeader}>
                <View style={[
                  styles.eventType,
                  { backgroundColor: getEventColor(event.type, event.status) }
                ]}>
                  <Text style={styles.eventTypeText}>{event.type}</Text>
                </View>
                <Text style={styles.eventTime}>
                  {event.startTime} - {event.endTime}
                </Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.client && (
                <Text style={styles.eventClient}>Client: {event.client}</Text>
              )}
              {event.status === 'pending' && (
                <View style={styles.pendingAlert}>
                  <Ionicons name="time" size={16} color="#F59E0B" />
                  <Text style={styles.pendingText}>Awaiting confirmation</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyDayTitle}>No events today</Text>
            <Text style={styles.emptyDayText}>Add availability or schedule sessions</Text>
          </View>
        )}
      </DashboardSection>

      <DashboardSection title="📊 Schedule Overview">
        <View style={styles.overviewStats}>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{events.filter(e => e.type === 'session').length}</Text>
            <Text style={styles.overviewLabel}>Sessions This Week</Text>
          </View>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>{events.filter(e => e.type === 'available').length}</Text>
            <Text style={styles.overviewLabel}>Available Slots</Text>
          </View>
          <View style={styles.overviewStat}>
            <Text style={styles.overviewValue}>
              {Math.round(events.filter(e => e.type === 'session').length / (events.filter(e => e.type === 'session').length + events.filter(e => e.type === 'available').length) * 100) || 0}%
            </Text>
            <Text style={styles.overviewLabel}>Utilization</Text>
          </View>
        </View>
      </DashboardSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventClient: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 8,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  pendingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  emptyDay: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyDayText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});