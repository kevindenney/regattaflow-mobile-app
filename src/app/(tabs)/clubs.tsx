import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from '@/src/components/ui/text';
import { useClubs } from '@/src/hooks/useData';
import ClubCard from '@/src/components/clubs/ClubCard';
import ClubDetail from '@/src/components/clubs/ClubDetail';

interface YachtClub {
  id: string;
  name: string;
  location: string;
  country: string;
  photo_url?: string;
  description?: string;
  facilities?: string[];
  member_since?: string;
  membership_type?: string;
  member_number?: string;
}

export default function ClubsScreen() {
  const { data: memberships, loading, error, refetch } = useClubs();
  const [selectedClub, setSelectedClub] = useState<YachtClub | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Show error if there's an actual error (not just missing tables)
  if (error && error.message && !error.message.includes('relation') && !error.message.includes('does not exist')) {
    Alert.alert('Error', `Failed to load clubs: ${error.message}`);
  }

  if (selectedClub) {
    return (
      <ClubDetail
        club={selectedClub}
        onBack={() => setSelectedClub(null)}
      />
    );
  }

  // Process memberships data - handle both possible data structures
  const processedMemberships = React.useMemo(() => {
    if (!memberships) return [];

    // Handle array of memberships with nested club data
    if (Array.isArray(memberships)) {
      return memberships.map((membership: any) => {
        // Check if club data is nested under 'club' or 'yacht_clubs'
        const clubData = membership.club || membership.yacht_clubs || membership;
        return {
          id: membership.id || clubData.id,
          clubData: {
            id: clubData.id,
            name: clubData.name,
            location: clubData.location,
            country: clubData.country,
            photo_url: clubData.photo_url,
            description: clubData.description,
            facilities: clubData.facilities,
          },
          member_since: membership.joined_at || membership.member_since,
          membership_type: membership.membership_type,
          member_number: membership.member_number,
        };
      });
    }

    return [];
  }, [memberships]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Clubs</Text>
        <Text style={styles.subtitle}>
          {processedMemberships.length} {processedMemberships.length === 1 ? 'membership' : 'memberships'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading memberships...</Text>
          </View>
        ) : processedMemberships.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={{ fontSize: 48 }}>⛵</Text>
            </View>
            <Text style={styles.emptyText}>No club memberships yet</Text>
            <Text style={styles.emptySubtext}>
              Join yacht clubs to access exclusive events, facilities, and connect with other sailors
            </Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Browse Clubs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          processedMemberships.map((membership) => (
            <ClubCard
              key={membership.id}
              club={{
                ...membership.clubData,
                member_since: membership.member_since,
                membership_type: membership.membership_type,
                member_number: membership.member_number,
              }}
              onPress={() => setSelectedClub({
                ...membership.clubData,
                member_since: membership.member_since,
                membership_type: membership.membership_type,
                member_number: membership.member_number,
              })}
            />
          ))
        )}

        {/* Debug info - remove in production */}
        {__DEV__ && error && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>{error.message || 'Unknown error'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 5,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
  },
});