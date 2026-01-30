/**
 * SailorBoatList - Horizontal list of sailor's boats
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Sailboat } from 'lucide-react-native';
import type { SailorBoat } from '@/services/SailorProfileService';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_LIST_INSETS,
  IOS_SHADOWS,
} from '@/lib/design-tokens-ios';

interface SailorBoatListProps {
  boats: SailorBoat[];
}

export function SailorBoatList({ boats }: SailorBoatListProps) {
  if (boats.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Boats</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {boats.map((boat) => (
          <View key={boat.id} style={styles.boatCard}>
            <View style={styles.boatIcon}>
              <Sailboat size={24} color={IOS_COLORS.systemBlue} />
            </View>
            <Text style={styles.className}>{boat.className}</Text>
            {boat.sailNumber && (
              <Text style={styles.sailNumber}>#{boat.sailNumber}</Text>
            )}
            {boat.name && (
              <Text style={styles.boatName} numberOfLines={1}>
                {boat.name}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_LIST_INSETS.insetGrouped.marginHorizontal,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...IOS_SHADOWS.sm,
  },
  title: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
    marginBottom: IOS_SPACING.md,
  },
  scrollContent: {
    gap: IOS_SPACING.md,
    paddingRight: IOS_SPACING.md,
  },
  boatCard: {
    width: 120,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.md,
    alignItems: 'center',
  },
  boatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IOS_SPACING.sm,
  },
  className: {
    ...IOS_TYPOGRAPHY.footnote,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  sailNumber: {
    ...IOS_TYPOGRAPHY.caption1,
    fontWeight: '700',
    color: IOS_COLORS.systemBlue,
    marginTop: 2,
  },
  boatName: {
    ...IOS_TYPOGRAPHY.caption2,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
    textAlign: 'center',
  },
});
