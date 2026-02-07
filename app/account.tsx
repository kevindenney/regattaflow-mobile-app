/**
 * Account Modal Route Shell
 *
 * Root-level route that presents the account screen as a modal.
 * On web, wraps content in a centered overlay since Expo Router's
 * `presentation: 'modal'` renders as a full-page push on web.
 * The actual content lives in AccountModalContent for reusability.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import AccountModalContent from '@/components/account/AccountModalContent';

function WebAccountModal() {
  return (
    <View style={webStyles.overlay}>
      <Pressable
        style={webStyles.backdrop}
        onPress={() => {
          if (router.canGoBack()) router.back();
        }}
      />
      <View style={webStyles.card}>
        <AccountModalContent />
      </View>
    </View>
  );
}

export default function AccountModal() {
  if (Platform.OS === 'web') {
    return <WebAccountModal />;
  }
  return <AccountModalContent />;
}

const webStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: 480,
    maxWidth: '90%',
    maxHeight: '85vh' as any,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F2F2F7',
    // Web shadow
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any)
      : {}),
  },
});
