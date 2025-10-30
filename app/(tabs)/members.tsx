import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  clubMemberService,
  ClubMember,
  MemberFilters,
  ClubMemberStats,
} from '@/services/ClubMemberService';
import { supabase } from '@/services/supabase';

export default function MembersScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [stats, setStats] = useState<ClubMemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>({
    membership_type: [],
    status: [],
    role: [],
    payment_status: [],
    search: '',
  });

  useEffect(() => {
    loadClubAndMembers();
  }, []);

  useEffect(() => {
    if (clubId) {
      loadMembers();
    }
  }, [clubId, filters]);

  const loadClubAndMembers = async () => {
    try {
      // Get current user's club profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clubProfile) {
        setClubId(clubProfile.id);
      }
    } catch (error) {
      console.error('Error loading club:', error);
    }
  };

  const loadMembers = async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      const [membersData, statsData] = await Promise.all([
        clubMemberService.getClubMembers(clubId, {
          ...filters,
          search: searchText,
        }),
        clubMemberService.getClubMemberStats(clubId),
      ]);

      setMembers(membersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMembers();
  };

  const handleExportMembers = async () => {
    if (!clubId) return;

    try {
      Alert.alert('Export Members', 'Preparing member list...');
      await clubMemberService.shareExportedMembers(clubId, 'Club');
    } catch (error) {
      console.error('Error exporting members:', error);
      Alert.alert('Error', 'Failed to export members');
    }
  };

  const handleViewPendingRequests = () => {
    router.push('/members/requests');
  };

  const handleViewMemberDetail = (memberId: string) => {
    router.push(`/members/${memberId}` as Href);
  };

  const toggleFilter = (filterType: keyof MemberFilters, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [filterType]: newValues,
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'inactive':
      case 'expired':
        return '#EF4444';
      case 'suspended':
        return '#8B5CF6';
      default:
        return '#64748B';
    }
  };

  if (loading && members.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </ThemedView>
    );
  }

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
              placeholder="Search by name, email, sail number..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#64748B"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter-outline" size={20} color="#007AFF" />
            {(filters.membership_type?.length || 0) +
              (filters.status?.length || 0) +
              (filters.role?.length || 0) +
              (filters.payment_status?.length || 0) >
              0 && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

        {/* Pending Requests Alert */}
        {stats && stats.pending_requests > 0 && (
          <TouchableOpacity
            style={styles.pendingAlert}
            onPress={handleViewPendingRequests}
          >
            <Ionicons name="alert-circle" size={24} color="#F59E0B" />
            <Text style={styles.pendingAlertText}>
              {stats.pending_requests} pending membership request
              {stats.pending_requests > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {stats?.total_members || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Members</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {stats?.new_this_month || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>New This Month</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {stats?.total_members
                ? Math.round(
                    ((stats.active_members || 0) / stats.total_members) * 100
                  )
                : 0}
              %
            </ThemedText>
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

          {/* Real member list */}
          {members.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#CBD5E1" />
              <ThemedText style={styles.emptyStateText}>
                No members found
              </ThemedText>
              <Text style={styles.emptyStateSubtext}>
                {searchText || (filters.membership_type?.length || 0) > 0
                  ? 'Try adjusting your filters'
                  : 'Start by inviting members to your club'}
              </Text>
            </View>
          ) : (
            members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => handleViewMemberDetail(member.id)}
              >
                <View style={styles.memberAvatar}>
                  {member.user?.avatar_url ? (
                    <img
                      src={member.user.avatar_url}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                  ) : (
                    <Ionicons name="person-circle" size={50} color="#CBD5E1" />
                  )}
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberHeader}>
                    <ThemedText style={styles.memberName}>
                      {member.user?.full_name || member.user?.email || 'Unknown'}
                    </ThemedText>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: `${getStatusColor(member.status)}20`,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: getStatusColor(member.status) },
                        ]}
                      >
                        {member.status}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.memberDetail}>
                    {member.membership_type.charAt(0).toUpperCase() +
                      member.membership_type.slice(1)}{' '}
                    Member • Joined{' '}
                    {new Date(member.joined_date).getFullYear()}
                  </ThemedText>
                  {member.boat_class && member.sail_number && (
                    <ThemedText style={styles.memberDetail}>
                      {member.boat_class} • {member.sail_number}
                    </ThemedText>
                  )}
                  {member.role !== 'member' && (
                    <View style={styles.roleBadge}>
                      <Ionicons
                        name="shield-checkmark"
                        size={12}
                        color="#8B5CF6"
                      />
                      <Text style={styles.roleText}>
                        {member.role.replace('_', ' ')}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity style={styles.memberAction}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportMembers}
          >
            <Ionicons name="download-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>
              Export Member List
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/members/send-email' as Href)}
          >
            <Ionicons name="mail-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>
              Send Group Email
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/members/import' as Href)}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
            <ThemedText style={styles.actionButtonText}>
              Import Members
            </ThemedText>
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
    boxShadow: '0px 1px',
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
    boxShadow: '0px 1px',
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
    boxShadow: '0px 1px',
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
    boxShadow: '0px 1px',
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
    boxShadow: '0px 1px',
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
    boxShadow: '0px 1px',
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  pendingAlertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 12,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
});