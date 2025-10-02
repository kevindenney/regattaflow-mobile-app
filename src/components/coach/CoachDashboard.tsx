import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CoachMarketplaceService } from '../../services/CoachService';
import PaymentService from '../../services/PaymentService';
import { CoachingSession } from '../../types/coach';

interface DashboardStats {
  totalEarnings: number;
  pendingPayouts: number;
  completedSessions: number;
  upcomingSessions: number;
  averageRating: number;
  totalReviews: number;
}

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  sessionCount: number;
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [recentSessions, setRecentSessions] = useState<CoachingSession[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedPeriod]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load coach dashboard data
      const dashboardData = await CoachMarketplaceService.getCoachDashboard(user.id);

      // Calculate stats based on selected period
      const now = new Date();
      const periodStart = new Date();

      switch (selectedPeriod) {
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'month':
          periodStart.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Filter sessions by period
      const periodSessions = dashboardData.sessions.filter(
        session => new Date(session.created_at) >= periodStart
      );

      const completedSessions = periodSessions.filter(s => s.status === 'completed');
      const upcomingSessions = dashboardData.sessions.filter(
        s => s.status === 'confirmed' && new Date(s.scheduled_start) > now
      );

      // Calculate earnings from completed sessions
      const totalEarnings = completedSessions.reduce((sum, session) => sum + session.coach_payout, 0);
      const pendingPayouts = completedSessions
        .filter(s => s.payment_status === 'captured' && !s.payout_processed)
        .reduce((sum, session) => sum + session.coach_payout, 0);

      setStats({
        totalEarnings,
        pendingPayouts,
        completedSessions: completedSessions.length,
        upcomingSessions: upcomingSessions.length,
        averageRating: dashboardData.profile.average_rating || 0,
        totalReviews: dashboardData.profile.total_reviews || 0,
      });

      // Set recent sessions (last 10)
      setRecentSessions(
        dashboardData.sessions
          .sort((a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())
          .slice(0, 10)
      );

      // Generate mock payout history (in production, this would come from the backend)
      setPayoutHistory(generateMockPayoutHistory(completedSessions));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockPayoutHistory = (completedSessions: CoachingSession[]): PayoutRecord[] => {
    // Group sessions by week for payout records
    const payouts: PayoutRecord[] = [];
    const sessionsByWeek = new Map<string, CoachingSession[]>();

    completedSessions.forEach(session => {
      const weekStart = new Date(session.scheduled_start);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!sessionsByWeek.has(weekKey)) {
        sessionsByWeek.set(weekKey, []);
      }
      sessionsByWeek.get(weekKey)!.push(session);
    });

    sessionsByWeek.forEach((sessions, weekKey) => {
      const totalAmount = sessions.reduce((sum, session) => sum + session.coach_payout, 0);
      payouts.push({
        id: `payout_${weekKey}`,
        amount: totalAmount,
        status: Math.random() > 0.3 ? 'completed' : 'pending',
        date: weekKey,
        sessionCount: sessions.length,
      });
    });

    return payouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleRequestPayout = async () => {
    Alert.alert(
      'Request Payout',
      `Request payout of ${formatPrice(stats.pendingPayouts)}? Payouts are typically processed within 2-3 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              // In production, this would call a backend endpoint
              Alert.alert('Payout Requested', 'Your payout request has been submitted and will be processed within 2-3 business days.');
            } catch (error) {
              Alert.alert('Error', 'Failed to request payout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00AA33';
      case 'confirmed':
        return '#0066CC';
      case 'pending':
        return '#FFA500';
      case 'cancelled':
        return '#FF6B35';
      default:
        return '#666';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00AA33';
      case 'processing':
        return '#0066CC';
      case 'pending':
        return '#FFA500';
      case 'failed':
        return '#FF6B35';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Coach Dashboard</Text>

        {/* Period Selector */}
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
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.earningsCard]}>
          <Text style={styles.statValue}>{formatPrice(stats.totalEarnings)}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>

        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={styles.statValue}>{formatPrice(stats.pendingPayouts)}</Text>
          <Text style={styles.statLabel}>Pending Payouts</Text>
          {stats.pendingPayouts > 0 && (
            <TouchableOpacity style={styles.requestButton} onPress={handleRequestPayout}>
              <Text style={styles.requestButtonText}>Request</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedSessions}</Text>
          <Text style={styles.statLabel}>Completed Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.upcomingSessions}</Text>
          <Text style={styles.statLabel}>Upcoming Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Average Rating</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalReviews}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {recentSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <View
                style={[
                  styles.sessionStatus,
                  { backgroundColor: getSessionStatusColor(session.status) },
                ]}
              >
                <Text style={styles.sessionStatusText}>{session.status}</Text>
              </View>
            </View>
            <Text style={styles.sessionDate}>
              {formatDate(session.scheduled_start)}
            </Text>
            <Text style={styles.sessionPayout}>
              Payout: {formatPrice(session.coach_payout)}
            </Text>
          </View>
        ))}
      </View>

      {/* Payout History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payout History</Text>
        {payoutHistory.map((payout) => (
          <View key={payout.id} style={styles.payoutCard}>
            <View style={styles.payoutHeader}>
              <Text style={styles.payoutAmount}>{formatPrice(payout.amount)}</Text>
              <View
                style={[
                  styles.payoutStatus,
                  { backgroundColor: getPayoutStatusColor(payout.status) },
                ]}
              >
                <Text style={styles.payoutStatusText}>{payout.status}</Text>
              </View>
            </View>
            <Text style={styles.payoutDate}>{formatDate(payout.date)}</Text>
            <Text style={styles.payoutSessions}>
              {payout.sessionCount} session{payout.sessionCount !== 1 ? 's' : ''}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px',
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    boxShadow: '0px 2px',
    elevation: 3,
  },
  earningsCard: {
    backgroundColor: '#E6F3FF',
  },
  pendingCard: {
    backgroundColor: '#FFF4E6',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requestButton: {
    marginTop: 8,
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  requestButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionStatusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionPayout: {
    fontSize: 14,
    color: '#00AA33',
    fontWeight: '500',
  },
  payoutCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  payoutStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  payoutStatusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payoutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  payoutSessions: {
    fontSize: 12,
    color: '#666',
  },
});