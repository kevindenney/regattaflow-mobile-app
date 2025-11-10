import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCoachWorkspace } from '@/hooks/useCoachWorkspace';
import { useCoachEarningsSummary } from '@/hooks/useCoachData';

type PeriodKey = 'week' | 'month' | 'year';

const periodLabels: Record<PeriodKey, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
};

const sessionTypeLabels: Record<string, string> = {
  on_water: 'On-Water',
  video_review: 'Video Review',
  strategy_session: 'Strategy Session',
  race_support: 'Race Support',
  boat_setup: 'Boat Setup',
  fitness: 'Fitness',
};

const toTitleCase = (value: string) => value.replace(/\b\w/g, (char: string) => char.toUpperCase());

const getStatusPillStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return { backgroundColor: '#FEF3C7', color: '#92400E' };
    case 'paid':
      return { backgroundColor: '#DCFCE7', color: '#166534' };
    case 'refunded':
      return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'requires_action':
      return { backgroundColor: '#FDE68A', color: '#92400E' };
    default:
      return { backgroundColor: '#E2E8F0', color: '#1E293B' };
  }
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
  const dollars = amount / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(dollars);
  } catch {
    return `$${dollars.toFixed(2)}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const formatPercentChange = (current: number, previous: number) => {
  if (previous <= 0) return null;
  const delta = ((current - previous) / previous) * 100;
  return delta;
};

type ShadowStyle = ViewStyle & { boxShadow?: string };

const createShadowStyle = ({
  webShadow,
  ios,
  androidElevation = 0,
}: {
  webShadow: string;
  ios: {
    color: string;
    opacity: number;
    radius: number;
    offset: { width: number; height: number };
  };
  androidElevation?: number;
}): ShadowStyle => {
  const style: ShadowStyle = {};

  if (Platform.OS === 'web') {
    style.boxShadow = webShadow;
    return style;
  }

  if (Platform.OS === 'ios') {
    style.shadowColor = ios.color;
    style.shadowOpacity = ios.opacity;
    style.shadowRadius = ios.radius;
    style.shadowOffset = ios.offset;
    return style;
  }

  if (Platform.OS === 'android' && androidElevation) {
    style.elevation = androidElevation;
  }

  return style;
};

const summaryCardShadow = createShadowStyle({
  webShadow: '0px 10px 20px rgba(15, 23, 42, 0.08)',
  ios: {
    color: '#0f172a',
    opacity: 0.08,
    radius: 20,
    offset: { width: 0, height: 10 },
  },
  androidElevation: 4,
});

const quickStatCardShadow = createShadowStyle({
  webShadow: '0px 6px 12px rgba(15, 23, 42, 0.05)',
  ios: {
    color: '#0f172a',
    opacity: 0.03,
    radius: 12,
    offset: { width: 0, height: 6 },
  },
  androidElevation: 2,
});

export default function EarningsScreen() {
  const { coachId, loading: personaLoading, refresh: refreshPersonaContext } = useCoachWorkspace();
  const earningsQuery = useCoachEarningsSummary();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('month');

  const summary = earningsQuery.data;
  const isLoading = personaLoading || (!summary && (earningsQuery.isLoading || earningsQuery.isFetching));
  const isConnected = !!coachId;

  const handleRequestPayout = () => {
    Alert.alert('Payout request received', 'We will notify you as soon as the transfer is on the way.');
  };

  const changeStats = useMemo(() => {
    if (!summary) return { current: 0, previous: 0, sessions: 0, average: 0 };
    const periodData = summary.period[selectedPeriod];
    return {
      current: periodData.current.total,
      previous: periodData.previous.total,
      sessions: periodData.current.sessions,
      average: periodData.current.averagePerSession,
    };
  }, [selectedPeriod, summary]);

  const changePercent = formatPercentChange(changeStats.current, changeStats.previous);
  const defaultCurrency = summary?.transactions[0]?.currency || 'USD';

  const breakdownEntries = useMemo(() => {
    if (!summary) return [] as Array<{ label: string; value: number }>;
    const entries = Object.entries(summary.breakdown || {})
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        label: sessionTypeLabels[key] || toTitleCase(key.replace(/_/g, ' ')),
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
    return entries;
  }, [summary]);

  const renderConnectState = () => (
    <View style={styles.missingContainer}>
      <Ionicons name="wallet-outline" size={48} color="#94A3B8" />
      <ThemedText style={styles.missingTitle}>Connect Your Coach Workspace</ThemedText>
      <ThemedText style={styles.missingDescription}>
        Earnings unlock after we confirm your coach profile. Refresh the connection or finish onboarding to continue.
      </ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={refreshPersonaContext}>
        <ThemedText style={styles.retryButtonText}>Retry Connection</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={40} color="#EF4444" />
      <ThemedText style={styles.errorTitle}>Unable to load earnings</ThemedText>
      <ThemedText style={styles.errorDescription}>
        {earningsQuery.error instanceof Error ? earningsQuery.error.message : 'Please try again in a moment.'}
      </ThemedText>
      <TouchableOpacity style={styles.retryButton} onPress={() => earningsQuery.refetch()}>
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (!isConnected && !personaLoading) {
    return <ThemedView style={styles.container}>{renderConnectState()}</ThemedView>;
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading earnings...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (earningsQuery.isError) {
    return <ThemedView style={styles.container}>{renderErrorState()}</ThemedView>;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={earningsQuery.isRefetching} onRefresh={earningsQuery.refetch} />
        }
      >
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.title}>Earnings</ThemedText>
            <ThemedText style={styles.subtitle}>Track payouts, income, and recent sessions</ThemedText>
          </View>
          {summary && summary.totals.pendingPayouts > 0 && (
            <TouchableOpacity style={styles.payoutButton} onPress={handleRequestPayout}>
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <ThemedText style={styles.payoutButtonText}>Request payout</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.periodSelector}>
          {(Object.keys(periodLabels) as PeriodKey[]).map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <ThemedText
                style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}
              >
                {periodLabels[period]}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {summary && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <ThemedText style={styles.summaryLabel}>Earnings {periodLabels[selectedPeriod].toLowerCase()}</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {formatCurrency(changeStats.current, defaultCurrency)}
                  </ThemedText>
                </View>
                <View style={styles.summaryIcon}>
                  <Ionicons name="trending-up" size={22} color="#10B981" />
                </View>
              </View>
              <View style={styles.summaryMetaRow}>
                <View>
                  <ThemedText style={styles.summaryMetaLabel}>Sessions</ThemedText>
                  <ThemedText style={styles.summaryMetaValue}>{changeStats.sessions}</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.summaryMetaLabel}>Avg / session</ThemedText>
                  <ThemedText style={styles.summaryMetaValue}>
                    {formatCurrency(changeStats.average, defaultCurrency)}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.summaryMetaLabel}>Change</ThemedText>
                  <ThemedText
                    style={[
                      styles.trendValue,
                      changePercent === null
                        ? styles.trendNeutral
                        : changePercent >= 0
                        ? styles.trendPositive
                        : styles.trendNegative,
                    ]}
                  >
                    {changePercent === null ? '—' : `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatCard}>
                <Ionicons name="hourglass-outline" size={18} color="#F97316" />
                <ThemedText style={styles.quickStatLabel}>Pending payouts</ThemedText>
                <ThemedText style={styles.quickStatValue}>
                  {formatCurrency(summary.totals.pendingPayouts, defaultCurrency)}
                </ThemedText>
              </View>
              <View style={styles.quickStatCard}>
                <Ionicons name="wallet-outline" size={18} color="#0EA5E9" />
                <ThemedText style={styles.quickStatLabel}>Lifetime</ThemedText>
                <ThemedText style={styles.quickStatValue}>
                  {formatCurrency(summary.totals.lifetime, defaultCurrency)}
                </ThemedText>
              </View>
              <View style={styles.quickStatCard}>
                <Ionicons name="people-outline" size={18} color="#10B981" />
                <ThemedText style={styles.quickStatLabel}>Sessions</ThemedText>
                <ThemedText style={styles.quickStatValue}>{summary.totals.sessions}</ThemedText>
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <ThemedText style={styles.sectionTitle}>Revenue breakdown</ThemedText>
                  <ThemedText style={styles.sectionSubtitle}>Top services driving payouts</ThemedText>
                </View>
              </View>
              {breakdownEntries.length === 0 ? (
                <ThemedText style={styles.emptyText}>No paid sessions yet</ThemedText>
              ) : (
                breakdownEntries.map((entry, index) => {
                  const maxValue = breakdownEntries[0]?.value || 1;
                  const widthPercent = maxValue > 0 ? Math.min(100, (entry.value / maxValue) * 100) : 0;
                  return (
                    <View key={`${entry.label}-${index}`} style={styles.breakdownRow}>
                      <View style={styles.breakdownRowHeader}>
                        <ThemedText style={styles.breakdownLabel}>{entry.label}</ThemedText>
                        <ThemedText style={styles.breakdownValue}>
                          {formatCurrency(entry.value, defaultCurrency)}
                        </ThemedText>
                      </View>
                      <View style={styles.breakdownBarTrack}>
                        <View
                          style={[styles.breakdownBar, { width: `${widthPercent}%` }]}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <ThemedText style={styles.sectionTitle}>Pending payouts</ThemedText>
                  <ThemedText style={styles.sectionSubtitle}>
                    Next transfer ETA {formatDate(summary.totals.nextPayoutDate)}
                  </ThemedText>
                </View>
              </View>
              {summary.pendingTransactions.length === 0 ? (
                <ThemedText style={styles.emptyText}>Nothing waiting on payouts right now.</ThemedText>
              ) : (
                summary.pendingTransactions.map(txn => (
                  <View key={txn.id} style={styles.transactionRow}>
                    <View style={styles.transactionIconPending}>
                      <Ionicons name="time-outline" size={18} color="#F97316" />
                    </View>
                    <View style={styles.transactionContent}>
                      <ThemedText style={styles.transactionTitle}>{txn.clientName}</ThemedText>
                      <ThemedText style={styles.transactionSubtitle}>{txn.sessionType}</ThemedText>
                    </View>
                    <View style={styles.transactionMeta}>
                      <ThemedText style={styles.transactionAmount}>
                        {formatCurrency(txn.amount, txn.currency || defaultCurrency)}
                      </ThemedText>
                      <ThemedText style={styles.transactionDate}>Payout {formatDate(txn.payoutDate)}</ThemedText>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <ThemedText style={styles.sectionTitle}>Recent transactions</ThemedText>
                  <ThemedText style={styles.sectionSubtitle}>Latest 30 coaching sessions</ThemedText>
                </View>
              </View>
              {summary.transactions.length === 0 ? (
                <ThemedText style={styles.emptyText}>No transactions yet.</ThemedText>
              ) : (
                summary.transactions.map(txn => {
                  const pill = getStatusPillStyle(txn.status);
                  return (
                    <View key={txn.id} style={styles.transactionRow}>
                      <View style={styles.transactionIcon}>
                        <Ionicons name="receipt-outline" size={18} color="#2563EB" />
                      </View>
                      <View style={styles.transactionContent}>
                        <ThemedText style={styles.transactionTitle}>{txn.clientName}</ThemedText>
                        <ThemedText style={styles.transactionSubtitle}>{txn.sessionType}</ThemedText>
                      </View>
                      <View style={styles.transactionMeta}>
                        <ThemedText style={styles.transactionAmount}>
                          {formatCurrency(txn.amount, txn.currency || defaultCurrency)}
                        </ThemedText>
                        <ThemedText style={styles.transactionDate}>{formatDate(txn.date)}</ThemedText>
                      </View>
                      <View style={[styles.statusPillBase, { backgroundColor: pill.backgroundColor }]}>
                        <ThemedText style={[styles.statusPillLabel, { color: pill.color }]}>
                          {txn.status.replace('_', ' ')}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
  },
  payoutButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    gap: 6,
  },
  payoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  periodButtonText: {
    fontWeight: '600',
    color: '#475569',
  },
  periodButtonTextActive: {
    color: '#4338CA',
  },
  summaryCard: {
    margin: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...summaryCardShadow,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetaLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  summaryMetaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 4,
  },
  trendValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  trendPositive: {
    color: '#16A34A',
  },
  trendNegative: {
    color: '#DC2626',
  },
  trendNeutral: {
    color: '#94A3B8',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    ...quickStatCardShadow,
  },
  quickStatLabel: {
    fontSize: 13,
    color: '#475569',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  breakdownCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  breakdownRow: {
    marginTop: 12,
  },
  breakdownRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  breakdownBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  breakdownBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#6366F1',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIconPending: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionMeta: {
    alignItems: 'flex-end',
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  transactionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  missingDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#94A3B8',
  },
  retryButton: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  statusPillBase: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#0F172A',
  },
});
