/**
 * TufteAccountSection
 *
 * Section container with UPPERCASE label and optional action link.
 * Uses hairline border for separation.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tufteAccountStyles as styles } from './accountStyles';

interface TufteAccountSectionProps {
  title: string;
  action?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
}

export function TufteAccountSection({
  title,
  action,
  onActionPress,
  children,
}: TufteAccountSectionProps) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && onActionPress && (
          <TouchableOpacity onPress={onActionPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}
