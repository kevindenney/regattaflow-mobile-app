import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { CoachRegistrationForm } from '../../../types/coach';

interface PersonalInfoStepProps {
  data: CoachRegistrationForm;
  updateData: (section: keyof CoachRegistrationForm, data: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  isLastStep: boolean;
}

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese (Mandarin)',
  'Chinese (Cantonese)',
  'Japanese',
  'Dutch',
];

export default function PersonalInfoStep({
  data,
  updateData,
  onNext,
  onBack,
  isLoading,
  isLastStep,
}: PersonalInfoStepProps) {
  const [personalInfo, setPersonalInfo] = useState(data.personal_info);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    updateData('personal_info', personalInfo);
  }, [personalInfo, updateData]);

  const updateField = (field: keyof typeof personalInfo, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleLanguage = (language: string) => {
    const currentLanguages = personalInfo.languages;
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];

    setPersonalInfo(prev => ({
      ...prev,
      languages: newLanguages,
    }));
  };

  const isFormValid = () => {
    return !!(
      personalInfo.first_name?.trim() &&
      personalInfo.last_name?.trim() &&
      personalInfo.location?.trim() &&
      personalInfo.time_zone &&
      personalInfo.bio?.trim() &&
      personalInfo.languages.length > 0
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>
          Tell us about yourself to help sailors find the right coach
        </Text>
      </View>

      <View style={styles.form}>
        {/* Name Fields */}
        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={personalInfo.first_name}
              onChangeText={(value) => updateField('first_name', value)}
              placeholder="John"
              autoCapitalize="words"
            />
          </View>

          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={personalInfo.last_name}
              onChangeText={(value) => updateField('last_name', value)}
              placeholder="Smith"
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, { opacity: 0.7 }]}
            value={personalInfo.email}
            editable={false}
            placeholder="john@example.com"
            keyboardType="email-address"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone (Optional)</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.phone || ''}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        {/* Location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={personalInfo.location}
            onChangeText={(value) => updateField('location', value)}
            placeholder="San Francisco, CA"
            autoCapitalize="words"
          />
          <Text style={styles.helpText}>
            City and country where you're based for coaching
          </Text>
        </View>

        {/* Timezone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Time Zone *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
          >
            <Text style={[styles.dropdownText, { color: personalInfo.time_zone ? '#1A1A1A' : '#999' }]}>
              {personalInfo.time_zone || 'Select your time zone'}
            </Text>
          </TouchableOpacity>

          {showTimezoneDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={styles.dropdownScroll}>
                {COMMON_TIMEZONES.map((timezone) => (
                  <TouchableOpacity
                    key={timezone}
                    style={styles.dropdownItem}
                    onPress={() => {
                      updateField('time_zone', timezone);
                      setShowTimezoneDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{timezone}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Languages */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Languages *</Text>
          <Text style={styles.helpText}>Select all languages you can coach in</Text>

          <View style={styles.chipContainer}>
            {COMMON_LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.chip,
                  personalInfo.languages.includes(language) && styles.chipSelected
                ]}
                onPress={() => toggleLanguage(language)}
              >
                <Text style={[
                  styles.chipText,
                  personalInfo.languages.includes(language) && styles.chipTextSelected
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Bio *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={personalInfo.bio}
            onChangeText={(value) => updateField('bio', value)}
            placeholder="Tell sailors about your sailing background, coaching philosophy, and what makes you unique as a coach..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>
            {personalInfo.bio?.length || 0}/500 characters
          </Text>
        </View>
      </View>

      {/* Validation Message */}
      {!isFormValid() && (
        <View style={styles.validationMessage}>
          <Text style={styles.validationText}>
            Please fill in all required fields (marked with *)
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    boxShadow: '0px 2px',
    elevation: 3,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  validationMessage: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEB9C',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  validationText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
});