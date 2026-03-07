/**
 * Learn Tab - BetterAt Course Catalog
 * Database-backed courses for all interests (sailing, nursing, drawing, fitness).
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { CoachesContent } from '@/components/learn/CoachesContent';
import { IOSSegmentedControl } from '@/components/ui/ios/IOSSegmentedControl';
import { TabScreenToolbar } from '@/components/ui/TabScreenToolbar';
import { useScrollToolbarHide } from '@/hooks/useScrollToolbarHide';
import { useInterest } from '@/providers/InterestProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { useCourses, type BetterAtCourse } from '@/hooks/useBetterAtCourses';
import { useOrganizationSearch } from '@/hooks/useOrganizationSearch';
import { organizationDiscoveryService, type OrganizationJoinMode } from '@/services/OrganizationDiscoveryService';

type LearnSegment = 'courses' | 'coaches';

const LEARN_SEGMENTS = [
  { value: 'courses' as const, label: 'Courses' },
  { value: 'coaches' as const, label: 'Coaches' },
];

export default function LearnScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { signedIn } = useAuth();
  const { memberships, activeOrganizationId, setActiveOrganizationId, refreshMemberships } = useOrganization();
  const [mounted, setMounted] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(0);
  const { toolbarHidden, handleScroll: handleToolbarScroll } = useScrollToolbarHide();
  const [activeSegment, setActiveSegment] = useState<LearnSegment>('courses');
  const [orgQuery, setOrgQuery] = useState('');
  const [joinBusyOrgId, setJoinBusyOrgId] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  const isDesktop = mounted && width > 768;

  const { currentInterest } = useInterest();
  const { data: betterAtCourses, isLoading: betterAtLoading } = useCourses();
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedMemberships = [...memberships].sort((a, b) => {
    const aStatus = String(a.membership_status || a.status || '').toLowerCase();
    const bStatus = String(b.membership_status || b.status || '').toLowerCase();
    const aRank = aStatus === 'active' || aStatus === 'verified' ? 0 : aStatus === 'pending' ? 1 : 2;
    const bRank = bStatus === 'active' || bStatus === 'verified' ? 0 : bStatus === 'pending' ? 1 : 2;
    if (aRank !== bRank) return aRank - bRank;
    return String(a.organization?.name || '').localeCompare(String(b.organization?.name || ''));
  });

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
      Alert.alert('Could not join organization', String(error?.message || 'Please try again.'));
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
            ) : !betterAtCourses || betterAtCourses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={32} color={IOS_COLORS.gray3} />
                <Text style={styles.emptyText}>No courses available yet</Text>
                <Text style={styles.emptySubtext}>
                  Courses for {currentInterest?.name || 'this interest'} are coming soon
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
                            </View>
                            <TouchableOpacity
                              style={[styles.orgActionButton, isActiveOrg && styles.orgActionButtonActive]}
                              onPress={() => setActiveOrganizationId(membership.organization_id)}
                              disabled={isActiveOrg}
                            >
                              <Text style={[styles.orgActionText, isActiveOrg && styles.orgActionTextActive]}>
                                {isActiveOrg ? 'Active' : 'Set active'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>

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
                        return (
                          <View key={org.id} style={styles.orgRow}>
                            <View style={styles.orgRowBody}>
                              <Text style={styles.orgName}>{org.name}</Text>
                              <Text style={styles.orgJoinModeLabel}>{getJoinModeLabel(org.join_mode)}</Text>
                            </View>
                            {isInviteOnly ? (
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
                  <Text style={styles.sectionLabel}>
                    {(currentInterest?.name || 'COURSES').toUpperCase()}
                  </Text>
                  <Text style={styles.sectionCount}>{betterAtCourses.length}</Text>
                </View>
                <View style={styles.coursesList}>
                  {betterAtCourses.map((course) => (
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
        /* Coaches segment */
        <CoachesContent toolbarOffset={toolbarHeight} onScroll={handleToolbarScroll} />
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
        {/* Apple HIG Segmented Control: Courses | Coaches */}
        <View style={styles.segmentedControlContainer}>
          <IOSSegmentedControl
            segments={LEARN_SEGMENTS}
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
  orgHint: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
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
