/**
 * SuggestionSubmitSheet — Bottom sheet for followers to submit suggestions
 *
 * Opened from the SailorActivityCard in the Follow feed.
 * Category picker chips + message input.
 */

import React, { useCallback, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_PHASE_MAP,
  type SuggestionCategory,
} from '@/services/FollowerSuggestionService';
import { useSubmitFollowerSuggestion } from '@/hooks/useFollowerSuggestions';

const CATEGORIES: SuggestionCategory[] = [
  'strategy',
  'weather',
  'crew',
  'tactics',
  'rig_tuning',
  'equipment',
];

const PHASE_LABELS: Record<string, string> = {
  days_before: 'Days Before',
  on_water: 'On Water',
  after_race: 'After Race',
};

const MAX_MESSAGE_LENGTH = 500;

interface SuggestionSubmitSheetProps {
  isOpen: boolean;
  onClose: () => void;
  raceId: string;
  raceOwnerId: string;
  raceName?: string;
}

export function SuggestionSubmitSheet({
  isOpen,
  onClose,
  raceId,
  raceOwnerId,
  raceName,
}: SuggestionSubmitSheetProps) {
  const insets = useSafeAreaInsets();
  const { submitSuggestion, isSubmitting } = useSubmitFollowerSuggestion();

  const [category, setCategory] = useState<SuggestionCategory>('strategy');
  const [message, setMessage] = useState('');

  const targetPhase = CATEGORY_PHASE_MAP[category];
  const phaseLabel = PHASE_LABELS[targetPhase];
  const canSubmit = message.trim().length > 0 && !isSubmitting;

  const handleCategorySelect = useCallback((cat: SuggestionCategory) => {
    triggerHaptic('selection');
    setCategory(cat);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    triggerHaptic('success');

    await submitSuggestion({
      raceId,
      raceOwnerId,
      category,
      message: message.trim(),
    });

    // Reset and close
    setMessage('');
    setCategory('strategy');
    onClose();
  }, [canSubmit, submitSuggestion, raceId, raceOwnerId, category, message, onClose]);

  const handleClose = useCallback(() => {
    setMessage('');
    setCategory('strategy');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Suggest</Text>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.sendButton, !canSubmit && styles.sendButtonDisabled]}
            >
              <Text style={[styles.sendText, !canSubmit && styles.sendTextDisabled]}>
                Send
              </Text>
            </Pressable>
          </View>

          {/* Race name context */}
          {raceName && (
            <View style={styles.raceContext}>
              <Ionicons name="flag-outline" size={14} color={IOS_COLORS.secondaryLabel} />
              <Text style={styles.raceContextText} numberOfLines={1}>
                {raceName}
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
          >
            {/* Category picker */}
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const color = CATEGORY_COLORS[cat];
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: color + '20', borderColor: color },
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[cat] as any}
                      size={16}
                      color={isSelected ? color : IOS_COLORS.secondaryLabel}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && { color, fontWeight: '600' },
                      ]}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Phase indicator */}
            <View style={styles.phaseIndicator}>
              <Ionicons name="arrow-forward-outline" size={14} color={IOS_COLORS.tertiaryLabel} />
              <Text style={styles.phaseIndicatorText}>
                Will appear in <Text style={styles.phaseBold}>{phaseLabel}</Text> tab
              </Text>
            </View>

            {/* Message input */}
            <Text style={styles.sectionLabel}>MESSAGE</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Share your tip or advice..."
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                value={message}
                onChangeText={setMessage}
                maxLength={MAX_MESSAGE_LENGTH}
                multiline
                textAlignVertical="top"
                autoFocus={isOpen}
              />
              <Text style={styles.charCount}>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray4,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  cancelButton: {
    padding: 4,
    minWidth: 60,
  },
  cancelText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.systemBlue,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  sendButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendText: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  sendTextDisabled: {
    color: IOS_COLORS.systemGray3,
  },
  raceContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
  },
  raceContextText: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.sm,
    marginTop: IOS_SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: IOS_SPACING.md,
    marginBottom: IOS_SPACING.sm,
  },
  phaseIndicatorText: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
  },
  phaseBold: {
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  inputContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.md,
    minHeight: 140,
  },
  input: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    flex: 1,
    minHeight: 100,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
      default: {},
    }),
  },
  charCount: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'right',
    marginTop: 4,
  },
});

export default SuggestionSubmitSheet;
