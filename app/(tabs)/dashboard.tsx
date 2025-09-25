/**
 * Dashboard Tab - Main user dashboard with stats and recent events
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  console.log('📊 Dashboard: Component loading - SIMPLIFIED VERSION');
  console.log('🔍 Dashboard: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Simplified test version</Text>
      <Text style={styles.text}>This dashboard is loading successfully!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});