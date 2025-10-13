/**
 * Club Onboarding Chat Route
 * AI-powered conversational club setup
 */

import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import ClubOnboardingChat from '@/src/components/onboarding/ClubOnboardingChat';

export default function ClubOnboardingChatScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Club Setup',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937' }}>
              AI-Powered Club Setup
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
              Set up your club in 5 minutes with conversational AI
            </Text>
          </View>

          {/* Chat Interface */}
          <ClubOnboardingChat />
        </View>
      </SafeAreaView>
    </>
  );
}
