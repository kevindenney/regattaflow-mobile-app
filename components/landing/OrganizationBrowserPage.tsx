import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SimpleLandingNav } from './SimpleLandingNav';
import { ScrollFix } from './ScrollFix';
import { GroupSection } from './GroupSection';
import { PersonTimelineRow } from './PersonTimelineRow';
import { SubscribeCTA } from './SubscribeCTA';
import { getInterest, getOrganization, type SampleCohort } from '@/lib/landing/sampleData';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganizationBlueprints, useBlueprintSteps, useSubscribe, useBlueprintSubscription } from '@/hooks/useBlueprint';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import type { BlueprintRecord } from '@/types/blueprint';
import { organizationDiscoveryService, type OrganizationJoinMode } from '@/services/OrganizationDiscoveryService';
import { useOrgPrograms, useOrgMemberTimelines } from '@/hooks/usePrograms';
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
  const [interestDbId, setInterestDbId] = useState<string | null>(null);
  const [blueprintCount, setBlueprintCount] = useState<number>(0);
  const { data: orgBlueprints } = useOrganizationBlueprints(dbOrgId);
  const publishedOrgBlueprints = orgBlueprints?.filter((bp) => bp.is_published) ?? [];
  const { data: dbPrograms } = useOrgPrograms(dbOrgId);
  const { data: realMemberTimelines } = useOrgMemberTimelines(dbOrgId, interestDbId);

  // Group blueprints by program_id
  const blueprintsByProgram = new Map<string | null, BlueprintRecord[]>();
  for (const bp of publishedOrgBlueprints) {
    const key = bp.program_id ?? null;
    const list = blueprintsByProgram.get(key) ?? [];
    list.push(bp);
    blueprintsByProgram.set(key, list);
  }
  const ungroupedBlueprints = blueprintsByProgram.get(null) ?? [];


  // Look up the real org from DB by matching name/slug
  useEffect(() => {
    if (!isLoggedIn || !org) return;

    const lookupOrg = async () => {
      try {
        // Look up interest_id for blueprint publishing
        const { data: interestRow } = await supabase
          .from('interests')
          .select('id')
          .eq('slug', interestSlug)
          .maybeSingle();
        if (interestRow) setInterestDbId(interestRow.id);

        const results = await organizationDiscoveryService.searchOrganizations({ query: org.name, limit: 5 });
        const match = results.find(
          (r) => r.slug === orgSlug || r.name.toLowerCase() === org.name.toLowerCase()
        );
        console.log('[OrgBrowserPage] Org match:', match ? { id: match.id, slug: match.slug, join_mode: match.join_mode } : 'NONE');
        if (match) {
          setDbOrgId(match.id);
          setJoinMode(match.join_mode);

          // Fetch blueprint count (bypasses RLS for non-members)
          const { data: countData, error: countErr } = await supabase.rpc('get_org_blueprint_count', {
            org_uuid: match.id,
          });
          console.log('[OrgBrowserPage] Blueprint count RPC:', { countData, countErr });
          if (typeof countData === 'number') setBlueprintCount(countData);

          // Check existing membership
          const { data: membership } = await supabase
            .from('organization_memberships')
            .select('membership_status,status')
            .eq('organization_id', match.id)
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('[OrgBrowserPage] Membership check:', membership);
          if (membership && membership.length > 0) {
            const status = membership[0].membership_status || membership[0].status;
            if (status === 'active') setJoinState('joined');
            else if (status === 'pending') setJoinState('pending');
          }
        }
      } catch (err) {
        console.error('[OrgBrowserPage] Error in lookupOrg:', err);
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
      console.log('[OrgBrowserPage] requestJoin:', { orgId: dbOrgId, mode: joinMode });
      const result = await organizationDiscoveryService.requestJoin({ orgId: dbOrgId, mode: joinMode! });
      console.log('[OrgBrowserPage] requestJoin result:', result);
      if (result.status === 'active' || result.status === 'existing') {
        setJoinState('joined');
        showAlert('Joined', `You've joined ${org!.name}. Welcome!`);
      } else if (result.status === 'pending') {
        setJoinState('pending');
        showAlert('Request Sent', `Your request to join ${org!.name} has been sent. An admin will review it.`);
      } else {
        showAlert('Unable to Join', result.message || 'Could not complete the request.');
      }
    } catch (err: any) {
      console.error('[OrgBrowserPage] requestJoin error:', err);
      const msg = err?.message || '';
      if (msg.includes('restricted to approved email domains')) {
        showAlert('Email Domain Restricted', `${org!.name} is restricted to approved email domains. Contact the organization for access.`);
      } else {
        showAlert('Error', msg || 'Something went wrong. Please try again.');
      }
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
          <View style={styles.heroActions}>
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
      </View>

      {/* DB Programs with associated blueprints and real member timelines */}
      {dbPrograms && dbPrograms.length > 0 && dbPrograms.some((prog) => blueprintsByProgram.has(prog.id)) && (
        <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
          {dbPrograms
            .filter((prog) => blueprintsByProgram.has(prog.id))
            .map((prog) => {
              const progBlueprints = blueprintsByProgram.get(prog.id) ?? [];
              return (
                <View key={prog.id} style={styles.dbProgramSection}>
                  <View style={styles.dbProgramHeader}>
                    <Ionicons name="school-outline" size={18} color={interest.color} />
                    <Text style={styles.dbProgramTitle}>{prog.title}</Text>
                  </View>
                  {progBlueprints.length > 0 && (
                    <View style={styles.pathwayGrid}>
                      {progBlueprints.map((bp) => (
                        <OrgBlueprintCard
                          key={bp.id}
                          blueprint={bp}
                          accentColor={interest.color}
                          isLoggedIn={isLoggedIn}
                          isMember={joinState === 'joined'}
                          userId={user?.id}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      )}

      {/* Ungrouped pathways (blueprints not associated with a program) */}
      {ungroupedBlueprints.length > 0 && (
        <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
          <Text style={styles.sectionTitle}>Pathways</Text>
          <Text style={styles.sectionSubtitle}>
            Subscribe to a pathway to add its steps to your timeline
          </Text>
          <View style={styles.pathwayGrid}>
            {ungroupedBlueprints.map((bp) => (
              <OrgBlueprintCard
                key={bp.id}
                blueprint={bp}
                accentColor={interest.color}
                isLoggedIn={isLoggedIn}
                isMember={joinState === 'joined'}
                userId={user?.id}
              />
            ))}
          </View>
        </View>
      )}

      {/* Teaser for non-members when blueprints exist but are hidden by RLS */}
      {publishedOrgBlueprints.length === 0 && blueprintCount > 0 && (
        <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
          <Text style={styles.sectionTitle}>Pathways</Text>
          <View style={styles.pathwayTeaser}>
            <Ionicons name="layers-outline" size={24} color={interest.color} />
            <Text style={styles.pathwayTeaserTitle}>
              {blueprintCount} pathway{blueprintCount !== 1 ? 's' : ''} available for members
            </Text>
            <Text style={styles.pathwayTeaserSubtitle}>
              Join {org.name} to browse and subscribe to curated learning pathways
            </Text>
            {joinState === 'idle' && (
              <TouchableOpacity
                style={[styles.pathwayTeaserBtn, { backgroundColor: interest.color }]}
                onPress={handleJoinOrg}
                activeOpacity={0.7}
              >
                <Text style={styles.pathwayTeaserBtnText}>{getJoinButtonLabel()}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Real member timelines */}
      {realMemberTimelines && realMemberTimelines.length > 0 && (
        <View style={[styles.body, isDesktop && styles.bodyDesktop, (publishedOrgBlueprints.length > 0 || blueprintCount > 0) && styles.dividerSection]}>
          <Text style={styles.sectionTitle}>Members</Text>
          <Text style={styles.sectionSubtitle}>
            Real timelines from active members
          </Text>
          {realMemberTimelines.map((member, i) => (
            <PersonTimelineRow
              key={member.person.userId || i}
              person={member.person}
              accentColor={interest.color}
              interestSlug={interestSlug}
              realStepIds={member.stepIds}
              interestId={interestDbId ?? undefined}
            />
          ))}
        </View>
      )}

      {/* Groups */}
      <View style={[styles.body, isDesktop && styles.bodyDesktop, publishedOrgBlueprints.length > 0 && styles.dividerSection]}>
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
              {cohort.isShared && cohort.partnerInterests && cohort.partnerInterests.length > 0 && (
                <View style={styles.sharedBadgeRow}>
                  {cohort.partnerInterests.map((partner) => {
                    const partnerInterest = getInterest(partner.interestSlug);
                    const partnerColor = partnerInterest?.color ?? '#6B7280';
                    return (
                      <TouchableOpacity
                        key={partner.interestSlug}
                        style={[styles.sharedBadge, { backgroundColor: partnerColor + '12', borderColor: partnerColor + '30' }]}
                        onPress={() => partner.orgSlug ? router.push(`/${partner.interestSlug}/${partner.orgSlug}` as any) : undefined}
                        activeOpacity={partner.orgSlug ? 0.7 : 1}
                      >
                        <Ionicons name="git-compare-outline" size={12} color={partnerColor} />
                        <Text style={[styles.sharedBadgeText, { color: partnerColor }]}>
                          Shared with {partner.orgName ?? partner.orgSlug ?? partnerInterest?.name ?? partner.interestSlug}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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

// ---------------------------------------------------------------------------
// OrgBlueprintCard — subscribe card for org page
// ---------------------------------------------------------------------------

function OrgBlueprintCard({
  blueprint,
  accentColor,
  isLoggedIn,
  isMember,
  userId,
}: {
  blueprint: BlueprintRecord;
  accentColor: string;
  isLoggedIn: boolean;
  isMember: boolean;
  userId?: string;
}) {
  const isOwner = !!userId && blueprint.user_id === userId;
  const { data: subscription, isLoading: subLoading } = useBlueprintSubscription(
    isLoggedIn ? blueprint.id : null,
  );
  const { data: steps } = useBlueprintSteps(blueprint.id);
  const subscribeMutation = useSubscribe();
  const isSubscribed = !!subscription;
  const isLocked = blueprint.access_level === 'org_members' && !isMember;

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(auth)/signup' } as any);
      return;
    }
    if (isLocked) {
      showAlert('Members Only', 'Join the organization to access this pathway.');
      return;
    }
    if (isSubscribed || subscribeMutation.isPending) return;
    subscribeMutation.mutate(blueprint.id);
  };

  const handleCardPress = () => {
    if (isLocked) {
      showAlert('Members Only', 'Join the organization to access this pathway.');
      return;
    }
    router.push(`/blueprint/${blueprint.slug}` as any);
  };

  return (
    <TouchableOpacity
      style={[styles.pathwayCard, isSubscribed && { borderColor: accentColor + '60' }]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.pathwayCardHeader}>
        <View style={[styles.pathwayIcon, { backgroundColor: accentColor + '12' }]}>
          <Ionicons
            name={isLocked ? 'lock-closed-outline' : 'document-text-outline'}
            size={24}
            color={accentColor}
          />
        </View>
        <View style={styles.pathwayCardHeaderText}>
          <Text style={styles.pathwayTitle}>{blueprint.title}</Text>
          {blueprint.description && (
            <Text style={styles.pathwayDescription} numberOfLines={2}>
              {blueprint.description}
            </Text>
          )}
        </View>
      </View>

      {/* Mini step timeline */}
      {steps && steps.length > 0 && (
        <View style={styles.miniTimeline}>
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const dotColor = isCompleted ? '#3D8A5A' : isInProgress ? '#D4A64A' : '#CBD5E1';
            return (
              <View key={step.id} style={styles.miniTimelineStep}>
                <View style={styles.miniTimelineStepRow}>
                  <View style={[styles.miniTimelineDot, { backgroundColor: dotColor }]} />
                  {idx < steps.length - 1 && (
                    <View style={[styles.miniTimelineLine, isCompleted ? { backgroundColor: '#3D8A5A' } : {}]} />
                  )}
                </View>
                <Text style={styles.miniTimelineLabel} numberOfLines={1}>{step.title}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.pathwayFooter}>
        {blueprint.subscriber_count > 0 && (
          <Text style={styles.pathwayMeta}>
            {blueprint.subscriber_count} subscriber{blueprint.subscriber_count !== 1 ? 's' : ''}
          </Text>
        )}
        {isOwner ? (
          <View style={[styles.pathwayBadge, { backgroundColor: accentColor + '12', borderColor: accentColor }]}>
            <Text style={[styles.pathwayBadgeText, { color: accentColor }]}>Your Pathway</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.pathwayBadge,
              isSubscribed
                ? { backgroundColor: accentColor, borderColor: accentColor }
                : isLocked
                  ? { borderColor: '#CBD5E1' }
                  : { borderColor: accentColor },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              handleSubscribe();
            }}
            activeOpacity={0.7}
          >
            {subLoading || subscribeMutation.isPending ? (
              <ActivityIndicator size="small" color={isSubscribed ? '#FFFFFF' : accentColor} />
            ) : (
              <Text style={[
                styles.pathwayBadgeText,
                { color: isSubscribed ? '#FFFFFF' : isLocked ? '#94A3B8' : accentColor },
              ]}>
                {isSubscribed ? 'Subscribed' : isLocked ? 'Join to Access' : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  followOrgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
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

  // Shared cohort badges
  sharedBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  sharedBadgeText: {
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

  // DB Programs
  dbProgramSection: {
    marginBottom: 24,
  },
  dbProgramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dbProgramTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },

  // Pathways
  pathwayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  pathwayTeaser: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  pathwayTeaserTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  pathwayTeaserSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  pathwayTeaserBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  pathwayTeaserBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pathwayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    width: 320,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  pathwayCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  pathwayCardHeaderText: {
    flex: 1,
  },
  pathwayIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathwayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  pathwayDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  miniTimeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
    marginBottom: 12,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  miniTimelineStep: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  miniTimelineStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  miniTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  miniTimelineLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    top: 4,
  },
  miniTimelineLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 11,
  },
  pathwayFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto' as any,
  },
  pathwayMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pathwayBadge: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pathwayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
