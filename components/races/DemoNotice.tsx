/**
 * Demo Notice
 *
 * Inline dismissable notice shown when viewing demo/sample data.
 * Includes link to claim workspace.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { demoNoticeStyles } from '@/components/races/styles';

export interface DemoNoticeProps {
  /** Whether the notice is visible */
  visible: boolean;
  /** Callback when dismiss button is pressed */
  onDismiss: () => void;
  /** Callback when "Claim workspace" is pressed */
  onClaimWorkspace: () => void;
}

/**
 * Demo Notice Component
 */
export function DemoNotice({
  visible,
  onDismiss,
  onClaimWorkspace,
}: DemoNoticeProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={demoNoticeStyles.container}>
      <Text style={demoNoticeStyles.text}>Viewing sample data</Text>
      <Text style={demoNoticeStyles.text}>·</Text>
      <Pressable onPress={onClaimWorkspace} hitSlop={8}>
        <Text style={demoNoticeStyles.link}>Claim workspace</Text>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        style={demoNoticeStyles.dismissButton}
        hitSlop={8}
      >
        <X size={14} color="#9CA3AF" />
      </Pressable>
    </View>
  );
}

export default DemoNotice;
