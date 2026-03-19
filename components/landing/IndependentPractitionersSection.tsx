import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { SamplePerson } from '@/lib/landing/sampleData';
import { PersonTimelineRow } from './PersonTimelineRow';

interface IndependentPractitionersSectionProps {
  people: SamplePerson[];
  interestSlug: string;
  interestName: string;
  accentColor: string;
}

export function IndependentPractitionersSection({
  people,
  interestSlug,
  interestName,
  accentColor,
}: IndependentPractitionersSectionProps) {
  if (people.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Independent Practitioners</Text>
      <View style={styles.card}>
        {people.map((person, i) => (
          <PersonTimelineRow
            key={i}
            person={person}
            accentColor={accentColor}
            compact
            interestSlug={interestSlug}
          />
        ))}
        <View style={styles.ctaRow}>
          <Ionicons name="person-add-outline" size={16} color={accentColor} />
          <Text style={styles.ctaText}>
            Track your own {interestName.toLowerCase()} journey — no organization required.
          </Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: accentColor }]}
            onPress={() => router.push({ pathname: '/(auth)/signup', params: { interest: interestSlug } } as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexWrap: 'wrap',
  },
  ctaText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    minWidth: 200,
  },
  ctaBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  ctaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
