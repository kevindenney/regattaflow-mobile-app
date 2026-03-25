import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterestBrowserPage } from '@/components/landing/InterestBrowserPage';

export default function PaintingPrintingPage() {
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : styles.container;

  return (
    <Container style={containerStyle}>
      <InterestBrowserPage slug="painting-printing" />
    </Container>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  webContainer: ViewStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webContainer: {
    minHeight: '100vh' as any,
    width: '100%',
  },
});
