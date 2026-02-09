/**
 * SuggestionDetailSheet — Bottom sheet showing full suggestion details
 *
 * Displays suggester info, category, full message, and accept/dismiss actions.
 */

import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { triggerHaptic } from '@/lib/haptics';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORY_PHASE_MAP,
  type FollowerSuggestion,
} from '@/services/FollowerSuggestionService';

const PHASE_LABELS: Record<string, string> = {
  days_before: 'Prep',
  on_water: 'Race',
  after_race: 'Review',
};

interface SuggestionDetailSheetProps {
  suggestion: FollowerSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  isAccepting?: boolean;
  isDismissing?: boolean;
}

export function SuggestionDetailSheet({
  suggestion,
  isOpen,
  onClose,
  onAccept,
  onDismiss,
  isAccepting = false,
  isDismissing = false,
}: SuggestionDetailSheetProps) {
  const insets = useSafeAreaInsets();

  const handleAccept = useCallback(() => {
    if (!suggestion) return;
    triggerHaptic('success');
    onAccept(suggestion.id);
    onClose();
  }, [suggestion, onAccept, onClose]);

  const handleDismiss = useCallback(() => {
    if (!suggestion) return;
    triggerHaptic('selection');
    onDismiss(suggestion.id);
    onClose();
  }, [suggestion, onDismiss, onClose]);

  if (!suggestion) return null;

  const categoryColor = CATEGORY_COLORS[suggestion.category];
  const categoryIcon = CATEGORY_ICONS[suggestion.category];
  const categoryLabel = CATEGORY_LABELS[suggestion.category];
  const phaseLabel = PHASE_LABELS[suggestion.targetPhase] ?? suggestion.targetPhase;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle-outline" size={28} color={IOS_COLORS.secondaryLabel} />
          </Pressable>
        </View>

        {/* Suggester info */}
        <View style={styles.suggesterRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: suggestion.suggesterAvatarColor || IOS_COLORS.systemGray5 },
            ]}
          >
            <Text style={styles.avatarEmoji}>
              {suggestion.suggesterAvatarEmoji || '⛵'}
            </Text>
          </View>
          <View style={styles.suggesterInfo}>
            <Text style={styles.suggesterName}>
              {suggestion.suggesterName || 'A fellow sailor'}
            </Text>
            <Text style={styles.suggesterSub}>sent you a suggestion</Text>
          </View>
        </View>

        {/* Category badge */}
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
          <Ionicons name={categoryIcon as any} size={18} color={categoryColor} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {categoryLabel}
          </Text>
          <View style={styles.phasePill}>
            <Text style={styles.phaseText}>{phaseLabel}</Text>
          </View>
        </View>

        {/* Full message */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{suggestion.message}</Text>
        </View>

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {new Date(suggestion.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.acceptButton, isAccepting && styles.buttonDisabled]}
            onPress={handleAccept}
            disabled={isAccepting || isDismissing}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>
              Add to {phaseLabel}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.dismissButton, isDismissing && styles.buttonDisabled]}
            onPress={handleDismiss}
            disabled={isAccepting || isDismissing}
          >
            <Text style={styles.dismissButtonText}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    paddingHorizontal: IOS_SPACING.lg,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray4,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: IOS_SPACING.md,
  },
  closeButton: {
    padding: 4,
  },
  suggesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
    marginBottom: IOS_SPACING.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  suggesterInfo: {
    flex: 1,
  },
  suggesterName: {
    ...IOS_TYPOGRAPHY.title3,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  suggesterSub: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: IOS_RADIUS.md,
    marginBottom: IOS_SPACING.lg,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  phasePill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  messageContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.md,
  },
  messageText: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    lineHeight: 24,
  },
  timestamp: {
    ...IOS_TYPOGRAPHY.caption1,
    color: IOS_COLORS.tertiaryLabel,
    marginBottom: IOS_SPACING.xl,
  },
  actions: {
    gap: IOS_SPACING.sm,
    marginTop: 'auto',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingVertical: 16,
    borderRadius: IOS_RADIUS.lg,
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: IOS_RADIUS.lg,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
  },
  dismissButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default SuggestionDetailSheet;
