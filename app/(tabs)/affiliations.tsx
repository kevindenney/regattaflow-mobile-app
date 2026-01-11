/**
 * Affiliations Screen
 *
 * Unified view of user's clubs and fleets with Tufte-style design.
 * Replaces separate clubs.tsx and fleets.tsx screens.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useClubs } from '@/hooks/useData';
import { useUserFleets } from '@/hooks/useFleetData';
import { TufteClubRow } from '@/components/affiliations/TufteClubRow';
import { TufteFleetRow } from '@/components/affiliations/TufteFleetRow';
import { affiliationsStyles } from '@/components/affiliations/affiliationsStyles';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

export default function AffiliationsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Data hooks
  const { data: clubsData, isLoading: clubsLoading, refetch: refetchClubs } = useClubs();
  const { fleets: fleetsData, loading: fleetsLoading, refresh: refreshFleets } = useUserFleets(user?.id);

  const isLoading = clubsLoading || fleetsLoading;

  // Filter clubs and fleets by search query
  const filteredClubs = useMemo(() => {
    if (!clubsData) return [];
    if (!searchQuery.trim()) return clubsData;
    const query = searchQuery.toLowerCase();
    return clubsData.filter((club: any) =>
      club.name?.toLowerCase().includes(query) ||
      club.location?.toLowerCase().includes(query)
    );
  }, [clubsData, searchQuery]);

  const filteredFleets = useMemo(() => {
    if (!fleetsData) return [];
    if (!searchQuery.trim()) return fleetsData;
    const query = searchQuery.toLowerCase();
    return fleetsData.filter((membership: any) =>
      membership.fleet?.name?.toLowerCase().includes(query) ||
      membership.fleet?.boat_class?.toLowerCase().includes(query)
    );
  }, [fleetsData, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchClubs(), refreshFleets()]);
    setRefreshing(false);
  };

  const handleClubPress = (clubId: string) => {
    router.push(`/club/${clubId}`);
  };

  const handleFleetPress = (fleetId: string) => {
    // Navigate to the fleet overview screen
    // The fleet/index.tsx manages fleet selection internally
    router.push('/(tabs)/fleet');
  };

  const handleAddClub = () => {
    // Navigate to club directory or add club flow
    router.push('/(tabs)/clubs');
  };

  const handleJoinFleet = () => {
    // Navigate to fleet discovery
    router.push('/(tabs)/fleets');
  };

  // Determine membership status from club data
  const getClubStatus = (club: any): 'member' | 'reciprocal' | 'pending' | 'inactive' => {
    if (club.membership_status === 'pending') return 'pending';
    if (club.membership_type === 'reciprocal') return 'reciprocal';
    if (club.membership_status === 'inactive' || club.membership_status === 'expired') return 'inactive';
    return 'member';
  };

  // Determine role from club data
  const getClubRole = (club: any): 'admin' | 'owner' | 'member' | 'guest' => {
    if (club.is_admin || club.role === 'admin') return 'admin';
    if (club.is_owner || club.role === 'owner') return 'owner';
    if (club.role === 'guest') return 'guest';
    return 'member';
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={IOS_COLORS.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs & fleets..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* My Clubs Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY CLUBS</Text>
          <TouchableOpacity onPress={handleAddClub}>
            <Text style={styles.sectionAction}>+ Add Club</Text>
          </TouchableOpacity>
        </View>

        {filteredClubs.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredClubs.map((club: any, index: number) => (
              <TufteClubRow
                key={club.id}
                name={club.name}
                status={getClubStatus(club)}
                role={getClubRole(club)}
                subtitle={club.location}
                upcomingEvents={club.upcoming_events_count}
                onPress={() => handleClubPress(club.id)}
                isLast={index === filteredClubs.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No clubs match your search' : 'No clubs yet'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity onPress={handleAddClub} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>Find clubs to join</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* My Fleets Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY FLEETS</Text>
          <TouchableOpacity onPress={handleJoinFleet}>
            <Text style={styles.sectionAction}>+ Join Fleet</Text>
          </TouchableOpacity>
        </View>

        {filteredFleets.length > 0 ? (
          <View style={styles.listContainer}>
            {filteredFleets.map((membership: any, index: number) => {
              const fleet = membership.fleet || membership;
              return (
                <TufteFleetRow
                  key={fleet.id || index}
                  name={fleet.name}
                  memberCount={fleet.member_count || membership.member_count}
                  ranking={membership.ranking || fleet.user_ranking}
                  boatClass={fleet.boat_class}
                  activity={fleet.latest_activity?.type}
                  activityTime={fleet.latest_activity?.time_ago}
                  onPress={() => handleFleetPress(fleet.id)}
                  isLast={index === filteredFleets.length - 1}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No fleets match your search' : 'No fleets yet'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity onPress={handleJoinFleet} style={styles.emptyAction}>
                <Text style={styles.emptyActionText}>Discover fleets</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TUFTE_BACKGROUND,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: IOS_COLORS.label,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 12,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
});
