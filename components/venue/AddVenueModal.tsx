/**
 * AddVenueModal
 *
 * Bottom sheet modal for adding a new community venue.
 * Shows a map with all existing venues and lets users tap to place their new venue.
 * Reddit-inspired low-friction venue creation.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_TYPOGRAPHY,
} from '@/lib/design-tokens-ios';
import { useAddCommunityVenue } from '@/hooks/useAddCommunityVenue';
import { triggerHaptic } from '@/lib/haptics';
import type { SailingVenue } from '@/services/venue/CommunityVenueCreationService';

// Platform-specific map component
const VenuePickerMap = Platform.select({
  web: () => require('./AddVenueMapWeb').AddVenueMapWeb,
  default: () => require('./AddVenueMapNative').AddVenueMapNative,
})();

interface AddVenueMapProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  searchQuery?: string;
}

interface AddVenueModalProps {
  visible: boolean;
  initialName: string;
  onDismiss: () => void;
  onSuccess?: (venue: SailingVenue) => void;
}

export function AddVenueModal({
  visible,
  initialName,
  onDismiss,
  onSuccess,
}: AddVenueModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { addVenueAsync, isLoading, reset } = useAddCommunityVenue({
    onSuccess: (venue) => {
      triggerHaptic('notificationSuccess');
      onSuccess?.(venue);
      handleDismiss();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create venue');
    },
  });

  // Reset form when modal opens with new name
  useEffect(() => {
    if (visible) {
      setName(initialName);
      setSelectedLocation(null);
      reset();
    }
  }, [visible, initialName, reset]);

  const handleDismiss = useCallback(() => {
    setName('');
    setSelectedLocation(null);
    reset();
    onDismiss();
  }, [onDismiss, reset]);

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    triggerHaptic('selection');
    setSelectedLocation({ lat, lng });
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter a name for the venue.');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Location Required', 'Please tap on the map to set the venue location.');
      return;
    }

    try {
      await addVenueAsync({
        name: trimmedName,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
    } catch {
      // Error handled by hook
    }
  }, [name, selectedLocation, addVenueAsync]);

  const canSubmit = name.trim().length > 0 && selectedLocation !== null && !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : 'pageSheet'}
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleDismiss} hitSlop={8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Add Venue</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            hitSlop={8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
            ) : (
              <Text
                style={[
                  styles.submitText,
                  !canSubmit && styles.submitTextDisabled,
                ]}
              >
                Add
              </Text>
            )}
          </Pressable>
        </View>

        {/* Venue Name Input */}
        <View style={styles.nameSection}>
          <Text style={styles.inputLabel}>VENUE NAME</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter venue name"
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={100}
          />
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Text style={styles.inputLabel}>TAP TO SET LOCATION</Text>
            {selectedLocation && (
              <View style={styles.coordinatesBadge}>
                <Ionicons name="location" size={12} color={IOS_COLORS.systemGreen} />
                <Text style={styles.coordinatesText}>
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.mapContainer}>
            <VenuePickerMap
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              searchQuery={name}
            />
            {!selectedLocation && (
              <View style={styles.mapOverlay}>
                <View style={styles.mapHint}>
                  <Ionicons name="hand-left-outline" size={20} color={IOS_COLORS.systemBlue} />
                  <Text style={styles.mapHintText}>
                    Tap on the map to place your venue
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Info notice */}
        <View style={styles.infoBox}>
          <Ionicons
            name="people-outline"
            size={18}
            color={IOS_COLORS.systemBlue}
          />
          <Text style={styles.infoText}>
            Community venues help sailors discover new waters. Your venue will be
            immediately available for discussions.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = Math.min(SCREEN_HEIGHT * 0.4, 350);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  cancelText: {
    fontSize: 17,
    color: IOS_COLORS.systemBlue,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  submitTextDisabled: {
    color: IOS_COLORS.tertiaryLabel,
  },
  nameSection: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: IOS_COLORS.label,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  mapSection: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
    gap: IOS_SPACING.xs,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordinatesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: IOS_COLORS.systemGreen + '15',
    borderRadius: IOS_RADIUS.sm,
  },
  coordinatesText: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.systemGreen,
    fontVariant: ['tabular-nums'],
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: IOS_COLORS.separator,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: IOS_SPACING.xl,
    pointerEvents: 'none',
  },
  mapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: IOS_RADIUS.full,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' } as any,
      default: { elevation: 4 },
    }),
  },
  mapHintText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: IOS_SPACING.sm,
    marginHorizontal: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
});

export default AddVenueModal;
