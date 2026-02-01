/**
 * Club Nearby Screen - Location-Aware Club Finder
 * Shows nearby clubs if location is available, otherwise search
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { ClubDiscoveryService, type YachtClub } from '@/services/ClubDiscoveryService';
import type { ClubSelection } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';

export default function ClubNearbyScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<YachtClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClub, setSelectedClub] = useState<YachtClub | null>(null);
  const [hasLocation, setHasLocation] = useState(false);

  // Load nearby or popular clubs
  useEffect(() => {
    const loadClubs = async () => {
      setIsLoading(true);
      try {
        // Check if we have location permission
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status === 'granted') {
          setHasLocation(true);
          // Get user's location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          // Search for nearby clubs
          const results = await ClubDiscoveryService.searchYachtClubs('', 20);
          // TODO: Sort by distance when location-based search is implemented
          setClubs(results);
        } else {
          // No location - load popular clubs
          const results = await ClubDiscoveryService.searchYachtClubs('', 20);
          setClubs(results);
        }
      } catch (error) {
        console.error('Error loading clubs:', error);
        // Fallback to loading some clubs
        try {
          const results = await ClubDiscoveryService.searchYachtClubs('', 20);
          setClubs(results);
        } catch {
          // Ignore secondary error
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadClubs();
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
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedClub) {
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
    router.push('/onboarding/personalize/find-sailors');
  }, [selectedClub, router]);

  const handleSkip = useCallback(async () => {
    await OnboardingStateService.setHomeClub(null);
    await OnboardingStateService.completeStep('home-club');
    router.push('/onboarding/personalize/find-sailors');
  }, [router]);

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
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedClub, handleSelect]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <OnboardingProgressDots
            currentStep={7}
            totalSteps={11}
            activeColor="#3B82F6"
            inactiveColor="#E2E8F0"
            completedColor="#93C5FD"
          />
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400).springify()}
          style={styles.titleContainer}
        >
          <Text style={styles.title}>
            {hasLocation ? 'Clubs Near You' : 'Find Your Club'}
          </Text>
          <Text style={styles.subtitle}>
            {hasLocation
              ? 'Join your home club to connect with fellow sailors.'
              : 'Search for your sailing club to join their community.'}
          </Text>
        </Animated.View>

        {/* Search */}
        <Animated.View
          entering={FadeIn.delay(200).duration(300)}
          style={styles.searchContainer}
        >
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
        </Animated.View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>
              {hasLocation ? 'Finding clubs near you...' : 'Loading clubs...'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={clubs}
            renderItem={renderClub}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedClub && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedClub}
          >
            <Text
              style={[
                styles.continueButtonText,
                !selectedClub && styles.continueButtonTextDisabled,
              ]}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  titleContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clubCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  clubIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
  checkmark: {
    marginLeft: 8,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    fontSize: 17,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#94A3B8',
  },
});
