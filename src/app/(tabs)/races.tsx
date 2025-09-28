import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { RaceBuilder } from '../../components/race';

// TODO: Replace with actual auth context when implemented
const useAuth = () => ({
  user: {
    id: 'user-1',
    type: 'yacht_club', // 'sailor' | 'yacht_club' | 'coach'
    profile: {
      name: 'Royal Hong Kong Yacht Club',
      role: 'Race Committee'
    }
  },
  loading: false
});

export default function RacesScreen() {
  const { user, loading } = useAuth();
  const [userType, setUserType] = useState<'sailor' | 'yacht_club' | 'coach'>('yacht_club');

  // TODO: Remove this demo toggle when auth is implemented
  const toggleUserType = () => {
    setUserType(prev => {
      switch (prev) {
        case 'yacht_club': return 'sailor';
        case 'sailor': return 'coach';
        case 'coach': return 'yacht_club';
        default: return 'yacht_club';
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TODO: Remove demo controls when auth is implemented */}
      <View style={styles.demoControls}>
        <Text style={styles.demoLabel}>Demo Mode - User Type:</Text>
        <TouchableOpacity onPress={toggleUserType} style={styles.demoButton}>
          <Text style={styles.demoButtonText}>
            {userType === 'yacht_club' && '🏛️ Yacht Club'}
            {userType === 'sailor' && '⛵ Sailor'}
            {userType === 'coach' && '👨‍🏫 Coach'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* User-Type Specific Race Builder */}
      {userType === 'yacht_club' && (
        <View style={styles.builderContainer}>
          <RaceBuilder />
        </View>
      )}

      {userType === 'sailor' && (
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonTitle}>
            ⛵ Sailor Race Builder
          </Text>
          <Text style={styles.comingSoonSubtitle}>
            AI-powered race strategy and course analysis coming soon
          </Text>
        </View>
      )}

      {userType === 'coach' && (
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonTitle}>
            👨‍🏫 Coach Race Builder
          </Text>
          <Text style={styles.comingSoonSubtitle}>
            Coaching tools and team management coming soon
          </Text>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  demoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    gap: 8,
  },
  demoLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  demoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoButtonText: {
    fontSize: 12,
    color: '#92400E',
  },
  builderContainer: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});