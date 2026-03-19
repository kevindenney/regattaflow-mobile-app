import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { SampleOrganization } from '@/lib/landing/sampleData';
import { PersonTimelineRow } from './PersonTimelineRow';

interface OrganizationPreviewCardProps {
  organization: SampleOrganization;
  interestSlug: string;
  accentColor: string;
}

export function OrganizationPreviewCard({ organization, interestSlug, accentColor }: OrganizationPreviewCardProps) {
  // Show up to 3 people from the first group as preview
  const previewPeople = organization.groups
    .flatMap((g) => g.people)
    .slice(0, 3);

  const totalPeople = organization.groups.reduce(
    (sum, g) => sum + g.people.length + (g.subgroups?.reduce((s, sg) => s + sg.people.length, 0) ?? 0),
    0,
  );
  const remainingCount = totalPeople - previewPeople.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/${interestSlug}/${organization.slug}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orgName}>{organization.name}</Text>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {organization.groups.length} {organization.groupLabel}
          </Text>
        </View>
      </View>

      <View style={styles.previewList}>
        {previewPeople.map((person, i) => (
          <PersonTimelineRow key={i} person={person} accentColor={accentColor} compact interestSlug={interestSlug} />
        ))}
      </View>

      {remainingCount > 0 && (
        <View style={styles.moreRow}>
          <Text style={styles.moreText}>+ {remainingCount} more people</Text>
          <Ionicons name="arrow-forward" size={14} color={accentColor} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orgName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewList: {
    marginBottom: 4,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  moreText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
