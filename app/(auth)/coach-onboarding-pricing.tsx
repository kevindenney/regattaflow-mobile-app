/**
 * Coach Onboarding - Pricing (Step 4 of 5)
 *
 * Tufte-inspired design with clean iOS styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
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
const CURRENT_STEP = 4;
const PLATFORM_FEE = 0.15; // 15% platform fee

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '\u20AC' },
  { code: 'GBP', symbol: '\u00A3' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'AUD', symbol: 'A$' },
];

const sessionDurations = [
  { value: '30', label: '30 min' },
  { value: '60', label: '60 min' },
  { value: '90', label: '90 min' },
  { value: '120', label: '2 hours' },
];

const CoachOnboardingPricing = () => {
  const router = useRouter();
  const { state, updatePricing, loading } = useCoachOnboardingState();

  const [pricingModel, setPricingModel] = useState<'hourly' | 'packages'>('hourly');
  const [hourlyRate, setHourlyRate] = useState('');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [currency, setCurrency] = useState('USD');
  const [packagePrices, setPackagePrices] = useState({
    single: '',
    five: '',
    ten: '',
  });

  // Load saved state
  useEffect(() => {
    if (state.pricing) {
      setPricingModel(state.pricing.pricingModel);
      setCurrency(state.pricing.currency);
      setHourlyRate(state.pricing.hourlyRate || '');
      setSessionDuration(state.pricing.sessionDuration || '60');
      if (state.pricing.packagePrices) {
        setPackagePrices(state.pricing.packagePrices);
      }
    }
  }, [state.pricing]);

  const updatePackagePrice = (key: string, value: string) => {
    setPackagePrices({ ...packagePrices, [key]: value });
  };

  const isFormValid = () => {
    if (pricingModel === 'hourly') {
      return hourlyRate.length > 0 && !isNaN(parseFloat(hourlyRate));
    }
    return Object.values(packagePrices).every(
      price => price.length > 0 && !isNaN(parseFloat(price))
    );
  };

  const getSelectedCurrency = () => {
    return currencies.find(c => c.code === currency) || currencies[0];
  };

  const getNetRate = () => {
    const rate = parseFloat(hourlyRate) || 0;
    return (rate * (1 - PLATFORM_FEE)).toFixed(0);
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    updatePricing({
      pricingModel,
      currency,
      hourlyRate: pricingModel === 'hourly' ? hourlyRate : undefined,
      sessionDuration: pricingModel === 'hourly' ? sessionDuration : undefined,
      packagePrices: pricingModel === 'packages' ? packagePrices : undefined,
    });

    router.push('/(auth)/coach-onboarding-payment-setup');
  };

  const handleCompleteLater = () => {
    updatePricing({
      pricingModel,
      currency,
      hourlyRate: pricingModel === 'hourly' ? hourlyRate : undefined,
      sessionDuration: pricingModel === 'hourly' ? sessionDuration : undefined,
      packagePrices: pricingModel === 'packages' ? packagePrices : undefined,
    });

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="cash" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Pricing</Text>
          <Text style={styles.heroSubtitle}>
            How much do you charge?
          </Text>
        </View>

        {/* Rate Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RATE TYPE</Text>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, pricingModel === 'hourly' && styles.segmentSelected]}
              onPress={() => setPricingModel('hourly')}
            >
              <Text style={[styles.segmentText, pricingModel === 'hourly' && styles.segmentTextSelected]}>
                Hourly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, pricingModel === 'packages' && styles.segmentSelected]}
              onPress={() => setPricingModel('packages')}
            >
              <Text style={[styles.segmentText, pricingModel === 'packages' && styles.segmentTextSelected]}>
                Package
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hourly Rate Section */}
        {pricingModel === 'hourly' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HOURLY RATE</Text>

              <View style={styles.card}>
                <View style={styles.rateInputRow}>
                  <Text style={styles.currencySymbol}>{getSelectedCurrency().symbol}</Text>
                  <TextInput
                    style={styles.rateInput}
                    placeholder="100"
                    placeholderTextColor={COLORS.tertiaryLabel}
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    keyboardType="numeric"
                  />
                  <Text style={styles.perHour}>/hour</Text>
                  <View style={styles.currencyPicker}>
                    <Text style={styles.currencyCode}>{currency}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.tertiaryLabel} />
                  </View>
                </View>
              </View>

              {/* Currency Selection */}
              <View style={styles.chipGrid}>
                {currencies.map((curr) => {
                  const isSelected = currency === curr.code;
                  return (
                    <TouchableOpacity
                      key={curr.code}
                      style={[styles.currencyChip, isSelected && styles.currencyChipSelected]}
                      onPress={() => setCurrency(curr.code)}
                    >
                      <Text style={[styles.currencyChipText, isSelected && styles.currencyChipTextSelected]}>
                        {curr.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SESSION LENGTH</Text>

              <View style={styles.chipGrid}>
                {sessionDurations.map((duration) => {
                  const isSelected = sessionDuration === duration.value;
                  return (
                    <TouchableOpacity
                      key={duration.value}
                      style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                      onPress={() => setSessionDuration(duration.value)}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.chipIcon} />
                      )}
                      <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                        {duration.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Net Earnings Info */}
            {hourlyRate && (
              <View style={styles.earningsCard}>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>After 15% platform fee</Text>
                  <Text style={styles.earningsValue}>
                    {getSelectedCurrency().symbol}{getNetRate()}/hr net
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Package Pricing Section */}
        {pricingModel === 'packages' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PACKAGE PRICES</Text>
            <Text style={styles.sectionSubtitle}>Set prices for session bundles</Text>

            <View style={styles.card}>
              {/* Single Session */}
              <View style={styles.packageRow}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageLabel}>Single Session</Text>
                  <Text style={styles.packageDesc}>Pay per session</Text>
                </View>
                <View style={styles.packageInput}>
                  <Text style={styles.packageCurrency}>{getSelectedCurrency().symbol}</Text>
                  <TextInput
                    style={styles.packageValue}
                    placeholder="100"
                    placeholderTextColor={COLORS.tertiaryLabel}
                    value={packagePrices.single}
                    onChangeText={(text) => updatePackagePrice('single', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputSeparator} />

              {/* 5 Sessions */}
              <View style={styles.packageRow}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageLabel}>5 Sessions</Text>
                  <Text style={styles.packageDesc}>Save 10%</Text>
                </View>
                <View style={styles.packageInput}>
                  <Text style={styles.packageCurrency}>{getSelectedCurrency().symbol}</Text>
                  <TextInput
                    style={styles.packageValue}
                    placeholder="450"
                    placeholderTextColor={COLORS.tertiaryLabel}
                    value={packagePrices.five}
                    onChangeText={(text) => updatePackagePrice('five', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputSeparator} />

              {/* 10 Sessions */}
              <View style={styles.packageRow}>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageLabel}>10 Sessions</Text>
                  <Text style={styles.packageDesc}>Save 20%</Text>
                </View>
                <View style={styles.packageInput}>
                  <Text style={styles.packageCurrency}>{getSelectedCurrency().symbol}</Text>
                  <TextInput
                    style={styles.packageValue}
                    placeholder="800"
                    placeholderTextColor={COLORS.tertiaryLabel}
                    value={packagePrices.ten}
                    onChangeText={(text) => updatePackagePrice('ten', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Currency Selection for Packages */}
            <View style={[styles.chipGrid, { marginTop: 16 }]}>
              {currencies.map((curr) => {
                const isSelected = currency === curr.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.currencyChip, isSelected && styles.currencyChipSelected]}
                    onPress={() => setCurrency(curr.code)}
                  >
                    <Text style={[styles.currencyChipText, isSelected && styles.currencyChipTextSelected]}>
                      {curr.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
    </KeyboardAvoidingView>
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
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: -8,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.unselected,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentSelected: {
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  segmentTextSelected: {
    color: COLORS.label,
    fontWeight: '600',
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Rate Input
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.label,
    marginRight: 4,
  },
  rateInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.label,
    padding: 0,
    minHeight: 40,
  },
  perHour: {
    fontSize: 17,
    color: COLORS.secondaryLabel,
    marginLeft: 4,
  },
  currencyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  currencyCode: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    marginRight: 4,
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  chipIcon: {
    marginRight: 6,
  },

  // Currency Chips
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currencyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.label,
  },
  currencyChipTextSelected: {
    color: '#FFFFFF',
  },

  // Duration Chips
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: 15,
    color: COLORS.label,
  },
  durationChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Earnings Card
  earningsCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  earningsValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Package Row
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageLabel: {
    fontSize: 17,
    color: COLORS.label,
  },
  packageDesc: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  packageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  packageCurrency: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginRight: 4,
  },
  packageValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    minWidth: 60,
    textAlign: 'right',
    padding: 0,
  },

  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
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

export default CoachOnboardingPricing;
