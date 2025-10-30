/**
 * InfoGrid and InfoItem Components
 *
 * 2-column responsive grid for displaying label/value pairs
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, colors } from '@/constants/designSystem';

interface InfoItemProps {
  label: string;
  value: string | number;
}

export const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

interface InfoGridProps {
  children: React.ReactNode;
  columns?: 1 | 2;
}

export const InfoGrid: React.FC<InfoGridProps> = ({ children, columns = 2 }) => (
  <View style={[styles.infoGrid, columns === 1 && styles.singleColumn]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  singleColumn: {
    flexDirection: 'column',
  },
  infoItem: {
    width: '48%', // 2 columns with gap
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    ...Typography.bodyBold,
    color: colors.text.primary,
  },
});
