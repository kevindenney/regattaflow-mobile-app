/**
 * JoinInstitutionStrip
 *
 * Shown on the races/timeline tab when the user has no organization membership
 * for the current interest. Links directly to the org page where they can
 * request to join.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getInterest } from '@/lib/landing/sampleData';

const C = {
  bg: 'rgba(37,99,235,0.06)',
  border: 'rgba(37,99,235,0.12)',
  accent: '#2563EB',
  labelMid: '#6D6C6A',
} as const;

interface JoinInstitutionStripProps {
  interestSlug?: string | null;
  hasOrg: boolean;
}

export function JoinInstitutionStrip({ interestSlug, hasOrg }: JoinInstitutionStripProps) {
  const router = useRouter();

  if (hasOrg || !interestSlug) return null;

  const interest = getInterest(interestSlug);
  const orgs = interest?.organizations ?? [];

  if (orgs.length === 0) return null;

  // Link directly to the first org's page if there's only one,
  // otherwise link to the interest browse page
  const target =
    orgs.length === 1
      ? `/${interestSlug}/${orgs[0].slug}`
      : `/${interestSlug}`;

  const label =
    orgs.length === 1
      ? `Join ${orgs[0].name} to access pathways and blueprints`
      : 'Join an institution to access pathways and blueprints';

  return (
    <Pressable
      style={styles.strip}
      onPress={() => router.push(target as any)}
    >
      <Ionicons name="business-outline" size={14} color={C.accent} />
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={C.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
  },
});
