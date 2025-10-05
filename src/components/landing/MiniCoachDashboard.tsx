import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function MiniCoachDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>18</Text>
          <Text style={styles.kpiLabel}>Clients</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>$4.2k</Text>
          <Text style={styles.kpiLabel}>Month</Text>
        </View>
      </View>

      {/* Today's Sessions */}
      <View style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Ionicons name="calendar" size={16} color="#8B5CF6" />
          <Text style={styles.sessionTitle}>Today's Sessions</Text>
        </View>
        <View style={styles.sessionItem}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionTimeText}>2:00 PM</Text>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionClient}>Sarah Chen</Text>
            <Text style={styles.sessionType}>Race Analysis</Text>
          </View>
          <View style={[styles.sessionStatus, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.sessionItem}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionTimeText}>4:00 PM</Text>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionClient}>Marcus Lee</Text>
            <Text style={styles.sessionType}>Live Coaching</Text>
          </View>
          <View style={[styles.sessionStatus, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="time" size={10} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Client Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Ionicons name="trending-up" size={16} color="#10B981" />
          <Text style={styles.progressTitle}>Client Progress</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressName}>Emma Thompson</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '85%' }]} />
          </View>
          <Text style={styles.progressPercent}>85%</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressName}>Tom Wilson</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '65%' }]} />
          </View>
          <Text style={styles.progressPercent}>65%</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <View style={[styles.actionCard, { backgroundColor: '#F5F3FF' }]}>
          <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
          <Text style={styles.actionText}>Schedule</Text>
        </View>
        <View style={[styles.actionCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cash-outline" size={20} color="#F59E0B" />
          <Text style={styles.actionText}>Earnings</Text>
        </View>
      </View>

      {/* New Leads */}
      <View style={styles.leadsCard}>
        <Text style={styles.leadsTitle}>New Leads (3)</Text>
        <View style={styles.leadItem}>
          <View style={styles.leadAvatar}>
            <Ionicons name="person" size={12} color="#8B5CF6" />
          </View>
          <View style={styles.leadDetails}>
            <Text style={styles.leadName}>Alex Johnson</Text>
            <Text style={styles.leadService}>Strategy Session</Text>
          </View>
          <Text style={styles.leadTime}>2h ago</Text>
        </View>
        <View style={styles.leadItem}>
          <View style={styles.leadAvatar}>
            <Ionicons name="person" size={12} color="#8B5CF6" />
          </View>
          <View style={styles.leadDetails}>
            <Text style={styles.leadName}>Lisa Park</Text>
            <Text style={styles.leadService}>Performance Review</Text>
          </View>
          <Text style={styles.leadTime}>5h ago</Text>
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
    color: '#8B5CF6',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  sessionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sessionTime: {
    width: 48,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#F5F3FF',
    borderRadius: 6,
  },
  sessionTimeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionClient: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  sessionType: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
  sessionStatus: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  progressItem: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
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
  leadsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leadsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  leadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  leadAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadDetails: {
    flex: 1,
  },
  leadName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
  },
  leadService: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
  leadTime: {
    fontSize: 9,
    color: '#8B5CF6',
  },
});
