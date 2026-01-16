/**
 * Coach Onboarding - Expertise (Step 2 of 5)
 *
 * Tufte-inspired design with clean iOS styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';

// Design tokens (consistent with welcome screen)
const COLORS = {
  primary: '#007AFF',
  primaryLight: '#E5F1FF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  separator: '#C6C6C8',
  success: '#34C759',
  selected: '#007AFF',
  selectedBg: '#007AFF',
  unselected: '#E5E5EA',
  border: '#D1D1D6',
};

const STEP_COUNT = 5;
const CURRENT_STEP = 2;

// Sailing-specific expertise areas
const expertiseOptions = [
  { id: 'match_racing', title: 'Match Racing', subtitle: 'One-on-one tactical racing' },
  { id: 'fleet_racing', title: 'Fleet Racing', subtitle: 'Multi-boat competition tactics' },
  { id: 'boat_handling', title: 'Boat Handling', subtitle: 'Sail trim and boat control' },
  { id: 'tactics', title: 'Racing Tactics', subtitle: 'Strategic race planning' },
  { id: 'speed_tuning', title: 'Speed & Tuning', subtitle: 'Boat speed optimization' },
  { id: 'starting', title: 'Starting Techniques', subtitle: 'Race start excellence' },
  { id: 'strategy', title: 'Race Strategy', subtitle: 'Course strategy & planning' },
  { id: 'offshore', title: 'Offshore Racing', subtitle: 'Long-distance racing' },
];

// Sailing class specialties
const specialtiesOptions = [
  { id: 'dragon', title: 'Dragon' },
  { id: 'melges', title: 'Melges' },
  { id: '470', title: '470' },
  { id: 'laser', title: 'Laser/ILCA' },
  { id: 'swan', title: 'Swan' },
  { id: 'j_boats', title: 'J/Boats' },
  { id: 'one_design', title: 'One-Design' },
  { id: 'grand_prix', title: 'Grand Prix' },
];

const CoachOnboardingExpertise = () => {
  const router = useRouter();
  const { state, updateExpertise, loading } = useCoachOnboardingState();

  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Load saved state
  useEffect(() => {
    if (state.expertise) {
      setSelectedExpertise(state.expertise.areas || []);
      setSelectedSpecialties(state.expertise.specialties || []);
    }
  }, [state.expertise]);

  const toggleExpertise = (id: string) => {
    setSelectedExpertise(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isFormValid = () => {
    return selectedExpertise.length > 0;
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    updateExpertise({
      areas: selectedExpertise,
      specialties: selectedSpecialties,
    });

    router.push('/(auth)/coach-onboarding-availability');
  };

  const handleCompleteLater = () => {
    if (selectedExpertise.length > 0 || selectedSpecialties.length > 0) {
      updateExpertise({
        areas: selectedExpertise,
        specialties: selectedSpecialties,
      });
    }
    router.replace('/(tabs)/coaching');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepIndicator}>Step {CURRENT_STEP} of {STEP_COUNT}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(CURRENT_STEP / STEP_COUNT) * 100}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="ribbon" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Expertise</Text>
          <Text style={styles.heroSubtitle}>
            What sailing areas do you specialize in?
          </Text>
        </View>

        {/* Coaching Focus Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COACHING FOCUS</Text>
          <Text style={styles.sectionSubtitle}>Select all areas you can coach</Text>

          <View style={styles.card}>
            {expertiseOptions.map((item, index) => {
              const isSelected = selectedExpertise.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.checkboxRow,
                    index < expertiseOptions.length - 1 && styles.checkboxRowBorder,
                  ]}
                  onPress={() => toggleExpertise(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkboxContent}>
                    <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelSelected]}>
                      {item.title}
                    </Text>
                    <Text style={styles.checkboxSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Boat Classes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BOAT CLASSES</Text>
          <Text style={styles.sectionSubtitle}>Which classes do you have experience coaching? (optional)</Text>

          <View style={styles.chipGrid}>
            {specialtiesOptions.map((item) => {
              const isSelected = selectedSpecialties.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.classChip,
                    isSelected && styles.classChipSelected,
                  ]}
                  onPress={() => toggleSpecialty(item.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.classChipIcon} />
                  )}
                  <Text style={[styles.classChipText, isSelected && styles.classChipTextSelected]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        {(selectedExpertise.length > 0 || selectedSpecialties.length > 0) && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected</Text>
              <Text style={styles.summaryValue}>
                {selectedExpertise.length} area{selectedExpertise.length !== 1 ? 's' : ''}
                {selectedSpecialties.length > 0 && (
                  <Text> · {selectedSpecialties.length} class{selectedSpecialties.length !== 1 ? 'es' : ''}</Text>
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isFormValid() && styles.continueButtonDisabled]}
          disabled={!isFormValid()}
          onPress={handleContinue}
        >
          <Text style={[styles.continueButtonText, !isFormValid() && styles.continueButtonTextDisabled]}>
            Continue
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={isFormValid() ? '#FFFFFF' : COLORS.tertiaryLabel}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterButton} onPress={handleCompleteLater}>
          <Text style={styles.laterButtonText}>Save & Complete Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerRight: {
    width: 44,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.unselected,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Checkbox Row
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkboxRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  checkboxContent: {
    flex: 1,
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 17,
    color: COLORS.label,
  },
  checkboxLabelSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  checkboxSubtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Class Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  classChipIcon: {
    marginRight: 6,
  },
  classChipText: {
    fontSize: 15,
    color: COLORS.label,
  },
  classChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Summary
  summaryContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.separator,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.unselected,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonTextDisabled: {
    color: COLORS.tertiaryLabel,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  laterButtonText: {
    fontSize: 15,
    color: COLORS.primary,
  },
});

export default CoachOnboardingExpertise;
