import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SimpleLandingNav } from './SimpleLandingNav';
import { ScrollFix } from './ScrollFix';
import { OrganizationPreviewCard } from './OrganizationPreviewCard';
import { ProgramCard } from './ProgramCard';
import { AffiliationGroup } from './AffiliationGroup';
import { IndependentPractitionersSection } from './IndependentPractitionersSection';
import { SubscribeCTA } from './SubscribeCTA';
import { getInterest } from '@/lib/landing/sampleData';
import { useInterest } from '@/providers/InterestProvider';
import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { supabase } from '@/services/supabase';

interface InterestBrowserPageProps {
  slug: string;
}

export function InterestBrowserPage({ slug }: InterestBrowserPageProps) {
  const interest = getInterest(slug);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { userInterests, allInterests, addInterest, switchInterest, currentInterest, refreshInterests } = useInterest();
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;
  const isInUserInterests = userInterests.some((i) => i.slug === slug);
  const existsInDb = allInterests.some((i) => i.slug === slug);
  const isCurrent = currentInterest?.slug === slug;

  const handleAddInterest = async () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(auth)/signup', params: { interest: slug } } as any);
      return;
    }
    try {
      if (existsInDb) {
        // If hidden, un-hide it first
        if (!isInUserInterests) {
          await addInterest(slug);
        }
        await switchInterest(slug);
        showAlert('Interest Active', `${interest?.name ?? slug} is now your active interest.`);
      } else {
        // Interest exists in sample data but not yet in DB — create it
        const { data: created, error } = await supabase
          .from('interests')
          .insert({
            slug,
            name: interest?.name ?? slug,
            status: 'active',
            visibility: 'public',
            type: 'official',
            accent_color: interest?.color ?? '#4338CA',
            icon_name: interest?.icon ?? 'compass',
          })
          .select('id, slug')
          .single();

        if (error) {
          console.warn('[InterestBrowserPage] Could not create interest:', error.message);
          showAlert('Coming Soon', `${interest?.name ?? slug} will be available as an interest soon.`);
          return;
        }

        // Refresh interests from DB, then switch
        await refreshInterests();
        // Small delay for the query to propagate
        setTimeout(async () => {
          try {
            await switchInterest(slug);
          } catch {
            // May not be available yet in the provider cache
          }
        }, 500);
        showAlert('Interest Added', `${interest?.name ?? slug} has been added and is now active.`);
      }
    } catch (err) {
      console.warn('[InterestBrowserPage] handleAddInterest error:', err);
      showAlert('Error', 'Could not add interest. Please try again.');
    }
  };

  if (!interest) {
    return (
      <View style={styles.container}>
        <SimpleLandingNav />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Interest not found</Text>
        </View>
      </View>
    );
  }

  const content = (
    <>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: interest.color }]}>
        <View style={styles.heroContent}>
          {/* Breadcrumbs */}
          <View style={styles.breadcrumbs}>
            <TouchableOpacity onPress={() => router.push('/' as any)}>
              <Text style={styles.breadcrumbLink}>BetterAt</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.breadcrumbCurrent}>{interest.name}</Text>
          </View>

          <Text style={styles.interestName}>{interest.name}</Text>
          <Text style={styles.interestDesc}>
            Explore programs, organizations, and see how people progress through{' '}
            {interest.name.toLowerCase()} with structured timelines.
          </Text>
          {isLoggedIn && (
            <TouchableOpacity
              style={[
                styles.addInterestBtn,
                isCurrent && styles.addInterestBtnAdded,
              ]}
              onPress={isCurrent ? undefined : handleAddInterest}
              activeOpacity={isCurrent ? 1 : 0.7}
              disabled={isCurrent}
            >
              <Ionicons
                name={isCurrent ? 'checkmark-circle' : isInUserInterests ? 'swap-horizontal' : 'add-circle-outline'}
                size={18}
                color={isCurrent ? interest.color : '#FFFFFF'}
              />
              <Text style={[styles.addInterestBtnText, isCurrent && { color: interest.color }]}>
                {isCurrent
                  ? 'Active Interest'
                  : isInUserInterests
                    ? `Switch to ${interest.name}`
                    : `Add ${interest.name} to My Interests`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
        {/* Programs & Offerings (only when enriched data exists) */}
        {interest.programs && interest.programs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Programs & Offerings</Text>
            <View style={styles.programGrid}>
              {interest.programs.map((program) => (
                <ProgramCard
                  key={program.slug}
                  program={program}
                  organizations={interest.organizations}
                  interestSlug={slug}
                  accentColor={interest.color}
                />
              ))}
            </View>
          </View>
        )}

        {/* Organizations — grouped by affiliation if available, flat grid otherwise */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organizations</Text>
          {interest.affiliations && interest.affiliations.length > 0 ? (
            <>
              {interest.affiliations.map((aff) => (
                <AffiliationGroup
                  key={aff.name}
                  affiliation={aff}
                  organizations={interest.organizations}
                  interestSlug={slug}
                  accentColor={interest.color}
                />
              ))}
              {/* Render unaffiliated orgs standalone */}
              {(() => {
                const affiliatedSlugs = new Set(interest.affiliations.flatMap((a) => a.orgSlugs));
                const unaffiliated = interest.organizations.filter((o) => !affiliatedSlugs.has(o.slug));
                if (unaffiliated.length === 0) return null;
                return (
                  <View style={[styles.orgGrid, isDesktop && styles.orgGridDesktop]}>
                    {unaffiliated.map((org) => (
                      <OrganizationPreviewCard
                        key={org.slug}
                        organization={org}
                        interestSlug={slug}
                        accentColor={interest.color}
                      />
                    ))}
                  </View>
                );
              })()}
            </>
          ) : (
            <View style={[styles.orgGrid, isDesktop && styles.orgGridDesktop]}>
              {interest.organizations.map((org) => (
                <OrganizationPreviewCard
                  key={org.slug}
                  organization={org}
                  interestSlug={slug}
                  accentColor={interest.color}
                />
              ))}
            </View>
          )}
        </View>

        {/* Independent Practitioners */}
        {interest.independentPractitioners && interest.independentPractitioners.length > 0 && (
          <IndependentPractitionersSection
            people={interest.independentPractitioners}
            interestSlug={slug}
            interestName={interest.name}
            accentColor={interest.color}
          />
        )}
      </View>

      <SubscribeCTA accentColor={interest.color} interestSlug={slug} />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollFix />
        <SimpleLandingNav currentInterestSlug={slug} />
        {content}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SimpleLandingNav currentInterestSlug={slug} />
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  hero: {
    paddingTop: 100,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  breadcrumbLink: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textDecorationLine: 'underline',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  breadcrumbCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  interestName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  interestDesc: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 600,
    lineHeight: 26,
  },
  body: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    padding: 24,
  },
  bodyDesktop: {
    padding: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  programGrid: {
    gap: 20,
  },
  orgGrid: {
    gap: 20,
  },
  orgGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addInterestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  addInterestBtnAdded: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  addInterestBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  notFoundText: {
    fontSize: 18,
    color: '#6B7280',
  },
});
