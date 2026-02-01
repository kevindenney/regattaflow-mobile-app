/**
 * Boat Picker Screen - Simplified Boat Class Selection
 * Single-purpose screen for selecting primary boat class
 */

import { OnboardingStateService } from '@/services/onboarding/OnboardingStateService';
import { useAllBoatClasses, type BrowseBoatClass } from '@/hooks/useAllBoatClasses';
import type { BoatClassSelection } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
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

export default function BoatPickerScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<BrowseBoatClass | null>(null);

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
  }, []);

  const handleContinue = useCallback(async () => {
    if (selectedClass) {
      const selection: BoatClassSelection = {
        id: selectedClass.id,
        name: selectedClass.name,
        type: selectedClass.type,
      };
      await OnboardingStateService.setBoatClass(selection);
    }
    await OnboardingStateService.completeStep('boat-class');
    router.push('/onboarding/personalize/location-permission');
  }, [selectedClass, router]);

  const handleSkip = useCallback(async () => {
    await OnboardingStateService.setBoatClass(null);
    await OnboardingStateService.completeStep('boat-class');
    router.push('/onboarding/personalize/location-permission');
  }, [router]);

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
            {item.type && <Text style={styles.classType}>{item.type}</Text>}
          </View>
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedClass, handleSelect]
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
            currentStep={5}
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
          <Text style={styles.title}>What do you sail?</Text>
          <Text style={styles.subtitle}>
            Select your boat class to see relevant races and connect with your fleet.
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
        </Animated.View>

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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No matching boat classes found</Text>
              </View>
            }
          />
        )}

        {/* Footer */}
        <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedClass && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedClass}
          >
            <Text
              style={[
                styles.continueButtonText,
                !selectedClass && styles.continueButtonTextDisabled,
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
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  classCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
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
  checkmark: {
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
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
