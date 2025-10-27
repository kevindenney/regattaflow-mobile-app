/**
 * Club Earnings Dashboard
 * Shows revenue, platform fees, and payouts from event registrations
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import EventService from '@/services/eventService';

interface EventEarnings {
  event_id: string;
  club_id: string;
  event_title: string;
  start_date: string;
  registration_fee: number;
  currency: string;
  total_registrations: number;
  paid_count: number;
  unpaid_count: number;
  total_collected: number;
  total_platform_fees: number;
  total_club_payout: number;
  total_refunded: number;
}

export default function ClubEarningsScreen() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EventEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'upcoming' | 'past'>('all');

  // TODO: Get club_id from user context
  const clubId = 'temp-club-id';

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const data = await EventService.getClubEarnings(clubId);
      setEarnings(data as EventEarnings[]);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEarnings = earnings.filter((event) => {
    const eventDate = new Date(event.start_date);
    const now = new Date();

    if (period === 'upcoming') {
      return eventDate > now;
    } else if (period === 'past') {
      return eventDate <= now;
    }
    return true;
  });

  const totals = filteredEarnings.reduce(
    (acc, event) => ({
      collected: acc.collected + Number(event.total_collected),
      platformFees: acc.platformFees + Number(event.total_platform_fees),
      clubPayout: acc.clubPayout + Number(event.total_club_payout),
      refunded: acc.refunded + Number(event.total_refunded),
      pendingCount: acc.pendingCount + event.unpaid_count,
    }),
    { collected: 0, platformFees: 0, clubPayout: 0, refunded: 0, pendingCount: 0 }
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Club Earnings</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.collectedCard]}>
            <Ionicons name="cash-outline" size={24} color="#10B981" />
            <ThemedText style={styles.summaryValue}>
              ${totals.collected.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Total Collected</ThemedText>
          </View>

          <View style={[styles.summaryCard, styles.payoutCard]}>
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.summaryValue}>
              ${totals.clubPayout.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Club Payout (90%)</ThemedText>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.feeCard]}>
            <Ionicons name="pie-chart-outline" size={24} color="#F59E0B" />
            <ThemedText style={styles.summaryValue}>
              ${totals.platformFees.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Platform Fee (10%)</ThemedText>
          </View>

          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Ionicons name="time-outline" size={24} color="#64748B" />
            <ThemedText style={styles.summaryValue}>{totals.pendingCount}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Pending Payments</ThemedText>
          </View>
        </View>
      </View>

      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
          {(['all', 'upcoming', 'past'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.filterTab, period === p && styles.filterTabActive]}
              onPress={() => setPeriod(p)}
            >
              <ThemedText
                style={[styles.filterTabText, period === p && styles.filterTabTextActive]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Event Earnings List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredEarnings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color="#CBD5E1" />
            <ThemedText style={styles.emptyText}>No earnings data available</ThemedText>
          </View>
        ) : (
          filteredEarnings.map((event) => (
            <View key={event.event_id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.eventInfo}>
                  <ThemedText style={styles.eventTitle}>{event.event_title}</ThemedText>
                  <ThemedText style={styles.eventDate}>
                    {new Date(event.start_date).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View style={styles.eventRevenue}>
                  <ThemedText style={styles.revenueAmount}>
                    ${Number(event.total_collected).toFixed(2)}
                  </ThemedText>
                  <ThemedText style={styles.revenueLabel}>Collected</ThemedText>
                </View>
              </View>

              <View style={styles.eventStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={16} color="#64748B" />
                  <ThemedText style={styles.statText}>
                    {event.paid_count}/{event.total_registrations} paid
                  </ThemedText>
                </View>
                {event.unpaid_count > 0 && (
                  <View style={[styles.statItem, styles.pendingBadge]}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                    <ThemedText style={styles.pendingText}>
                      {event.unpaid_count} pending
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.breakdown}>
                <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownLabel}>Club Payout (90%)</ThemedText>
                  <ThemedText style={styles.breakdownValue}>
                    ${Number(event.total_club_payout).toFixed(2)}
                  </ThemedText>
                </View>
                <View style={styles.breakdownRow}>
                  <ThemedText style={styles.breakdownLabel}>Platform Fee (10%)</ThemedText>
                  <ThemedText style={styles.breakdownValueFee}>
                    ${Number(event.total_platform_fees).toFixed(2)}
                  </ThemedText>
                </View>
                {Number(event.total_refunded) > 0 && (
                  <View style={styles.breakdownRow}>
                    <ThemedText style={styles.breakdownLabel}>Refunded</ThemedText>
                    <ThemedText style={styles.breakdownValueRefund}>
                      -${Number(event.total_refunded).toFixed(2)}
                    </ThemedText>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => router.push(`/club/event/${event.event_id}/entries`)}
              >
                <ThemedText style={styles.viewDetailsText}>View Registrations</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          ))
        )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  collectedCard: {
    backgroundColor: '#ECFDF5',
  },
  payoutCard: {
    backgroundColor: '#EFF6FF',
  },
  feeCard: {
    backgroundColor: '#FEF3C7',
  },
  pendingCard: {
    backgroundColor: '#F1F5F9',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#64748B',
  },
  eventRevenue: {
    alignItems: 'flex-end',
  },
  revenueAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  revenueLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  eventStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#475569',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  breakdown: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  breakdownValueFee: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  breakdownValueRefund: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});
