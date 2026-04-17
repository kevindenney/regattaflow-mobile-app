/**
 * Creator Earnings Screen
 *
 * Accessible to any user with a connected Stripe account who sells blueprints.
 * Shows blueprint subscription revenue, payout balance, and transaction history.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import {
  StripeConnectService,
  type StripeConnectStatus,
  type PayoutResult,
  type PayoutHistoryItem,
} from '@/services/StripeConnectService';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import { supabase } from '@/services/supabase';

const C = {
  bg: '#FFFFFF',
  card: '#F8F7F6',
  accent: '#00897B',
  accentBg: 'rgba(0,137,123,0.08)',
  border: '#E5E4E1',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  yellow: '#CA8A04',
  yellowBg: '#FEF9C3',
  red: '#DC2626',
  redBg: '#FEE2E2',
} as const;

interface EarningsSummary {
  totalRevenue: number;
  platformFees: number;
  netEarnings: number;
  totalSales: number;
  activeSubscribers: number;
}

export default function CreatorEarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [balance, setBalance] = useState<{ available: number; pending: number; currency: string } | null>(null);
  const [payouts, setPayouts] = useState<PayoutHistoryItem[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      const [status, bal, payoutHistory] = await Promise.all([
        StripeConnectService.getConnectStatus(userId),
        StripeConnectService.getBalance(userId).catch(() => null),
        StripeConnectService.getPayoutHistory(userId).catch(() => []),
      ]);

      setConnectStatus(status);
      if (bal) setBalance({ ...bal, currency: bal.currency || 'usd' });
      setPayouts(payoutHistory);

      // Fetch blueprint sales summary from Supabase
      const { data: purchases } = await supabase
        .from('blueprint_purchases')
        .select('amount_paid_cents, platform_fee_cents, status')
        .eq('status', 'completed')
        .in('blueprint_id', (
          await supabase
            .from('timeline_blueprints')
            .select('id')
            .eq('user_id', userId)
        ).data?.map((b: any) => b.id) || []);

      const { count: subscriberCount } = await supabase
        .from('blueprint_subscriptions')
        .select('id', { count: 'exact', head: true })
        .in('subscription_status', ['active', 'past_due'])
        .in('blueprint_id', (
          await supabase
            .from('timeline_blueprints')
            .select('id')
            .eq('user_id', userId)
        ).data?.map((b: any) => b.id) || []);

      const completedPurchases = purchases || [];
      const totalRevenue = completedPurchases.reduce((s, p) => s + (p.amount_paid_cents || 0), 0);
      const platformFees = completedPurchases.reduce((s, p) => s + (p.platform_fee_cents || 0), 0);

      setSummary({
        totalRevenue,
        platformFees,
        netEarnings: totalRevenue - platformFees,
        totalSales: completedPurchases.length,
        activeSubscribers: subscriberCount || 0,
      });
    } catch (err) {
      console.error('Failed to load earnings data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleRequestPayout = useCallback(async () => {
    if (!userId) return;
    showConfirm(
      'Request Payout',
      'Transfer all available funds to your bank account?',
      async () => {
        setPayoutLoading(true);
        const result: PayoutResult = await StripeConnectService.requestPayout(userId);
        setPayoutLoading(false);
        if (result.success) {
          showAlert('Payout Requested', `$${((result.amount || 0) / 100).toFixed(2)} is on its way to your bank.`);
          loadData();
        } else {
          showAlert('Payout Failed', result.error || 'Please try again later.');
        }
      },
    );
  }, [userId, loadData]);

  const handleOpenDashboard = useCallback(async () => {
    if (!userId) return;
    const result = await StripeConnectService.getDashboardLink(userId);
    if (result.success && result.url) {
      if (Platform.OS === 'web') {
        window.open(result.url, '_blank');
      } else {
        Linking.openURL(result.url);
      }
    } else {
      showAlert('Error', result.error || 'Could not open Stripe dashboard.');
    }
  }, [userId]);

  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  // Not connected — prompt to connect
  if (!connectStatus?.connected) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="card-outline" size={48} color={C.labelLight} />
        <Text style={styles.emptyTitle}>No Stripe Account Connected</Text>
        <Text style={styles.emptySubtitle}>
          Connect your Stripe account to start receiving payments from blueprint sales.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.labelDark} />
        </Pressable>
        <Text style={styles.headerTitle}>Creator Earnings</Text>
        <Pressable onPress={handleOpenDashboard} hitSlop={12}>
          <Ionicons name="open-outline" size={20} color={C.accent} />
        </Pressable>
      </View>

      {/* Balance card */}
      {balance && (
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceLabel}>Available</Text>
              <Text style={styles.balanceAmount}>{formatAmount(balance.available)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceCol}>
              <Text style={styles.balanceLabel}>Pending</Text>
              <Text style={[styles.balanceAmount, { color: C.yellow }]}>{formatAmount(balance.pending)}</Text>
            </View>
          </View>
          {balance.available > 0 && (
            <Pressable
              style={[styles.payoutBtn, payoutLoading && { opacity: 0.6 }]}
              onPress={handleRequestPayout}
              disabled={payoutLoading}
            >
              {payoutLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-forward-circle-outline" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.payoutBtnText}>
                {payoutLoading ? 'Requesting...' : 'Request Payout'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Summary stats */}
      {summary && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.totalSales}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.activeSubscribers}</Text>
            <Text style={styles.statLabel}>Active Subscribers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.green }]}>{formatAmount(summary.netEarnings)}</Text>
            <Text style={styles.statLabel}>Net Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.labelMid }]}>{formatAmount(summary.platformFees)}</Text>
            <Text style={styles.statLabel}>Platform Fees (15%)</Text>
          </View>
        </View>
      )}

      {/* Payout history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payout History</Text>
        {payouts.length === 0 ? (
          <Text style={styles.emptyRow}>No payouts yet</Text>
        ) : (
          payouts.map((payout) => {
            const statusStyle = getPayoutStatusStyle(payout.status);
            return (
              <View key={payout.id} style={styles.payoutRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutAmount}>{formatAmount(payout.amount)}</Text>
                  <Text style={styles.payoutDate}>
                    {new Date(payout.arrival_date * 1000).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusPillText, { color: statusStyle.color }]}>
                    {payout.status}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Stripe dashboard link */}
      <Pressable style={styles.dashboardLink} onPress={handleOpenDashboard}>
        <Ionicons name="open-outline" size={14} color={C.accent} />
        <Text style={styles.dashboardLinkText}>Open Full Stripe Dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

function getPayoutStatusStyle(status: string) {
  switch (status) {
    case 'paid': return { bg: C.greenBg, color: C.green };
    case 'in_transit': return { bg: C.yellowBg, color: C.yellow };
    case 'failed': return { bg: C.redBg, color: C.red };
    default: return { bg: '#F1F5F9', color: C.labelMid };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: C.labelMid,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.labelDark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.labelMid,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.labelDark,
  },
  balanceCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.border,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.labelMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: C.green,
  },
  payoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
  },
  payoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: C.labelDark,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.labelMid,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  section: {
    marginTop: 24,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.labelDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptyRow: {
    fontSize: 13,
    color: C.labelLight,
    paddingVertical: 12,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: C.labelDark,
  },
  payoutDate: {
    fontSize: 12,
    color: C.labelMid,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dashboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 12,
  },
  dashboardLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accent,
  },
});
