import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ResultsRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Results</Text>
      <Text style={styles.text}>Route working from src/app location</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0066CC' },
  text: { fontSize: 16, color: '#333' },
});