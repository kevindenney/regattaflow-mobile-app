import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { OrganizationBrowserPage } from '@/components/landing/OrganizationBrowserPage';

export default function KnittingOrgPage() {
  const { orgSlug } = useLocalSearchParams<{ orgSlug: string }>();
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle =
    Platform.OS === 'web'
      ? [styles.container, styles.webContainer]
      : styles.container;

  return (
    <Container style={containerStyle}>
      <OrganizationBrowserPage interestSlug="knitting" orgSlug={orgSlug!} />
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
