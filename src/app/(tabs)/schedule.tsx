import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
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

          {/* Placeholder session cards */}
          {[
            { time: '09:00 AM', client: 'Sarah Johnson', type: 'On-Water Training' },
            { time: '11:00 AM', client: 'Mike Chen', type: 'Tactics Review' },
            { time: '02:00 PM', client: 'Team Practice', type: 'Group Session' },
          ].map((session, i) => (
            <TouchableOpacity key={i} style={styles.sessionCard}>
              <View style={styles.timeBlock}>
                <ThemedText style={styles.sessionTime}>{session.time}</ThemedText>
              </View>
              <View style={styles.sessionInfo}>
                <ThemedText style={styles.sessionClient}>{session.client}</ThemedText>
                <ThemedText style={styles.sessionType}>{session.type}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
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