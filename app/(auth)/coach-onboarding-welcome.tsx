/**
 * Coach Onboarding - Welcome (Step 1 of 5)
 *
 * Tufte-inspired design with clean iOS styling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachOnboardingState } from '@/hooks/useCoachOnboardingState';
import { useAuth } from '@/providers/AuthProvider';

// Design tokens
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
const CURRENT_STEP = 1;

const experienceOptions = [
  { value: '1-2 years', label: '1-2 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '6-10 years', label: '6-10 years' },
  { value: '10-15 years', label: '10-15 years' },
  { value: '15+ years', label: '15+ years' },
  { value: 'Olympic/Professional Level', label: 'Olympic / Professional' },
];

const titleSuggestions = ['Head Coach', 'Performance Coach', 'Tactical Coach', 'Youth Coach', 'Race Coach'];
const orgSuggestions = ['Independent', 'Yacht Club', 'Sailing School', 'National Team'];
const languageOptions = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Cantonese', 'Portuguese', 'Italian'];

const CoachOnboardingWelcome = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { state, updateWelcome, loading } = useCoachOnboardingState();

  const [fullName, setFullName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [experience, setExperience] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);

  // Load saved state
  useEffect(() => {
    if (state.welcome) {
      setFullName(state.welcome.fullName);
      setProfessionalTitle(state.welcome.professionalTitle);
      setExperience(state.welcome.experience);
      setOrganization(state.welcome.organization || '');
      setPhone(state.welcome.phone || '');
      setSelectedLanguages(state.welcome.languages.length > 0 ? state.welcome.languages : ['English']);
    }
  }, [state.welcome]);

  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const isFormValid = () => {
    return (
      fullName.length >= 2 &&
      professionalTitle.length > 0 &&
      experience.length > 0 &&
      selectedLanguages.length > 0
    );
  };

  const handleContinue = () => {
    if (!isFormValid()) return;

    updateWelcome({
      fullName,
      professionalTitle,
      experience,
      organization: organization || undefined,
      phone: phone || undefined,
      languages: selectedLanguages,
    });

    router.push('/(auth)/coach-onboarding-expertise');
  };

  const handleCompleteLater = () => {
    if (fullName.length >= 2 || professionalTitle.length > 0) {
      updateWelcome({
        fullName,
        professionalTitle,
        experience,
        organization: organization || undefined,
        phone: phone || undefined,
        languages: selectedLanguages,
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
            <Ionicons name="school" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Welcome to Coaching</Text>
          <Text style={styles.heroSubtitle}>
            Tell us about yourself to create your coach profile
          </Text>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>

          <View style={styles.card}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your display name"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputSeparator} />

            {/* Professional Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Professional Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Head Coach, Tactical Coach"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={professionalTitle}
                onChangeText={setProfessionalTitle}
              />
              <View style={styles.chipRow}>
                {titleSuggestions.map((title) => (
                  <TouchableOpacity
                    key={title}
                    style={[
                      styles.chip,
                      professionalTitle === title && styles.chipSelected,
                    ]}
                    onPress={() => setProfessionalTitle(title)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        professionalTitle === title && styles.chipTextSelected,
                      ]}
                    >
                      {title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSeparator} />

            {/* Organization */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Organization <Text style={styles.optionalLabel}>(optional)</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="Club, school, or team"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={organization}
                onChangeText={setOrganization}
              />
              <View style={styles.chipRow}>
                {orgSuggestions.map((org) => (
                  <TouchableOpacity
                    key={org}
                    style={[
                      styles.chip,
                      organization === org && styles.chipSelected,
                    ]}
                    onPress={() => setOrganization(org)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        organization === org && styles.chipTextSelected,
                      ]}
                    >
                      {org}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COACHING EXPERIENCE</Text>

          <View style={styles.card}>
            {experienceOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioRow,
                  index < experienceOptions.length - 1 && styles.radioRowBorder,
                ]}
                onPress={() => setExperience(option.value)}
              >
                <Text style={styles.radioLabel}>{option.label}</Text>
                <View style={[styles.radio, experience === option.value && styles.radioSelected]}>
                  {experience === option.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{email}</Text>
                <Ionicons name="lock-closed" size={16} color={COLORS.tertiaryLabel} />
              </View>
            </View>

            <View style={styles.inputSeparator} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone <Text style={styles.optionalLabel}>(optional)</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Languages Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LANGUAGES</Text>
          <Text style={styles.sectionSubtitle}>Select all languages you can coach in</Text>

          <View style={styles.languageGrid}>
            {languageOptions.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.languageChip,
                  selectedLanguages.includes(language) && styles.languageChipSelected,
                ]}
                onPress={() => toggleLanguage(language)}
              >
                {selectedLanguages.includes(language) && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" style={styles.languageCheckIcon} />
                )}
                <Text
                  style={[
                    styles.languageChipText,
                    selectedLanguages.includes(language) && styles.languageChipTextSelected,
                  ]}
                >
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
    marginBottom: 8,
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

  // Input Group
  inputGroup: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginBottom: 8,
  },
  optionalLabel: {
    fontWeight: '400',
    color: COLORS.tertiaryLabel,
  },
  textInput: {
    fontSize: 17,
    color: COLORS.label,
    padding: 0,
    minHeight: 24,
  },
  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
  },

  // Read-only input
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    fontSize: 17,
    color: COLORS.tertiaryLabel,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Radio
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  radioRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  radioLabel: {
    fontSize: 17,
    color: COLORS.label,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  // Languages
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  languageChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageCheckIcon: {
    marginRight: 6,
  },
  languageChipText: {
    fontSize: 15,
    color: COLORS.label,
  },
  languageChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
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

export default CoachOnboardingWelcome;
