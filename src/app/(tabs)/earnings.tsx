import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';

export default function EarningsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Earnings</ThemedText>
          <TouchableOpacity style={styles.withdrawButton}>
            <ThemedText style={styles.withdrawButtonText}>Withdraw</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>$2,840.00</ThemedText>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <ThemedText style={styles.balanceStatLabel}>This Month</ThemedText>
              <ThemedText style={styles.balanceStatValue}>+$1,250</ThemedText>
            </View>
            <View style={styles.balanceStat}>
              <ThemedText style={styles.balanceStatLabel}>Pending</ThemedText>
              <ThemedText style={styles.balanceStatValue}>$450</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>

          {/* Placeholder transactions */}
          {[
            { client: 'Sarah Johnson', amount: '$120', date: 'Today', status: 'completed' },
            { client: 'Mike Chen', amount: '$90', date: 'Yesterday', status: 'completed' },
            { client: 'Team Practice', amount: '$200', date: '3 days ago', status: 'pending' },
            { client: 'Alex Rivera', amount: '$120', date: '5 days ago', status: 'completed' },
          ].map((transaction, i) => (
            <View key={i} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={transaction.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                  size={32}
                  color={transaction.status === 'completed' ? '#10B981' : '#F59E0B'}
                />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText style={styles.transactionClient}>{transaction.client}</ThemedText>
                <ThemedText style={styles.transactionDate}>{transaction.date}</ThemedText>
              </View>
              <ThemedText style={[
                styles.transactionAmount,
                transaction.status === 'pending' && styles.pendingAmount
              ]}>
                {transaction.amount}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Monthly Overview</ThemedText>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Sessions Completed</ThemedText>
              <ThemedText style={styles.overviewValue}>24</ThemedText>
            </View>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Average per Session</ThemedText>
              <ThemedText style={styles.overviewValue}>$118</ThemedText>
            </View>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Total Earned</ThemedText>
              <ThemedText style={styles.overviewValue}>$2,840</ThemedText>
            </View>
            <View style={styles.overviewRow}>
              <ThemedText style={styles.overviewLabel}>Platform Fee (15%)</ThemedText>
              <ThemedText style={styles.overviewValue}>-$426</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.payoutSettingsButton}>
            <Ionicons name="settings-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.payoutSettingsText}>Payout Settings</ThemedText>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>
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
});