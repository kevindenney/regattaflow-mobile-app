/**
 * TufteTuningSection
 *
 * Section container for tuning guides grouped by boat class.
 * Uses UPPERCASE section headers and optional "Fetch Guides" action.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';

interface TufteTuningSectionProps {
  title: string;
  action?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}

export function TufteTuningSection({
  title,
  action,
  onActionPress,
  children,
}: TufteTuningSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {action && onActionPress && (
          <TouchableOpacity
            onPress={onActionPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.action}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
  action: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },
});
