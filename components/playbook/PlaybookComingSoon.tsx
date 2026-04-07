/**
 * Temporary placeholder card used by Phase 2 Playbook route shells.
 *
 * Replaced section-by-section as later phases land real UI.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';

interface PlaybookComingSoonProps {
  title: string;
  description: string;
  phaseLabel?: string;
}

export function PlaybookComingSoon({
  title,
  description,
  phaseLabel,
}: PlaybookComingSoonProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconBubble}>
          <Ionicons name="construct-outline" size={22} color={IOS_COLORS.systemBlue} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {phaseLabel ? <Text style={styles.phase}>{phaseLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    padding: IOS_SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 16,
    padding: IOS_SPACING.xl,
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.tertiarySystemGroupedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  phase: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: IOS_SPACING.sm,
  },
});
