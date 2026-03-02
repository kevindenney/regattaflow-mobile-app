import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type OnboardingLayoutShellProps = {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: StatusBarStyle;
  contentStyle?: StyleProp<ViewStyle>;
};

export function OnboardingLayoutShell({
  children,
  backgroundColor = '#F8FAFC',
  statusBarStyle = 'dark',
  contentStyle,
}: OnboardingLayoutShellProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style={statusBarStyle} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
