/**
 * Boat Class Selection Screen
 * User selects their primary boat class or indicates they don't have a boat
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { useAllBoatClasses, type BrowseBoatClass } from '@/hooks/useAllBoatClasses';
import type { BoatClassSelection } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
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

export default function BoatClassScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<BrowseBoatClass | null>(null);
  const [hasNoBoat, setHasNoBoat] = useState(false);

  const { classes, isLoading, error } = useAllBoatClasses({ limit: 50 });

  // Filter classes based on search
  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) {
      return classes;
    }
    const query = searchQuery.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.type && c.type.toLowerCase().includes(query))
    );
  }, [classes, searchQuery]);

  const handleSelect = useCallback((boatClass: BrowseBoatClass) => {
    setSelectedClass(boatClass);
    setHasNoBoat(false);
  }, []);

  const handleNoBoat = useCallback(() => {
    setHasNoBoat(true);
    setSelectedClass(null);
  }, []);

  const handleContinue = useCallback(async () => {
    if (hasNoBoat) {
      await OnboardingStateService.setBoatClass(null);
    } else if (selectedClass) {
      const selection: BoatClassSelection = {
        id: selectedClass.id,
        name: selectedClass.name,
        type: selectedClass.type,
      };
      await OnboardingStateService.setBoatClass(selection);
    }

    await OnboardingStateService.completeStep('boat-class');

    router.push({
      pathname: '/onboarding/home-club',
      params: { name: params.name, avatarUrl: params.avatarUrl },
    });
  }, [selectedClass, hasNoBoat, router, params]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderBoatClass = useCallback(
    ({ item }: { item: BrowseBoatClass }) => {
      const isSelected = selectedClass?.id === item.id;

      return (
        <TouchableOpacity
          style={[styles.classCard, isSelected && styles.classCardSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.classIcon, isSelected && styles.classIconSelected]}>
            <Ionicons
              name="boat"
              size={22}
              color={isSelected ? '#FFFFFF' : '#64748B'}
            />
          </View>
          <View style={styles.classContent}>
            <Text style={[styles.className, isSelected && styles.classNameSelected]}>
              {item.name}
            </Text>
            {item.type && (
              <Text style={styles.classType}>{item.type}</Text>
            )}
          </View>
          {item.fleetCount > 0 && (
            <View style={styles.fleetBadge}>
              <Text style={styles.fleetBadgeText}>{item.fleetCount} fleets</Text>
            </View>
          )}
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedClass, handleSelect]
  );

  const canContinue = selectedClass !== null || hasNoBoat;

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
              <View style={[styles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 5</Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>What do you sail?</Text>
          <Text style={styles.subtitle}>
            Select your primary boat class to see relevant fleets and races.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search boat classes..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
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
            <Text style={styles.loadingText}>Loading boat classes...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={32} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClasses}
            renderItem={renderBoatClass}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              filteredClasses.length > 0 ? (
                <Text style={styles.sectionTitle}>Popular Classes</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No matching boat classes found</Text>
              </View>
            }
          />
        )}

        {/* No boat option */}
        <View style={styles.noBoatContainer}>
          <TouchableOpacity
            style={[styles.noBoatButton, hasNoBoat && styles.noBoatButtonSelected]}
            onPress={handleNoBoat}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasNoBoat ? 'checkbox' : 'square-outline'}
              size={22}
              color={hasNoBoat ? '#3B82F6' : '#64748B'}
            />
            <Text style={[styles.noBoatText, hasNoBoat && styles.noBoatTextSelected]}>
              I don't have a boat yet
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
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
  classCard: {
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
  classCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  classIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classIconSelected: {
    backgroundColor: '#3B82F6',
  },
  classContent: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  classNameSelected: {
    color: '#1E40AF',
  },
  classType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  fleetBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  fleetBadgeText: {
    fontSize: 12,
    color: '#3B82F6',
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
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  noBoatContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  noBoatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  noBoatButtonSelected: {},
  noBoatText: {
    fontSize: 15,
    color: '#64748B',
  },
  noBoatTextSelected: {
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
