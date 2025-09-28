/**
 * Coach Dashboard - Professional Coaching Marketplace
 * Client management, session booking, and performance analysis platform
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { router } from 'expo-router';
import { AppHeader } from '@/components/layout/AppHeader';

export default function CoachDashboard() {
  console.log('👨‍🏫 Coach Dashboard: Professional coaching marketplace loading');
  const { user, userProfile, signOut, loading } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>👨‍🏫 Loading Coach Dashboard...</Text>
        <Text style={styles.loadingSubtitle}>Initializing coaching platform</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>👨‍🏫 RegattaFlow Coach</Text>
        <Text style={styles.subtitle}>Please log in to access coaching features</Text>
        <Text style={styles.description}>
          • Client management dashboard
          • Session booking and scheduling
          • Performance analysis tools
          • Marketplace profile management
        </Text>
      </View>
    );
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of RegattaFlow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        }
      ]
    );
  };

  const dismissWelcome = () => {
    setShowWelcome(false);
  };

  if (showWelcome) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <AppHeader title="Coach Dashboard" />
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>👨‍🏫 Welcome to Coach Hub</Text>
        <Text style={styles.welcomeSubtitle}>
          Professional Sailing Coaching Platform
        </Text>

        <View style={styles.featureList}>
          <Text style={styles.featureItem}>👥 Client Management & Progress Tracking</Text>
          <Text style={styles.featureItem}>📅 Session Scheduling & Booking</Text>
          <Text style={styles.featureItem}>📊 Performance Analysis & Review</Text>
          <Text style={styles.featureItem}>🛒 Marketplace Profile & Services</Text>
          <Text style={styles.featureItem}>🤖 AI Analysis Review & Correction</Text>
          <Text style={styles.featureItem}>💰 Revenue Tracking & Analytics</Text>
        </View>

        <Text style={styles.welcomeDescription}>
          Monetize your sailing expertise through RegattaFlow's integrated coaching
          marketplace. Manage clients, deliver professional analysis, and grow your
          coaching business with industry-leading tools.
        </Text>

        <View style={styles.welcomeActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={dismissWelcome}
          >
            <Text style={styles.primaryButtonText}>🚀 Launch Coaching Hub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignOut}
          >
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userText}>⚓ Welcome Coach, {userProfile?.full_name || user.email}!</Text>
          <Text style={styles.tierText}>Plan: {userProfile?.subscription_tier || 'Free'}</Text>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppHeader title="Coach Dashboard" />
      <ScrollView style={styles.dashboardContainer}>
      <View style={styles.header}>
        <Text style={styles.dashboardTitle}>Coach Dashboard</Text>
        <Text style={styles.dashboardSubtitle}>Client Management & Coaching Platform</Text>
      </View>

      <View style={styles.statsOverview}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Active Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>15</Text>
          <Text style={styles.statLabel}>Sessions This Month</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>$2,400</Text>
          <Text style={styles.statLabel}>Monthly Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionTitle}>Clients</Text>
          <Text style={styles.actionDescription}>Manage your sailors</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionTitle}>Schedule</Text>
          <Text style={styles.actionDescription}>Booking calendar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Analysis</Text>
          <Text style={styles.actionDescription}>Performance review</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>🛒</Text>
          <Text style={styles.actionTitle}>Marketplace</Text>
          <Text style={styles.actionDescription}>Service listings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.upcomingSessions}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        <View style={styles.sessionCard}>
          <Text style={styles.sessionClient}>Bram Van Olsen</Text>
          <Text style={styles.sessionTime}>Today, 2:00 PM</Text>
          <Text style={styles.sessionType}>Race Analysis • Dragon Class</Text>
        </View>
        <View style={styles.sessionCard}>
          <Text style={styles.sessionClient}>Sarah Liu</Text>
          <Text style={styles.sessionTime}>Tomorrow, 10:00 AM</Text>
          <Text style={styles.sessionType}>Tactical Training • Match Racing</Text>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.activityItem}>• Completed race analysis for Bram's weekend regatta</Text>
        <Text style={styles.activityItem}>• New booking request from Hong Kong sailor</Text>
        <Text style={styles.activityItem}>• AI analysis reviewed for 3 client sessions</Text>
        <Text style={styles.activityItem}>• Payment received: $180 for October sessions</Text>
      </View>

      <View style={styles.marketplaceStatus}>
        <Text style={styles.sectionTitle}>Marketplace Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Profile Active</Text>
          <Text style={styles.statusDescription}>
            Dragon Class Expert • Heavy Weather Specialist
          </Text>
          <Text style={styles.statusMeta}>47 reviews • $150/hour</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    padding: 24,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  featureList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 18,
    color: 'white',
    marginBottom: 12,
    fontWeight: '600',
  },
  welcomeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  welcomeActions: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  userInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  userText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  tierText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    backgroundColor: '#059669',
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsOverview: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '23%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  upcomingSessions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionClient: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    color: '#6B7280',
  },
  recentActivity: {
    padding: 16,
  },
  activityItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    paddingLeft: 8,
  },
  marketplaceStatus: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  statusMeta: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  signOutButton: {
    margin: 16,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
});