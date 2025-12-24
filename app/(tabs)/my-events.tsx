/**
 * My Events - Sailor Dashboard
 * SAILTI-competitive "Sailor Portal" equivalent
 * Shows registrations, results, favorites, and live signals
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/AuthProvider';
import { RaceSignal, raceSignalService } from '@/services/RaceSignalService';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow, isFuture, isPast, isToday } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface MyRegistration {
  id: string;
  regatta_id: string;
  regatta_name: string;
  regatta_location?: string;
  start_date: string;
  end_date?: string;
  entry_number?: string;
  sail_number?: string;
  division?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'waitlisted';
  series_rank?: number;
  series_points?: number;
  races_sailed?: number;
  club_logo?: string;
}

interface SavedEvent {
  id: string;
  regatta_id: string;
  regatta_name: string;
  regatta_location?: string;
  start_date: string;
  end_date?: string;
  status: string;
  club_logo?: string;
}

interface MyResults {
  regatta_id: string;
  regatta_name: string;
  division?: string;
  final_rank: number;
  total_entries: number;
  net_points: number;
  races_sailed: number;
  end_date: string;
}

export default function MyEventsScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [registrations, setRegistrations] = useState<MyRegistration[]>([]);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [recentResults, setRecentResults] = useState<MyResults[]>([]);
  const [liveSignals, setLiveSignals] = useState<RaceSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'saved'>('upcoming');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      await Promise.all([
        loadRegistrations(),
        loadSavedEvents(),
        loadRecentResults(),
        loadLiveSignals(),
      ]);
    } catch (error) {
      console.error('Error loading my events data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('race_entries')
      .select(`
        id,
        entry_number,
        sail_number,
        division,
        status,
        regatta:regatta_id (
          id,
          name,
          location,
          start_date,
          end_date,
          club:club_id (
            logo_url
          )
        )
      `)
      .eq('sailor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading registrations:', error);
      return;
    }

    // Get standings for each registration
    const regs: MyRegistration[] = [];
    for (const entry of data || []) {
      let standings = null;
      try {
        const { data: standingsData } = await supabase
          .from('series_standings')
          .select('rank, net_points, races_sailed')
          .eq('entry_id', entry.id)
          .single();
        standings = standingsData;
      } catch {}

      regs.push({
        id: entry.id,
        regatta_id: entry.regatta?.id,
        regatta_name: entry.regatta?.name || 'Unknown Regatta',
        regatta_location: entry.regatta?.location,
        start_date: entry.regatta?.start_date,
        end_date: entry.regatta?.end_date,
        entry_number: entry.entry_number,
        sail_number: entry.sail_number,
        division: entry.division,
        status: entry.status,
        series_rank: standings?.rank,
        series_points: standings?.net_points,
        races_sailed: standings?.races_sailed,
        club_logo: entry.regatta?.club?.logo_url,
      });
    }

    setRegistrations(regs);
  };

  const loadSavedEvents = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('saved_regattas')
      .select(`
        id,
        regatta:regatta_id (
          id,
          name,
          location,
          start_date,
          end_date,
          status,
          club:club_id (
            logo_url
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading saved events:', error);
      return;
    }

    setSavedEvents((data || []).map(s => ({
      id: s.id,
      regatta_id: s.regatta?.id,
      regatta_name: s.regatta?.name || 'Unknown',
      regatta_location: s.regatta?.location,
      start_date: s.regatta?.start_date,
      end_date: s.regatta?.end_date,
      status: s.regatta?.status || 'upcoming',
      club_logo: s.regatta?.club?.logo_url,
    })));
  };

  const loadRecentResults = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('series_standings')
      .select(`
        rank,
        net_points,
        races_sailed,
        division,
        entry:entry_id (
          regatta:regatta_id (
            id,
            name,
            end_date
          )
        )
      `)
      .eq('entry_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading results:', error);
      return;
    }

    // For now, set empty - this would need proper query
    setRecentResults([]);
  };

  const loadLiveSignals = async () => {
    // Get signals for any registered regattas that are live
    const activeRegattaIds = registrations
      .filter(r => isToday(new Date(r.start_date)) || 
                   (r.end_date && new Date() >= new Date(r.start_date) && new Date() <= new Date(r.end_date)))
      .map(r => r.regatta_id);

    const allSignals: RaceSignal[] = [];
    for (const regattaId of activeRegattaIds) {
      try {
        const signals = await raceSignalService.getActiveSignals(regattaId);
        allSignals.push(...signals);
      } catch {}
    }

    setLiveSignals(allSignals.slice(0, 5));
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user?.id]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'waitlisted': return '#8B5CF6';
      case 'rejected': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const upcomingRegistrations = registrations.filter(r => 
    r.start_date && isFuture(new Date(r.start_date))
  );

  const activeRegistrations = registrations.filter(r => {
    if (!r.start_date) return false;
    const start = new Date(r.start_date);
    const end = r.end_date ? new Date(r.end_date) : start;
    const now = new Date();
    return now >= start && now <= end;
  });

  const pastRegistrations = registrations.filter(r => {
    if (!r.start_date) return false;
    const end = r.end_date ? new Date(r.end_date) : new Date(r.start_date);
    return isPast(end);
  });

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <ThemedText style={styles.loadingText}>Loading your events...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle" size={64} color="#94A3B8" />
          <ThemedText style={styles.emptyTitle}>Sign In Required</ThemedText>
          <ThemedText style={styles.emptyText}>
            Sign in to view your registrations, results, and saved events
          </ThemedText>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerGreeting}>
            Welcome back{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}
          </ThemedText>
          <ThemedText style={styles.headerTitle}>My Events</ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="person-circle" size={40} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Live Signals Alert */}
        {liveSignals.length > 0 && (
          <View style={styles.liveSection}>
            <View style={styles.liveHeader}>
              <View style={styles.liveDot} />
              <ThemedText style={styles.liveTitle}>Live Now</ThemedText>
            </View>
            {liveSignals.map((signal) => (
              <View key={signal.id} style={styles.liveCard}>
                <Ionicons name="flag" size={20} color="#EF4444" />
                <View style={styles.liveInfo}>
                  <ThemedText style={styles.liveSignalTitle}>{signal.title}</ThemedText>
                  <ThemedText style={styles.liveSignalMeta}>
                    Race {signal.race_number} • {formatDistanceToNow(new Date(signal.signal_time), { addSuffix: true })}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{activeRegistrations.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Active</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#3B82F6' }]}>
              {upcomingRegistrations.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Upcoming</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#8B5CF6' }]}>
              {pastRegistrations.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: '#F59E0B' }]}>
              {savedEvents.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Saved</ThemedText>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Past Results
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content based on tab */}
        {activeTab === 'upcoming' && (
          <View style={styles.section}>
            {/* Active Events First */}
            {activeRegistrations.length > 0 && (
              <>
                <ThemedText style={styles.sectionTitle}>🔴 Racing Now</ThemedText>
                {activeRegistrations.map((reg) => (
                  <TouchableOpacity 
                    key={reg.id}
                    style={[styles.eventCard, styles.eventCardActive]}
                    onPress={() => router.push(`/regatta/${reg.regatta_id}`)}
                  >
                    <View style={styles.eventHeader}>
                      {reg.club_logo ? (
                        <Image source={{ uri: reg.club_logo }} style={styles.clubLogo} />
                      ) : (
                        <View style={styles.clubLogoPlaceholder}>
                          <Ionicons name="boat" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.eventInfo}>
                        <ThemedText style={styles.eventName}>{reg.regatta_name}</ThemedText>
                        <ThemedText style={styles.eventLocation}>{reg.regatta_location}</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reg.status) }]}>
                        <ThemedText style={styles.statusText}>{reg.status}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetail}>
                        <Ionicons name="boat-outline" size={16} color="#64748B" />
                        <ThemedText style={styles.eventDetailText}>{reg.sail_number}</ThemedText>
                      </View>
                      {reg.series_rank && (
                        <View style={styles.eventDetail}>
                          <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
                          <ThemedText style={styles.eventDetailText}>
                            {reg.series_rank}{getOrdinalSuffix(reg.series_rank)} ({reg.series_points} pts)
                          </ThemedText>
                        </View>
                      )}
                      {reg.races_sailed !== undefined && (
                        <View style={styles.eventDetail}>
                          <Ionicons name="flag-outline" size={16} color="#64748B" />
                          <ThemedText style={styles.eventDetailText}>{reg.races_sailed} races</ThemedText>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity style={styles.liveButton}>
                      <Ionicons name="radio" size={16} color="#FFFFFF" />
                      <ThemedText style={styles.liveButtonText}>View Live</ThemedText>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Upcoming Events */}
            {upcomingRegistrations.length > 0 && (
              <>
                <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>Coming Up</ThemedText>
                {upcomingRegistrations.map((reg) => (
                  <TouchableOpacity 
                    key={reg.id}
                    style={styles.eventCard}
                    onPress={() => router.push(`/regatta/${reg.regatta_id}`)}
                  >
                    <View style={styles.eventHeader}>
                      {reg.club_logo ? (
                        <Image source={{ uri: reg.club_logo }} style={styles.clubLogo} />
                      ) : (
                        <View style={styles.clubLogoPlaceholder}>
                          <Ionicons name="boat" size={20} color="#94A3B8" />
                        </View>
                      )}
                      <View style={styles.eventInfo}>
                        <ThemedText style={styles.eventName}>{reg.regatta_name}</ThemedText>
                        <ThemedText style={styles.eventLocation}>{reg.regatta_location}</ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reg.status) }]}>
                        <ThemedText style={styles.statusText}>{reg.status}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.eventFooter}>
                      <View style={styles.eventDate}>
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <ThemedText style={styles.eventDateText}>
                          {format(new Date(reg.start_date), 'MMM d, yyyy')}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.eventCountdown}>
                        {formatDistanceToNow(new Date(reg.start_date), { addSuffix: true })}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {activeRegistrations.length === 0 && upcomingRegistrations.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
                <ThemedText style={styles.emptyCardTitle}>No Upcoming Events</ThemedText>
                <ThemedText style={styles.emptyCardText}>
                  Browse and register for regattas to get started
                </ThemedText>
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => router.push('/(tabs)/events')}
                >
                  <ThemedText style={styles.browseButtonText}>Find Events</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'past' && (
          <View style={styles.section}>
            {pastRegistrations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="trophy-outline" size={48} color="#94A3B8" />
                <ThemedText style={styles.emptyCardTitle}>No Past Results</ThemedText>
                <ThemedText style={styles.emptyCardText}>
                  Your completed regatta results will appear here
                </ThemedText>
              </View>
            ) : (
              pastRegistrations.map((reg) => (
                <TouchableOpacity 
                  key={reg.id}
                  style={styles.resultCard}
                  onPress={() => router.push(`/regatta/${reg.regatta_id}/results`)}
                >
                  <View style={styles.resultRank}>
                    {reg.series_rank && reg.series_rank <= 3 ? (
                      <Ionicons 
                        name="trophy" 
                        size={24} 
                        color={reg.series_rank === 1 ? '#F59E0B' : reg.series_rank === 2 ? '#94A3B8' : '#B87333'} 
                      />
                    ) : (
                      <ThemedText style={styles.resultRankText}>{reg.series_rank || '-'}</ThemedText>
                    )}
                  </View>
                  <View style={styles.resultInfo}>
                    <ThemedText style={styles.resultName}>{reg.regatta_name}</ThemedText>
                    <ThemedText style={styles.resultMeta}>
                      {reg.division} • {reg.races_sailed || 0} races • {reg.series_points || 0} pts
                    </ThemedText>
                    <ThemedText style={styles.resultDate}>
                      {reg.end_date ? format(new Date(reg.end_date), 'MMM yyyy') : ''}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'saved' && (
          <View style={styles.section}>
            {savedEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="bookmark-outline" size={48} color="#94A3B8" />
                <ThemedText style={styles.emptyCardTitle}>No Saved Events</ThemedText>
                <ThemedText style={styles.emptyCardText}>
                  Bookmark events you're interested in
                </ThemedText>
              </View>
            ) : (
              savedEvents.map((event) => (
                <TouchableOpacity 
                  key={event.id}
                  style={styles.savedCard}
                  onPress={() => router.push(`/regatta/${event.regatta_id}`)}
                >
                  <View style={styles.savedInfo}>
                    <ThemedText style={styles.savedName}>{event.regatta_name}</ThemedText>
                    <ThemedText style={styles.savedLocation}>{event.regatta_location}</ThemedText>
                    <ThemedText style={styles.savedDate}>
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </ThemedText>
                  </View>
                  <Ionicons name="bookmark" size={24} color="#F59E0B" />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerGreeting: {
    fontSize: 14,
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  liveSection: {
    backgroundColor: '#FEF2F2',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  liveTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  liveInfo: {
    flex: 1,
  },
  liveSignalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  liveSignalMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  section: {
    padding: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventCardActive: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 12,
  },
  clubLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  eventLocation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 16,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#64748B',
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  liveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDateText: {
    fontSize: 13,
    color: '#64748B',
  },
  eventCountdown: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyCardText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultRank: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultRankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  resultMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  resultDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savedInfo: {
    flex: 1,
  },
  savedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  savedLocation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  savedDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});

