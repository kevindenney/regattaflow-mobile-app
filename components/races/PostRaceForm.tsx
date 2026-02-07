/**
 * PostRaceForm Component
 *
 * Form for entering post-race analysis and lessons learned.
 * Part of the Sailor Discovery feature - allows sailors to share
 * their race debrief with fleet mates or publicly.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Lightbulb,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS, IOS_TYPOGRAPHY, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { useRegattaContent, ContentVisibility } from '@/hooks/useRegattaContent';

// =============================================================================
// TYPES
// =============================================================================

export interface PostRaceFormProps {
  /** Regatta ID to save content to */
  regattaId: string;
  /** Race name for display */
  raceName?: string;
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when content is saved successfully */
  onSaved?: () => void;
}

// =============================================================================
// VISIBILITY SELECTOR (Shared with RacePrepForm)
// =============================================================================

const VISIBILITY_OPTIONS: { value: ContentVisibility; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'private',
    label: 'Private',
    description: 'Just for your records',
    icon: <EyeOff size={16} color={IOS_COLORS.systemGray} />,
  },
  {
    value: 'fleet',
    label: 'Fleet Only',
    description: 'Visible to fleet members',
    icon: <Users size={16} color={IOS_COLORS.systemBlue} />,
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Help anyone sailing your boat class',
    icon: <Eye size={16} color={IOS_COLORS.systemGreen} />,
  },
];

function VisibilitySelector({
  value,
  onChange,
}: {
  value: ContentVisibility;
  onChange: (v: ContentVisibility) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selected = VISIBILITY_OPTIONS.find(o => o.value === value) || VISIBILITY_OPTIONS[1];

  return (
    <View style={styles.visibilityContainer}>
      <Text style={styles.label}>Who can learn from this?</Text>
      <Pressable
        style={styles.visibilityButton}
        onPress={() => setExpanded(!expanded)}
      >
        {selected.icon}
        <Text style={styles.visibilityButtonText}>{selected.label}</Text>
        <ChevronDown
          size={16}
          color={IOS_COLORS.secondaryLabel}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded && (
        <View style={styles.visibilityOptions}>
          {VISIBILITY_OPTIONS.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.visibilityOption,
                option.value === value && styles.visibilityOptionSelected,
              ]}
              onPress={() => {
                onChange(option.value);
                setExpanded(false);
              }}
            >
              {option.icon}
              <View style={styles.visibilityOptionText}>
                <Text style={styles.visibilityOptionLabel}>{option.label}</Text>
                <Text style={styles.visibilityOptionDescription}>{option.description}</Text>
              </View>
              {option.value === value && (
                <Check size={16} color={IOS_COLORS.systemBlue} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// =============================================================================
// LESSONS LEARNED INPUT
// =============================================================================

function LessonsLearnedInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (lessons: string[]) => void;
}) {
  const handleAdd = useCallback(() => {
    onChange([...value, '']);
  }, [value, onChange]);

  const handleRemove = useCallback((index: number) => {
    const newLessons = [...value];
    newLessons.splice(index, 1);
    onChange(newLessons);
  }, [value, onChange]);

  const handleChange = useCallback((index: number, text: string) => {
    const newLessons = [...value];
    newLessons[index] = text;
    onChange(newLessons);
  }, [value, onChange]);

  return (
    <View style={styles.lessonsContainer}>
      <View style={styles.lessonsHeader}>
        <Lightbulb size={18} color={IOS_COLORS.systemYellow} />
        <Text style={styles.lessonsHeaderText}>Key Lessons Learned</Text>
      </View>
      <Text style={styles.lessonsHint}>
        Quick bullet points for future reference
      </Text>

      <View style={styles.lessonsList}>
        {value.map((lesson, index) => (
          <View key={index} style={styles.lessonItem}>
            <View style={styles.lessonBullet}>
              <Lightbulb size={14} color={IOS_COLORS.systemYellow} />
            </View>
            <TextInput
              style={styles.lessonInput}
              value={lesson}
              onChangeText={(text) => handleChange(index, text)}
              placeholder="What did you learn?"
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
            />
            <Pressable
              style={styles.lessonRemove}
              onPress={() => handleRemove(index)}
            >
              <Trash2 size={16} color={IOS_COLORS.systemRed} />
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.addLessonButton} onPress={handleAdd}>
          <Plus size={16} color={IOS_COLORS.systemBlue} />
          <Text style={styles.addLessonText}>Add Lesson</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PostRaceForm({
  regattaId,
  raceName,
  visible,
  onClose,
  onSaved,
}: PostRaceFormProps) {
  const {
    content,
    isLoading,
    isSaving,
    savePostRaceContent,
    refetch,
  } = useRegattaContent({ regattaId, onSaved });

  // Local form state
  const [postRaceNotes, setPostRaceNotes] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ContentVisibility>('fleet');

  // Load existing content when modal opens
  useEffect(() => {
    if (visible && regattaId) {
      refetch();
    }
  }, [visible, regattaId, refetch]);

  // Sync local state with loaded content
  useEffect(() => {
    if (content) {
      setPostRaceNotes(content.postRaceNotes || '');
      setLessonsLearned(content.lessonsLearned || []);
      setVisibility(content.contentVisibility || 'fleet');
    }
  }, [content]);

  const handleSave = useCallback(async () => {
    const success = await savePostRaceContent({
      postRaceNotes,
      lessonsLearned,
      contentVisibility: visibility,
    });
    if (success) {
      onClose();
    }
  }, [postRaceNotes, lessonsLearned, visibility, savePostRaceContent, onClose]);

  const hasChanges = postRaceNotes !== (content?.postRaceNotes || '') ||
    JSON.stringify(lessonsLearned) !== JSON.stringify(content?.lessonsLearned || []) ||
    visibility !== (content?.contentVisibility || 'fleet');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <X size={24} color={IOS_COLORS.systemBlue} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Share Your Debrief</Text>
            {raceName && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>{raceName}</Text>
            )}
          </View>
          <Pressable
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton]}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={IOS_COLORS.systemBackground} />
            ) : (
              <Text style={[
                styles.saveButtonText,
                (!hasChanges) && styles.saveButtonTextDisabled,
              ]}>
                Save
              </Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Visibility - moved to top for social emphasis */}
            <VisibilitySelector
              value={visibility}
              onChange={setVisibility}
            />

            {/* Post-Race Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>What Did You Learn?</Text>
              <Text style={styles.hint}>
                Your experience helps others improve
              </Text>
              <TextInput
                style={styles.textArea}
                value={postRaceNotes}
                onChangeText={setPostRaceNotes}
                placeholder="How did the race go? Any key moments, decisions, or conditions that affected your performance?"
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            {/* Lessons Learned */}
            <LessonsLearnedInput
              value={lessonsLearned}
              onChange={setLessonsLearned}
            />

            {/* Info footer */}
            <View style={styles.infoFooter}>
              <Text style={styles.infoText}>
                {visibility === 'private' && 'This analysis stays in your personal journal.'}
                {visibility === 'fleet' && 'Your fleet mates can learn from your experience.'}
                {visibility === 'public' && 'Sailors in your boat class can discover and learn from your insights.'}
              </Text>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    backgroundColor: IOS_COLORS.systemBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  headerButton: {
    padding: IOS_SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.md,
  },
  saveButtonText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  saveButtonTextDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.md,
  },
  loadingText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.lg,
  },
  section: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  label: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.xs,
  },
  hint: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.md,
  },
  textArea: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: IOS_TYPOGRAPHY.body.fontWeight,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    minHeight: 160,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  // Visibility styles
  visibilityContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemBackground,
    padding: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  visibilityButtonText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    flex: 1,
  },
  visibilityOptions: {
    marginTop: IOS_SPACING.sm,
    gap: IOS_SPACING.xs,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
    padding: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  visibilityOptionSelected: {
    backgroundColor: `${IOS_COLORS.systemBlue}10`,
  },
  visibilityOptionText: {
    flex: 1,
  },
  visibilityOptionLabel: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  visibilityOptionDescription: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.secondaryLabel,
  },
  // Lessons learned styles
  lessonsContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  lessonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.xs,
  },
  lessonsHeaderText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  lessonsHint: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.md,
  },
  lessonsList: {
    gap: IOS_SPACING.sm,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  lessonBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${IOS_COLORS.systemYellow}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonInput: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: IOS_TYPOGRAPHY.body.fontWeight,
    color: IOS_COLORS.label,
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.sm,
    padding: IOS_SPACING.md,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray5,
  },
  lessonRemove: {
    padding: IOS_SPACING.sm,
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
    padding: IOS_SPACING.md,
    borderRadius: IOS_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: IOS_COLORS.systemBlue,
    marginTop: IOS_SPACING.sm,
  },
  addLessonText: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  // Info footer
  infoFooter: {
    padding: IOS_SPACING.lg,
    alignItems: 'center',
  },
  infoText: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default PostRaceForm;
