import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

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
          <YachtClubRaceBuilderDemo />
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

// Demo component showing the yacht club race builder interface
function YachtClubRaceBuilderDemo() {
  const [activeTab, setActiveTab] = useState<'courses' | 'management' | 'publishing' | 'series'>('courses');

  return (
    <ScrollView style={styles.demoContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>🏛️ Race Committee</Text>
          <Text style={styles.subtitle}>Professional Race Course Builder & Management</Text>
        </View>
        <TouchableOpacity style={styles.quickActionButton}>
          <Text style={styles.quickActionText}>➕ New Course</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {[
          { id: 'courses', label: '🎨 Course Design', active: activeTab === 'courses' },
          { id: 'management', label: '🏁 Race Management', active: activeTab === 'management', badge: 2 },
          { id: 'publishing', label: '📡 Publishing', active: activeTab === 'publishing', badge: 3 },
          { id: 'series', label: '🏆 Series', active: activeTab === 'series' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, tab.active && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabButtonText, tab.active && styles.tabButtonTextActive]}>
              {tab.label}
            </Text>
            {tab.badge && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {activeTab === 'courses' && (
          <View style={styles.tabContentArea}>
            <Text style={styles.sectionTitle}>🎨 Professional Course Design</Text>
            <View style={styles.courseCard}>
              <Text style={styles.cardTitle}>📍 3D Course Visualization</Text>
              <Text style={styles.cardDescription}>
                OnX Maps-style drag-and-drop course builder with real-time validation and safety checks.
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.feature}>✓ Visual mark placement & management</Text>
                <Text style={styles.feature}>✓ World Sailing rule compliance</Text>
                <Text style={styles.feature}>✓ Weather integration & tactical analysis</Text>
                <Text style={styles.feature}>✓ Professional course templates</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'management' && (
          <View style={styles.tabContentArea}>
            <Text style={styles.sectionTitle}>🏁 Race Management</Text>
            <View style={styles.courseCard}>
              <Text style={styles.cardTitle}>Live Race Control</Text>
              <Text style={styles.cardDescription}>
                Professional race committee tools for start sequences, timing, and live race management.
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.feature}>✓ Automated start sequences</Text>
                <Text style={styles.feature}>✓ Real-time fleet tracking</Text>
                <Text style={styles.feature}>✓ Digital protest management</Text>
                <Text style={styles.feature}>✓ Scoring system integration</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'publishing' && (
          <View style={styles.tabContentArea}>
            <Text style={styles.sectionTitle}>📡 Course Publishing</Text>
            <View style={styles.courseCard}>
              <Text style={styles.cardTitle}>Sailor Distribution System</Text>
              <Text style={styles.cardDescription}>
                Automatic course distribution to sailor apps, email notifications, and club integration.
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.feature}>✓ Multi-channel distribution</Text>
                <Text style={styles.feature}>✓ Real-time course amendments</Text>
                <Text style={styles.feature}>✓ Sailor app integration</Text>
                <Text style={styles.feature}>✓ Publication analytics</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'series' && (
          <View style={styles.tabContentArea}>
            <Text style={styles.sectionTitle}>🏆 Series Management</Text>
            <View style={styles.courseCard}>
              <Text style={styles.cardTitle}>Championship Organization</Text>
              <Text style={styles.cardDescription}>
                Comprehensive tools for managing racing series, championships, and multi-event competitions.
              </Text>
              <View style={styles.featureList}>
                <Text style={styles.feature}>✓ Multi-race series management</Text>
                <Text style={styles.feature}>✓ Championship scoring systems</Text>
                <Text style={styles.feature}>✓ Division & fleet management</Text>
                <Text style={styles.feature}>✓ Prize structure configuration</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          📊 5 courses • 3 published • 2 active races
        </Text>
        <Text style={styles.statusText}>
          Current: Hong Kong Dragon Championship • ✅ Valid
        </Text>
      </View>
    </ScrollView>
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
  // Demo component styles
  demoContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickActionButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickActionText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066CC',
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#0066CC',
  },
  tabButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  tabContentArea: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 22,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  statusBar: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});