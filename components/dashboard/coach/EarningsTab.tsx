import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSection, DashboardKPICard } from '../shared';
import { createLogger } from '@/lib/utils/logger';

interface EarningsData {
  monthly: {
    current: number;
    previous: number;
    projected: number;
  };
  weekly: {
    current: number;
    previous: number;
  };
  transactions: Array<{
    id: string;
    client: string;
    service: string;
    amount: number;
    date: string;
    status: 'paid' | 'pending' | 'overdue';
  }>;
  breakdown: {
    sessions: number;
    programs: number;
    raceDaySupport: number;
    other: number;
  };
}

interface EarningsTabProps {
  earningsData: EarningsData;
  onViewTransaction: (transactionId: string) => void;
  onRequestPayout: () => void;
  onViewTaxInfo: () => void;
}

const logger = createLogger('EarningsTab');
export function EarningsTab({
  earningsData,
  onViewTransaction,
  onRequestPayout,
  onViewTaxInfo
}: EarningsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const monthlyGrowth = ((earningsData.monthly.current - earningsData.monthly.previous) / earningsData.monthly.previous * 100);
  const weeklyGrowth = ((earningsData.weekly.current - earningsData.weekly.previous) / earningsData.weekly.previous * 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Earnings Overview */}
      <DashboardSection title="💰 Earnings Overview" showBorder={false}>
        <View style={styles.kpiGrid}>
          <DashboardKPICard
            title="This Month"
            value={`$${earningsData.monthly.current.toLocaleString()}`}
            icon="cash-outline"
            iconColor="#10B981"
            trend={{
              direction: monthlyGrowth > 0 ? 'up' : 'down',
              value: `${Math.abs(monthlyGrowth).toFixed(1)}%`
            }}
          />
          <DashboardKPICard
            title="This Week"
            value={`$${earningsData.weekly.current.toLocaleString()}`}
            icon="trending-up-outline"
            iconColor="#3B82F6"
            trend={{
              direction: weeklyGrowth > 0 ? 'up' : 'down',
              value: `${Math.abs(weeklyGrowth).toFixed(1)}%`
            }}
          />
          <DashboardKPICard
            title="Projected"
            value={`$${earningsData.monthly.projected.toLocaleString()}`}
            subtitle="month end"
            icon="analytics-outline"
            iconColor="#6366F1"
          />
          <DashboardKPICard
            title="Pending"
            value={`$${earningsData.transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`}
            icon="time-outline"
            iconColor="#F59E0B"
          />
        </View>
      </DashboardSection>

      {/* Earnings Breakdown */}
      <DashboardSection title="📊 Revenue Breakdown">
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="videocam" size={20} color="#3B82F6" />
              <Text style={styles.breakdownLabel}>Live Sessions</Text>
            </View>
            <Text style={styles.breakdownValue}>${earningsData.breakdown.sessions.toLocaleString()}</Text>
            <View style={styles.breakdownBar}>
              <View style={[
                styles.breakdownProgress,
                { width: `${(earningsData.breakdown.sessions / earningsData.monthly.current) * 100}%`, backgroundColor: '#3B82F6' }
              ]} />
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="school" size={20} color="#10B981" />
              <Text style={styles.breakdownLabel}>Training Programs</Text>
            </View>
            <Text style={styles.breakdownValue}>${earningsData.breakdown.programs.toLocaleString()}</Text>
            <View style={styles.breakdownBar}>
              <View style={[
                styles.breakdownProgress,
                { width: `${(earningsData.breakdown.programs / earningsData.monthly.current) * 100}%`, backgroundColor: '#10B981' }
              ]} />
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="boat" size={20} color="#F59E0B" />
              <Text style={styles.breakdownLabel}>Race Day Support</Text>
            </View>
            <Text style={styles.breakdownValue}>${earningsData.breakdown.raceDaySupport.toLocaleString()}</Text>
            <View style={styles.breakdownBar}>
              <View style={[
                styles.breakdownProgress,
                { width: `${(earningsData.breakdown.raceDaySupport / earningsData.monthly.current) * 100}%`, backgroundColor: '#F59E0B' }
              ]} />
            </View>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
              <Text style={styles.breakdownLabel}>Other Services</Text>
            </View>
            <Text style={styles.breakdownValue}>${earningsData.breakdown.other.toLocaleString()}</Text>
            <View style={styles.breakdownBar}>
              <View style={[
                styles.breakdownProgress,
                { width: `${(earningsData.breakdown.other / earningsData.monthly.current) * 100}%`, backgroundColor: '#6B7280' }
              ]} />
            </View>
          </View>
        </View>
      </DashboardSection>

      {/* Recent Transactions */}
      <DashboardSection
        title="💳 Recent Transactions"
        headerAction={{
          label: 'View All',
          onPress: () => logger.debug('View all transactions'),
          icon: 'list-outline'
        }}
      >
        {earningsData.transactions.slice(0, 5).map((transaction) => (
          <TouchableOpacity
            key={transaction.id}
            style={styles.transactionCard}
            onPress={() => onViewTransaction(transaction.id)}
          >
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionClient}>{transaction.client}</Text>
              <Text style={styles.transactionService}>{transaction.service}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={styles.amountValue}>${transaction.amount}</Text>
              <View style={[
                styles.transactionStatus,
                { backgroundColor: getStatusColor(transaction.status) }
              ]}>
                <Text style={styles.statusText}>{transaction.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection title="⚡ Quick Actions">
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={onRequestPayout}>
            <Ionicons name="card" size={24} color="#10B981" />
            <Text style={styles.actionTitle}>Request Payout</Text>
            <Text style={styles.actionSubtitle}>Transfer earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={onViewTaxInfo}>
            <Ionicons name="document-text" size={24} color="#3B82F6" />
            <Text style={styles.actionTitle}>Tax Information</Text>
            <Text style={styles.actionSubtitle}>Download forms</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="analytics" size={24} color="#6366F1" />
            <Text style={styles.actionTitle}>Detailed Report</Text>
            <Text style={styles.actionSubtitle}>Export data</Text>
          </TouchableOpacity>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: -4,
  },
  breakdownContainer: {
    gap: 16,
  },
  breakdownItem: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  breakdownBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownProgress: {
    height: '100%',
    borderRadius: 3,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  transactionService: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});