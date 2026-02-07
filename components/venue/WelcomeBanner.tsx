/**
 * WelcomeBanner - Dismissible onboarding banner for Discuss tab
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';

const DISMISS_KEY = 'discuss-welcome-banner-dismissed';

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISS_KEY).then(val => {
      if (val !== 'true') setVisible(true);
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    AsyncStorage.setItem(DISMISS_KEY, 'true');
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={20} color={IOS_COLORS.systemBlue} />
        <Text style={styles.title}>Welcome to Discuss</Text>
        <Pressable onPress={handleDismiss} hitSlop={12}>
          <Ionicons name="close" size={18} color={IOS_COLORS.tertiaryLabel} />
        </Pressable>
      </View>
      <Text style={styles.body}>
        Your <Text style={styles.bold}>Feed</Text> shows posts from communities you've joined.
        Switch to <Text style={styles.bold}>Communities</Text> to discover and join new ones.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.xs,
    padding: IOS_SPACING.md,
    backgroundColor: '#EFF6FF',
    borderRadius: IOS_RADIUS.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  body: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
});
