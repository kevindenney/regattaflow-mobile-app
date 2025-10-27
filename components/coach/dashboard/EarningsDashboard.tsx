/**
 * Coach Earnings Dashboard
 * Displays earnings, session stats, and payout information for coaches
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { CoachMarketplaceService } from '@/services/CoachService';

interface EarningsPeriod {
  totalEarnings: number;
  sessionCount: number;
  averageEarningsPerSession: number;
  pendingPayouts: number;
  period: 'week' | 'month' | 'year';
}

interface EarningsStats {
  week: EarningsPeriod;
  month: EarningsPeriod;
  year: EarningsPeriod;
}

interface EarningsDashboardProps {
  coachId: string;
  style?: any;
}

export const EarningsDashboard: React.FC<EarningsDashboardProps> = ({
  coachId,
  style,
}) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [earnings, setEarnings] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, [coachId]);

  const loadEarnings = async () => {
    if (!coachId) return;

    setLoading(true);
    try {
      const [weekData, monthData, yearData] = await Promise.all([
        CoachMarketplaceService.getCoachEarnings(coachId, 'week'),
        CoachMarketplaceService.getCoachEarnings(coachId, 'month'),
        CoachMarketplaceService.getCoachEarnings(coachId, 'year'),
      ]);

      setEarnings({
        week: weekData,
        month: monthData,
        year: yearData,
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getCurrentEarnings = () => {
    return earnings ? earnings[selectedPeriod] : null;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEarningsCard = () => {
    const currentEarnings = getCurrentEarnings();
    if (!currentEarnings) return null;

    return (
      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <View>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsAmount}>
              {formatCurrency(currentEarnings.totalEarnings)}
            </Text>
          </View>
          <View style={styles.earningsIcon}>
            <Ionicons name="trending-up" size={24} color="#00AA33" />
          </View>
        </View>

        <View style={styles.earningsDetails}>
          <View style={styles.earningsDetailItem}>
            <Text style={styles.earningsDetailLabel}>Sessions</Text>
            <Text style={styles.earningsDetailValue}>{currentEarnings.sessionCount}</Text>
          </View>
          <View style={styles.earningsDetailItem}>
            <Text style={styles.earningsDetailLabel}>Avg per Session</Text>
            <Text style={styles.earningsDetailValue}>
              {formatCurrency(currentEarnings.averageEarningsPerSession)}
            </Text>
          </View>
        </View>

        {currentEarnings.pendingPayouts > 0 && (
          <View style={styles.pendingPayouts}>
            <Ionicons name="time" size={16} color="#FF9500" />
            <Text style={styles.pendingPayoutsText}>
              {formatCurrency(currentEarnings.pendingPayouts)} pending payout
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderQuickStats = () => {
    if (!earnings) return null;

    const allTimeTotal = earnings.year.totalEarnings;
    const monthlyGrowth = earnings.month.totalEarnings - earnings.week.totalEarnings * 4;
    const totalSessions = earnings.year.sessionCount;

    return (
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatCard}>
          <Ionicons name="wallet" size={20} color="#0066CC" />
          <Text style={styles.quickStatLabel}>All Time</Text>
          <Text style={styles.quickStatValue}>{formatCurrency(allTimeTotal)}</Text>
        </View>

        <View style={styles.quickStatCard}>
          <Ionicons name="calendar" size={20} color="#00AA33" />
          <Text style={styles.quickStatLabel}>Total Sessions</Text>
          <Text style={styles.quickStatValue}>{totalSessions}</Text>
        </View>

        <View style={styles.quickStatCard}>
          <Ionicons name="trending-up" size={20} color="#FF9500" />
          <Text style={styles.quickStatLabel}>Growth</Text>
          <Text style={[
            styles.quickStatValue,
            { color: monthlyGrowth >= 0 ? '#00AA33' : '#FF3B30' }
          ]}>
            {monthlyGrowth >= 0 ? '+' : ''}{formatCurrency(Math.abs(monthlyGrowth))}
          </Text>
        </View>
      </View>
    );
  };

  const renderPayoutInfo = () => (
    <View style={styles.payoutInfoCard}>
      <View style={styles.payoutInfoHeader}>
        <Ionicons name="information-circle" size={20} color="#0066CC" />
        <Text style={styles.payoutInfoTitle}>Payout Information</Text>
      </View>

      <View style={styles.payoutInfoContent}>
        <View style={styles.payoutInfoItem}>
          <Text style={styles.payoutInfoLabel}>Platform Fee</Text>
          <Text style={styles.payoutInfoValue}>15%</Text>
        </View>
        <View style={styles.payoutInfoItem}>
          <Text style={styles.payoutInfoLabel}>You Keep</Text>
          <Text style={styles.payoutInfoValue}>85%</Text>
        </View>
        <View style={styles.payoutInfoItem}>
          <Text style={styles.payoutInfoLabel}>Payout Schedule</Text>
          <Text style={styles.payoutInfoValue}>Weekly</Text>
        </View>
        <View style={styles.payoutInfoItem}>
          <Text style={styles.payoutInfoLabel}>Next Payout</Text>
          <Text style={styles.payoutInfoValue}>
            {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.payoutInfoNote}>
        Payouts are processed automatically every Friday for sessions completed in the previous week.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>💰 Earnings</Text>
        <Text style={styles.subtitle}>Track your coaching income and payouts</Text>
      </View>

      {renderPeriodSelector()}
      {renderEarningsCard()}
      {renderQuickStats()}
      {renderPayoutInfo()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#0066CC',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  earningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px',
    elevation: 4,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  earningsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  earningsDetailItem: {
    alignItems: 'center',
  },
  earningsDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  earningsDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pendingPayouts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  pendingPayoutsText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  payoutInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  payoutInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  payoutInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  payoutInfoContent: {
    marginBottom: 16,
  },
  payoutInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  payoutInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  payoutInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  payoutInfoNote: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default EarningsDashboard;