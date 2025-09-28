/**
 * Profile Screen - User Account Management and Settings
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { status, loading: subscriptionLoading } = useSubscription();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [userProfile, setUserProfile] = useState({
    displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Sailor',
    sailNumber: 'USA 12345',
    sailingClass: 'Dragon',
    club: 'Hong Kong Yacht Club',
  });

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleSubscriptionManagement = () => {
    router.push('/(app)/subscription');
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing coming soon!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings panel coming soon!');
  };

  const handleHelp = () => {
    router.push('/(app)/contact');
  };

  if (authLoading) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <View style={styles.authPrompt}>
          <Ionicons name="person-circle-outline" size={80} color="#64748b" />
          <ThemedText style={styles.authTitle}>Sign In Required</ThemedText>
          <ThemedText style={styles.authSubtitle}>
            Please sign in to access your profile and settings
          </ThemedText>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <ThemedText style={styles.authButtonText}>Sign In</ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#334155']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#0ea5e9" />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.displayName}>{userProfile.displayName}</ThemedText>
              <ThemedText style={styles.email}>{user.email}</ThemedText>
              <View style={styles.statusBadge}>
                <Ionicons
                  name={status?.isActive ? "checkmark-circle" : "information-circle"}
                  size={16}
                  color={status?.isActive ? "#22c55e" : "#f59e0b"}
                />
                <ThemedText style={styles.statusText}>
                  {status?.isActive ? `${status.tier.toUpperCase()} Member` : 'Free Plan'}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={20} color="#0ea5e9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={[styles.actionsGrid, isDesktop && styles.actionsGridDesktop]}>
            <ActionCard
              icon="card"
              title="Subscription"
              description={status?.isActive ? 'Manage billing' : 'Upgrade plan'}
              onPress={handleSubscriptionManagement}
              color="#0ea5e9"
            />
            <ActionCard
              icon="settings"
              title="Settings"
              description="App preferences"
              onPress={handleSettings}
              color="#8b5cf6"
            />
            <ActionCard
              icon="help-circle"
              title="Help & Support"
              description="Get assistance"
              onPress={handleHelp}
              color="#22c55e"
            />
            <ActionCard
              icon="log-out"
              title="Sign Out"
              description="End session"
              onPress={handleSignOut}
              color="#ef4444"
            />
          </View>
        </View>

        {/* Sailing Profile */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sailing Profile</ThemedText>
          <View style={styles.profileCard}>
            <ProfileItem
              icon="boat"
              label="Sail Number"
              value={userProfile.sailNumber}
            />
            <ProfileItem
              icon="trophy"
              label="Class"
              value={userProfile.sailingClass}
            />
            <ProfileItem
              icon="location"
              label="Home Club"
              value={userProfile.club}
            />
          </View>
        </View>

        {/* Subscription Status */}
        {status && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
            <View style={[
              styles.subscriptionCard,
              status.isActive ? styles.activeSubscription : styles.inactiveSubscription
            ]}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionIcon}>
                  <Ionicons
                    name={status.isActive ? "checkmark-circle" : "information-circle"}
                    size={24}
                    color={status.isActive ? "#22c55e" : "#f59e0b"}
                  />
                </View>
                <View style={styles.subscriptionInfo}>
                  <ThemedText style={styles.subscriptionPlan}>
                    {status.tier.replace('_', ' ').toUpperCase()}
                  </ThemedText>
                  <ThemedText style={styles.subscriptionStatus}>
                    {status.isActive ? 'Active' : 'Inactive'}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={handleSubscriptionManagement}
                >
                  <ThemedText style={styles.manageButtonText}>Manage</ThemedText>
                </TouchableOpacity>
              </View>

              {status.isActive && status.expiresAt && (
                <View style={styles.subscriptionDetails}>
                  <ThemedText style={styles.subscriptionDetailText}>
                    {status.isTrialing ? 'Trial ends' : 'Renews'} on{' '}
                    {new Date(status.expiresAt).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* App Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>App Information</ThemedText>
          <View style={styles.infoCard}>
            <InfoItem label="Version" value="1.0.0" />
            <InfoItem label="Build" value="2024091501" />
            <InfoItem label="Platform" value="Expo Universal App" />
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  color: string;
}

function ActionCard({ icon, title, description, onPress, color }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <ThemedText style={styles.actionTitle}>{title}</ThemedText>
      <ThemedText style={styles.actionDescription}>{description}</ThemedText>
    </TouchableOpacity>
  );
}

interface ProfileItemProps {
  icon: string;
  label: string;
  value: string;
}

function ProfileItem({ icon, label, value }: ProfileItemProps) {
  return (
    <View style={styles.profileItem}>
      <View style={styles.profileItemIcon}>
        <Ionicons name={icon as any} size={20} color="#0ea5e9" />
      </View>
      <View style={styles.profileItemContent}>
        <ThemedText style={styles.profileItemLabel}>{label}</ThemedText>
        <ThemedText style={styles.profileItemValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 16,
  },

  // Auth Prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  editButton: {
    padding: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 8,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionsGridDesktop: {
    gap: 20,
  },
  actionCard: {
    width: '45%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    gap: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileItemIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f8fafc',
  },

  // Subscription Card
  subscriptionCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
  },
  activeSubscription: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  inactiveSubscription: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#94a3b8',
  },
  manageButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  subscriptionDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  subscriptionDetailText: {
    fontSize: 14,
    color: '#cbd5e1',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 20,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
  },
});