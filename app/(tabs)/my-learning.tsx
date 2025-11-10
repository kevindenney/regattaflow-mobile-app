/**
 * My Learning Screen
 *
 * Displays the sailor's personalized learning profile with AI-powered insights,
 * strengths, focus areas, and practice recommendations.
 */

import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RaceLearningInsights } from '@/components/races/RaceLearningInsights';

export default function MyLearningScreen() {
  const router = useRouter();

  const handlePreRaceReminderPress = (reminder: string) => {
    // Could save to race preparation, copy to clipboard, etc.
    console.log('Pre-race reminder pressed:', reminder);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Learning',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1f2937',
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <RaceLearningInsights onPreRaceReminderPress={handlePreRaceReminderPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  backButton: {
    marginLeft: 16,
    padding: 4,
  },
});
