import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING } from '@/lib/design-tokens-ios';

export default function SubscriptionSuccessScreen(): React.ReactElement {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: IOS_COLORS.systemGroupedBackground }}>
      <Stack.Screen options={{ title: 'Subscribed', headerShown: false }} />
      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: IOS_SPACING.xl }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: IOS_COLORS.systemGreen,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>

        <Text style={{
          ...IOS_TYPOGRAPHY.title1,
          color: IOS_COLORS.label,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          You're all set!
        </Text>

        <Text style={{
          ...IOS_TYPOGRAPHY.body,
          color: IOS_COLORS.secondaryLabel,
          textAlign: 'center',
          marginBottom: 32,
          maxWidth: 300,
        }}>
          Your subscription is active. All premium features are now unlocked.
        </Text>

        <Pressable
          onPress={() => router.replace('/(tabs)/races')}
          style={{
            backgroundColor: IOS_COLORS.systemBlue,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 32,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>
            Get Started
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
