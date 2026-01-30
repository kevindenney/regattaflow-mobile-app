/**
 * Primary Fleet Selection Screen
 * User selects their primary racing fleet
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import {
  FleetDiscoveryService,
  type Fleet,
} from '@/services/FleetDiscoveryService';
import type { FleetSelection } from '@/types/onboarding';
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

export default function PrimaryFleetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [hasNoFleet, setHasNoFleet] = useState(false);

  // Load fleets based on selected boat class and club from preferences
  useEffect(() => {
    const loadFleets = async () => {
      setIsLoading(true);
      try {
        const preferences = await OnboardingStateService.getPreferences();
        const classId = preferences.boatClass?.id;
        const clubId = preferences.homeClub?.id;

        let results: Fleet[] = [];

        // Priority: fleets matching user's boat class
        if (classId) {
          results = await FleetDiscoveryService.discoverFleets(undefined, classId, 20);
        }

        // If no fleets found for class and user has a club, try club's fleets
        if (results.length === 0 && clubId) {
          results = await FleetDiscoveryService.discoverFleetsByClub(clubId, 20);
        }

        // Fallback: search for any public fleets
        if (results.length === 0) {
          results = await FleetDiscoveryService.searchFleets('', 20);
        }

        setFleets(results);
      } catch (error) {
        console.error('Error loading fleets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFleets();
  }, []);

  // Search fleets when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const searchFleets = async () => {
      setIsSearching(true);
      try {
        const results = await FleetDiscoveryService.searchFleets(searchQuery, 20);
        setFleets(results);
      } catch (error) {
        console.error('Error searching fleets:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchFleets, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = useCallback((fleet: Fleet) => {
    setSelectedFleet(fleet);
    setHasNoFleet(false);
  }, []);

  const handleNoFleet = useCallback(() => {
    setHasNoFleet(true);
    setSelectedFleet(null);
  }, []);

  const handleContinue = useCallback(async () => {
    if (hasNoFleet) {
      await OnboardingStateService.setPrimaryFleet(null);
    } else if (selectedFleet) {
      const selection: FleetSelection = {
        id: selectedFleet.id,
        name: selectedFleet.name,
        classId: selectedFleet.class_id,
        clubId: selectedFleet.club_id,
      };
      await OnboardingStateService.setPrimaryFleet(selection);
    }

    await OnboardingStateService.completeStep('primary-fleet');

    router.push({
      pathname: '/onboarding/find-races',
      params: { name: params.name, avatarUrl: params.avatarUrl },
    });
  }, [selectedFleet, hasNoFleet, router, params]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderFleet = useCallback(
    ({ item }: { item: Fleet }) => {
      const isSelected = selectedFleet?.id === item.id;
      const className = item.boat_classes?.name;
      const memberCount = item.member_count || 0;

      return (
        <TouchableOpacity
          style={[styles.fleetCard, isSelected && styles.fleetCardSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.fleetIcon, isSelected && styles.fleetIconSelected]}>
            <Ionicons
              name="people"
              size={22}
              color={isSelected ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <View style={styles.fleetContent}>
            <Text style={[styles.fleetName, isSelected && styles.fleetNameSelected]}>
              {item.name}
            </Text>
            <View style={styles.fleetMeta}>
              {className && (
                <View style={styles.metaItem}>
                  <Ionicons name="boat-outline" size={12} color="#94A3B8" />
                  <Text style={styles.metaText}>{className}</Text>
                </View>
              )}
              {item.region && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color="#94A3B8" />
                  <Text style={styles.metaText}>{item.region}</Text>
                </View>
              )}
            </View>
          </View>
          {memberCount > 0 && (
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>{memberCount}</Text>
              <Ionicons name="person" size={10} color="#64748B" />
            </View>
          )}
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedFleet, handleSelect]
  );

  const canContinue = selectedFleet !== null || hasNoFleet;

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
              <View style={[styles.progressFill, { width: '80%' }]} />
            </View>
            <Text style={styles.progressText}>Step 4 of 5</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Join your fleet</Text>
          <Text style={styles.subtitle}>
            Connect with other sailors in your class. See their races, share documents, and race
            together.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search fleets..."
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

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Finding fleets for you...</Text>
          </View>
        ) : (
          <FlatList
            data={fleets}
            renderItem={renderFleet}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              fleets.length > 0 ? (
                <Text style={styles.sectionTitle}>
                  {searchQuery ? 'Search Results' : 'Suggested Fleets'}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No fleets found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'We couldn\'t find fleets matching your boat class'}
                </Text>
              </View>
            }
          />
        )}

        {/* No fleet option */}
        <View style={styles.noFleetContainer}>
          <TouchableOpacity
            style={[styles.noFleetButton, hasNoFleet && styles.noFleetButtonSelected]}
            onPress={handleNoFleet}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasNoFleet ? 'checkbox' : 'square-outline'}
              size={22}
              color={hasNoFleet ? '#3B82F6' : '#64748B'}
            />
            <Text style={[styles.noFleetText, hasNoFleet && styles.noFleetTextSelected]}>
              I'll find a fleet later
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text
              style={[
                styles.continueButtonText,
                !canContinue && styles.continueButtonTextDisabled,
              ]}
            >
              Continue
            </Text>
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
    backgroundColor: '#3B82F6',
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
    marginBottom: 16,
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
  fleetCard: {
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
  fleetCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  fleetIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fleetIconSelected: {
    backgroundColor: '#3B82F6',
  },
  fleetContent: {
    flex: 1,
  },
  fleetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  fleetNameSelected: {
    color: '#1E40AF',
  },
  fleetMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  memberBadgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
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
    paddingHorizontal: 24,
  },
  noFleetContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  noFleetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  noFleetButtonSelected: {},
  noFleetText: {
    fontSize: 15,
    color: '#64748B',
  },
  noFleetTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingTop: 8,
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
  continueButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#94A3B8',
  },
});
