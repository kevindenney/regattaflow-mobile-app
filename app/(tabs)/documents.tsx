/**
 * Documents Tab - SIMPLIFIED TEST VERSION
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function DocumentsScreen() {
  console.log('📄 Documents: SIMPLE TEST VERSION LOADING');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>✅ Documents Component Working!</Text>
        <Text style={styles.subtitle}>This proves routing is now functional</Text>
        <Text style={styles.text}>📄 Simple Documents component successfully rendering</Text>
        <Text style={styles.text}>🔧 Ready to restore full AI functionality</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
});