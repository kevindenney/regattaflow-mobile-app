import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';

export default function MembersScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Members</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="person-add" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#64748B"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>156</ThemedText>
            <ThemedText style={styles.statLabel}>Total Members</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>23</ThemedText>
            <ThemedText style={styles.statLabel}>New This Month</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>89%</ThemedText>
            <ThemedText style={styles.statLabel}>Active Rate</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Member List</ThemedText>
            <TouchableOpacity style={styles.viewToggle}>
              <Ionicons name="grid-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Placeholder member cards */}
          {[
            {
              name: 'Sarah Johnson',
              type: 'Premium',
              joined: '2023',
              status: 'Active',
              sailNumber: 'USA 1234',
              boat: 'Dragon'
            },
            {
              name: 'Mike Chen',
              type: 'Standard',
              joined: '2024',
              status: 'Active',
              sailNumber: 'USA 5678',
              boat: 'J/70'
            },
            {
              name: 'Alex Rivera',
              type: 'Premium',
              joined: '2022',
              status: 'Inactive',
              sailNumber: 'USA 9012',
              boat: 'Laser'
            },
            {
              name: 'Emma Wilson',
              type: 'Junior',
              joined: '2024',
              status: 'Active',
              sailNumber: 'USA 3456',
              boat: 'Optimist'
            },
          ].map((member, i) => (
            <TouchableOpacity key={i} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Ionicons name="person-circle" size={50} color="#CBD5E1" />
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: member.status === 'Active' ? '#10B98120' : '#EF444420' }
                  ]}>
                    <ThemedText style={[
                      styles.statusText,
                      { color: member.status === 'Active' ? '#10B981' : '#EF4444' }
                    ]}>
                      {member.status}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.memberDetail}>
                  {member.type} Member • Joined {member.joined}
                </ThemedText>
                <ThemedText style={styles.memberDetail}>
                  {member.boat} • {member.sailNumber}
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.memberAction}>
                <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Membership Types</ThemedText>
          <View style={styles.membershipTypes}>
            {[
              { type: 'Premium', count: 45, color: '#007AFF' },
              { type: 'Standard', count: 78, color: '#10B981' },
              { type: 'Junior', count: 23, color: '#F59E0B' },
              { type: 'Guest', count: 10, color: '#64748B' },
            ].map((membership, i) => (
              <View key={i} style={styles.membershipCard}>
                <View style={[styles.membershipIcon, { backgroundColor: membership.color }]}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.membershipType}>{membership.type}</ThemedText>
                <ThemedText style={styles.membershipCount}>{membership.count}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>Export Member List</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="mail-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>Send Newsletter</ThemedText>
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
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  viewToggle: {
    padding: 4,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  memberAvatar: {
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberDetail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  memberAction: {
    padding: 8,
  },
  membershipTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '22%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  membershipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  membershipType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  membershipCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
});