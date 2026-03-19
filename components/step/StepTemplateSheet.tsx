/**
 * StepTemplateSheet — modal picker that lets users create a step
 * from a pre-built template or start with a blank one.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IOS_COLORS,
  IOS_SPACING,
  IOS_TYPOGRAPHY,
  IOS_RADIUS,
  IOS_SHADOWS,
} from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { type StepTemplate } from '@/lib/step-templates';

interface StepTemplateSheetProps {
  visible: boolean;
  interestSlug?: string | null;
  onSelect: (template: StepTemplate) => void;
  onBlank: () => void;
  onClose: () => void;
}

export function StepTemplateSheet({
  visible,
  interestSlug,
  onSelect,
  onBlank,
  onClose,
}: StepTemplateSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top || IOS_SPACING.lg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>New Step</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeButton}
          >
            <Ionicons
              name="close-circle-outline"
              size={28}
              color={IOS_COLORS.secondaryLabel}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + IOS_SPACING.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Blank step option */}
          <Pressable
            onPress={onBlank}
            style={({ pressed }) => [
              styles.blankCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.blankIconContainer}>
              <Ionicons name="add" size={24} color={STEP_COLORS.accent} />
            </View>
            <View style={styles.blankTextContainer}>
              <Text style={styles.blankTitle}>Blank Step</Text>
              <Text style={styles.blankDescription}>
                Start from scratch with an empty step.
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={IOS_COLORS.systemGray3}
            />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  closeButton: {
    position: 'absolute',
    right: IOS_SPACING.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },

  // Blank step card
  blankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.card,
  },
  blankIconContainer: {
    width: 40,
    height: 40,
    borderRadius: IOS_RADIUS.sm,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: IOS_SPACING.md,
  },
  blankTextContainer: {
    flex: 1,
  },
  blankTitle: {
    ...IOS_TYPOGRAPHY.body,
    fontWeight: '600',
    color: STEP_COLORS.accent,
  },
  blankDescription: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },

  cardPressed: {
    opacity: 0.7,
  },
});
