/**
 * InterestCatalogPage — Netflix-style interest browser for signed-in users.
 *
 * Shows all available interests with personalized state:
 * - "Added" badge for interests already in the user's list
 * - "Add" button for interests not yet added
 * - Organization cards with join/follow state based on org settings
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SimpleLandingNav } from './SimpleLandingNav';
import { ScrollFix } from './ScrollFix';
import { SAMPLE_INTERESTS } from '@/lib/landing/sampleData';
import { useInterest } from '@/providers/InterestProvider';
import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { supabase } from '@/services/supabase';

export function InterestCatalogPage() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDesktop = mounted && width > 768;

  const { userInterests, allInterests, groupedInterests, addInterest, currentInterest, switchInterest, refreshInterests } = useInterest();
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;

  const userInterestSlugs = new Set(userInterests.map((i) => i.slug));

  const handleAddInterest = async (slug: string, name: string) => {
    if (!isLoggedIn) {
      router.push('/(auth)/signup');
      return;
    }
    try {
      const existsInDb = allInterests.some((i) => i.slug === slug);
      if (existsInDb) {
        const isHidden = !userInterestSlugs.has(slug);
        if (isHidden) await addInterest(slug);
        await switchInterest(slug);
        showAlert('Interest Active', `${name} is now your active interest.`);
      } else {
        // Interest exists in sample data but not in DB — create it
        const sampleInterest = SAMPLE_INTERESTS.find((i) => i.slug === slug);
        const { error } = await supabase
          .from('interests')
          .insert({
            slug,
            name,
            status: 'active',
            visibility: 'public',
            type: 'official',
            accent_color: sampleInterest?.color ?? '#4338CA',
            icon_name: sampleInterest?.icon ?? 'compass',
          });

        if (error) {
          console.warn('[InterestCatalogPage] Could not create interest:', error.message);
          showAlert('Coming Soon', `${name} will be available as an interest soon.`);
          return;
        }
        await refreshInterests();
        setTimeout(async () => {
          try { await switchInterest(slug); } catch {}
        }, 500);
        showAlert('Interest Added', `${name} has been added and is now active.`);
      }
    } catch {
      showAlert('Error', 'Could not add interest. Please try again.');
    }
  };

  const handleBrowse = (slug: string) => {
    router.push(`/${slug}` as any);
  };

  // Merge sample data with DB interests for display
  // Use sample data for rich content (orgs, colors, icons), DB for user state
  const displayInterests = SAMPLE_INTERESTS.map((sample) => {
    const dbInterest = allInterests.find((i) => i.slug === sample.slug);
    return {
      ...sample,
      isAdded: userInterestSlugs.has(sample.slug),
      isCurrent: currentInterest?.slug === sample.slug,
      accentColor: dbInterest?.accent_color || sample.color,
    };
  });

  const addedInterests = displayInterests.filter((i) => i.isAdded);
  const availableInterests = displayInterests.filter((i) => !i.isAdded);

  // Group display interests by domain for sectioned rendering
  const groupInterestsByDomain = (items: typeof displayInterests) => {
    const groups: { domainName: string; domainColor: string; items: typeof displayInterests }[] = [];
    const slugToDomain = new Map<string, { name: string; color: string }>();

    for (const group of groupedInterests) {
      for (const interest of group.interests) {
        slugToDomain.set(interest.slug, { name: group.domain.name, color: group.domain.accent_color });
      }
    }

    const byDomain = new Map<string, typeof displayInterests>();
    const domainOrder: string[] = [];
    for (const item of items) {
      const domain = slugToDomain.get(item.slug);
      const key = domain?.name ?? 'Other';
      if (!byDomain.has(key)) {
        byDomain.set(key, []);
        domainOrder.push(key);
      }
      byDomain.get(key)!.push(item);
    }

    for (const key of domainOrder) {
      const domainItems = byDomain.get(key)!;
      const domain = slugToDomain.get(domainItems[0].slug);
      groups.push({
        domainName: key,
        domainColor: domain?.color ?? '#6B7280',
        items: domainItems,
      });
    }

    return groups;
  };

  const addedGroups = groupInterestsByDomain(addedInterests);
  const availableGroups = groupInterestsByDomain(availableInterests);
  const showDomainHeaders = groupedInterests.length > 1;

  const renderInterestCard = (interest: typeof displayInterests[0], isAdded: boolean) => (
    <View
      key={interest.slug}
      style={[styles.card, isDesktop && styles.cardDesktop]}
    >
      <TouchableOpacity
        onPress={() => handleBrowse(interest.slug)}
        activeOpacity={0.7}
        style={styles.cardTouchArea}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: interest.accentColor + '15' }]}>
            <Ionicons name={(interest.icon + '-outline') as any} size={24} color={interest.accentColor} />
          </View>
          {isAdded && (
            <View style={[styles.addedBadge, { backgroundColor: interest.accentColor + '15' }]}>
              <Ionicons name={interest.isCurrent ? 'radio-button-on' : 'checkmark-circle'} size={14} color={interest.accentColor} />
              <Text style={[styles.addedBadgeText, { color: interest.accentColor }]}>
                {interest.isCurrent ? 'Active' : 'Added'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.cardName}>{interest.name}</Text>
        <Text style={styles.cardMeta}>
          {interest.organizations.length} organization{interest.organizations.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.orgLinks}>
          {interest.organizations.slice(0, 2).map((org) => (
            <TouchableOpacity
              key={org.slug}
              onPress={(e) => {
                e.stopPropagation?.();
                router.push(`/${interest.slug}/${org.slug}` as any);
              }}
            >
              <Text style={[styles.orgLink, { color: interest.accentColor }]} numberOfLines={1}>
                {org.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
      {!isAdded && (
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: interest.accentColor + '40' }]}
          onPress={() => handleAddInterest(interest.slug, interest.name)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={16} color={interest.accentColor} />
          <Text style={[styles.addBtnText, { color: interest.accentColor }]}>
            Switch to {interest.name}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderGroupedSection = (
    groups: ReturnType<typeof groupInterestsByDomain>,
    isAdded: boolean,
  ) =>
    groups.map((group) => (
      <View key={group.domainName}>
        {showDomainHeaders && (
          <View style={styles.domainHeaderRow}>
            <View style={[styles.domainAccent, { backgroundColor: group.domainColor }]} />
            <Text style={styles.domainHeaderText}>{group.domainName}</Text>
          </View>
        )}
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {group.items.map((interest) => renderInterestCard(interest, isAdded))}
        </View>
      </View>
    ));

  const content = (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Explore Interests</Text>
          <Text style={styles.headerSubtitle}>
            Discover new areas to track your progress and follow people and organizations.
          </Text>
        </View>
      </View>

      {/* Your Interests */}
      {addedInterests.length > 0 && (
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Your Interests</Text>
          {renderGroupedSection(addedGroups, true)}
        </View>
      )}

      {/* Available Interests */}
      {availableInterests.length > 0 && (
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>
            {addedInterests.length > 0 ? 'Discover More' : 'All Interests'}
          </Text>
          {renderGroupedSection(availableGroups, false)}
        </View>
      )}
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollFix />
        <SimpleLandingNav />
        {content}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SimpleLandingNav />
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    backgroundColor: '#1A1A1A',
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    maxWidth: 500,
  },

  // Sections
  section: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    padding: 24,
  },
  sectionDesktop: {
    padding: 40,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Domain header
  domainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  domainAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  domainHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grid
  grid: {
    gap: 16,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      } as any,
    }),
  },
  cardDesktop: {
    width: '31%' as any,
    flexGrow: 1,
    flexBasis: 300,
    maxWidth: 380,
  },
  cardTouchArea: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  orgLinks: {
    gap: 4,
  },
  orgLink: {
    fontSize: 14,
    fontWeight: '500',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },

  // Added badge
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  addedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
