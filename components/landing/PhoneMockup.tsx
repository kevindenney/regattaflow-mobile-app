import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface PhoneMockupProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export function PhoneMockup({ children, width = 280, height = 560 }: PhoneMockupProps) {
  return (
    <View
      style={[
        styles.frame,
        { width, height },
        Platform.OS === 'web' && (styles.frameWeb as any),
      ]}
    >
      {/* Notch */}
      <View style={styles.notch} />

      {/* Screen area */}
      <View style={styles.screen}>
        {children}
      </View>

      {/* Home indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#1A1A1A',
    borderRadius: 40,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  frameWeb: {
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35), 0 8px 20px rgba(0, 0, 0, 0.2)',
  } as any,
  notch: {
    width: 120,
    height: 24,
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 4,
    zIndex: 10,
  },
  screen: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  homeIndicator: {
    width: 100,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    marginTop: 8,
  },
});
