/**
 * Learn Tab - BetterAt Course Catalog
 * Database-backed courses for all interests (sailing, nursing, drawing, fitness).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS } from '@/components/cards/constants';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { useInterest } from '@/providers/InterestProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useOrgMembers } from '@/hooks/useOrgMembers';
import { useCourses, type BetterAtCourse } from '@/hooks/useBetterAtCourses';
import { useOrganizationSearch } from '@/hooks/useOrganizationSearch';
import { organizationDiscoveryService, type OrganizationJoinMode } from '@/services/OrganizationDiscoveryService';
import { supabase } from '@/services/supabase';
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';
import { isUuid } from '@/utils/uuid';
import { coachRoleLabel } from '@/lib/organizations/roleLabels';

type LearnSegment = 'courses' | 'coaches' | 'people';

const NURSING_COACH_ROLES = new Set([
  'coach',
  'preceptor',
  'instructor',
  'clinical_instructor',
  'evaluator',
  'assessor',
  'admin',
  'manager',
]);
const SAILING_EXTRA_COACH_ROLES = new Set([
  'coordinator',
  'staff',
  'tutor',
  'volunteer',
  // Backward compatibility in case legacy rows still exist.
  'tactician',
  'sailmaker',
  'rigger',
  'race_officer',
  'team_captain',
]);

type OrgStepTemplate = {
  id: string;
  org_id: string;
  interest_slug: string;
  title: string;
  description: string | null;
  step_type: string | null;
  module_ids: string[] | null;
  suggested_competency_ids: string[] | null;
  is_published: boolean;
  created_at: string;
};

type UserCohort = {
  id: string;
  name: string;
  interest_slug: string | null;
};

function normalizeText(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function templateMatchesCohort(template: OrgStepTemplate, cohort: UserCohort): boolean {
  const cohortName = normalizeText(cohort.name);
  if (!cohortName) return false;
  const haystack = `${template.title || ''} ${template.description || ''}`.toLowerCase();
  return (
    haystack.includes(`[${cohortName}]`)
    || haystack.includes(`cohort:${cohortName}`)
    || haystack.includes(cohortName)
  );
}

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { signedIn, user } = useAuth();
  const { memberships, activeOrganizationId, setActiveOrganizationId, refreshMemberships, canManageActiveOrganization } = useOrganization();
  const [mounted, setMounted] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();
  const [activeSegment, setActiveSegment] = useState<LearnSegment>('courses');
  const [orgQuery, setOrgQuery] = useState('');
  const [peopleQuery, setPeopleQuery] = useState('');
  const [joinBusyOrgId, setJoinBusyOrgId] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);
  const [orgTemplates, setOrgTemplates] = useState<OrgStepTemplate[]>([]);
  const [orgTemplatesLoading, setOrgTemplatesLoading] = useState(false);
  const [orgTemplatesError, setOrgTemplatesError] = useState<string | null>(null);
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [userCohorts, setUserCohorts] = useState<UserCohort[]>([]);
  const [userCohortsLoading, setUserCohortsLoading] = useState(false);
  const [userCohortsError, setUserCohortsError] = useState<string | null>(null);

  const isDesktop = mounted && width > 768;

  const { currentInterest } = useInterest();
  const interestSlug = String(currentInterest?.slug || '').trim().toLowerCase();
  const isNursingInterest = interestSlug === 'nursing';
  const isSailingInterest = interestSlug === 'sail-racing' || interestSlug.includes('sail');
  const { data: betterAtCourses, isLoading: betterAtLoading } = useCourses();
  const filteredCourses = useMemo(() => betterAtCourses ?? [], [betterAtCourses]);
  const courseTabLabel = isSailingInterest ? 'Training' : 'Courses';
  const courseSectionLabel = isSailingInterest ? 'Training' : 'Courses';
  const templateSectionLabel = isNursingInterest
    ? 'Recommended from your program'
    : isSailingInterest
      ? 'Recommended drills & playbooks'
      : 'Recommended for your organization';
  const learnSegments = useMemo(
    () => [
      { value: 'courses' as const, label: courseTabLabel },
      { value: 'coaches' as const, label: 'Coaches' },
      { value: 'people' as const, label: 'People' },
    ],
    [courseTabLabel]
  );
  const {
    results: organizationResults,
    loading: organizationSearchLoading,
    errorText: organizationSearchError,
    refresh: refreshOrganizationSearch,
  } = useOrganizationSearch({
    query: orgQuery,
    enabled: activeSegment === 'courses' && signedIn,
    limit: 16,
  });
  const {
    members: orgMembers,
    loading: orgMembersLoading,
    error: orgMembersError,
    hasMore: orgMembersHasMore,
    retry: retryOrgMembers,
  } = useOrgMembers({
    organizationId: activeOrganizationId,
    enabled: activeSegment === 'coaches' || activeSegment === 'people',
    limit: 200,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadOrgTemplates = async () => {
      if (!activeOrganizationId || !isUuid(activeOrganizationId) || !interestSlug) {
        if (!cancelled) {
          setOrgTemplates([]);
          setOrgTemplatesError(null);
          setOrgTemplatesLoading(false);
        }
        return;
      }

      setOrgTemplatesLoading(true);
      setOrgTemplatesError(null);
      try {
        const { data, error } = await supabase
          .from('betterat_org_step_templates')
          .select('id,org_id,interest_slug,title,description,step_type,module_ids,suggested_competency_ids,is_published,created_at')
          .eq('org_id', activeOrganizationId)
          .eq('interest_slug', interestSlug)
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          throw error;
        }
        if (!cancelled) {
          setOrgTemplates((data || []) as OrgStepTemplate[]);
        }
      } catch (templateError: any) {
        if (!cancelled) {
          setOrgTemplates([]);
          setOrgTemplatesError(templateError?.message || 'Could not load recommendations.');
        }
      } finally {
        if (!cancelled) {
          setOrgTemplatesLoading(false);
        }
      }
    };

    if (activeSegment === 'courses') {
      void loadOrgTemplates();
    }

    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, activeSegment, interestSlug]);

  useEffect(() => {
    let cancelled = false;

    const loadUserCohorts = async () => {
      if (!signedIn || !user?.id || !isUuid(user.id) || !activeOrganizationId || !isUuid(activeOrganizationId)) {
        if (!cancelled) {
          setUserCohorts([]);
          setUserCohortsError(null);
          setUserCohortsLoading(false);
        }
        return;
      }

      setUserCohortsLoading(true);
      setUserCohortsError(null);
      try {
        const { data: memberRows, error: memberError } = await supabase
          .from('betterat_org_cohort_members')
          .select('cohort_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;

        const cohortIds = Array.from(
          new Set(
            (memberRows || [])
              .map((row: any) => String(row.cohort_id || ''))
              .filter((id) => isUuid(id))
          )
        );

        if (cohortIds.length === 0) {
          if (!cancelled) {
            setUserCohorts([]);
          }
          return;
        }

        const { data: cohortRows, error: cohortError } = await supabase
          .from('betterat_org_cohorts')
          .select('id,name,interest_slug,org_id')
          .eq('org_id', activeOrganizationId)
          .in('id', cohortIds);

        if (cohortError) throw cohortError;

        const normalized = (cohortRows || []).map((row: any) => ({
          id: String(row.id),
          name: String(row.name || 'Cohort'),
          interest_slug: typeof row.interest_slug === 'string' ? row.interest_slug : null,
        }));

        if (!cancelled) {
          setUserCohorts(normalized);
        }
      } catch (error: any) {
        if (!cancelled) {
          setUserCohorts([]);
          setUserCohortsError(error?.message || 'Could not load cohort context.');
        }
      } finally {
        if (!cancelled) {
          setUserCohortsLoading(false);
        }
      }
    };

    if (activeSegment === 'courses') {
      void loadUserCohorts();
    }

    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, activeSegment, signedIn, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadPendingAccessCount = async () => {
      if (
        activeSegment !== 'courses'
        || !canManageActiveOrganization
        || !activeOrganizationId
        || !isUuid(activeOrganizationId)
      ) {
        if (!cancelled) {
          setPendingAccessCount(0);
        }
        return;
      }

      try {
        let { count, error } = await supabase
          .from('organization_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', activeOrganizationId)
          .eq('membership_status', 'pending');
        if (error && isMissingSupabaseColumn(error, 'organization_memberships.membership_status')) {
          const fallback = await supabase
            .from('organization_memberships')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', activeOrganizationId)
            .eq('status', 'pending');
          count = fallback.count;
          error = fallback.error;
        }
        if (error) throw error;
        if (!cancelled) {
          setPendingAccessCount(count || 0);
        }
      } catch {
        if (!cancelled) {
          setPendingAccessCount(0);
        }
      }
    };

    void loadPendingAccessCount();
    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, activeSegment, canManageActiveOrganization]);

  const sortedMemberships = [...memberships].sort((a, b) => {
    const aStatus = String(a.membership_status || a.status || '').toLowerCase();
    const bStatus = String(b.membership_status || b.status || '').toLowerCase();
    const aRank = aStatus === 'active' || aStatus === 'verified' ? 0 : aStatus === 'pending' ? 1 : 2;
    const bRank = bStatus === 'active' || bStatus === 'verified' ? 0 : bStatus === 'pending' ? 1 : 2;
    if (aRank !== bRank) return aRank - bRank;
    return String(a.organization?.name || '').localeCompare(String(b.organization?.name || ''));
  });
  const membershipsByOrgId = useMemo(
    () => new Map(sortedMemberships.map((membership) => [membership.organization_id, membership])),
    [sortedMemberships]
  );

  const handleJoinOrganization = async (orgId: string, mode: OrganizationJoinMode) => {
    if (joinBusyOrgId) return;
    setJoinBusyOrgId(orgId);
    setJoinNotice(null);
    try {
      const result = await organizationDiscoveryService.requestJoin({orgId, mode});
      setJoinNotice(result.message);
      await refreshMemberships();
      await refreshOrganizationSearch();
    } catch (error: any) {
      setJoinNotice(String(error?.message || 'Could not send request. Please try again.'));
    } finally {
      setJoinBusyOrgId(null);
    }
  };

  const getJoinModeLabel = (mode: OrganizationJoinMode): string => {
    if (mode === 'open_join') return 'Open join';
    if (mode === 'request_to_join') return 'Request to join';
    return 'Invite only';
  };

  const getMembershipStatusLabel = (status: string | null | undefined): string => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active' || normalized === 'verified') return 'Active';
    if (normalized === 'pending' || normalized === 'invited') return 'Pending';
    if (normalized === 'rejected') return 'Rejected';
    return 'Inactive';
  };

  const handleBetterAtCoursePress = (course: BetterAtCourse) => {
    router.push({
      pathname: '/(tabs)/learn/[courseId]',
      params: { courseId: course.id },
    });
  };

  const coachRoleSet = useMemo(() => {
    if (isSailingInterest) {
      return new Set<string>([...NURSING_COACH_ROLES, ...SAILING_EXTRA_COACH_ROLES]);
    }
    return NURSING_COACH_ROLES;
  }, [isSailingInterest]);

  const coaches = useMemo(
    () => orgMembers.filter((member) => coachRoleSet.has(member.role.toLowerCase())),
    [coachRoleSet, orgMembers]
  );

  const filteredPeople = useMemo(() => {
    const query = peopleQuery.trim().toLowerCase();
    if (!query) return orgMembers;
    return orgMembers.filter((member) => {
      return (
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.status.toLowerCase().includes(query) ||
        (member.email || '').toLowerCase().includes(query)
      );
    });
  }, [orgMembers, peopleQuery]);

  const isMemberActive = (status: string) => status === 'active' || status === 'verified';
  const statusLabel = (status: string) => (isMemberActive(status) ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive');
  const prioritizedOrgTemplates = useMemo(() => {
    if (!orgTemplates.length || !userCohorts.length) return orgTemplates;
    const withRank = orgTemplates.map((template) => {
      const linked = userCohorts.some((cohort) => templateMatchesCohort(template, cohort));
      return { template, linked };
    });

    return withRank
      .sort((a, b) => Number(b.linked) - Number(a.linked))
      .map((entry) => entry.template);
  }, [orgTemplates, userCohorts]);

  return (
    <View style={styles.container}>
      {/* Scroll content first — flows behind absolutely-positioned toolbar */}
      {activeSegment === 'courses' ? (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]} onScroll={handleToolbarScroll} scrollEventThrottle={16}>
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {betterAtLoading ? (
              <View style={styles.betterAtLoading}>
                <ActivityIndicator size="large" color={currentInterest?.accent_color || IOS_COLORS.systemBlue} />
              </View>
            ) : !filteredCourses || filteredCourses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={32} color={IOS_COLORS.gray3} />
                <Text style={styles.emptyText}>No {courseSectionLabel.toLowerCase()} available yet</Text>
                <Text style={styles.emptySubtext}>
                  {courseSectionLabel} for {currentInterest?.name || 'this interest'} are coming soon
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.orgSection}>
                  <Text style={styles.orgSectionTitle}>Your Organizations</Text>
                  {sortedMemberships.length === 0 ? (
                    <Text style={styles.orgHint}>No organizations yet.</Text>
                  ) : (
                    <View style={styles.orgList}>
                      {sortedMemberships.map((membership) => {
                        const statusText = getMembershipStatusLabel(membership.membership_status || membership.status);
                        const normalizedStatus = String(membership.membership_status || membership.status || '').toLowerCase();
                        const isPending = normalizedStatus === 'pending' || normalizedStatus === 'invited';
                        const isActiveOrg = activeOrganizationId === membership.organization_id;
                        return (
                          <View key={membership.id} style={styles.orgRow}>
                            <View style={styles.orgRowBody}>
                              <Text style={styles.orgName}>{membership.organization?.name || 'Organization'}</Text>
                              <View style={styles.orgMetaRow}>
                                <Text style={styles.orgMetaText}>{statusText}</Text>
                                <Text style={styles.orgMetaDot}>·</Text>
                                <Text style={styles.orgMetaText}>{membership.role}</Text>
                              </View>
                              {isPending ? (
                                <Text style={styles.orgPendingHelper}>Awaiting approval</Text>
                              ) : null}
                            </View>
                            {isPending ? (
                              <View style={[styles.inviteRequiredPill, styles.pendingPill]}>
                                <Text style={[styles.inviteRequiredText, styles.pendingPillText]}>Pending</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={[styles.orgActionButton, isActiveOrg && styles.orgActionButtonActive]}
                                onPress={() => setActiveOrganizationId(membership.organization_id)}
                                disabled={isActiveOrg}
                              >
                                <Text style={[styles.orgActionText, isActiveOrg && styles.orgActionTextActive]}>
                                  {isActiveOrg ? 'Current' : 'Use this org'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

                {canManageActiveOrganization && activeOrganizationId && isUuid(activeOrganizationId) ? (
                  <View style={styles.orgSection}>
                    <Text style={styles.orgSectionTitle}>Admin tools</Text>
                    <View style={styles.adminToolsList}>
                      <TouchableOpacity style={styles.adminToolRow} onPress={() => router.push('/organization/access-requests')}>
                        <Text style={styles.adminToolLabel}>Access requests</Text>
                        <View style={styles.adminToolRight}>
                          {pendingAccessCount > 0 ? (
                            <View style={styles.pendingCountBadge}>
                              <Text style={styles.pendingCountText}>{pendingAccessCount}</Text>
                            </View>
                          ) : null}
                          <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.adminToolRow} onPress={() => router.push('/organization/members')}>
                        <Text style={styles.adminToolLabel}>Members</Text>
                        <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.adminToolRow} onPress={() => router.push('/organization/cohorts')}>
                        <Text style={styles.adminToolLabel}>Cohorts</Text>
                        <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.adminToolRow} onPress={() => router.push('/organization/templates')}>
                        <Text style={styles.adminToolLabel}>Templates</Text>
                        <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={styles.orgSection}>
                  <Text style={styles.orgSectionTitle}>Find an organization</Text>
                  <TextInput
                    style={styles.orgSearchInput}
                    value={orgQuery}
                    onChangeText={setOrgQuery}
                    placeholder="Search by name or slug"
                    placeholderTextColor={IOS_COLORS.tertiaryLabel}
                    autoCapitalize="none"
                  />
                  {joinNotice ? (
                    <Text style={styles.orgNotice}>{joinNotice}</Text>
                  ) : null}
                  {organizationSearchError ? (
                    <Text style={styles.orgError}>{organizationSearchError}</Text>
                  ) : null}
                  {organizationSearchLoading ? (
                    <View style={styles.orgSearchLoading}>
                      <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
                    </View>
                  ) : (
                    <View style={styles.orgList}>
                      {organizationResults.map((org) => {
                        const isInviteOnly = org.join_mode === 'invite_only';
                        const isRequestMode = org.join_mode === 'request_to_join';
                        const isBusy = joinBusyOrgId === org.id;
                        const existingMembership = membershipsByOrgId.get(org.id);
                        const existingStatus = String(existingMembership?.membership_status || existingMembership?.status || '').toLowerCase();
                        const hasPendingMembership = existingStatus === 'pending' || existingStatus === 'invited';
                        const hasActiveMembership = existingStatus === 'active' || existingStatus === 'verified';
                        return (
                          <View key={org.id} style={styles.orgRow}>
                            <View style={styles.orgRowBody}>
                              <Text style={styles.orgName}>{org.name}</Text>
                              <Text style={styles.orgJoinModeLabel}>{getJoinModeLabel(org.join_mode)}</Text>
                            </View>
                            {hasPendingMembership ? (
                              <View style={[styles.orgActionButton, styles.orgActionButtonDisabled]}>
                                <Text style={[styles.orgActionText, styles.orgActionTextDisabled]}>Request sent</Text>
                              </View>
                            ) : hasActiveMembership ? (
                              <View style={[styles.orgActionButton, styles.orgActionButtonDisabled]}>
                                <Text style={[styles.orgActionText, styles.orgActionTextDisabled]}>Member</Text>
                              </View>
                            ) : isInviteOnly ? (
                              <View style={styles.inviteRequiredPill}>
                                <Text style={styles.inviteRequiredText}>Invite required</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.orgActionButton}
                                onPress={() => handleJoinOrganization(org.id, org.join_mode)}
                                disabled={isBusy}
                              >
                                <Text style={styles.orgActionText}>
                                  {isBusy ? 'Saving...' : isRequestMode ? 'Request access' : 'Join'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                      {organizationResults.length === 0 ? (
                        <Text style={styles.orgHint}>No organizations found.</Text>
                      ) : null}
                    </View>
                  )}
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{templateSectionLabel.toUpperCase()}</Text>
                  <Text style={styles.sectionCount}>{prioritizedOrgTemplates.length}</Text>
                </View>
                {userCohortsLoading ? (
                  <View style={styles.orgSearchLoading}>
                    <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
                  </View>
                ) : userCohorts.length > 0 ? (
                  <View style={styles.cohortBadgeRow}>
                    <Text style={styles.cohortBadgeLabel}>{userCohorts.length > 1 ? 'Your cohorts' : 'Your cohort'}</Text>
                    {userCohorts.slice(0, 3).map((cohort) => (
                      <View key={cohort.id} style={styles.cohortPill}>
                        <Text style={styles.cohortPillText}>{cohort.name}</Text>
                      </View>
                    ))}
                    {userCohorts.length > 3 ? (
                      <View style={styles.cohortPill}>
                        <Text style={styles.cohortPillText}>+{userCohorts.length - 3}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : userCohortsError ? (
                  <Text style={styles.orgError}>{userCohortsError}</Text>
                ) : null}
                <View style={styles.coursesList}>
                  {!activeOrganizationId ? (
                    <Text style={styles.orgHint}>Set an active organization to see recommendations.</Text>
                  ) : orgTemplatesLoading ? (
                    <View style={styles.orgSearchLoading}>
                      <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
                    </View>
                  ) : orgTemplatesError ? (
                    <Text style={styles.orgError}>{orgTemplatesError}</Text>
                  ) : prioritizedOrgTemplates.length === 0 ? (
                    <Text style={styles.orgHint}>No published recommendations for this interest yet.</Text>
                  ) : (
                    prioritizedOrgTemplates.map((template) => (
                      <View key={template.id} style={styles.templateRow}>
                        <View style={styles.templateIconContainer}>
                          <Ionicons name="sparkles-outline" size={14} color={IOS_COLORS.systemBlue} />
                        </View>
                        <View style={styles.templateBody}>
                          <Text style={styles.templateTitle}>{template.title}</Text>
                          {template.description ? (
                            <Text style={styles.templateDescription} numberOfLines={2}>
                              {template.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>{courseSectionLabel.toUpperCase()}</Text>
                  <Text style={styles.sectionCount}>{filteredCourses.length}</Text>
                </View>
                <View style={styles.coursesList}>
                  {filteredCourses.map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      style={styles.betterAtCourseRow}
                      onPress={() => handleBetterAtCoursePress(course)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.betterAtCourseAccent,
                        { backgroundColor: currentInterest?.accent_color || '#003DA5' },
                      ]} />
                      <View style={styles.betterAtCourseInfo}>
                        <Text style={styles.betterAtCourseTitle}>{course.title}</Text>
                        {course.description && (
                          <Text style={styles.betterAtCourseDesc} numberOfLines={2}>
                            {course.description}
                          </Text>
                        )}
                        <View style={styles.betterAtCourseMeta}>
                          <Text style={styles.betterAtCourseLevel}>{course.level}</Text>
                          <Text style={styles.betterAtCourseMetaSep}>·</Text>
                          <Text style={styles.betterAtCourseLessons}>
                            {course.lesson_count} {course.lesson_count === 1 ? 'lesson' : 'lessons'}
                          </Text>
                          {course.topic && (
                            <>
                              <Text style={styles.betterAtCourseMetaSep}>·</Text>
                              <Text style={styles.betterAtCourseTopic}>{course.topic}</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.tertiaryLabel} />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: toolbarHeight }]}
          onScroll={handleToolbarScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.content, isDesktop && styles.contentDesktop]}>
            {!activeOrganizationId ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={32} color={IOS_COLORS.gray3} />
                <Text style={styles.emptyText}>No active organization selected</Text>
                <Text style={styles.emptySubtext}>Choose an organization to view members.</Text>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => router.push('/settings/organization-access')}
                >
                  <Text style={styles.primaryActionText}>Open Organization Access</Text>
                </TouchableOpacity>
              </View>
            ) : orgMembersLoading ? (
              <View style={styles.betterAtLoading}>
                <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
              </View>
            ) : orgMembersError ? (
              <View style={styles.emptyState}>
                <Ionicons name="alert-circle-outline" size={32} color={IOS_COLORS.systemRed} />
                <Text style={styles.emptyText}>Could not load members</Text>
                <Text style={styles.orgError}>{orgMembersError}</Text>
                <TouchableOpacity style={styles.primaryActionButton} onPress={retryOrgMembers}>
                  <Text style={styles.primaryActionText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : activeSegment === 'coaches' ? (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>COACHES</Text>
                  <Text style={styles.sectionCount}>{coaches.length}</Text>
                </View>
                <View style={styles.coursesList}>
                  {coaches.map((coach) => (
                    <View key={`${coach.userId}-${coach.role}`} style={styles.memberRow}>
                      <View style={styles.memberRowBody}>
                        <Text style={styles.memberName}>{coach.name}</Text>
                        <View style={styles.memberMetaRow}>
                          <View style={[styles.roleBadge, styles.roleBadgeCoach]}>
                            <Text style={[styles.badgeText, styles.roleBadgeCoachText]}>
                              {coachRoleLabel({ interestSlug, role: coach.role })}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.roleBadge,
                              isMemberActive(coach.status) ? styles.statusBadgeActive : styles.statusBadgePending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                isMemberActive(coach.status) ? styles.statusBadgeActiveText : styles.statusBadgePendingText,
                              ]}
                            >
                              {statusLabel(coach.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.orgActionButton} onPress={() => router.push('/communications')}>
                        <Text style={styles.orgActionText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {coaches.length === 0 ? (
                    <Text style={styles.orgHint}>No coach-role members in this organization yet.</Text>
                  ) : null}
                </View>
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>PEOPLE</Text>
                  <Text style={styles.sectionCount}>{filteredPeople.length}</Text>
                </View>
                <TextInput
                  style={styles.orgSearchInput}
                  value={peopleQuery}
                  onChangeText={setPeopleQuery}
                  placeholder="Search members"
                  placeholderTextColor={IOS_COLORS.tertiaryLabel}
                  autoCapitalize="none"
                />
                {orgMembersHasMore ? <Text style={styles.orgHint}>Showing first 200 members.</Text> : null}
                <View style={styles.coursesList}>
                  {filteredPeople.map((member) => (
                    <View key={`${member.userId}-${member.role}`} style={styles.memberRow}>
                      <View style={styles.memberRowBody}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <View style={styles.memberMetaRow}>
                          <Text style={styles.memberMetaText}>{member.role}</Text>
                          <Text style={styles.memberMetaDot}>·</Text>
                          <Text style={styles.memberMetaText}>{statusLabel(member.status)}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  {filteredPeople.length === 0 ? (
                    <Text style={styles.orgHint}>No matching members.</Text>
                  ) : null}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}

      {/* Toolbar rendered last — absolutely positioned over content */}
      <TabScreenToolbar
        title="Learn"
        topInset={insets.top}
        actions={[
          {
            icon: 'bookmark-outline',
            label: 'Saved courses',
            onPress: () => router.push('/(tabs)/my-learning'),
          },
        ]}
        onMeasuredHeight={setToolbarHeight}
        hidden={toolbarHidden}
      >
        {/* Apple HIG Segmented Control: interest-specific Courses label | Coaches | People */}
        <View style={styles.segmentedControlContainer}>
          <IOSSegmentedControl
            segments={learnSegments}
            selectedValue={activeSegment}
            onValueChange={setActiveSegment}
          />
        </View>
      </TabScreenToolbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  contentDesktop: {
    paddingHorizontal: 24,
  },
  // iOS Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.tertiaryLabel,
  },
  // Course list
  coursesList: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
  },
  // BetterAt DB-backed course styles
  betterAtLoading: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  orgSection: {
    marginBottom: 14,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  orgSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
  },
  orgSearchInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingHorizontal: 10,
    color: IOS_COLORS.label,
  },
  orgList: {
    gap: 8,
  },
  orgRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orgRowBody: {
    flex: 1,
    gap: 2,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  orgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgMetaText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  orgMetaDot: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  orgJoinModeLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  orgActionButton: {
    minHeight: 30,
    minWidth: 82,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  orgActionButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF3',
  },
  orgActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  orgActionTextActive: {
    color: '#15803D',
  },
  inviteRequiredPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  inviteRequiredText: {
    fontSize: 11,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
  },
  pendingPill: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  pendingPillText: {
    color: '#1D4ED8',
  },
  orgHint: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  orgPendingHelper: {
    fontSize: 11,
    color: IOS_COLORS.tertiaryLabel,
  },
  orgNotice: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  orgError: {
    fontSize: 12,
    color: IOS_COLORS.systemRed,
  },
  orgSearchLoading: {
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  adminToolsList: {
    gap: 8,
  },
  adminToolRow: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  adminToolLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  adminToolRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingCountBadge: {
    minWidth: 18,
    borderRadius: 999,
    backgroundColor: IOS_COLORS.systemRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  pendingCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cohortBadgeRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cohortBadgeLabel: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    fontWeight: '600',
    marginRight: 2,
  },
  cohortPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cohortPillText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  templateIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  templateBody: {
    flex: 1,
    gap: 2,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  templateDescription: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 16,
  },
  primaryActionButton: {
    marginTop: 10,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  orgActionButtonDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F8FAFC',
  },
  orgActionTextDisabled: {
    color: IOS_COLORS.secondaryLabel,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  memberRowBody: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberMetaText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  memberMetaDot: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeCoach: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  roleBadgeCoachText: {
    color: '#1D4ED8',
  },
  statusBadgeActive: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  statusBadgeActiveText: {
    color: '#15803D',
  },
  statusBadgePending: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
  },
  statusBadgePendingText: {
    color: '#64748B',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  betterAtCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  betterAtCourseAccent: {
    width: 4,
    height: '80%',
    borderRadius: 2,
    marginRight: 12,
  },
  betterAtCourseInfo: {
    flex: 1,
  },
  betterAtCourseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 3,
  },
  betterAtCourseDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  betterAtCourseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  betterAtCourseLevel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  betterAtCourseMetaSep: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  betterAtCourseLessons: {
    fontSize: 11,
    color: '#64748B',
  },
  betterAtCourseTopic: {
    fontSize: 11,
    color: '#64748B',
  },
});
