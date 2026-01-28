/**
 * ClubsContent
 *
 * Self-contained clubs list for the Community tab.
 * Extracted from affiliations.tsx — shows user's clubs with search, refresh, and add action.
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
import { useClubs } from '@/hooks/useData';
import { TufteClubRow } from '@/components/affiliations/TufteClubRow';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

export function ClubsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: clubsData, isLoading, refetch: refetchClubs } = useClubs();

  const filteredClubs = useMemo(() => {
    if (!clubsData) return [];
    if (!searchQuery.trim()) return clubsData;
    const query = searchQuery.toLowerCase();
    return clubsData.filter(
      (club: any) =>
        club.name?.toLowerCase().includes(query) ||
        club.location?.toLowerCase().includes(query)
    );
  }, [clubsData, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchClubs();
    setRefreshing(false);
  };

  const handleClubPress = (clubId: string) => {
    router.push(`/club/${clubId}`);
  };

  const handleAddClub = () => {
    router.push('/(tabs)/clubs');
  };

  const getClubStatus = (club: any): 'member' | 'reciprocal' | 'pending' | 'inactive' => {
    if (club.membership_status === 'pending') return 'pending';
    if (club.membership_type === 'reciprocal') return 'reciprocal';
    if (club.membership_status === 'inactive' || club.membership_status === 'expired') return 'inactive';
    return 'member';
  };

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
          placeholder="Search clubs..."
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

export default ClubsContent;
