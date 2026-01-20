/**
 * InputMethodTabs Component
 *
 * Segmented control for selecting document input method.
 * Mobile-first: URL tab is first (easiest to paste from email/browser).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, FileText, ClipboardPaste } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

export type InputMethod = 'url' | 'paste' | 'upload';

interface InputMethodTabsProps {
  activeMethod: InputMethod;
  onMethodChange: (method: InputMethod) => void;
  disabled?: boolean;
}

export function InputMethodTabs({
  activeMethod,
  onMethodChange,
  disabled = false,
}: InputMethodTabsProps) {
  const tabs: Array<{ method: InputMethod; label: string; icon: React.ReactNode }> = [
    {
      method: 'url',
      label: 'URL',
      icon: <Link size={14} color={activeMethod === 'url' ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel} />,
    },
    {
      method: 'paste',
      label: 'Paste',
      icon: <ClipboardPaste size={14} color={activeMethod === 'paste' ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel} />,
    },
    {
      method: 'upload',
      label: 'PDF',
      icon: <FileText size={14} color={activeMethod === 'upload' ? IOS_COLORS.blue : TUFTE_FORM_COLORS.secondaryLabel} />,
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.method}
          style={[
            styles.tab,
            activeMethod === tab.method && styles.tabActive,
            disabled && styles.tabDisabled,
          ]}
          onPress={() => !disabled && onMethodChange(tab.method)}
          disabled={disabled}
        >
          {tab.icon}
          <Text
            style={[
              styles.tabText,
              activeMethod === tab.method && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: IOS_COLORS.blue,
  },
  tabDisabled: {
    opacity: 0.5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  tabTextActive: {
    color: IOS_COLORS.blue,
  },
});

export default InputMethodTabs;
