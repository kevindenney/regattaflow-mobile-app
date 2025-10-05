import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/src/components/ui/text';

interface YachtClub {
  id: string;
  name: string;
  location: string;
  country: string;
  photo_url?: string;
  member_since?: string;
  membership_type?: string;
  member_number?: string;
}

interface ClubCardProps {
  club: YachtClub;
  onPress: () => void;
}

export default function ClubCard({ club, onPress }: ClubCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.clubInfo}>
          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.location}>
            {club.location}, {club.country}
          </Text>
        </View>
      </View>

      <View style={styles.memberInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>{formatDate(club.member_since)}</Text>
        </View>

        {club.membership_type && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Membership Type</Text>
            <Text style={styles.value}>{club.membership_type}</Text>
          </View>
        )}

        {club.member_number && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Member Number</Text>
            <Text style={styles.value}>{club.member_number}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap for details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  memberInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 14,
    color: '#2196F3',
    textAlign: 'center',
  },
});
