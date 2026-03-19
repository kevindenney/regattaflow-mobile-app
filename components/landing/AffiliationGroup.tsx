import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { SampleAffiliation, SampleOrganization } from '@/lib/landing/sampleData';
import { OrganizationPreviewCard } from './OrganizationPreviewCard';

interface AffiliationGroupProps {
  affiliation: SampleAffiliation;
  organizations: SampleOrganization[];
  interestSlug: string;
  accentColor: string;
}

export function AffiliationGroup({ affiliation, organizations, interestSlug, accentColor }: AffiliationGroupProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const affiliatedOrgs = affiliation.orgSlugs
    .map((slug) => organizations.find((o) => o.slug === slug))
    .filter(Boolean) as SampleOrganization[];

  if (affiliatedOrgs.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.line} />
        <Text style={styles.affiliationName}>{affiliation.name}</Text>
        <View style={styles.line} />
      </View>
      <View style={[styles.orgGrid, isDesktop && styles.orgGridDesktop]}>
        {affiliatedOrgs.map((org) => (
          <OrganizationPreviewCard
            key={org.slug}
            organization={org}
            interestSlug={interestSlug}
            accentColor={accentColor}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  affiliationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orgGrid: {
    gap: 20,
  },
  orgGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
