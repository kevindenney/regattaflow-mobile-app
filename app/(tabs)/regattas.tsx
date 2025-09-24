import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegattasScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Regattas</ThemedText>
        <ThemedText type="subtitle">Manage your racing events</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <ThemedText type="subtitle">📋 Upcoming Events</ThemedText>
          <ThemedText type="default">• Spring Championship - June 15-17</ThemedText>
          <ThemedText type="default">• Club Series Race 3 - June 22</ThemedText>
          <ThemedText type="default">• Laser Masters - July 5-7</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">🏆 Recent Results</ThemedText>
          <ThemedText type="default">• Memorial Day Regatta - 2nd Place</ThemedText>
          <ThemedText type="default">• Spring Series - 1st Overall</ThemedText>
        </View>

        <View style={styles.card}>
          <ThemedText type="subtitle">➕ Quick Actions</ThemedText>
          <ThemedText type="default">• Create new regatta</ThemedText>
          <ThemedText type="default">• Upload sailing instructions</ThemedText>
          <ThemedText type="default">• Add race to calendar</ThemedText>
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