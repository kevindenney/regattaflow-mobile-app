/**
 * Coach Profile Editor
 *
 * Comprehensive profile editing for coaches including:
 * - Bio and professional info
 * - Specialties and expertise
 * - Languages and certifications
 * - Teaching modalities
 * - Marketplace visibility
 * - Profile preview
 */

import { coachingService } from '@/services/CoachingService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
import { useCoachWorkspace } from '@/hooks/useCoachWorkspace';
import * as ImagePicker from 'expo-image-picker';

// ============================================================================
// Constants - Options matching onboarding
// ============================================================================

const SPECIALTY_OPTIONS = [
  { id: 'match_racing', label: 'Match Racing', description: 'One-on-one tactical racing' },
  { id: 'fleet_racing', label: 'Fleet Racing', description: 'Multi-boat competition tactics' },
  { id: 'boat_handling', label: 'Boat Handling', description: 'Sail trim and boat control' },
  { id: 'racing_tactics', label: 'Racing Tactics', description: 'Strategic race planning' },
  { id: 'speed_tuning', label: 'Speed & Tuning', description: 'Boat speed optimization' },
  { id: 'starting', label: 'Starting Techniques', description: 'Race start excellence' },
  { id: 'race_strategy', label: 'Race Strategy', description: 'Course strategy & planning' },
  { id: 'offshore', label: 'Offshore Racing', description: 'Long-distance racing' },
];

const EXPERIENCE_LEVELS = [
  { id: '1-2', label: '1-2 years' },
  { id: '3-5', label: '3-5 years' },
  { id: '6-10', label: '6-10 years' },
  { id: '10-15', label: '10-15 years' },
  { id: '15+', label: '15+ years' },
  { id: 'olympic', label: 'Olympic/Professional Level' },
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Mandarin',
  'Cantonese', 'Portuguese', 'Italian', 'Japanese', 'Korean',
];

const BOAT_CLASS_OPTIONS = [
  'Dragon', 'Melges', '470', 'Laser/ILCA', 'Swan', 'J/Boats',
  'One-Design', 'Grand Prix', 'Optimist', 'RS Feva', '49er',
  'Nacra 17', 'Finn', 'Star', 'Etchells', 'Farr 40',
];

const TEACHING_MODALITY_OPTIONS = [
  { id: 'on_water', label: 'On-Water Coaching', icon: 'boat-outline' },
  { id: 'video_review', label: 'Video Analysis', icon: 'videocam-outline' },
  { id: 'remote', label: 'Remote/Online', icon: 'laptop-outline' },
  { id: 'strategy', label: 'Strategy Sessions', icon: 'analytics-outline' },
  { id: 'boat_setup', label: 'Boat Setup', icon: 'build-outline' },
  { id: 'fitness', label: 'Fitness Training', icon: 'fitness-outline' },
];

const PROFESSIONAL_TITLE_SUGGESTIONS = [
  'Head Coach',
  'Performance Coach',
  'Tactical Coach',
  'Youth Coach',
  'Race Coach',
  'Olympic Coach',
  'Sailing Instructor',
];

// ============================================================================
// Types
// ============================================================================

interface CoachProfileData {
  id: string;
  displayName: string;
  profilePhotoUrl: string | null;
  bio: string | null;
  professionalTitle: string | null;
  specializations: string[];
  experienceYears: number | null;
  languages: string[];
  certifications: string[];
  boatClasses: string[];
  teachingModalities: string[];
  marketplaceVisible: boolean;
  isActive: boolean;
  hourlyRate: number | null;
  currency: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProfileEditScreen() {
  const router = useRouter();
  const { coachId, loading: workspaceLoading } = useCoachWorkspace();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [boatClasses, setBoatClasses] = useState<string[]>([]);
  const [teachingModalities, setTeachingModalities] = useState<string[]>(['on_water']);
  const [marketplaceVisible, setMarketplaceVisible] = useState(true);

  // New certification input
  const [newCertification, setNewCertification] = useState('');

  // Validation error
  const [displayNameError, setDisplayNameError] = useState('');

  // ============================================================================
  // Load Profile
  // ============================================================================

  useEffect(() => {
    if (coachId) {
      loadProfile();
    }
  }, [coachId]);

  const loadProfile = async () => {
    if (!coachId) return;

    try {
      setLoading(true);
      const profile = await coachingService.getCoachProfileForEdit(coachId);

      if (profile) {
        setDisplayName(profile.displayName || '');
        setProfilePhotoUrl(profile.profilePhotoUrl);
        setBio(profile.bio || '');
        setProfessionalTitle(profile.professionalTitle || '');
        setSpecializations(profile.specializations || []);
        setLanguages(profile.languages || ['English']);
        setCertifications(profile.certifications || []);
        setBoatClasses(profile.boatClasses || []);
        setTeachingModalities(profile.teachingModalities || ['on_water']);
        setMarketplaceVisible(profile.marketplaceVisible);

        // Map experience years to level
        if (profile.experienceYears) {
          if (profile.experienceYears >= 15) setExperienceLevel('15+');
          else if (profile.experienceYears >= 10) setExperienceLevel('10-15');
          else if (profile.experienceYears >= 6) setExperienceLevel('6-10');
          else if (profile.experienceYears >= 3) setExperienceLevel('3-5');
          else setExperienceLevel('1-2');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showAlert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const markChanged = () => setHasChanges(true);

  const toggleSpecialization = (id: string) => {
    setSpecializations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    markChanged();
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
    markChanged();
  };

  const toggleBoatClass = (boatClass: string) => {
    setBoatClasses((prev) =>
      prev.includes(boatClass) ? prev.filter((b) => b !== boatClass) : [...prev, boatClass]
    );
    markChanged();
  };

  const toggleModality = (id: string) => {
    setTeachingModalities((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    markChanged();
  };

  const addCertification = () => {
    const cert = newCertification.trim();
    if (cert && !certifications.includes(cert)) {
      setCertifications((prev) => [...prev, cert]);
      setNewCertification('');
      markChanged();
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications((prev) => prev.filter((c) => c !== cert));
    markChanged();
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Upload the image
      const uploadResult = await coachingService.uploadProfilePhoto(coachId!, result.assets[0].uri);
      if (uploadResult.url) {
        setProfilePhotoUrl(uploadResult.url);
        markChanged();
      } else {
        showAlert('Upload Failed', uploadResult.error || 'Could not upload image');
      }
    }
  };

  const getExperienceYears = (): number | undefined => {
    switch (experienceLevel) {
      case '1-2': return 2;
      case '3-5': return 5;
      case '6-10': return 8;
      case '10-15': return 12;
      case '15+': return 20;
      case 'olympic': return 25;
      default: return undefined;
    }
  };

  const handleSave = async () => {
    if (!coachId) return;

    // Validate required fields
    if (!displayName.trim()) {
      setDisplayNameError('Display name is required');
      return;
    }

    setDisplayNameError('');
    setSaving(true);

    try {
      const result = await coachingService.updateCoachProfileFull(coachId, {
        displayName: displayName.trim(),
        profilePhotoUrl,
        bio: bio.trim(),
        professionalTitle: professionalTitle.trim(),
        specializations,
        experienceYears: getExperienceYears(),
        languages,
        certifications,
        boatClasses,
        teachingModalities,
        marketplaceVisible,
      });

      if (!result.success) {
        showAlert('Error', result.error || 'Failed to save profile');
        return;
      }

      setHasChanges(false);
      showAlert('Profile Updated', 'Your profile has been saved successfully.');
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        () => router.back(),
        { destructive: true, confirmText: 'Leave' }
      );
    } else {
      router.back();
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (workspaceLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!coachId) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#94A3B8" />
        <Text style={[styles.loadingText, { marginTop: 12, fontSize: 17, fontWeight: '600', color: '#0F172A' }]}>
          Coach profile not found
        </Text>
        <Text style={[styles.loadingText, { textAlign: 'center', paddingHorizontal: 32 }]}>
          Your coach workspace could not be loaded. Try again or complete onboarding first.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 16, backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your coach profile</Text>
          </View>
          <TouchableOpacity onPress={() => setShowPreview(true)} style={styles.previewButton}>
            <Ionicons name="eye-outline" size={20} color="#4F46E5" />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickImage} style={styles.photoContainer}>
            {profilePhotoUrl ? (
              <Image source={{ uri: profilePhotoUrl }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color="#94A3B8" />
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change photo</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name *</Text>
            <TextInput
              style={[styles.textInput, displayNameError ? styles.textInputError : null]}
              value={displayName}
              onChangeText={(v) => {
                setDisplayName(v);
                markChanged();
                if (displayNameError) setDisplayNameError('');
              }}
              placeholder="Your name as shown to sailors"
            />
            {displayNameError ? (
              <Text style={styles.fieldError}>{displayNameError}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Professional Title</Text>
            <TextInput
              style={styles.textInput}
              value={professionalTitle}
              onChangeText={(v) => { setProfessionalTitle(v); markChanged(); }}
              placeholder="e.g., Head Coach, Performance Coach"
            />
            <View style={styles.suggestionChips}>
              {PROFESSIONAL_TITLE_SUGGESTIONS.slice(0, 4).map((title) => (
                <TouchableOpacity
                  key={title}
                  style={styles.suggestionChip}
                  onPress={() => { setProfessionalTitle(title); markChanged(); }}
                >
                  <Text style={styles.suggestionChipText}>{title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bio / About Me</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={bio}
              onChangeText={(v) => { setBio(v); markChanged(); }}
              placeholder="Tell sailors about yourself, your coaching philosophy, and experience..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <View style={styles.optionGrid}>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.optionChip,
                  experienceLevel === level.id && styles.optionChipSelected,
                ]}
                onPress={() => { setExperienceLevel(level.id); markChanged(); }}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    experienceLevel === level.id && styles.optionChipTextSelected,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coaching Specialties</Text>
          <Text style={styles.sectionSubtitle}>Select all areas you specialize in</Text>
          <View style={styles.specialtyGrid}>
            {SPECIALTY_OPTIONS.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                style={[
                  styles.specialtyCard,
                  specializations.includes(specialty.id) && styles.specialtyCardSelected,
                ]}
                onPress={() => toggleSpecialization(specialty.id)}
              >
                {specializations.includes(specialty.id) && (
                  <Ionicons name="checkmark-circle" size={20} color="#4F46E5" style={styles.specialtyCheck} />
                )}
                <Text
                  style={[
                    styles.specialtyLabel,
                    specializations.includes(specialty.id) && styles.specialtyLabelSelected,
                  ]}
                >
                  {specialty.label}
                </Text>
                <Text style={styles.specialtyDescription}>{specialty.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages Spoken</Text>
          <View style={styles.optionGrid}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.optionChip,
                  languages.includes(lang) && styles.optionChipSelected,
                ]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    languages.includes(lang) && styles.optionChipTextSelected,
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Boat Classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boat Classes</Text>
          <Text style={styles.sectionSubtitle}>Which boat classes do you coach?</Text>
          <View style={styles.optionGrid}>
            {BOAT_CLASS_OPTIONS.map((boatClass) => (
              <TouchableOpacity
                key={boatClass}
                style={[
                  styles.optionChip,
                  boatClasses.includes(boatClass) && styles.optionChipSelected,
                ]}
                onPress={() => toggleBoatClass(boatClass)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    boatClasses.includes(boatClass) && styles.optionChipTextSelected,
                  ]}
                >
                  {boatClass}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Teaching Modalities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teaching Methods</Text>
          <Text style={styles.sectionSubtitle}>How do you deliver coaching?</Text>
          <View style={styles.modalityGrid}>
            {TEACHING_MODALITY_OPTIONS.map((modality) => (
              <TouchableOpacity
                key={modality.id}
                style={[
                  styles.modalityCard,
                  teachingModalities.includes(modality.id) && styles.modalityCardSelected,
                ]}
                onPress={() => toggleModality(modality.id)}
              >
                <Ionicons
                  name={modality.icon as any}
                  size={24}
                  color={teachingModalities.includes(modality.id) ? '#4F46E5' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modalityLabel,
                    teachingModalities.includes(modality.id) && styles.modalityLabelSelected,
                  ]}
                >
                  {modality.label}
                </Text>
                {teachingModalities.includes(modality.id) && (
                  <Ionicons name="checkmark-circle" size={18} color="#4F46E5" style={styles.modalityCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          <Text style={styles.sectionSubtitle}>Add your coaching certifications</Text>

          <View style={styles.certInputRow}>
            <TextInput
              style={[styles.textInput, styles.certInput]}
              value={newCertification}
              onChangeText={setNewCertification}
              placeholder="e.g., US Sailing Level 3"
              onSubmitEditing={addCertification}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCertification}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {certifications.length > 0 && (
            <View style={styles.certList}>
              {certifications.map((cert, index) => (
                <View key={index} style={styles.certItem}>
                  <Ionicons name="ribbon-outline" size={18} color="#059669" />
                  <Text style={styles.certText}>{cert}</Text>
                  <TouchableOpacity onPress={() => removeCertification(cert)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Marketplace Visibility */}
        <View style={styles.section}>
          <View style={styles.visibilityHeader}>
            <View style={styles.visibilityInfo}>
              <Text style={styles.sectionTitle}>Marketplace Visibility</Text>
              <Text style={styles.sectionSubtitle}>
                Control whether new sailors can find you in search results
              </Text>
            </View>
            <Switch
              value={marketplaceVisible}
              onValueChange={(v) => { setMarketplaceVisible(v); markChanged(); }}
              trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
              thumbColor={marketplaceVisible ? '#4F46E5' : '#94A3B8'}
            />
          </View>

          <View style={[
            styles.visibilityStatus,
            marketplaceVisible ? styles.visibilityOn : styles.visibilityOff,
          ]}>
            <Ionicons
              name={marketplaceVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={marketplaceVisible ? '#059669' : '#DC2626'}
            />
            <Text style={[
              styles.visibilityStatusText,
              marketplaceVisible ? styles.visibilityStatusOn : styles.visibilityStatusOff,
            ]}>
              {marketplaceVisible
                ? 'Your profile is visible to all sailors'
                : 'Only existing clients can find and book you'}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.submitBar}>
        <TouchableOpacity
          style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Profile Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <ProfilePreview
          displayName={displayName}
          profilePhotoUrl={profilePhotoUrl}
          bio={bio}
          professionalTitle={professionalTitle}
          specializations={specializations}
          experienceLevel={experienceLevel}
          languages={languages}
          certifications={certifications}
          boatClasses={boatClasses}
          teachingModalities={teachingModalities}
          onClose={() => setShowPreview(false)}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// Profile Preview Component
// ============================================================================

function ProfilePreview({
  displayName,
  profilePhotoUrl,
  bio,
  professionalTitle,
  specializations,
  experienceLevel,
  languages,
  certifications,
  boatClasses,
  teachingModalities,
  onClose,
}: {
  displayName: string;
  profilePhotoUrl: string | null;
  bio: string;
  professionalTitle: string;
  specializations: string[];
  experienceLevel: string;
  languages: string[];
  certifications: string[];
  boatClasses: string[];
  teachingModalities: string[];
  onClose: () => void;
}) {
  const getSpecialtyLabel = (id: string) => {
    return SPECIALTY_OPTIONS.find((s) => s.id === id)?.label || id;
  };

  const getModalityLabel = (id: string) => {
    return TEACHING_MODALITY_OPTIONS.find((m) => m.id === id)?.label || id;
  };

  const getExperienceLabel = () => {
    return EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label || experienceLevel;
  };

  return (
    <View style={previewStyles.container}>
      {/* Header */}
      <View style={previewStyles.header}>
        <TouchableOpacity onPress={onClose} style={previewStyles.closeButton}>
          <Ionicons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={previewStyles.headerTitle}>Profile Preview</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={previewStyles.content}>
        {/* This is what sailors see */}
        <View style={previewStyles.previewBanner}>
          <Ionicons name="eye-outline" size={16} color="#4F46E5" />
          <Text style={previewStyles.previewBannerText}>
            This is how sailors see your profile
          </Text>
        </View>

        {/* Profile Header */}
        <View style={previewStyles.profileHeader}>
          {profilePhotoUrl ? (
            <Image source={{ uri: profilePhotoUrl }} style={previewStyles.photo} />
          ) : (
            <View style={previewStyles.photoPlaceholder}>
              <Ionicons name="person" size={48} color="#94A3B8" />
            </View>
          )}
          <Text style={previewStyles.name}>{displayName || 'Your Name'}</Text>
          {professionalTitle && (
            <Text style={previewStyles.title}>{professionalTitle}</Text>
          )}
          {experienceLevel && (
            <View style={previewStyles.experienceBadge}>
              <Ionicons name="trophy-outline" size={14} color="#F59E0B" />
              <Text style={previewStyles.experienceText}>{getExperienceLabel()}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {bio && (
          <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>About</Text>
            <Text style={previewStyles.bioText}>{bio}</Text>
          </View>
        )}

        {/* Specialties */}
        {specializations.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>Specialties</Text>
            <View style={previewStyles.chipRow}>
              {specializations.map((s) => (
                <View key={s} style={previewStyles.chip}>
                  <Text style={previewStyles.chipText}>{getSpecialtyLabel(s)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Boat Classes */}
        {boatClasses.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>Boat Classes</Text>
            <View style={previewStyles.chipRow}>
              {boatClasses.map((b) => (
                <View key={b} style={[previewStyles.chip, previewStyles.chipBoat]}>
                  <Ionicons name="boat-outline" size={12} color="#0EA5E9" />
                  <Text style={[previewStyles.chipText, { color: '#0EA5E9' }]}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Teaching Methods */}
        {teachingModalities.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>Teaching Methods</Text>
            <View style={previewStyles.chipRow}>
              {teachingModalities.map((m) => (
                <View key={m} style={[previewStyles.chip, previewStyles.chipModality]}>
                  <Text style={[previewStyles.chipText, { color: '#059669' }]}>{getModalityLabel(m)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>Languages</Text>
            <Text style={previewStyles.languageText}>{languages.join(', ')}</Text>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={previewStyles.section}>
            <Text style={previewStyles.sectionTitle}>Certifications</Text>
            {certifications.map((cert, i) => (
              <View key={i} style={previewStyles.certRow}>
                <Ionicons name="ribbon-outline" size={16} color="#059669" />
                <Text style={previewStyles.certText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2E8F0',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748B',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  textInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  fieldError: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#64748B',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  optionChipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  optionChipTextSelected: {
    color: '#4F46E5',
  },
  specialtyGrid: {
    gap: 10,
  },
  specialtyCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  specialtyCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  specialtyCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  specialtyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  specialtyLabelSelected: {
    color: '#4F46E5',
  },
  specialtyDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  modalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalityCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  modalityCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  modalityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  modalityLabelSelected: {
    color: '#4F46E5',
  },
  modalityCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  certInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  certInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certList: {
    marginTop: 12,
    gap: 8,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
  },
  certText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  visibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityInfo: {
    flex: 1,
    marginRight: 16,
  },
  visibilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  visibilityOn: {
    backgroundColor: '#ECFDF5',
  },
  visibilityOff: {
    backgroundColor: '#FEF2F2',
  },
  visibilityStatusText: {
    flex: 1,
    fontSize: 14,
  },
  visibilityStatusOn: {
    color: '#065F46',
  },
  visibilityStatusOff: {
    color: '#991B1B',
  },
  submitBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

const previewStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#EEF2FF',
  },
  previewBannerText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
  },
  experienceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
  },
  chipBoat: {
    backgroundColor: '#E0F2FE',
    flexDirection: 'row',
    gap: 4,
  },
  chipModality: {
    backgroundColor: '#ECFDF5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },
  languageText: {
    fontSize: 15,
    color: '#475569',
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  certText: {
    fontSize: 14,
    color: '#065F46',
  },
});
