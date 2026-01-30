/**
 * Home Club Discovery Screen
 * User searches for and joins their home yacht club
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { ClubDiscoveryService, type YachtClub } from '@/services/ClubDiscoveryService';
import type { ClubSelection } from '@/types/onboarding';
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

export default function HomeClubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<YachtClub[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClub, setSelectedClub] = useState<YachtClub | null>(null);
  const [hasNoClub, setHasNoClub] = useState(false);

  // Load initial popular/nearby clubs
  useEffect(() => {
    const loadInitialClubs = async () => {
      setIsLoading(true);
      try {
        // For now, search with empty query to get some clubs
        const results = await ClubDiscoveryService.searchYachtClubs('', 20);
        setClubs(results);
      } catch (error) {
        console.error('Error loading clubs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialClubs();
  }, []);

  // Search clubs when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const searchClubs = async () => {
      setIsSearching(true);
      try {
        const results = await ClubDiscoveryService.searchYachtClubs(searchQuery, 20);
        setClubs(results);
      } catch (error) {
        console.error('Error searching clubs:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchClubs, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelect = useCallback((club: YachtClub) => {
    setSelectedClub(club);
    setHasNoClub(false);
  }, []);

  const handleNoClub = useCallback(() => {
    setHasNoClub(true);
    setSelectedClub(null);
  }, []);

  const handleContinue = useCallback(async () => {
    if (hasNoClub) {
      await OnboardingStateService.setHomeClub(null);
    } else if (selectedClub) {
      const selection: ClubSelection = {
        id: selectedClub.id,
        name: selectedClub.name,
        venueId: selectedClub.venue_id,
        venueName: selectedClub.sailing_venues?.name,
        region: selectedClub.sailing_venues?.region,
      };
      await OnboardingStateService.setHomeClub(selection);
    }

    await OnboardingStateService.completeStep('home-club');

    router.push({
      pathname: '/onboarding/primary-fleet',
      params: { name: params.name, avatarUrl: params.avatarUrl },
    });
  }, [selectedClub, hasNoClub, router, params]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderClub = useCallback(
    ({ item }: { item: YachtClub }) => {
      const isSelected = selectedClub?.id === item.id;
      const location =
        item.sailing_venues?.name ||
        item.sailing_venues?.region ||
        item.sailing_venues?.country;

      return (
        <TouchableOpacity
          style={[styles.clubCard, isSelected && styles.clubCardSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.clubIcon, isSelected && styles.clubIconSelected]}>
            <Ionicons
              name="flag"
              size={22}
              color={isSelected ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <View style={styles.clubContent}>
            <Text style={[styles.clubName, isSelected && styles.clubNameSelected]}>
              {item.name}
            </Text>
            {location && <Text style={styles.clubLocation}>{location}</Text>}
          </View>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedClub, handleSelect]
  );

  const canContinue = selectedClub !== null || hasNoClub;

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
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.progressText}>Step 3 of 5</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Where do you sail?</Text>
          <Text style={styles.subtitle}>
            Join your home club to discover their races and connect with other members.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search yacht clubs..."
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
            <Text style={styles.loadingText}>Loading clubs...</Text>
          </View>
        ) : (
          <FlatList
            data={clubs}
            renderItem={renderClub}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              clubs.length > 0 && !searchQuery ? (
                <Text style={styles.sectionTitle}>Popular Clubs</Text>
              ) : searchQuery && clubs.length > 0 ? (
                <Text style={styles.sectionTitle}>Search Results</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No clubs found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Start typing to search for your club'}
                </Text>
              </View>
            }
          />
        )}

        {/* No club option */}
        <View style={styles.noClubContainer}>
          <TouchableOpacity
            style={[styles.noClubButton, hasNoClub && styles.noClubButtonSelected]}
            onPress={handleNoClub}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasNoClub ? 'checkbox' : 'square-outline'}
              size={22}
              color={hasNoClub ? '#3B82F6' : '#64748B'}
            />
            <Text style={[styles.noClubText, hasNoClub && styles.noClubTextSelected]}>
              I don't belong to a club
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
  clubCard: {
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
  clubCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  clubIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clubIconSelected: {
    backgroundColor: '#3B82F6',
  },
  clubContent: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  clubNameSelected: {
    color: '#1E40AF',
  },
  clubLocation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
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
  },
  noClubContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  noClubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  noClubButtonSelected: {},
  noClubText: {
    fontSize: 15,
    color: '#64748B',
  },
  noClubTextSelected: {
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
