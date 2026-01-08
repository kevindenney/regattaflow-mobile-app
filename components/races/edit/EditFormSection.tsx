/**
 * EditFormSection - iOS-style grouped form section
 *
 * Tufte-inspired section wrapper with:
 * - Icon and title header
 * - Optional subtitle
 * - Rounded card container for child content
 * - Consistent spacing with design tokens
 *
 * Used in EditRaceForm for organizing fields into logical groups.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TufteTokens, colors } from '@/constants/designSystem';
import { IOS_COLORS } from '@/components/cards/constants';

export interface EditFormSectionProps {
  /** Section title (uppercase label above the card) */
  title: string;
  /** Optional icon to display next to title */
  icon?: React.ReactNode;
  /** Optional subtitle below title */
  subtitle?: string;
  /** Child form rows */
  children: React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function EditFormSection({
  title,
  icon,
  subtitle,
  children,
  style,
  testID,
}: EditFormSectionProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Section Header */}
      <View style={styles.header}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Card Container */}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: TufteTokens.spacing.section + 8, // 24px between sections
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TufteTokens.spacing.section,
    marginBottom: TufteTokens.spacing.compact, // 8px gap before card
  },
  iconWrapper: {
    marginRight: TufteTokens.spacing.compact,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    marginHorizontal: TufteTokens.spacing.section,
    overflow: 'hidden',
    // iOS-style subtle shadow
    shadowColor: IOS_COLORS.label,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
});

export default EditFormSection;
