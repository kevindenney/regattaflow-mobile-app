import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { SampleProgram, SampleOrganization } from '@/lib/landing/sampleData';
import { getInterest } from '@/lib/landing/sampleData';
import { PersonTimelineRow } from './PersonTimelineRow';

const TYPE_LABELS: Record<SampleProgram['type'], string> = {
  degree: 'Degree',
  certification: 'Certification',
  course: 'Course',
  training: 'Training',
  residency: 'Residency',
  fellowship: 'Fellowship',
  retreat: 'Retreat',
};

interface ProgramCardProps {
  program: SampleProgram;
  organizations: SampleOrganization[];
  interestSlug: string;
  accentColor: string;
}

export function ProgramCard({ program, organizations, interestSlug, accentColor }: ProgramCardProps) {
  const orgLookup = new Map(organizations.map((o) => [o.slug, o]));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.programName}>{program.name}</Text>
        <View style={[styles.typeBadge, { backgroundColor: accentColor + '15' }]}>
          <Text style={[styles.typeBadgeText, { color: accentColor }]}>
            {TYPE_LABELS[program.type]}
          </Text>
        </View>
      </View>

      {program.description && (
        <Text style={styles.description}>{program.description}</Text>
      )}

      {/* Offering organizations */}
      <View style={styles.orgRow}>
        {program.offeredBy.map((ref) => {
          const org = orgLookup.get(ref.orgSlug);
          return (
            <TouchableOpacity
              key={ref.orgSlug}
              style={styles.orgChip}
              onPress={() => router.push(`/${interestSlug}/${ref.orgSlug}` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.orgChipRole}>{ref.role}:</Text>
              <Text style={[styles.orgChipName, { color: accentColor }]}>
                {org?.name ?? ref.orgSlug}
              </Text>
              <Ionicons name="open-outline" size={10} color={accentColor} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Co-hosted with badge */}
      {program.coHostedWith && program.coHostedWith.length > 0 && (
        <View style={styles.coHostRow}>
          {program.coHostedWith.map((partner) => {
            const partnerInterest = getInterest(partner.interestSlug);
            const partnerColor = partnerInterest?.color ?? '#6B7280';
            const partnerOrg = partnerInterest?.organizations.find((o) => o.slug === partner.orgSlug);
            return (
              <TouchableOpacity
                key={partner.orgSlug}
                style={[styles.coHostChip, { backgroundColor: partnerColor + '12', borderColor: partnerColor + '30' }]}
                onPress={() => router.push(`/${partner.interestSlug}/${partner.orgSlug}` as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="git-compare-outline" size={12} color={partnerColor} />
                <Text style={[styles.coHostChipText, { color: partnerColor }]}>
                  Co-hosted with {partnerOrg?.name ?? partner.orgSlug}
                </Text>
                <Text style={[styles.coHostChipRole, { color: partnerColor + '99' }]}>
                  ({partner.role})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Sample people with timelines */}
      {program.samplePeople.length > 0 && (
        <View style={styles.peopleSection}>
          {program.samplePeople.map((person, i) => (
            <PersonTimelineRow
              key={i}
              person={person}
              accentColor={accentColor}
              compact
              interestSlug={interestSlug}
            />
          ))}
        </View>
      )}
    </View>
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
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  programName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  typeBadge: {
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  orgRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  orgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  orgChipRole: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  orgChipName: {
    fontSize: 11,
    fontWeight: '600',
  },
  coHostRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  coHostChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  coHostChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coHostChipRole: {
    fontSize: 11,
    fontWeight: '500',
  },
  peopleSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
});
