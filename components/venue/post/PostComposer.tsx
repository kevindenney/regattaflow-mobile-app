/**
 * PostComposer
 *
 * Modal for creating/editing posts. Includes post type selector,
 * topic tag picker, condition tag editor, and optional map location picker.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TufteTokens } from '@/constants/designSystem';
import { POST_TYPE_CONFIG } from '@/types/community-feed';
import { useCreatePost } from '@/hooks/useCommunityFeed';
import { useTopicTags } from '@/hooks/useCommunityFeed';
import { CatalogRaceService } from '@/services/CatalogRaceService';
import type { PostType } from '@/types/community-feed';
import type { CatalogRace } from '@/types/catalog-race';

interface PostComposerProps {
  visible: boolean;
  venueId: string;
  racingAreaId?: string | null;
  catalogRaceId?: string | null;
  catalogRaceName?: string | null;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const POST_TYPES: PostType[] = ['discussion', 'tip', 'question', 'report', 'safety_alert'];

export function PostComposer({
  visible,
  venueId,
  racingAreaId,
  catalogRaceId: initialCatalogRaceId,
  catalogRaceName: initialCatalogRaceName,
  onDismiss,
  onSuccess,
}: PostComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState<PostType>('discussion');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [conditionLabel, setConditionLabel] = useState('');

  // Race tagging
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(initialCatalogRaceId || null);
  const [selectedRaceName, setSelectedRaceName] = useState<string | null>(initialCatalogRaceName || null);
  const [showRacePicker, setShowRacePicker] = useState(false);
  const [raceSearchQuery, setRaceSearchQuery] = useState('');
  const [raceSearchResults, setRaceSearchResults] = useState<CatalogRace[]>([]);

  const { data: topicTags } = useTopicTags();
  const createPost = useCreatePost();

  const resetForm = useCallback(() => {
    setTitle('');
    setBody('');
    setPostType('discussion');
    setSelectedTagIds([]);
    setConditionLabel('');
    setSelectedRaceId(null);
    setSelectedRaceName(null);
    setRaceSearchQuery('');
    setRaceSearchResults([]);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please add a title for your post.');
      return;
    }

    try {
      const conditionTags = conditionLabel.trim()
        ? [{
            label: conditionLabel.trim(),
            wind_direction_min: null,
            wind_direction_max: null,
            wind_speed_min: null,
            wind_speed_max: null,
            tide_phase: null,
            wave_height_min: null,
            wave_height_max: null,
            current_speed_min: null,
            current_speed_max: null,
            season: null,
            time_of_day: null,
          }]
        : undefined;

      await createPost.mutateAsync({
        venue_id: venueId,
        title: title.trim(),
        body: body.trim() || undefined,
        post_type: postType,
        racing_area_id: racingAreaId || undefined,
        topic_tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        condition_tags: conditionTags,
        catalog_race_id: selectedRaceId || undefined,
      });

      resetForm();
      onSuccess?.();
      onDismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  }, [title, body, postType, venueId, racingAreaId, selectedTagIds, conditionLabel, selectedRaceId, createPost, resetForm, onSuccess, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (title.trim() || body.trim()) {
      Alert.alert(
        'Discard Post?',
        'You have unsaved changes. Are you sure you want to discard?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => { resetForm(); onDismiss(); } },
        ]
      );
    } else {
      onDismiss();
    }
  }, [title, body, resetForm, onDismiss]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const handleRaceSearch = useCallback(async (query: string) => {
    setRaceSearchQuery(query);
    if (query.trim().length < 2) {
      setRaceSearchResults([]);
      return;
    }
    try {
      const results = await CatalogRaceService.searchRaces(query.trim());
      setRaceSearchResults(results);
    } catch {
      setRaceSearchResults([]);
    }
  }, []);

  const handleSelectRace = useCallback((race: CatalogRace) => {
    setSelectedRaceId(race.id);
    setSelectedRaceName(race.short_name || race.name);
    setShowRacePicker(false);
    setRaceSearchQuery('');
    setRaceSearchResults([]);
  }, []);

  const handleClearRace = useCallback(() => {
    setSelectedRaceId(null);
    setSelectedRaceName(null);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleDismiss}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!title.trim() || createPost.isPending}
            style={[styles.submitButton, !title.trim() && styles.submitButtonDisabled]}
          >
            {createPost.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Post Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Post Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeRow}
            >
              {POST_TYPES.map(type => {
                const config = POST_TYPE_CONFIG[type];
                const isSelected = postType === type;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      isSelected && { backgroundColor: config.bgColor, borderColor: config.color },
                    ]}
                    onPress={() => setPostType(type)}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={16}
                      color={isSelected ? config.color : '#9CA3AF'}
                    />
                    <Text style={[
                      styles.typeOptionText,
                      isSelected && { color: config.color, fontWeight: '600' },
                    ]}>
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              autoFocus
            />
            <Text style={styles.charCount}>{title.length}/200</Text>
          </View>

          {/* Body */}
          <View style={styles.section}>
            <TextInput
              style={styles.bodyInput}
              placeholder="Share your knowledge, ask a question, or report conditions..."
              placeholderTextColor="#9CA3AF"
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Topic Tags */}
          {topicTags && topicTags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Topics</Text>
              <View style={styles.tagGrid}>
                {topicTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[
                        styles.tagOption,
                        isSelected && { backgroundColor: `${tag.color}15`, borderColor: tag.color || '#E5E7EB' },
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      {tag.icon && (
                        <Ionicons
                          name={tag.icon as any}
                          size={12}
                          color={isSelected ? tag.color || '#6B7280' : '#9CA3AF'}
                        />
                      )}
                      <Text style={[
                        styles.tagOptionText,
                        isSelected && { color: tag.color || '#374151', fontWeight: '600' },
                      ]}>
                        {tag.display_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tag a Race */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Race (optional)</Text>
            {selectedRaceId && selectedRaceName ? (
              <View style={styles.raceChipRow}>
                <View style={styles.raceChipSelected}>
                  <Ionicons name="flag" size={12} color={TufteTokens.colors?.accent || '#5856D6'} />
                  <Text style={styles.raceChipSelectedText} numberOfLines={1}>
                    {selectedRaceName}
                  </Text>
                  <Pressable onPress={handleClearRace} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>
            ) : showRacePicker ? (
              <View style={styles.racePickerContainer}>
                <View style={styles.raceSearchRow}>
                  <Ionicons name="search" size={14} color="#9CA3AF" />
                  <TextInput
                    style={styles.raceSearchInput}
                    placeholder="Search races..."
                    placeholderTextColor="#9CA3AF"
                    value={raceSearchQuery}
                    onChangeText={handleRaceSearch}
                    autoFocus
                  />
                  <Pressable onPress={() => { setShowRacePicker(false); setRaceSearchQuery(''); setRaceSearchResults([]); }}>
                    <Text style={styles.raceSearchCancel}>Cancel</Text>
                  </Pressable>
                </View>
                {raceSearchResults.length > 0 && (
                  <View style={styles.raceResultsList}>
                    {raceSearchResults.slice(0, 6).map(race => (
                      <Pressable
                        key={race.id}
                        style={styles.raceResultRow}
                        onPress={() => handleSelectRace(race)}
                      >
                        <View style={styles.raceResultInfo}>
                          <Text style={styles.raceResultName} numberOfLines={1}>
                            {race.name}
                          </Text>
                          {race.country && (
                            <Text style={styles.raceResultMeta} numberOfLines={1}>
                              {[race.organizing_authority, race.country].filter(Boolean).join(' · ')}
                            </Text>
                          )}
                        </View>
                        <Ionicons name="add-circle-outline" size={18} color="#2563EB" />
                      </Pressable>
                    ))}
                  </View>
                )}
                {raceSearchQuery.trim().length >= 2 && raceSearchResults.length === 0 && (
                  <Text style={styles.raceNoResults}>No races found</Text>
                )}
              </View>
            ) : (
              <Pressable
                style={styles.raceChipEmpty}
                onPress={() => setShowRacePicker(true)}
              >
                <Ionicons name="flag-outline" size={14} color="#9CA3AF" />
                <Text style={styles.raceChipEmptyText}>Tag a Race</Text>
              </Pressable>
            )}
          </View>

          {/* Condition Label (simplified) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Conditions (optional)</Text>
            <TextInput
              style={styles.conditionInput}
              placeholder='e.g. "NE 15-20kts, ebb tide"'
              placeholderTextColor="#9CA3AF"
              value={conditionLabel}
              onChangeText={setConditionLabel}
            />
            <Text style={styles.conditionHint}>
              Describe the conditions when this tip applies
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Tips for great posts</Text>
            <Text style={styles.tipText}>
              {postType === 'tip' && '• Share specific, actionable advice based on your experience'}
              {postType === 'question' && '• Be specific about what you need help with'}
              {postType === 'report' && '• Include current conditions and what you observed'}
              {postType === 'safety_alert' && '• Be clear about the hazard and its location'}
              {postType === 'discussion' && '• Start a conversation about tactics, strategy, or venue knowledge'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TufteTokens.backgrounds.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.standard,
    borderBottomWidth: TufteTokens.borders.hairline,
    borderBottomColor: TufteTokens.borders.colorSubtle,
  },
  cancelButton: {
    ...TufteTokens.typography.secondary,
    color: '#6B7280',
  },
  headerTitle: {
    ...TufteTokens.typography.primary,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.compact,
    borderRadius: TufteTokens.borderRadius.subtle,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    ...TufteTokens.typography.tertiary,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: TufteTokens.spacing.section,
    paddingVertical: TufteTokens.spacing.standard,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8E8E93',
    marginBottom: TufteTokens.spacing.compact,
  },
  // Post type
  typeRow: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.compact,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionText: {
    ...TufteTokens.typography.tertiary,
    color: '#9CA3AF',
  },
  // Title
  titleInput: {
    ...TufteTokens.typography.primary,
    fontSize: 18,
    color: '#111827',
    padding: 0,
  },
  charCount: {
    ...TufteTokens.typography.micro,
    color: '#D1D5DB',
    textAlign: 'right',
    marginTop: 4,
  },
  // Body
  bodyInput: {
    ...TufteTokens.typography.secondary,
    color: '#374151',
    minHeight: 120,
    padding: 0,
    lineHeight: 20,
  },
  // Tags
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TufteTokens.spacing.compact,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagOptionText: {
    ...TufteTokens.typography.tertiary,
    color: '#9CA3AF',
  },
  // Race picker
  raceChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  raceChipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: '#5856D612',
    borderRadius: TufteTokens.borderRadius.subtle,
    borderWidth: 1,
    borderColor: '#5856D630',
  },
  raceChipSelectedText: {
    ...TufteTokens.typography.tertiary,
    color: '#5856D6',
    fontWeight: '600',
    maxWidth: 200,
  },
  raceChipEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    alignSelf: 'flex-start',
  },
  raceChipEmptyText: {
    ...TufteTokens.typography.tertiary,
    color: '#9CA3AF',
  },
  racePickerContainer: {
    gap: TufteTokens.spacing.compact,
  },
  raceSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  raceSearchInput: {
    flex: 1,
    ...TufteTokens.typography.secondary,
    color: '#374151',
    padding: 0,
  },
  raceSearchCancel: {
    ...TufteTokens.typography.tertiary,
    color: '#6B7280',
  },
  raceResultsList: {
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
    overflow: 'hidden',
  },
  raceResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  raceResultInfo: {
    flex: 1,
    marginRight: 8,
  },
  raceResultName: {
    ...TufteTokens.typography.secondary,
    color: '#374151',
    fontWeight: '500',
  },
  raceResultMeta: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    marginTop: 1,
  },
  raceNoResults: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: TufteTokens.spacing.compact,
  },

  // Conditions
  conditionInput: {
    ...TufteTokens.typography.secondary,
    color: '#374151',
    backgroundColor: TufteTokens.backgrounds.subtle,
    paddingHorizontal: TufteTokens.spacing.standard,
    paddingVertical: TufteTokens.spacing.compact,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  conditionHint: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Tips
  tipsSection: {
    marginHorizontal: TufteTokens.spacing.section,
    marginTop: TufteTokens.spacing.section,
    padding: TufteTokens.spacing.standard,
    backgroundColor: TufteTokens.backgrounds.subtle,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  tipsTitle: {
    ...TufteTokens.typography.micro,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  tipText: {
    ...TufteTokens.typography.micro,
    color: '#9CA3AF',
    lineHeight: 16,
  },
});

export default PostComposer;
