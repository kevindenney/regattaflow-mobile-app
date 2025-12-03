/**
 * Competitor Dashboard
 * 
 * Personal command center for sailors
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import competitorService, {
  CompetitorBoat,
  CompetitorAlert,
  CompetitorStats,
  RaceHistory,
  UpcomingRace,
  SeriesStanding,
  DashboardData,
} from '../../services/CompetitorService';

// ============================================================================
// Types
// ============================================================================

type TabType = 'home' | 'races' | 'results' | 'boats' | 'alerts';

// ============================================================================
// Main Component
// ============================================================================

export default function CompetitorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ==========================================================================
  // Data Loading
  // ==========================================================================
  
  const loadData = useCallback(async () => {
    try {
      const [data, count] = await Promise.all([
        competitorService.getDashboardData(),
        competitorService.getUnreadCount(),
      ]);
      setDashboardData(data);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  // ==========================================================================
  // Actions
  // ==========================================================================
  
  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await competitorService.markAlertRead(alertId);
      loadData();
    } catch (error) {
      console.error('Error marking alert read:', error);
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await competitorService.markAllAlertsRead();
      loadData();
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };
  
  // ==========================================================================
  // Render Helpers
  // ==========================================================================
  
  const renderHomeTab = () => {
    if (!dashboardData) return null;
    
    const { stats, upcomingRaces, recentResults, activeStandings, alerts } = dashboardData;
    
    return (
      <View style={styles.tabContent}>
        {/* Stats Summary */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>My Racing Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_races}</Text>
                <Text style={styles.statLabel}>Races</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.podiums}</Text>
                <Text style={styles.statLabel}>Podiums</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.first_places}</Text>
                <Text style={styles.statLabel}>🥇 Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.avg_finish ? stats.avg_finish.toFixed(1) : '-'}
                </Text>
                <Text style={styles.statLabel}>Avg Finish</Text>
              </View>
            </View>
            
            {/* This Year */}
            <View style={styles.yearStats}>
              <Text style={styles.yearStatsText}>
                This year: {stats.races_this_year} races · {stats.podiums_this_year} podiums
              </Text>
            </View>
          </View>
        )}
        
        {/* Next Race */}
        {upcomingRaces.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Race</Text>
            <NextRaceCard race={upcomingRaces[0]} />
          </View>
        )}
        
        {/* Active Series */}
        {activeStandings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Series</Text>
            {activeStandings.slice(0, 2).map((standing) => (
              <SeriesCard key={standing.series_id} standing={standing} />
            ))}
          </View>
        )}
        
        {/* Recent Results */}
        {recentResults.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Results</Text>
              <TouchableOpacity onPress={() => setActiveTab('results')}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentResults.slice(0, 3).map((result) => (
              <ResultCard key={result.result_id} result={result} />
            ))}
          </View>
        )}
        
        {/* Unread Alerts */}
        {alerts.filter(a => !a.is_read).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🔔 Alerts ({alerts.filter(a => !a.is_read).length})
              </Text>
              <TouchableOpacity onPress={() => setActiveTab('alerts')}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            </View>
            {alerts.filter(a => !a.is_read).slice(0, 2).map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onMarkRead={() => handleMarkAlertRead(alert.id)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };
  
  const renderRacesTab = () => {
    const upcomingRaces = dashboardData?.upcomingRaces || [];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Upcoming Races</Text>
        
        {upcomingRaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="boat-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No upcoming races</Text>
            <TouchableOpacity style={styles.findEventsButton}>
              <Text style={styles.findEventsText}>Find Events</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingRaces.map((race) => (
            <UpcomingRaceCard key={race.entry_id} race={race} />
          ))
        )}
      </View>
    );
  };
  
  const renderResultsTab = () => {
    const results = dashboardData?.recentResults || [];
    const stats = dashboardData?.stats;
    
    return (
      <View style={styles.tabContent}>
        {/* Performance Summary */}
        {stats && (
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Performance</Text>
            <View style={styles.performanceStats}>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>🥇 {stats.first_places}</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>🥈 {stats.second_places}</Text>
              </View>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>🥉 {stats.third_places}</Text>
              </View>
            </View>
            <View style={styles.performanceDetail}>
              <Text style={styles.performanceDetailText}>
                Best finish: {stats.best_finish ? competitorService.formatPosition(stats.best_finish) : '-'}
              </Text>
              <Text style={styles.performanceDetailText}>
                Recent form: {stats.recent_avg_finish ? stats.recent_avg_finish.toFixed(1) : '-'} avg
              </Text>
            </View>
          </View>
        )}
        
        <Text style={styles.sectionTitle}>Race History</Text>
        
        {results.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No race results yet</Text>
          </View>
        ) : (
          results.map((result) => (
            <ResultCard key={result.result_id} result={result} detailed />
          ))
        )}
      </View>
    );
  };
  
  const renderBoatsTab = () => {
    const boats = dashboardData?.boats || [];
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Boats</Text>
          <TouchableOpacity 
            style={styles.addBoatButton}
            onPress={() => router.push('/competitor/boats/add')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBoatText}>Add Boat</Text>
          </TouchableOpacity>
        </View>
        
        {boats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="boat-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No boats added yet</Text>
            <Text style={styles.emptySubtext}>
              Add your boats to track ratings and certificates
            </Text>
            <TouchableOpacity 
              style={styles.addFirstBoatButton}
              onPress={() => router.push('/competitor/boats/add')}
            >
              <Text style={styles.addFirstBoatText}>Add Your First Boat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          boats.map((boat) => (
            <BoatCard key={boat.id} boat={boat} />
          ))
        )}
      </View>
    );
  };
  
  const renderAlertsTab = () => {
    const alerts = dashboardData?.alerts || [];
    const unread = alerts.filter(a => !a.is_read);
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Notifications {unread.length > 0 && `(${unread.length} unread)`}
          </Text>
          {unread.length > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAllReadLink}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onMarkRead={() => handleMarkAlertRead(alert.id)}
              detailed
            />
          ))
        )}
      </View>
    );
  };
  
  // ==========================================================================
  // Main Render
  // ==========================================================================
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.subtitle}>Your racing command center</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setActiveTab('alerts')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { id: 'home', label: 'Home', icon: 'home' },
          { id: 'races', label: 'Races', icon: 'flag' },
          { id: 'results', label: 'Results', icon: 'trophy' },
          { id: 'boats', label: 'Boats', icon: 'boat' },
          { id: 'alerts', label: 'Alerts', icon: 'notifications' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === tab.id ? '#3b82f6' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.id === 'alerts' && unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'races' && renderRacesTab()}
        {activeTab === 'results' && renderResultsTab()}
        {activeTab === 'boats' && renderBoatsTab()}
        {activeTab === 'alerts' && renderAlertsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function NextRaceCard({ race }: { race: UpcomingRace }) {
  const startDate = race.scheduled_start 
    ? new Date(race.scheduled_start)
    : null;
  
  const daysUntil = startDate
    ? Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <TouchableOpacity style={styles.nextRaceCard}>
      <View style={styles.nextRaceHeader}>
        <View style={styles.nextRaceBadge}>
          {daysUntil !== null && daysUntil <= 1 ? (
            <Text style={styles.nextRaceBadgeText}>TODAY</Text>
          ) : (
            <Text style={styles.nextRaceBadgeText}>
              {daysUntil} days
            </Text>
          )}
        </View>
        {race.check_in_status === 'checked_in' && (
          <View style={styles.checkedInBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={styles.checkedInText}>Checked In</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.nextRaceName}>{race.regatta_name}</Text>
      <Text style={styles.nextRaceDetails}>
        {race.race_name || `Race ${race.race_number}`}
      </Text>
      
      <View style={styles.nextRaceInfo}>
        <View style={styles.nextRaceInfoItem}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.nextRaceInfoText}>{race.club_name}</Text>
        </View>
        {startDate && (
          <View style={styles.nextRaceInfoItem}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.nextRaceInfoText}>
              {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        <View style={styles.nextRaceInfoItem}>
          <Ionicons name="boat-outline" size={16} color="#6b7280" />
          <Text style={styles.nextRaceInfoText}>
            {race.sail_number} · {race.boat_class}
          </Text>
        </View>
      </View>
      
      {race.check_in_status !== 'checked_in' && (
        <TouchableOpacity style={styles.checkInButton}>
          <Text style={styles.checkInButtonText}>Check In</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

function UpcomingRaceCard({ race }: { race: UpcomingRace }) {
  const startDate = race.scheduled_start 
    ? new Date(race.scheduled_start)
    : null;
  
  return (
    <TouchableOpacity style={styles.upcomingRaceCard}>
      <View style={styles.upcomingRaceLeft}>
        <Text style={styles.upcomingRegattaName}>{race.regatta_name}</Text>
        <Text style={styles.upcomingRaceName}>
          {race.race_name || `Race ${race.race_number}`}
        </Text>
        <Text style={styles.upcomingRaceClub}>{race.club_name}</Text>
        {startDate && (
          <Text style={styles.upcomingRaceDate}>
            {startDate.toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.upcomingRaceRight}>
        <Text style={styles.upcomingSailNumber}>{race.sail_number}</Text>
        {race.check_in_status === 'checked_in' ? (
          <View style={styles.checkedInIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          </View>
        ) : (
          <TouchableOpacity style={styles.checkInSmallButton}>
            <Text style={styles.checkInSmallText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SeriesCard({ standing }: { standing: SeriesStanding }) {
  return (
    <View style={styles.seriesCard}>
      <View style={styles.seriesHeader}>
        <Text style={styles.seriesName}>{standing.series_name}</Text>
        <View style={[
          styles.positionBadge,
          standing.position <= 3 && styles.positionBadgePodium,
        ]}>
          <Text style={[
            styles.positionText,
            standing.position <= 3 && styles.positionTextPodium,
          ]}>
            {competitorService.getPositionEmoji(standing.position)} {competitorService.formatPosition(standing.position)}
          </Text>
        </View>
      </View>
      <Text style={styles.seriesClub}>{standing.club_name}</Text>
      <View style={styles.seriesStats}>
        <Text style={styles.seriesStatText}>
          {standing.points} pts · {standing.races_sailed} races sailed
        </Text>
        {standing.races_remaining > 0 && (
          <Text style={styles.seriesRemaining}>
            {standing.races_remaining} remaining
          </Text>
        )}
      </View>
    </View>
  );
}

function ResultCard({ result, detailed }: { result: RaceHistory; detailed?: boolean }) {
  const positionEmoji = competitorService.getPositionEmoji(result.finish_position || 0);
  
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultLeft}>
        {result.finish_position && result.finish_position <= 3 ? (
          <Text style={styles.resultEmoji}>{positionEmoji}</Text>
        ) : (
          <View style={styles.resultPosition}>
            <Text style={styles.resultPositionText}>
              {result.finish_position || result.status_code || '-'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.resultCenter}>
        <Text style={styles.resultRegatta}>{result.regatta_name}</Text>
        <Text style={styles.resultRace}>
          {result.race_name || `Race ${result.race_number}`}
        </Text>
        {detailed && (
          <Text style={styles.resultDetails}>
            {result.sail_number} · {result.boat_class} · {result.club_name}
          </Text>
        )}
      </View>
      <View style={styles.resultRight}>
        {result.points !== undefined && (
          <Text style={styles.resultPoints}>{result.points} pts</Text>
        )}
        {result.scheduled_start && (
          <Text style={styles.resultDate}>
            {new Date(result.scheduled_start).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
}

function BoatCard({ boat }: { boat: CompetitorBoat }) {
  return (
    <TouchableOpacity 
      style={styles.boatCard}
      onPress={() => router.push(`/competitor/boats/${boat.id}`)}
    >
      <View style={styles.boatHeader}>
        <View>
          <Text style={styles.boatName}>{boat.name}</Text>
          <Text style={styles.boatSailNumber}>{boat.sail_number}</Text>
        </View>
        {boat.is_primary && (
          <View style={styles.primaryBadge}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.boatClass}>{boat.boat_class}</Text>
      
      <View style={styles.boatRatings}>
        {boat.phrf_rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>PHRF: {boat.phrf_rating}</Text>
          </View>
        )}
        {boat.irc_rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>IRC: {boat.irc_rating}</Text>
          </View>
        )}
        {boat.orc_rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>ORC: {boat.orc_rating}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.boatFooter}>
        <Text style={styles.ownershipText}>
          {boat.ownership_type === 'owner' ? '👤 Owner' : 
           boat.ownership_type === 'co_owner' ? '👥 Co-owner' :
           boat.ownership_type === 'charter' ? '📋 Charter' : '⛵ Crew'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
}

function AlertCard({ 
  alert, 
  onMarkRead,
  detailed,
}: { 
  alert: CompetitorAlert; 
  onMarkRead: () => void;
  detailed?: boolean;
}) {
  const typeInfo = competitorService.getAlertTypeInfo(alert.alert_type);
  const priorityInfo = competitorService.getPriorityInfo(alert.priority);
  
  return (
    <TouchableOpacity 
      style={[
        styles.alertCard,
        !alert.is_read && styles.alertCardUnread,
      ]}
      onPress={() => {
        if (!alert.is_read) onMarkRead();
        if (alert.action_url) {
          router.push(alert.action_url as any);
        }
      }}
    >
      <View style={styles.alertIcon}>
        <Text style={styles.alertIconText}>{typeInfo.icon}</Text>
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertTitle, !alert.is_read && styles.alertTitleUnread]}>
            {alert.title}
          </Text>
          {alert.priority === 'urgent' && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.bgColor }]}>
              <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
                {priorityInfo.label}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.alertMessage} numberOfLines={detailed ? undefined : 2}>
          {alert.message}
        </Text>
        <Text style={styles.alertTime}>
          {new Date(alert.created_at).toLocaleDateString()} · {typeInfo.label}
        </Text>
      </View>
      {!alert.is_read && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  yearStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  yearStatsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Next Race Card
  nextRaceCard: {
    backgroundColor: '#1e3a5f',
    borderRadius: 16,
    padding: 20,
  },
  nextRaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nextRaceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextRaceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  checkedInText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '500',
  },
  nextRaceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  nextRaceDetails: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  nextRaceInfo: {
    gap: 8,
  },
  nextRaceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextRaceInfoText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  checkInButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Upcoming Race Card
  upcomingRaceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  upcomingRaceLeft: {},
  upcomingRegattaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  upcomingRaceName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  upcomingRaceClub: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  upcomingRaceDate: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 4,
  },
  upcomingRaceRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  upcomingSailNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  checkedInIcon: {},
  checkInSmallButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkInSmallText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Series Card
  seriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  seriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seriesName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  positionBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  positionBadgePodium: {
    backgroundColor: '#fef3c7',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  positionTextPodium: {
    color: '#b45309',
  },
  seriesClub: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  seriesStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  seriesStatText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  seriesRemaining: {
    fontSize: 13,
    color: '#3b82f6',
  },
  
  // Result Card
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  resultLeft: {
    width: 44,
    alignItems: 'center',
    marginRight: 12,
  },
  resultEmoji: {
    fontSize: 28,
  },
  resultPosition: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPositionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  resultCenter: {
    flex: 1,
  },
  resultRegatta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  resultRace: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  resultDetails: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  resultDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  
  // Performance Card
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  performanceDetail: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  performanceDetailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Boat Card
  boatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  boatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  boatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  boatSailNumber: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginTop: 2,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  primaryText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '500',
  },
  boatClass: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  boatRatings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  ratingBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  boatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ownershipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  
  // Alert Card
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  alertCardUnread: {
    backgroundColor: '#eff6ff',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertIconText: {
    fontSize: 18,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  alertTitleUnread: {
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    alignSelf: 'center',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  findEventsButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  findEventsText: {
    color: '#fff',
    fontWeight: '600',
  },
  addFirstBoatButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstBoatText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  
  // Add Boat Button
  addBoatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBoatText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Mark All Read
  markAllReadLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});

