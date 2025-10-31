/**
 * Admin Results Polling Dashboard
 * Comprehensive admin interface for managing external racing results integration
 * Provides system monitoring, configuration, and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { ExternalResultsMonitor } from '@/components/results/ExternalResultsMonitor';
import { ResultsSearchInterface } from '@/components/results/ResultsSearchInterface';

interface SystemStats {
  totalResults: number;
  totalRegattas: number;
  activeSources: number;
  healthySources: number;
  errorSources: number;
  dailyPolls: number;
  successRate: number;
  dataFreshness: number; // hours
}

interface RecentActivity {
  id: string;
  type: 'poll_success' | 'poll_error' | 'new_regatta' | 'new_results';
  sourceId: string;
  sourceName: string;
  message: string;
  count?: number;
  timestamp: Date;
}

interface ResultsPollingDashboardProps {
  style?: any;
}

export const ResultsPollingDashboard: React.FC<ResultsPollingDashboardProps> = ({ style }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'monitor' | 'search' | 'analytics'>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();

    // Set up periodic refresh
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // In a real implementation, these would be separate API calls
      await Promise.all([
        loadSystemStats(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSystemStats = async () => {
    // Simulated stats - in production, this would call a real API
    const simulatedStats: SystemStats = {
      totalResults: 12847,
      totalRegattas: 342,
      activeSources: 6,
      healthySources: 5,
      errorSources: 1,
      dailyPolls: 288,
      successRate: 94.2,
      dataFreshness: 0.5,
    };

    setStats(simulatedStats);
  };

  const loadRecentActivity = async () => {
    // Simulated activity - in production, this would call a real API
    const simulatedActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'poll_success',
        sourceId: 'sailwave',
        sourceName: 'Sailwave',
        message: 'Successfully polled and imported 23 new results',
        count: 23,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: '2',
        type: 'new_regatta',
        sourceId: 'regattanetwork',
        sourceName: 'Regatta Network',
        message: 'Discovered new regatta: Dragon Gold Cup 2024',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        id: '3',
        type: 'poll_error',
        sourceId: 'yacht_scoring',
        sourceName: 'Yacht Scoring',
        message: 'Poll failed: Connection timeout',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: '4',
        type: 'poll_success',
        sourceId: 'raceqs',
        sourceName: 'RaceQs',
        message: 'Successfully polled and imported 45 new results',
        count: 45,
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
      },
    ];

    setRecentActivity(simulatedActivity);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'overview', label: 'Overview', icon: 'analytics' },
        { key: 'monitor', label: 'Monitor', icon: 'pulse' },
        { key: 'search', label: 'Search', icon: 'search' },
        { key: 'analytics', label: 'Analytics', icon: 'bar-chart' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? '#0066CC' : '#666'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.tabButtonTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderSystemStats()}
      {renderRecentActivity()}
      {renderQuickActions()}
    </ScrollView>
  );

  const renderSystemStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>System Overview</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalResults.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Results</Text>
            <Ionicons name="document-text" size={24} color="#0066CC" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRegattas.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Regattas</Text>
            <Ionicons name="flag" size={24} color="#00AA33" />
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeSources}</Text>
            <Text style={styles.statLabel}>Active Sources</Text>
            <Ionicons name="server" size={24} color="#FF9500" />
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00AA33' }]}>
              {stats.successRate}%
            </Text>
            <Text style={styles.statLabel}>Success Rate</Text>
            <Ionicons name="checkmark-circle" size={24} color="#00AA33" />
          </View>
        </View>

        <View style={styles.healthIndicators}>
          <View style={styles.healthIndicator}>
            <Ionicons name="checkmark-circle" size={20} color="#00AA33" />
            <Text style={styles.healthText}>
              {stats.healthySources} sources healthy
            </Text>
          </View>

          {stats.errorSources > 0 && (
            <View style={styles.healthIndicator}>
              <Ionicons name="warning" size={20} color="#FF3B30" />
              <Text style={[styles.healthText, { color: '#FF3B30' }]}>
                {stats.errorSources} source{stats.errorSources !== 1 ? 's' : ''} with errors
              </Text>
            </View>
          )}

          <View style={styles.healthIndicator}>
            <Ionicons name="time" size={20} color="#0066CC" />
            <Text style={styles.healthText}>
              Data {stats.dataFreshness < 1 ? 'under 1 hour' : `${stats.dataFreshness}h`} old
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentActivity = () => (
    <View style={styles.activitySection}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      {recentActivity.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Ionicons
              name={getActivityIcon(activity.type)}
              size={20}
              color={getActivityColor(activity.type)}
            />
          </View>

          <View style={styles.activityContent}>
            <Text style={styles.activityMessage}>{activity.message}</Text>
            <View style={styles.activityMeta}>
              <Text style={styles.activitySource}>{activity.sourceName}</Text>
              <Text style={styles.activityTime}>
                {formatActivityTime(activity.timestamp)}
              </Text>
            </View>
          </View>

          {activity.count && (
            <View style={styles.activityBadge}>
              <Text style={styles.activityCount}>{activity.count}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  type ActivityIconName =
    | 'checkmark-circle'
    | 'close-circle'
    | 'add-circle'
    | 'document-text'
    | 'information-circle';

  const getActivityIcon = (type: string): ActivityIconName => {
    switch (type) {
      case 'poll_success': return 'checkmark-circle';
      case 'poll_error': return 'close-circle';
      case 'new_regatta': return 'add-circle';
      case 'new_results': return 'document-text';
      default: return 'information-circle';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'poll_success': return '#00AA33';
      case 'poll_error': return '#FF3B30';
      case 'new_regatta': return '#0066CC';
      case 'new_results': return '#FF9500';
      default: return '#666666';
    }
  };

  const formatActivityTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderQuickActions = () => (
    <View style={styles.actionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="refresh-circle" size={24} color="#0066CC" />
          <Text style={styles.actionButtonText}>Poll All Sources</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="settings" size={24} color="#666" />
          <Text style={styles.actionButtonText}>Configure Sources</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download" size={24} color="#00AA33" />
          <Text style={styles.actionButtonText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bug" size={24} color="#FF9500" />
          <Text style={styles.actionButtonText}>Debug Mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'monitor':
        return <ExternalResultsMonitor style={styles.tabContent} />;
      case 'search':
        return <ResultsSearchInterface style={styles.tabContent} />;
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.placeholderContent}>
        <Ionicons name="bar-chart" size={64} color="#CCC" />
        <Text style={styles.placeholderText}>
          Analytics dashboard coming soon
        </Text>
        <Text style={styles.placeholderSubtext}>
          This will include detailed charts and metrics for polling performance,
          data quality, and system health over time.
        </Text>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Results Polling Admin</Text>
        <Text style={styles.subtitle}>
          System monitoring and configuration
        </Text>
      </View>

      {renderTabBar()}
      {renderTabContent()}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#F0F8FF',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2, // Account for padding and gap
    alignItems: 'center',
    boxShadow: '0px 1px',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  healthIndicators: {
    gap: 8,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthText: {
    fontSize: 14,
    color: '#666',
  },
  activitySection: {
    padding: 20,
    paddingTop: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activitySource: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  activityBadge: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activityCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: 'center',
    gap: 8,
    boxShadow: '0px 1px',
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
    textAlign: 'center',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ResultsPollingDashboard;
