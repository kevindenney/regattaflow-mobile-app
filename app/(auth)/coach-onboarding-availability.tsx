/**
 * Coach Onboarding - Availability (Step 3 of 5)
 *
 * Tufte-inspired design with clean iOS styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';

// Design tokens (consistent with other screens)
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
const CURRENT_STEP = 3;

const days = [
  { key: 'monday', label: 'M' },
  { key: 'tuesday', label: 'T' },
  { key: 'wednesday', label: 'W' },
  { key: 'thursday', label: 'T' },
  { key: 'friday', label: 'F' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'S' },
];

const timeSlots = [
  { key: 'morning', label: 'Morning', time: '6a-12p' },
  { key: 'afternoon', label: 'Afternoon', time: '12-6p' },
  { key: 'evening', label: 'Evening', time: '6-10p' },
];

const groupOptions = [
  { key: 'individual', label: 'Individual' },
  { key: 'smallGroup', label: 'Small (2-4)' },
  { key: 'largeGroup', label: 'Large (5+)' },
];

const CoachOnboardingAvailability = () => {
  const router = useRouter();
  const { state, updateAvailability, loading } = useCoachOnboardingState();

  const [availability, setAvailability] = useState<{ [key: string]: boolean }>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: false,
    friday: false,
    saturday: true,
    sunday: false,
  });

  const [selectedHours, setSelectedHours] = useState<{ [key: string]: boolean }>({
    morning: true,
    afternoon: true,
    evening: false,
  });

  const [inPersonCoaching, setInPersonCoaching] = useState(true);
  const [remoteCoaching, setRemoteCoaching] = useState(true);
  const [maxDistance, setMaxDistance] = useState(50);
  const [groupSizes, setGroupSizes] = useState<{ [key: string]: boolean }>({
    individual: true,
    smallGroup: true,
    largeGroup: false,
  });

  // Load saved state
  useEffect(() => {
    if (state.availability) {
      setAvailability({
        monday: state.availability.monday,
        tuesday: state.availability.tuesday,
        wednesday: state.availability.wednesday,
        thursday: state.availability.thursday,
        friday: state.availability.friday,
        saturday: state.availability.saturday,
        sunday: state.availability.sunday,
      });
      setSelectedHours({
        morning: state.availability.morning,
        afternoon: state.availability.afternoon,
        evening: state.availability.evening,
      });
      setInPersonCoaching(state.availability.locationPreference === 'in-person');
      setRemoteCoaching(state.availability.remoteCoaching);
      setMaxDistance(state.availability.maxDistance);
      setGroupSizes({
        individual: state.availability.individualSessions,
        smallGroup: state.availability.smallGroup,
        largeGroup: state.availability.largeGroup,
      });
    }
  }, [state.availability]);

  const toggleDay = (day: string) => {
    setAvailability({ ...availability, [day]: !availability[day] });
  };

  const toggleHour = (hour: string) => {
    setSelectedHours({ ...selectedHours, [hour]: !selectedHours[hour] });
  };

  const toggleGroupSize = (size: string) => {
    setGroupSizes({ ...groupSizes, [size]: !groupSizes[size] });
  };

  const isFormValid = () => {
    const hasDaySelected = Object.values(availability).some(day => day);
    const hasHourSelected = Object.values(selectedHours).some(hour => hour);
    const hasGroupSizeSelected = Object.values(groupSizes).some(size => size);
    const hasLocationSelected = inPersonCoaching || remoteCoaching;
    return hasDaySelected && hasHourSelected && hasGroupSizeSelected && hasLocationSelected;
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    updateAvailability({
      monday: availability.monday,
      tuesday: availability.tuesday,
      wednesday: availability.wednesday,
      thursday: availability.thursday,
      friday: availability.friday,
      saturday: availability.saturday,
      sunday: availability.sunday,
      morning: selectedHours.morning,
      afternoon: selectedHours.afternoon,
      evening: selectedHours.evening,
      locationPreference: inPersonCoaching ? 'in-person' : 'remote',
      remoteCoaching,
      maxDistance,
      individualSessions: groupSizes.individual,
      smallGroup: groupSizes.smallGroup,
      largeGroup: groupSizes.largeGroup,
    });

    router.push('/(auth)/coach-onboarding-pricing');
  };

  const handleCompleteLater = () => {
    updateAvailability({
      monday: availability.monday,
      tuesday: availability.tuesday,
      wednesday: availability.wednesday,
      thursday: availability.thursday,
      friday: availability.friday,
      saturday: availability.saturday,
      sunday: availability.sunday,
      morning: selectedHours.morning,
      afternoon: selectedHours.afternoon,
      evening: selectedHours.evening,
      locationPreference: inPersonCoaching ? 'in-person' : 'remote',
      remoteCoaching,
      maxDistance,
      individualSessions: groupSizes.individual,
      smallGroup: groupSizes.smallGroup,
      largeGroup: groupSizes.largeGroup,
    });

    router.replace('/(tabs)/coaching');
  };

  // Generate summary text
  const getSummaryText = () => {
    const selectedDays = Object.entries(availability)
      .filter(([_, selected]) => selected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');

    const selectedTimes = Object.entries(selectedHours)
      .filter(([_, selected]) => selected)
      .map(([time]) => time.charAt(0).toUpperCase() + time.slice(1))
      .join(', ');

    return `${selectedDays} · ${selectedTimes}`;
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
            <Ionicons name="calendar" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Availability</Text>
          <Text style={styles.heroSubtitle}>
            When can you coach?
          </Text>
        </View>

        {/* Days Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DAYS</Text>

          <View style={styles.daysRow}>
            {days.map((day) => {
              const isSelected = availability[day.key];
              return (
                <TouchableOpacity
                  key={day.key}
                  style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}
                  onPress={() => toggleDay(day.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Times Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIMES</Text>

          <View style={styles.chipGrid}>
            {timeSlots.map((slot) => {
              const isSelected = selectedHours[slot.key];
              return (
                <TouchableOpacity
                  key={slot.key}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => toggleHour(slot.key)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.chipIcon} />
                  )}
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                    {slot.label}
                  </Text>
                  <Text style={[styles.timeChipSubtext, isSelected && styles.timeChipSubtextSelected]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCATION</Text>

          <View style={styles.card}>
            {/* In-Person Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="location" size={20} color={COLORS.secondaryLabel} />
                <Text style={styles.toggleLabel}>In-person coaching</Text>
              </View>
              <Switch
                value={inPersonCoaching}
                onValueChange={setInPersonCoaching}
                trackColor={{ false: COLORS.unselected, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Distance Slider (only shown when in-person is enabled) */}
            {inPersonCoaching && (
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Travel distance</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setMaxDistance(Math.max(5, maxDistance - 5))}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '600', color: '#374151' }}>{'\u2212'}</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', minWidth: 80, textAlign: 'center' }}>
                    {maxDistance} km
                  </Text>
                  <TouchableOpacity
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => setMaxDistance(Math.min(100, maxDistance + 5))}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '600', color: '#374151' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputSeparator} />

            {/* Remote Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Ionicons name="videocam" size={20} color={COLORS.secondaryLabel} />
                <Text style={styles.toggleLabel}>Remote / video calls</Text>
              </View>
              <Switch
                value={remoteCoaching}
                onValueChange={setRemoteCoaching}
                trackColor={{ false: COLORS.unselected, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Group Size Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GROUP SIZE</Text>

          <View style={styles.chipGrid}>
            {groupOptions.map((option) => {
              const isSelected = groupSizes[option.key];
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.groupChip, isSelected && styles.groupChipSelected]}
                  onPress={() => toggleGroupSize(option.key)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.chipIcon} />
                  )}
                  <Text style={[styles.groupChipText, isSelected && styles.groupChipTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        {isFormValid() && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Schedule</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {getSummaryText()}
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
    marginBottom: 12,
    marginLeft: 4,
  },

  // Days
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipIcon: {
    marginRight: 6,
  },

  // Time Chips
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeChipText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  timeChipTextSelected: {
    color: '#FFFFFF',
  },
  timeChipSubtext: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginLeft: 6,
  },
  timeChipSubtextSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  // Group Chips
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  groupChipText: {
    fontSize: 15,
    color: COLORS.label,
  },
  groupChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 17,
    color: COLORS.label,
    marginLeft: 12,
  },

  // Slider
  sliderContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sliderLabel: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
  },

  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
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
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
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

export default CoachOnboardingAvailability;
