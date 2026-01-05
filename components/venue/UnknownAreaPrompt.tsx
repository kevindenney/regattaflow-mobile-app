/**
 * UnknownAreaPrompt
 *
 * Prompt shown when user is sailing in an undefined area.
 * Allows them to name and define a new community racing area.
 * Tufte-inspired: clean, focused, minimal chrome.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import type { CreateCommunityAreaParams } from '@/services/venue/CommunityVenueCreationService';

interface UnknownAreaPromptProps {
  visible: boolean;
  latitude: number;
  longitude: number;
  nearestVenue?: {
    id: string;
    name: string;
    distanceKm: number;
  };
  onCreateArea: (params: CreateCommunityAreaParams) => Promise<void>;
  onDismiss: () => void;
}

const DEFAULT_RADIUS_METERS = 2000;

// Preset radius options (pure JS, no native slider needed)
const RADIUS_PRESETS = [
  { label: 'Small', value: 500, description: 'Harbor racing' },
  { label: 'Medium', value: 2000, description: 'Club racing' },
  { label: 'Large', value: 5000, description: 'Offshore start' },
  { label: 'XL', value: 10000, description: 'Distance race' },
];

export function UnknownAreaPrompt({
  visible,
  latitude,
  longitude,
  nearestVenue,
  onCreateArea,
  onDismiss,
}: UnknownAreaPromptProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS);
  const [attachToVenue, setAttachToVenue] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('Please enter a name for this area');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreateArea({
        name: name.trim(),
        centerLat: latitude,
        centerLng: longitude,
        radiusMeters,
        description: description.trim() || undefined,
        venueId: attachToVenue && nearestVenue ? nearestVenue.id : null,
      });

      // Reset form
      setName('');
      setDescription('');
      setRadiusMeters(DEFAULT_RADIUS_METERS);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create area');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, latitude, longitude, radiusMeters, attachToVenue, nearestVenue, onCreateArea, onDismiss]);

  const formatRadius = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <Pressable style={styles.backdrop} onPress={onDismiss} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={24} color="#2563EB" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>New Racing Area</Text>
                <Text style={styles.subtitle}>You're sailing somewhere new</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onDismiss}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name this area</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Kellett Island"
                placeholderTextColor="#9CA3AF"
                autoFocus
                maxLength={50}
              />
            </View>

            {/* Description input (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="What makes this area special?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                maxLength={200}
              />
            </View>

            {/* Radius preset buttons */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area size</Text>
              <View style={styles.radiusPresets}>
                {RADIUS_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.value}
                    style={[
                      styles.radiusPreset,
                      radiusMeters === preset.value && styles.radiusPresetActive,
                    ]}
                    onPress={() => setRadiusMeters(preset.value)}
                  >
                    <Text
                      style={[
                        styles.radiusPresetLabel,
                        radiusMeters === preset.value && styles.radiusPresetLabelActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text
                      style={[
                        styles.radiusPresetValue,
                        radiusMeters === preset.value && styles.radiusPresetValueActive,
                      ]}
                    >
                      {formatRadius(preset.value)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Venue association */}
            {nearestVenue && (
              <Pressable
                style={styles.venueToggle}
                onPress={() => setAttachToVenue(!attachToVenue)}
              >
                <View style={styles.venueToggleContent}>
                  <Ionicons
                    name={attachToVenue ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={attachToVenue ? '#2563EB' : '#9CA3AF'}
                  />
                  <View style={styles.venueToggleText}>
                    <Text style={styles.venueToggleLabel}>
                      Part of {nearestVenue.name}
                    </Text>
                    <Text style={styles.venueToggleHint}>
                      {nearestVenue.distanceKm < 1
                        ? `${Math.round(nearestVenue.distanceKm * 1000)}m away`
                        : `${nearestVenue.distanceKm.toFixed(1)}km away`}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Coordinates display */}
            <View style={styles.coordinates}>
              <Text style={styles.coordinatesText}>
                {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onDismiss}>
              <Text style={styles.cancelButtonText}>Not now</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Create Area</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Community note */}
          <View style={styles.communityNote}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.communityNoteText}>
              Other sailors will be able to see and confirm this area
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * UnknownAreaBanner - Compact inline prompt for unknown area detection
 */
interface UnknownAreaBannerProps {
  onPress: () => void;
  latitude: number;
  longitude: number;
}

export function UnknownAreaBanner({ onPress, latitude, longitude }: UnknownAreaBannerProps) {
  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <View style={styles.bannerIcon}>
        <Ionicons name="location" size={16} color="#2563EB" />
      </View>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>Sailing somewhere new?</Text>
        <Text style={styles.bannerSubtitle}>Tap to name this area</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheet: {
    backgroundColor: TufteTokens.backgrounds.paper,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: TufteTokens.spacing.section,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TufteTokens.spacing.standard,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    gap: 2,
  },
  title: {
    ...TufteTokens.typography.primary,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    ...TufteTokens.typography.tertiary,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
  },

  // Form
  form: {
    padding: TufteTokens.spacing.section,
    gap: TufteTokens.spacing.section,
  },
  inputGroup: {
    gap: TufteTokens.spacing.tight,
  },
  label: {
    ...TufteTokens.typography.secondary,
    color: '#374151',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  labelValue: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#2563EB',
  },
  input: {
    ...TufteTokens.typography.secondary,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Radius presets
  radiusPresets: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.compact,
  },
  radiusPreset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: TufteTokens.spacing.standard,
    paddingHorizontal: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  radiusPresetActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  radiusPresetLabel: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#6B7280',
  },
  radiusPresetLabelActive: {
    color: '#2563EB',
  },
  radiusPresetValue: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    marginTop: 2,
  },
  radiusPresetValueActive: {
    color: '#3B82F6',
  },

  // Venue toggle
  venueToggle: {
    padding: TufteTokens.spacing.standard,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  venueToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TufteTokens.spacing.standard,
  },
  venueToggleText: {
    flex: 1,
    gap: 2,
  },
  venueToggleLabel: {
    ...TufteTokens.typography.secondary,
    color: '#374151',
  },
  venueToggleHint: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: TufteTokens.spacing.compact,
    backgroundColor: '#FEF2F2',
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  errorText: {
    ...TufteTokens.typography.tertiary,
    color: '#DC2626',
    flex: 1,
  },

  // Coordinates
  coordinates: {
    alignItems: 'center',
  },
  coordinatesText: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.standard,
    paddingHorizontal: TufteTokens.spacing.section,
    paddingTop: TufteTokens.spacing.compact,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: TufteTokens.borderRadius.subtle,
    backgroundColor: TufteTokens.backgrounds.subtle,
  },
  cancelButtonText: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: TufteTokens.borderRadius.subtle,
    backgroundColor: '#2563EB',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Community note
  communityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: TufteTokens.spacing.section,
    paddingHorizontal: TufteTokens.spacing.section,
  },
  communityNoteText: {
    ...TufteTokens.typography.micro,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TufteTokens.spacing.standard,
    padding: TufteTokens.spacing.standard,
    backgroundColor: '#EFF6FF',
    borderRadius: TufteTokens.borderRadius.subtle,
    marginHorizontal: TufteTokens.spacing.section,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    ...TufteTokens.typography.secondary,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  bannerSubtitle: {
    ...TufteTokens.typography.micro,
    color: '#3B82F6',
  },
});

export default UnknownAreaPrompt;
