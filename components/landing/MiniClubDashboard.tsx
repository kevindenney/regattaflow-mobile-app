import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function MiniClubDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>247</Text>
          <Text style={styles.kpiLabel}>Members</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>8</Text>
          <Text style={styles.kpiLabel}>Events</Text>
        </View>
      </View>

      {/* Upcoming Events */}
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <Ionicons name="trophy" size={16} color="#10B981" />
          <Text style={styles.eventTitle}>Upcoming Events</Text>
        </View>
        <View style={styles.eventItem}>
          <View style={[styles.eventDot, { backgroundColor: '#3B82F6' }]} />
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>Spring Regatta</Text>
            <Text style={styles.eventDate}>April 15, 2025</Text>
          </View>
          <View style={styles.eventEntries}>
            <Text style={styles.eventEntriesText}>24/30</Text>
          </View>
        </View>
        <View style={styles.eventItem}>
          <View style={[styles.eventDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>Club Championship</Text>
            <Text style={styles.eventDate}>May 20, 2025</Text>
          </View>
          <View style={styles.eventEntries}>
            <Text style={styles.eventEntriesText}>18/40</Text>
          </View>
        </View>
        <View style={styles.eventItem}>
          <View style={[styles.eventDot, { backgroundColor: '#F59E0B' }]} />
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>Junior Training</Text>
            <Text style={styles.eventDate}>Apr 8, 2025</Text>
          </View>
          <View style={styles.eventEntries}>
            <Text style={styles.eventEntriesText}>12/15</Text>
          </View>
        </View>
      </View>

      {/* Facility Status */}
      <View style={styles.facilityCard}>
        <View style={styles.facilityHeader}>
          <Ionicons name="business" size={16} color="#6366F1" />
          <Text style={styles.facilityTitle}>Facilities</Text>
        </View>
        <View style={styles.facilityItem}>
          <Text style={styles.facilityName}>Main Dock</Text>
          <View style={styles.facilityStatus}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.facilityStatusText}>Operational</Text>
          </View>
        </View>
        <View style={styles.facilityItem}>
          <Text style={styles.facilityName}>Club House</Text>
          <View style={styles.facilityStatus}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.facilityStatusText}>Operational</Text>
          </View>
        </View>
        <View style={styles.facilityItem}>
          <Text style={styles.facilityName}>Boat Storage</Text>
          <View style={styles.facilityStatus}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.facilityStatusText}>Maintenance</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <View style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="add-circle-outline" size={20} color="#10B981" />
          <Text style={styles.actionText}>New Event</Text>
        </View>
        <View style={[styles.actionCard, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="people-outline" size={20} color="#3B82F6" />
          <Text style={styles.actionText}>Members</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityCard}>
        <Text style={styles.activityTitle}>Recent Activity</Text>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="person-add" size={10} color="#10B981" />
          </View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityText}>3 new member registrations</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons name="document" size={10} color="#3B82F6" />
          </View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityText}>Spring Regatta entries updated</Text>
            <Text style={styles.activityTime}>5 hours ago</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventDate: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
  eventEntries: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  eventEntriesText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#374151',
  },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  facilityTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  facilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  facilityName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1F2937',
  },
  facilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  facilityStatusText: {
    fontSize: 9,
    color: '#6B7280',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  actionCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#374151',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  activityIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
});
