/**
 * InterestCatalogSection — Domain-grouped interest browser for the public landing page.
 * No auth required — uses SAMPLE_INTERESTS for content.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SAMPLE_INTERESTS, INTEREST_DOMAINS } from '@/lib/landing/sampleData';

export function InterestCatalogSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDesktop = mounted && width > 768;

  // Build domain-grouped display from sample data
  const groups = INTEREST_DOMAINS.map((domain) => {
    const interests = domain.slugs
      .map((slug) => SAMPLE_INTERESTS.find((i) => i.slug === slug))
      .filter(Boolean) as typeof SAMPLE_INTERESTS;
    return { ...domain, interests };
  }).filter((g) => g.interests.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>— EXPLORE</Text>
        <Text style={[styles.heading, isDesktop && styles.headingDesktop]}>
          Find your interest
        </Text>
        <Text style={styles.subheading}>
          Whatever you're working to improve, BetterAt gives you structure,
          community, and coaching.
        </Text>

        {groups.map((group) => (
          <View key={group.name} style={styles.domainSection}>
            <View style={styles.domainHeaderRow}>
              <View style={[styles.domainAccent, { backgroundColor: group.color }]} />
              <Text style={styles.domainHeaderText}>{group.name}</Text>
            </View>
            <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
              {group.interests.map((interest) => (
                <TouchableOpacity
                  key={interest.slug}
                  style={[styles.card, isDesktop && styles.cardDesktop]}
                  onPress={() => router.push(`/${interest.slug}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: interest.color + '15' }]}>
                    <Ionicons
                      name={(interest.icon + '-outline') as any}
                      size={24}
                      color={interest.color}
                    />
                  </View>
                  <Text style={styles.cardName}>{interest.name}</Text>
                  <Text style={styles.cardMeta}>
                    {interest.organizations.length} organization
                    {interest.organizations.length !== 1 ? 's' : ''}
                  </Text>
                  {interest.organizations.length > 0 && (
                    <View style={styles.orgList}>
                      {interest.organizations.slice(0, 2).map((org) => (
                        <Text
                          key={org.slug}
                          style={[styles.orgName, { color: interest.color }]}
                          numberOfLines={1}
                        >
                          {org.name}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#FAF8F5',
  },
  inner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: '#9B9B9B',
    marginBottom: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 40,
  },
  headingDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  subheading: {
    fontSize: 15,
    color: '#6B6B6B',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 520,
  },

  domainSection: {
    marginBottom: 32,
  },
  domainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  domainAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  domainHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridDesktop: {
    gap: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    width: '100%',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
      } as any,
    }),
  },
  cardDesktop: {
    width: 'calc(33.333% - 14px)' as any,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: '#9B9B9B',
    marginBottom: 8,
  },
  orgList: {
    gap: 2,
  },
  orgName: {
    fontSize: 13,
    fontWeight: '500',
  },
});
