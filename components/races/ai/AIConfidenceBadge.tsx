import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AIConfidenceBadgeProps {
  confidence: number;
  showExplanation?: boolean;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTone(confidence: number) {
  if (confidence >= 75) return { label: 'High', color: '#16A34A', bg: '#DCFCE7' };
  if (confidence >= 45) return { label: 'Medium', color: '#CA8A04', bg: '#FEF9C3' };
  return { label: 'Low', color: '#DC2626', bg: '#FEE2E2' };
}

export function AIConfidenceBadge({ confidence, showExplanation = true }: AIConfidenceBadgeProps) {
  const safe = clamp(confidence);
  const tone = getTone(safe);

  return (
    <View style={[styles.container, { backgroundColor: tone.bg }]}> 
      <Text style={[styles.value, { color: tone.color }]}>{safe}%</Text>
      <Text style={[styles.label, { color: tone.color }]}>{tone.label} confidence</Text>
      {showExplanation && (
        <Text style={styles.explanation}>Based on race data quality, weather confidence, and model match to current phase.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 14,
  },
});
