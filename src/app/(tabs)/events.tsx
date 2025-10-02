import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';

export default function EventsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Events</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={32} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>New Event</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="sailboat" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>New Regatta</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="school-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionText}>Training</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Upcoming Events</ThemedText>

          {/* Placeholder event cards */}
          {[
            {
              title: 'Spring Championship Regatta',
              date: 'March 15-17, 2024',
              participants: 45,
              status: 'Registration Open',
              color: '#10B981'
            },
            {
              title: 'Junior Sailing Training',
              date: 'March 22, 2024',
              participants: 18,
              status: 'Confirmed',
              color: '#007AFF'
            },
            {
              title: 'Club Social Evening',
              date: 'March 30, 2024',
              participants: 32,
              status: 'Planning',
              color: '#F59E0B'
            },
          ].map((event, i) => (
            <TouchableOpacity key={i} style={styles.eventCard}>
              <View style={[styles.eventStatus, { backgroundColor: event.color }]} />
              <View style={styles.eventInfo}>
                <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
                <ThemedText style={styles.eventDate}>{event.date}</ThemedText>
                <View style={styles.eventMeta}>
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="people-outline" size={16} color="#64748B" />
                    <ThemedText style={styles.eventMetaText}>{event.participants} registered</ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${event.color}20` }]}>
                    <ThemedText style={[styles.statusText, { color: event.color }]}>
                      {event.status}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
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
});