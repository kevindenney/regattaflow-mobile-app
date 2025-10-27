import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/AuthProvider';
import { StripeConnectService } from '@/services/StripeConnectService';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type StripeTransaction = {
  id: string;
  amount: number;
  currency: string;
  created: number;
  description?: string;
  status?: string;
  type?: string;
};

type MonthlyStats = {
  sessionsCompleted: number;
  averagePerSession: number;
  totalEarned: number;
  platformFee: number;
  currency: string;
};

export default function EarningsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coachProfileId, setCoachProfileId] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState({
    connected: false,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
  });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [balance, setBalance] = useState<{ available: number; pending: number; currency?: string }>({ available: 0, pending: 0, currency: 'usd' });
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    sessionsCompleted: 0,
    averagePerSession: 0,
    totalEarned: 0,
    platformFee: 0,
    currency: 'usd',
  });

  useEffect(() => {
    loadCoachProfile();
  }, [user]);

  const loadCoachProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get the coach profile ID
      const { data: profile, error } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error loading coach profile:', error);
        setLoading(false);
        return;
      }

      setCoachProfileId(profile.id);
      await loadStripeStatus(profile.id);
    } catch (error) {
      console.error('Error loading coach profile:', error);
      setLoading(false);
    }
  };

  const loadStripeStatus = async (profileId: string) => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const status = await StripeConnectService.getConnectStatus(profileId);
      setConnectStatus({
        connected: status.connected,
        detailsSubmitted: status.detailsSubmitted || false,
        chargesEnabled: status.chargesEnabled || false,
        payoutsEnabled: status.payoutsEnabled || false,
      });
      if (status.connected && status.chargesEnabled) {
        await Promise.all([loadFinancials(profileId), loadMonthlyStats()]);
      }
    } catch (error) {
      console.error('Error loading Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancials = useCallback(async (profileId: string) => {
    if (!profileId) return;
    setLoadError(null);
    try {
      const [bal, tx] = await Promise.all([
        StripeConnectService.getBalance(profileId),
        StripeConnectService.getTransactions(profileId, { limit: 25 })
      ]);
      setBalance(bal);
      setTransactions(tx);
    } catch (e: any) {
      console.error('Error loading financials:', e);
      setLoadError(e?.message || 'Failed to load earnings');
    }
  }, []);

  const loadMonthlyStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get current month's date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Query coaching sessions for current month
      const { data: sessions, error } = await supabase
        .from('coaching_sessions')
        .select('fee_amount, currency, paid, status')
        .eq('coach_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth.toISOString())
        .lte('completed_at', endOfMonth.toISOString());

      if (error) {
        console.error('Error loading monthly stats:', error);
        return;
      }

      if (sessions && sessions.length > 0) {
        const totalEarned = sessions.reduce((sum: number, s: any) => sum + (Number(s.fee_amount) || 0), 0);
        const sessionsCompleted = sessions.length;
        const averagePerSession = sessionsCompleted > 0 ? totalEarned / sessionsCompleted : 0;
        const platformFee = totalEarned * 0.15; // 15% platform fee
        const currency = sessions[0]?.currency?.toLowerCase() || 'usd';

        setMonthlyStats({
          sessionsCompleted,
          averagePerSession,
          totalEarned,
          platformFee,
          currency,
        });
      }
    } catch (e: any) {
      console.error('Error loading monthly stats:', e);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (coachProfileId) {
        await Promise.all([loadStripeStatus(coachProfileId), loadFinancials(coachProfileId), loadMonthlyStats()]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [coachProfileId, loadFinancials, loadMonthlyStats]);

  const handleOpenDashboard = async () => {
    if (!coachProfileId) return;

    setLoadingDashboard(true);
    try {
      const result = await StripeConnectService.getDashboardLink(coachProfileId);
      if (result.success && result.url) {
        await Linking.openURL(result.url);
      } else {
        Alert.alert('Error', result.error || 'Failed to open Stripe dashboard');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleSetupStripe = async () => {
    if (!coachProfileId) return;

    try {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const result = await StripeConnectService.startOnboarding(
        coachProfileId,
        `${appUrl}/(tabs)/earnings`,
        `${appUrl}/(tabs)/earnings`
      );

      if (result.success && result.url) {
        await Linking.openURL(result.url);
      } else {
        Alert.alert('Error', result.error || 'Failed to start Stripe onboarding');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to setup payments');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading earnings...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!connectStatus.connected || !connectStatus.chargesEnabled) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Earnings</ThemedText>
          </View>

          <View style={styles.setupCard}>
            <Ionicons name="card-outline" size={64} color="#007AFF" />
            <ThemedText style={styles.setupTitle}>Payment Setup Required</ThemedText>
            <ThemedText style={styles.setupDescription}>
              Connect your bank account with Stripe to start receiving payments from coaching sessions.
            </ThemedText>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={handleSetupStripe}
            >
              <ThemedText style={styles.setupButtonText}>Setup Payments</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresList}>
            <ThemedText style={styles.featuresTitle}>What you'll get:</ThemedText>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <ThemedText style={styles.featureText}>Secure payments via Stripe</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <ThemedText style={styles.featureText}>Automatic payouts to your bank</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <ThemedText style={styles.featureText}>Transaction history and analytics</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <ThemedText style={styles.featureText}>Tax documentation and reporting</ThemedText>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Earnings</ThemedText>
          <TouchableOpacity style={styles.withdrawButton}>
            <ThemedText style={styles.withdrawButtonText}>Withdraw</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>
            {formatCurrency(balance.available, balance.currency)}
          </ThemedText>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <ThemedText style={styles.balanceStatLabel}>Pending</ThemedText>
              <ThemedText style={styles.balanceStatValue}>{formatCurrency(balance.pending, balance.currency)}</ThemedText>
            </View>
          </View>
          {balance.available === 0 && balance.pending === 0 && (
            <View style={styles.apiNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#FFFFFF" />
              <ThemedText style={styles.apiNoticeText}>
                Stripe balance requires backend API setup
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>
          {loadError && (
            <ThemedText style={styles.transactionDate}>{loadError}</ThemedText>
          )}
          {transactions.length === 0 && !loadError && (
            <ThemedText style={styles.transactionDate}>No recent transactions</ThemedText>
          )}
          {transactions.map((t: StripeTransaction) => (
            <View key={t.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={t.status === 'paid' || t.type === 'transfer' ? 'checkmark-circle' : 'time-outline'}
                  size={32}
                  color={t.status === 'paid' || t.type === 'transfer' ? '#10B981' : '#F59E0B'}
                />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText style={styles.transactionClient}>{t.description || (t.type ? t.type.toUpperCase() : 'Transaction')}</ThemedText>
                <ThemedText style={styles.transactionDate}>{formatDate(t.created)}</ThemedText>
              </View>
              <ThemedText style={[styles.transactionAmount]}>
                {formatCurrency(t.amount, t.currency)}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Monthly Overview</ThemedText>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Sessions Completed</ThemedText>
              <ThemedText style={styles.overviewValue}>{monthlyStats.sessionsCompleted}</ThemedText>
            </View>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Average per Session</ThemedText>
              <ThemedText style={styles.overviewValue}>
                {formatCurrency(monthlyStats.averagePerSession * 100, monthlyStats.currency)}
              </ThemedText>
            </View>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Total Earned</ThemedText>
              <ThemedText style={styles.overviewValue}>
                {formatCurrency(monthlyStats.totalEarned * 100, monthlyStats.currency)}
              </ThemedText>
            </View>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Platform Fee (15%)</ThemedText>
              <ThemedText style={styles.overviewValue}>
                -{formatCurrency(monthlyStats.platformFee * 100, monthlyStats.currency)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.payoutSettingsButton}
            onPress={handleOpenDashboard}
            disabled={loadingDashboard}
          >
            {loadingDashboard ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="settings-outline" size={24} color="#007AFF" />
            )}
            <ThemedText style={styles.payoutSettingsText}>
              {loadingDashboard ? 'Opening...' : 'Stripe Dashboard'}
            </ThemedText>
            <Ionicons name="open-outline" size={24} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.verificationBadge}>
            {connectStatus.payoutsEnabled ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <ThemedText style={styles.verifiedText}>Verified & Ready for Payouts</ThemedText>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <ThemedText style={styles.pendingText}>Verification Pending</ThemedText>
              </>
            )}
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
  withdrawButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 30,
    boxShadow: '0px 4px',
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceStat: {
    flex: 1,
  },
  balanceStatLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  apiNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  apiNoticeText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
    opacity: 0.9,
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
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  transactionIcon: {
    marginRight: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  pendingAmount: {
    color: '#F59E0B',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  payoutSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  payoutSettingsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  setupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
    boxShadow: '0px 4px',
    elevation: 4,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  setupDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresList: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 12,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 8,
  },
});

function formatCurrency(amountCents: number, currency: string = 'usd'): string {
  try {
    const value = (amountCents || 0) / 100;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(value);
  } catch {
    return `$${((amountCents || 0) / 100).toFixed(2)}`;
  }
}

function formatDate(epochSeconds: number): string {
  try {
    const d = new Date(epochSeconds * 1000);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}