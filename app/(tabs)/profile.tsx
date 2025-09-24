import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        <ThemedText type="subtitle">Settings & Account</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <ThemedText type="subtitle">👤 Sailor Profile</ThemedText>
          <ThemedText type="default">Name: John Sailor</ThemedText>
          <ThemedText type="default">Sail Number: USA 12345</ThemedText>
          <ThemedText type="default">Class: Laser Standard</ThemedText>
          <ThemedText type="default">Club: Bay Area Yacht Club</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">📊 Subscription</ThemedText>
          <ThemedText type="default">Plan: Sailor Pro</ThemedText>
          <ThemedText type="default">Status: Active</ThemedText>
          <ThemedText type="default">Renewal: July 15, 2025</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">🗺️ Offline Maps</ThemedText>
          <ThemedText type="default">• San Francisco Bay (125 MB)</ThemedText>
          <ThemedText type="default">• Monterey Bay (89 MB)</ThemedText>
          <ThemedText type="default">+ Download new area</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">⚙️ Settings</ThemedText>
          <ThemedText type="default">• Notifications</ThemedText>
          <ThemedText type="default">• Units (Metric/Imperial)</ThemedText>
          <ThemedText type="default">• Data sync preferences</ThemedText>
          <ThemedText type="default">• Privacy settings</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">📱 App Info</ThemedText>
          <ThemedText type="default">Version: 1.0.0</ThemedText>
          <ThemedText type="default">Build: 24091501</ThemedText>
          <ThemedText type="default">• Help & Support</ThemedText>
          <ThemedText type="default">• Terms of Service</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
});