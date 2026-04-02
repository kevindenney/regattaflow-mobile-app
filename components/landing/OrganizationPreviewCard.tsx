import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { SampleOrganization } from '@/lib/landing/sampleData';
import { PersonTimelineRow } from './PersonTimelineRow';
import type { BlueprintRecord } from '@/types/blueprint';

interface OrganizationPreviewCardProps {
  organization: SampleOrganization;
  interestSlug: string;
  accentColor: string;
  blueprints?: BlueprintRecord[];
}

export function OrganizationPreviewCard({ organization, interestSlug, accentColor, blueprints = [] }: OrganizationPreviewCardProps) {

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
            {organization.groups.length > 0
              ? `${organization.groups.length} ${organization.groupLabel}`
              : blueprints.length > 0
                ? `${blueprints.length} Pathway${blueprints.length !== 1 ? 's' : ''}`
                : ''}
          </Text>
        </View>
      </View>

      {/* Pathways (real blueprints or teaser for hidden ones) */}
      {blueprints.length > 0 && (() => {
        const visible = blueprints.filter((bp) => bp.title);
        const hiddenCount = blueprints.length - visible.length;
        return (
          <View style={styles.pathwaySection}>
            <View style={styles.pathwayHeader}>
              <Ionicons name="layers-outline" size={13} color={accentColor} />
              <Text style={[styles.pathwayLabel, { color: accentColor }]}>
                {blueprints.length} Pathway{blueprints.length !== 1 ? 's' : ''}
              </Text>
            </View>
            {visible.map((bp) => (
              <TouchableOpacity
                key={bp.id}
                style={styles.pathwayRow}
                onPress={() => router.push(`/blueprint/${bp.slug}` as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="layers" size={12} color={accentColor} />
                <Text style={styles.pathwayTitle} numberOfLines={1}>{bp.title}</Text>
                <Text style={styles.pathwaySubs}>
                  {bp.subscriber_count} sub{bp.subscriber_count !== 1 ? 's' : ''}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
            {hiddenCount > 0 && (
              <View style={styles.pathwayRow}>
                <Ionicons name="lock-closed-outline" size={12} color="#9CA3AF" />
                <Text style={[styles.pathwayTitle, { color: '#9CA3AF' }]}>
                  {hiddenCount} member-only pathway{hiddenCount !== 1 ? 's' : ''} — join to access
                </Text>
              </View>
            )}
          </View>
        );
      })()}

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
  pathwaySection: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pathwayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  pathwayLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pathwayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 4,
  },
  pathwayTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  pathwaySubs: {
    fontSize: 11,
    color: '#9CA3AF',
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
