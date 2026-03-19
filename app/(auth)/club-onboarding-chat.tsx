/**
 * Club Onboarding Chat Route
 * AI-powered conversational club/organization setup
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import ClubOnboardingChat from '@/components/onboarding/ClubOnboardingChat';
import { getOnboardingContext } from '@/lib/onboarding/interestContext';

export default function ClubOnboardingChatScreen() {
  const { interest } = useLocalSearchParams<{ interest?: string }>();
  const ctx = getOnboardingContext(interest);
  const orgLabel = ctx.organizationLabel;
  const capitalizedOrg = orgLabel.charAt(0).toUpperCase() + orgLabel.slice(1);

  return (
    <>
      <Stack.Screen
        options={{
          title: `${capitalizedOrg} Setup`,
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937' }}>
              AI-Powered {capitalizedOrg} Setup
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              Set up your {orgLabel} in 5 minutes with conversational AI
            </Text>
          </View>

          {/* Chat Interface */}
          <ClubOnboardingChat interestSlug={interest} />
        </View>
      </SafeAreaView>
    </>
  );
}
