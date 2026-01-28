/**
 * FleetsContent
 *
 * Self-contained fleets list for the Community tab.
 * Extracted from affiliations.tsx — shows user's fleets with search, refresh, and join action.
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
import { useUserFleets } from '@/hooks/useFleetData';
import { TufteFleetRow } from '@/components/affiliations/TufteFleetRow';
import { IOS_COLORS } from '@/components/cards/constants';

export function FleetsContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { fleets: fleetsData, loading: fleetsLoading, refresh: refreshFleets } = useUserFleets(user?.id);

  const filteredFleets = useMemo(() => {
    if (!fleetsData) return [];
    if (!searchQuery.trim()) return fleetsData;
    const query = searchQuery.toLowerCase();
    return fleetsData.filter(
      (membership: any) =>
        membership.fleet?.name?.toLowerCase().includes(query) ||
        membership.fleet?.boat_class?.toLowerCase().includes(query)
    );
  }, [fleetsData, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFleets();
    setRefreshing(false);
  };

  const handleFleetPress = (fleetId: string) => {
    router.push('/(tabs)/fleet');
  };

  const handleJoinFleet = () => {
    router.push('/(tabs)/fleets');
  };

  if (fleetsLoading && !refreshing) {
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
          placeholder="Search fleets..."
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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

export default FleetsContent;
