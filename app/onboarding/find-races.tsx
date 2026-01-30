/**
 * Find Races Screen
 * User discovers and adds upcoming races to their calendar
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { supabase } from '@/services/supabase';
import type { RaceSelection } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface UpcomingRace {
  id: string;
  name: string;
  start_date: string;
  venue_name?: string;
  class_name?: string;
  status: string;
}

export default function FindRacesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [races, setRaces] = useState<UpcomingRace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRaces, setSelectedRaces] = useState<Set<string>>(new Set());

  // Load upcoming races (public/catalog races)
  useEffect(() => {
    const loadRaces = async () => {
      setIsLoading(true);
      try {
        // Get upcoming races from catalog_races and regattas tables
        const now = new Date().toISOString();

        // Fetch from catalog_races (public races)
        const { data: catalogRaces, error: catalogError } = await supabase
          .from('catalog_races')
          .select('id, name, typical_month, country, organizing_authority')
          .order('follower_count', { ascending: false })
          .limit(15);

        if (catalogError) {
          console.error('Error loading catalog races:', catalogError);
        }

        // Fetch upcoming races from race_events
        const { data: upcomingRaces, error: eventsError } = await supabase
          .from('race_events')
          .select('id, name, start_time, location, boat_class')
          .gte('start_time', now)
          .order('start_time', { ascending: true })
          .limit(15);

        if (eventsError) {
          console.error('Error loading race events:', eventsError);
        }

        // Combine and map results
        const mappedCatalog: UpcomingRace[] = (catalogRaces || []).map((race: any) => ({
          id: race.id,
          name: race.name,
          start_date: race.typical_month ? `${race.typical_month} (Annual)` : 'TBD',
          venue_name: race.organizing_authority || race.country,
          class_name: undefined,
          status: 'catalog',
        }));

        const mappedEvents: UpcomingRace[] = (upcomingRaces || []).map((race: any) => ({
          id: race.id,
          name: race.name,
          start_date: race.start_time,
          venue_name: race.location,
          class_name: race.boat_class,
          status: 'upcoming',
        }));

        // Combine and dedupe by name
        const allRaces = [...mappedEvents, ...mappedCatalog];
        const uniqueRaces = allRaces.reduce((acc: UpcomingRace[], race) => {
          if (!acc.find((r) => r.name === race.name)) {
            acc.push(race);
          }
          return acc;
        }, []);

        setRaces(uniqueRaces.slice(0, 20));
      } catch (error) {
        console.error('Error loading races:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRaces();
  }, []);

  // Search races when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const searchRaces = async () => {
      setIsSearching(true);
      try {
        const query = searchQuery.toLowerCase();

        // Search catalog_races
        const { data: catalogResults, error: catalogError } = await supabase
          .from('catalog_races')
          .select('id, name, typical_month, country, organizing_authority')
          .or(`name.ilike.%${query}%,country.ilike.%${query}%,organizing_authority.ilike.%${query}%`)
          .limit(20);

        if (catalogError) {
          console.error('Error searching catalog:', catalogError);
        }

        // Search race_events
        const { data: eventResults, error: eventsError } = await supabase
          .from('race_events')
          .select('id, name, start_time, location, boat_class')
          .ilike('name', `%${query}%`)
          .limit(20);

        if (eventsError) {
          console.error('Error searching events:', eventsError);
        }

        // Map and combine results
        const mappedCatalog: UpcomingRace[] = (catalogResults || []).map((race: any) => ({
          id: race.id,
          name: race.name,
          start_date: race.typical_month ? `${race.typical_month} (Annual)` : 'TBD',
          venue_name: race.organizing_authority || race.country,
          class_name: undefined,
          status: 'catalog',
        }));

        const mappedEvents: UpcomingRace[] = (eventResults || []).map((race: any) => ({
          id: race.id,
          name: race.name,
          start_date: race.start_time,
          venue_name: race.location,
          class_name: race.boat_class,
          status: 'upcoming',
        }));

        setRaces([...mappedEvents, ...mappedCatalog].slice(0, 20));
      } catch (error) {
        console.error('Error searching races:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchRaces, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleToggleRace = useCallback((raceId: string) => {
    setSelectedRaces((prev) => {
      const next = new Set(prev);
      if (next.has(raceId)) {
        next.delete(raceId);
      } else {
        next.add(raceId);
      }
      return next;
    });
  }, []);

  const handleContinue = useCallback(async () => {
    // Save selected races
    const selected: RaceSelection[] = races
      .filter((r) => selectedRaces.has(r.id))
      .map((r) => ({
        id: r.id,
        name: r.name,
        startDate: r.start_date,
        venueName: r.venue_name,
      }));

    await OnboardingStateService.setSelectedRaces(selected);
    await OnboardingStateService.completeStep('find-races');

    router.push({
      pathname: '/onboarding/complete',
      params: { name: params.name, avatarUrl: params.avatarUrl },
    });
  }, [selectedRaces, races, router, params]);

  const handleSkip = useCallback(async () => {
    await OnboardingStateService.setSelectedRaces([]);
    await OnboardingStateService.completeStep('find-races');

    router.push({
      pathname: '/onboarding/complete',
      params: { name: params.name, avatarUrl: params.avatarUrl },
    });
  }, [router, params]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const formatDate = (dateStr: string) => {
    if (dateStr.includes('Annual') || dateStr === 'TBD') {
      return dateStr;
    }
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderRace = useCallback(
    ({ item }: { item: UpcomingRace }) => {
      const isSelected = selectedRaces.has(item.id);

      return (
        <TouchableOpacity
          style={[styles.raceCard, isSelected && styles.raceCardSelected]}
          onPress={() => handleToggleRace(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.raceIcon, isSelected && styles.raceIconSelected]}>
            <Ionicons
              name="calendar"
              size={22}
              color={isSelected ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <View style={styles.raceContent}>
            <Text style={[styles.raceName, isSelected && styles.raceNameSelected]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.raceMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                <Text style={styles.metaText}>{formatDate(item.start_date)}</Text>
              </View>
              {item.venue_name && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color="#94A3B8" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.venue_name}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedRaces, handleToggleRace]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>Step 5 of 5</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Add upcoming races</Text>
          <Text style={styles.subtitle}>
            Select races you're interested in. We'll help you prepare and track your progress.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search races..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && <ActivityIndicator size="small" color="#3B82F6" />}
            {!isSearching && searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected count */}
        {selectedRaces.size > 0 && (
          <View style={styles.selectedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.selectedText}>
              {selectedRaces.size} race{selectedRaces.size > 1 ? 's' : ''} selected
            </Text>
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding races for you...</Text>
          </View>
        ) : (
          <FlatList
            data={races}
            renderItem={renderRace}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              races.length > 0 ? (
                <Text style={styles.sectionTitle}>
                  {searchQuery ? 'Search Results' : 'Popular Races'}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No races found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'No upcoming races available'}
                </Text>
              </View>
            }
          />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {selectedRaces.size > 0 ? 'Continue' : 'Continue'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  spacer: {
    width: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
  },
  selectedText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  raceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  raceCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  raceIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  raceIconSelected: {
    backgroundColor: '#10B981',
  },
  raceContent: {
    flex: 1,
  },
  raceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  raceNameSelected: {
    color: '#065F46',
  },
  raceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
    maxWidth: 120,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingTop: 8,
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '500',
  },
});
