import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RaceBuilder } from './RaceBuilder';
import { SailorRaceInterface } from './SailorRaceInterface';
import { CoachRaceInterface } from './CoachRaceInterface';

// User types for the race interface
export type UserType = 'sailor' | 'yacht_club' | 'coach';

export function UserTypeAwareRaces() {
  const { user, userType: authUserType, capabilities } = useAuth();

  // Determine display user type based on auth user type and capabilities
  const getUserType = (): UserType => {
    // Club users see yacht_club interface
    if (authUserType === 'club') return 'yacht_club';
    // Users with coaching capability see coach interface
    if (capabilities?.hasCoaching) return 'coach';
    // Default to sailor
    return 'sailor';
  };

  const userType = getUserType();
  const hasCoaching = capabilities?.hasCoaching;

  // Loading state
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.messageContainer}>
          <ThemedText type="title" style={styles.messageTitle}>🔐 Authentication Required</ThemedText>
          <ThemedText style={styles.messageSubtitle}>
            Please log in to access race features
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* User Type Debug Info - Remove in production */}
      <View style={styles.debugContainer}>
        <ThemedText style={styles.debugText}>
          👤 User Type: {userType.charAt(0).toUpperCase() + userType.slice(1).replace('_', ' ')}
        </ThemedText>
      </View>

      {/* Render appropriate interface based on user type */}
      {userType === 'yacht_club' && <RaceBuilder />}
      {userType === 'sailor' && <SailorRaceInterface />}
      {userType === 'coach' && <CoachRaceInterface />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  messageTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  messageSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});