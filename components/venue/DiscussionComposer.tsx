/**
 * @deprecated Use PostComposer from components/venue/post/PostComposer.tsx instead.
 *
 * DiscussionComposer - Create new discussion modal
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useCreateDiscussion, useDiscussionCategories } from '@/hooks/useVenueDiscussions';
import { DiscussionCategory } from '@/services/venue/VenueDiscussionService';
import { useVenueRacingAreasAndRoutes } from '@/hooks/useVenueRacingAreas';

interface DiscussionComposerProps {
  venueId: string;
  venueName: string;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRacingAreaId?: string | null;
  defaultRaceRouteId?: string | null;
}

export function DiscussionComposer({
  venueId,
  venueName,
  visible,
  onClose,
  onSuccess,
  defaultRacingAreaId,
  defaultRaceRouteId,
}: DiscussionComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<DiscussionCategory>('general');
  const [selectedRacingAreaId, setSelectedRacingAreaId] = useState<string | null>(defaultRacingAreaId ?? null);
  const [selectedRaceRouteId, setSelectedRaceRouteId] = useState<string | null>(defaultRaceRouteId ?? null);

  const categories = useDiscussionCategories();
  const createMutation = useCreateDiscussion();
  const { items: racingItems } = useVenueRacingAreasAndRoutes(venueId);

  // Sync with defaults when they change
  useEffect(() => {
    setSelectedRacingAreaId(defaultRacingAreaId ?? null);
    setSelectedRaceRouteId(defaultRaceRouteId ?? null);
  }, [defaultRacingAreaId, defaultRaceRouteId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for your discussion');
      return;
    }

    try {
      await createMutation.mutateAsync({
        venue_id: venueId,
        title: title.trim(),
        body: body.trim() || undefined,
        category,
        racing_area_id: selectedRacingAreaId || undefined,
        race_route_id: selectedRaceRouteId || undefined,
      });

      // Reset form
      setTitle('');
      setBody('');
      setCategory('general');
      setSelectedRacingAreaId(defaultRacingAreaId ?? null);
      setSelectedRaceRouteId(defaultRaceRouteId ?? null);

      onSuccess?.();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create discussion. Please try again.');
      console.error('[DiscussionComposer] Create error:', error);
    }
  };

  const handleClose = () => {
    if (title.trim() || body.trim()) {
      Alert.alert(
        'Discard draft?',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setTitle('');
              setBody('');
              setCategory('general');
              setSelectedRacingAreaId(defaultRacingAreaId ?? null);
              setSelectedRaceRouteId(defaultRaceRouteId ?? null);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  // Get label for selected racing area/route
  const getSelectedLocationLabel = (): string => {
    if (selectedRaceRouteId) {
      const route = racingItems.find(item => item.type === 'race_route' && item.id === selectedRaceRouteId);
      return route?.name || 'Race Route';
    }
    if (selectedRacingAreaId) {
      const area = racingItems.find(item => item.type === 'racing_area' && item.id === selectedRacingAreaId);
      return area?.name || 'Racing Area';
    }
    return `All ${venueName}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.headerTitle}>New Discussion</ThemedText>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.headerButton, styles.postButton]}
            disabled={!title.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.postText}>Post</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
        >
          {/* Venue Label */}
          <View style={styles.venueLabel}>
            <Ionicons name="location" size={16} color="#2563EB" />
            <ThemedText style={styles.venueName}>{venueName}</ThemedText>
          </View>

          {/* Racing Area Selector */}
          {racingItems.length > 0 && (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Racing Area</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {/* All Areas Option */}
                <TouchableOpacity
                  style={[
                    styles.locationChip,
                    !selectedRacingAreaId && !selectedRaceRouteId && styles.locationChipActive,
                  ]}
                  onPress={() => {
                    setSelectedRacingAreaId(null);
                    setSelectedRaceRouteId(null);
                  }}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={!selectedRacingAreaId && !selectedRaceRouteId ? '#2563EB' : '#6B7280'}
                  />
                  <ThemedText
                    style={[
                      styles.locationChipText,
                      !selectedRacingAreaId && !selectedRaceRouteId && styles.locationChipTextActive,
                    ]}
                  >
                    All {venueName}
                  </ThemedText>
                </TouchableOpacity>

                {/* Racing Areas and Routes */}
                {racingItems.map((item) => {
                  const isSelected = item.type === 'racing_area'
                    ? selectedRacingAreaId === item.id
                    : selectedRaceRouteId === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.locationChip,
                        isSelected && styles.locationChipActive,
                      ]}
                      onPress={() => {
                        if (item.type === 'racing_area') {
                          setSelectedRacingAreaId(item.id);
                          setSelectedRaceRouteId(null);
                        } else {
                          setSelectedRaceRouteId(item.id);
                          setSelectedRacingAreaId(null);
                        }
                      }}
                    >
                      <Ionicons
                        name={item.type === 'racing_area' ? 'navigate-outline' : 'trail-sign-outline'}
                        size={16}
                        color={isSelected ? '#2563EB' : '#6B7280'}
                      />
                      <ThemedText
                        style={[
                          styles.locationChipText,
                          isSelected && styles.locationChipTextActive,
                        ]}
                      >
                        {item.name}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Category Selector */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Category</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    category === cat.value && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={category === cat.value ? '#2563EB' : '#6B7280'}
                  />
                  <ThemedText
                    style={[
                      styles.categoryChipText,
                      category === cat.value && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Title</ThemedText>
            <TextInput
              style={styles.titleInput}
              placeholder="What would you like to discuss?"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              autoFocus
            />
            <ThemedText style={styles.charCount}>
              {title.length}/200
            </ThemedText>
          </View>

          {/* Body Input */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Details (optional)</ThemedText>
            <TextInput
              style={styles.bodyInput}
              placeholder="Add more context, share your experience, or ask a specific question..."
              placeholderTextColor="#9CA3AF"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={18} color="#D97706" />
              <ThemedText style={styles.tipsTitle}>Tips for a great discussion</ThemedText>
            </View>
            <View style={styles.tipsList}>
              <ThemedText style={styles.tipItem}>• Be specific about conditions (wind, tide, etc.)</ThemedText>
              <ThemedText style={styles.tipItem}>• Mention what boat class or racing format</ThemedText>
              <ThemedText style={styles.tipItem}>• Share what you've already tried</ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  postButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  postText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 20,
  },
  venueLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  venueName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  locationChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  locationChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationChipTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    fontWeight: '500',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  bodyInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 150,
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
});
