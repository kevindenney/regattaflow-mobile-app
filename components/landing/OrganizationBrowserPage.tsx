import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SimpleLandingNav } from './SimpleLandingNav';
import { ScrollFix } from './ScrollFix';
import { GroupSection } from './GroupSection';
import { PersonTimelineRow } from './PersonTimelineRow';
import { SubscribeCTA } from './SubscribeCTA';
import { getInterest, getOrganization } from '@/lib/landing/sampleData';
import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { organizationDiscoveryService, type OrganizationJoinMode } from '@/services/OrganizationDiscoveryService';
import { supabase } from '@/services/supabase';

interface OrganizationBrowserPageProps {
  interestSlug: string;
  orgSlug: string;
}

export function OrganizationBrowserPage({ interestSlug, orgSlug }: OrganizationBrowserPageProps) {
  const interest = getInterest(interestSlug);
  const org = getOrganization(interestSlug, orgSlug);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;
  const [joinState, setJoinState] = useState<'idle' | 'joined' | 'pending' | 'blocked'>('idle');
  const [joinMode, setJoinMode] = useState<OrganizationJoinMode | null>(null);
  const [dbOrgId, setDbOrgId] = useState<string | null>(null);

  // Look up the real org from DB by matching name/slug
  useEffect(() => {
    if (!isLoggedIn || !org) return;

    const lookupOrg = async () => {
      try {
        const results = await organizationDiscoveryService.searchOrganizations({ query: org.name, limit: 5 });
        const match = results.find(
          (r) => r.slug === orgSlug || r.name.toLowerCase() === org.name.toLowerCase()
        );
        if (match) {
          setDbOrgId(match.id);
          setJoinMode(match.join_mode);

          // Check existing membership
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select('membership_status,status')
            .eq('organization_id', match.id)
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (membership && membership.length > 0) {
            const status = membership[0].membership_status || membership[0].status;
            if (status === 'active') setJoinState('joined');
            else if (status === 'pending') setJoinState('pending');
          }
        }
      } catch {
        // Non-fatal — fall back to local-only UI
      }
    };
    lookupOrg();
  }, [isLoggedIn, org?.name, orgSlug, user?.id]);

  const handleJoinOrg = async () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(auth)/signup', params: { persona: 'club', interest: interestSlug } } as any);
      return;
    }

    if (!dbOrgId) {
      showAlert('Not Available', 'This organization is not yet set up for joining. Check back later.');
      return;
    }

    if (joinMode === 'invite_only') {
      showAlert('Invite Only', `${org!.name} requires an invitation. Contact the organization directly.`);
      return;
    }

    try {
      const result = await organizationDiscoveryService.requestJoin({ orgId: dbOrgId, mode: joinMode! });
      if (result.status === 'active' || result.status === 'existing') {
        setJoinState('joined');
        showAlert('Joined', `You've joined ${org!.name}. Welcome!`);
      } else if (result.status === 'pending') {
        setJoinState('pending');
        showAlert('Request Sent', `Your request to join ${org!.name} has been sent. An admin will review it.`);
      } else {
        showAlert('Unable to Join', result.message || 'Could not complete the request.');
      }
    } catch {
      showAlert('Error', 'Something went wrong. Please try again.');
    }
  };

  const getJoinButtonLabel = () => {
    if (joinState === 'joined') return 'Member';
    if (joinState === 'pending') return 'Request Pending';
    if (!isLoggedIn) return 'Sign Up to Join';
    if (joinMode === 'invite_only') return 'Invite Only';
    if (joinMode === 'request_to_join') return 'Request to Join';
    if (joinMode === 'open_join') return `Join ${org!.name}`;
    // Default when join_mode not yet loaded
    return `Follow ${org!.name}`;
  };

  const isJoinDisabled = joinState === 'joined' || joinState === 'pending';

  if (!interest || !org) {
    return (
      <View style={styles.container}>
        <SimpleLandingNav currentInterestSlug={interestSlug} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Organization not found</Text>
        </View>
      </View>
    );
  }

  const content = (
    <>
      {/* Header */}
      <View style={[styles.hero, { backgroundColor: interest.color }]}>
        <View style={styles.heroContent}>
          {/* Breadcrumbs */}
          <View style={styles.breadcrumbs}>
            <TouchableOpacity onPress={() => router.push('/' as any)}>
              <Text style={styles.breadcrumbLink}>BetterAt</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
            <TouchableOpacity onPress={() => router.push(`/${interestSlug}` as any)}>
              <Text style={styles.breadcrumbLink}>{interest.name}</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.breadcrumbCurrent}>{org.name}</Text>
          </View>

          <Text style={styles.orgName}>{org.name}</Text>
          <Text style={styles.orgMeta}>
            {org.groups.length} {org.groupLabel}
            {org.cohorts ? ` · ${org.cohorts.length} Cohorts` : ''}
            {org.capabilityGoals ? ` · ${org.capabilityGoals.length} Capability Goals` : ''}
          </Text>
          <TouchableOpacity
            style={[
              styles.followOrgBtn,
              isJoinDisabled && styles.followOrgBtnActive,
            ]}
            onPress={handleJoinOrg}
            activeOpacity={isJoinDisabled ? 1 : 0.7}
            disabled={isJoinDisabled}
          >
            <Ionicons
              name={
                joinState === 'joined'
                  ? 'checkmark-circle'
                  : joinState === 'pending'
                    ? 'time-outline'
                    : joinMode === 'invite_only'
                      ? 'lock-closed-outline'
                      : 'add-circle-outline'
              }
              size={16}
              color={isJoinDisabled ? interest.color : '#FFFFFF'}
            />
            <Text style={[styles.followOrgBtnText, isJoinDisabled && { color: interest.color }]}>
              {getJoinButtonLabel()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups */}
      <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
        <Text style={styles.sectionTitle}>{org.groupLabel}</Text>
        {org.groups.map((group, i) => (
          <GroupSection key={i} group={group} accentColor={interest.color} interestSlug={interestSlug} />
        ))}
      </View>

      {/* Cohorts */}
      {org.cohorts && org.cohorts.length > 0 && (
        <View style={[styles.body, isDesktop && styles.bodyDesktop, styles.dividerSection]}>
          <Text style={styles.sectionTitle}>Cohorts</Text>
          <Text style={styles.sectionSubtitle}>
            Students grouped by enrollment semester
          </Text>
          {org.cohorts.map((cohort, i) => (
            <View key={i} style={styles.cohortCard}>
              <View style={styles.cohortHeader}>
                <Ionicons name="people-outline" size={18} color={interest.color} />
                <Text style={styles.cohortName}>{cohort.name}</Text>
                <View style={[styles.cohortBadge, { backgroundColor: interest.color + '15' }]}>
                  <Text style={[styles.cohortBadgeText, { color: interest.color }]}>
                    {cohort.people.length} students
                  </Text>
                </View>
              </View>
              {cohort.people.map((person, j) => (
                <PersonTimelineRow key={j} person={person} accentColor={interest.color} interestSlug={interestSlug} />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Capability Goals */}
      {org.capabilityGoals && org.capabilityGoals.length > 0 && (
        <View style={[styles.body, isDesktop && styles.bodyDesktop, styles.dividerSection]}>
          <Text style={styles.sectionTitle}>Capability Goals</Text>
          <Text style={styles.sectionSubtitle}>
            Cross-cutting competencies tracked across all programs
          </Text>
          {org.capabilityGoals.map((goal, i) => (
            <View key={i} style={styles.capabilityGoal}>
              <View style={styles.capabilityGoalHeader}>
                <Ionicons name="ribbon-outline" size={18} color={interest.color} />
                <Text style={styles.capabilityGoalName}>{goal.name}</Text>
              </View>
              {goal.people.map((person, j) => (
                <PersonTimelineRow key={j} person={person} accentColor={interest.color} interestSlug={interestSlug} />
              ))}
            </View>
          ))}
        </View>
      )}

      <SubscribeCTA accentColor={interest.color} interestSlug={interestSlug} />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollFix />
        <SimpleLandingNav currentInterestSlug={interestSlug} />
        {content}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SimpleLandingNav currentInterestSlug={interestSlug} />
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
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Breadcrumbs
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
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

  orgName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  orgMeta: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  followOrgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  followOrgBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  followOrgBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
  },
  dividerSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 32,
  },

  // Cohorts
  cohortCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cohortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cohortName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  cohortBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cohortBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Capability goals
  capabilityGoal: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  capabilityGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  capabilityGoalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
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
