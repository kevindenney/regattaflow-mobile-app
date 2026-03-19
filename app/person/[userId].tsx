import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';
import { findPersonBySlug, type PersonSearchResult, type SampleTimelineStep } from '@/lib/landing/sampleData';
import { SimpleLandingNav } from '@/components/landing/SimpleLandingNav';
import { Footer } from '@/components/landing/Footer';
import { ScrollFix } from '@/components/landing/ScrollFix';
import { PersonTimelineRow } from '@/components/landing/PersonTimelineRow';
import { InterestTimelineCard } from '@/components/profile/InterestTimelineCard';
import { useUserTimeline } from '@/hooks/useTimelineSteps';
import type { TimelineStepRecord } from '@/types/timeline-steps';

// UUID v4 pattern check
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── DB user profile (existing behavior) ─────────────────────────────

type MembershipRow = {
  organization_id: string;
  role: string | null;
  status: string | null;
  membership_status: string | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string | null;
  interest_slug: string | null;
};

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveMembership(row: MembershipRow): boolean {
  const membershipStatus = normalize(row.membership_status);
  const status = normalize(row.status);
  return membershipStatus === 'active' || status === 'active';
}

/** Convert DB TimelineStepRecord status to SampleTimelineStep status */
function toSampleStatus(status: string): SampleTimelineStep['status'] {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'current';
  return 'upcoming';
}

function DbUserProfile({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [name, setName] = useState('Unknown');
  const [email, setEmail] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [organizations, setOrganizations] = useState<Map<string, OrganizationRow>>(new Map());
  const [activities, setActivities] = useState<Array<{ id: string; name: string; date: string | null; venue: string | null }>>([]);
  const timelineQuery = useUserTimeline(userId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorText(null);
      try {
        const userResult = await supabase
          .from('users')
          .select('id,full_name,email')
          .eq('id', userId)
          .maybeSingle();
        if (userResult.error || !userResult.data) throw userResult.error || new Error('User not found');
        if (!cancelled) {
          setName(String((userResult.data as any).full_name || (userResult.data as any).email || userId));
          setEmail((userResult.data as any).email ? String((userResult.data as any).email) : null);
        }

        let membershipResult = await supabase
          .from('organization_memberships')
          .select('organization_id,role,status,membership_status')
          .eq('user_id', userId)
          .limit(3000);
        if (membershipResult.error && isMissingSupabaseColumn(membershipResult.error, 'organization_memberships.membership_status')) {
          membershipResult = await supabase
            .from('organization_memberships')
            .select('organization_id,role,status')
            .eq('user_id', userId)
            .limit(3000);
        }
        if (membershipResult.error) throw membershipResult.error;
        const membershipRows: MembershipRow[] = (membershipResult.data || []).map((row: any) => ({
          organization_id: String(row.organization_id || ''),
          role: row.role ? String(row.role) : null,
          status: row.status ? String(row.status) : null,
          membership_status: row.membership_status ? String(row.membership_status) : null,
        }));
        const activeMemberships = membershipRows.filter(isActiveMembership);
        if (!cancelled) setMemberships(activeMemberships);

        const orgIds = Array.from(new Set(activeMemberships.map((m) => m.organization_id).filter(Boolean)));
        if (orgIds.length > 0) {
          const orgResult = await supabase
            .from('organizations')
            .select('id,name,slug,interest_slug')
            .in('id', orgIds)
            .limit(4000);
          if (orgResult.error) throw orgResult.error;
          const map = new Map<string, OrganizationRow>();
          for (const row of orgResult.data || []) {
            map.set(String((row as any).id), {
              id: String((row as any).id),
              name: String((row as any).name || ''),
              slug: (row as any).slug ? String((row as any).slug) : null,
              interest_slug: (row as any).interest_slug ? String((row as any).interest_slug) : null,
            });
          }
          if (!cancelled) setOrganizations(map);
        } else if (!cancelled) {
          setOrganizations(new Map());
        }

        const activityResult = await supabase
          .from('regattas')
          .select('id,name,start_date,start_area_name')
          .eq('created_by', userId)
          .order('start_date', { ascending: false })
          .limit(20);
        if (!activityResult.error && !cancelled) {
          setActivities(
            (activityResult.data || []).map((row: any) => ({
              id: String(row.id),
              name: String(row.name || 'Untitled Activity'),
              date: row.start_date ? String(row.start_date) : null,
              venue: row.start_area_name ? String(row.start_area_name) : null,
            })),
          );
        }
      } catch (error: any) {
        if (!cancelled) setErrorText(String(error?.message || 'Failed to load profile'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (userId) void load();
    else {
      setLoading(false);
      setErrorText('Missing user id');
    }
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const orgRows = useMemo(
    () =>
      memberships.map((membership) => ({
        ...membership,
        org: organizations.get(membership.organization_id) || null,
      })),
    [memberships, organizations],
  );

  return (
    <SafeAreaView style={dbStyles.safeArea}>
      <View style={dbStyles.header}>
        <Pressable onPress={() => router.back()} style={dbStyles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text style={dbStyles.title}>Profile</Text>
        <View style={dbStyles.iconBtn} />
      </View>

      {loading ? (
        <View style={dbStyles.centerState}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={dbStyles.stateText}>Loading profile…</Text>
        </View>
      ) : null}

      {!loading && errorText ? (
        <View style={dbStyles.centerState}>
          <Text style={dbStyles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      {!loading && !errorText ? (
        <ScrollView contentContainerStyle={dbStyles.content}>
          <View style={dbStyles.card}>
            <Text style={dbStyles.name}>{name}</Text>
            <Text style={dbStyles.meta}>{email || userId}</Text>
          </View>

          <View style={dbStyles.card}>
            <Text style={dbStyles.sectionTitle}>Organizations</Text>
            {orgRows.length === 0 ? <Text style={dbStyles.meta}>No active organization memberships.</Text> : null}
            {orgRows.map((row, idx) => (
              <View key={`${row.organization_id}-${idx}`} style={dbStyles.row}>
                <Text style={dbStyles.rowTitle}>{row.org?.name || row.organization_id}</Text>
                <Text style={dbStyles.rowMeta}>{row.org?.interest_slug || 'interest-agnostic'} · {row.role || 'member'}</Text>
              </View>
            ))}
          </View>

          <View style={dbStyles.card}>
            <Text style={dbStyles.sectionTitle}>Recent Activities</Text>
            {activities.length === 0 ? <Text style={dbStyles.meta}>No activities yet.</Text> : null}
            {activities.map((activity) => (
              <View key={activity.id} style={dbStyles.row}>
                <Text style={dbStyles.rowTitle}>{activity.name}</Text>
                <Text style={dbStyles.rowMeta}>
                  {activity.date ? new Date(activity.date).toLocaleDateString() : 'Date TBD'}
                  {activity.venue ? ` · ${activity.venue}` : ''}
                </Text>
              </View>
            ))}
          </View>

          {/* Timeline Steps — grouped by interest */}
          {timelineQuery.data && timelineQuery.data.length > 0 && (() => {
            const byInterest = new Map<string, TimelineStepRecord[]>();
            for (const step of timelineQuery.data) {
              const key = step.interest_id || '__none__';
              if (!byInterest.has(key)) byInterest.set(key, []);
              byInterest.get(key)!.push(step);
            }
            return Array.from(byInterest.entries()).map(([interestId, steps]) => {
              const orgRow = orgRows.find((r) => r.org?.interest_slug);
              const interestSlug = orgRow?.org?.interest_slug || '';
              const hasOrg = steps.some((s) => s.organization_id);
              return (
                <View key={interestId} style={dbStyles.card}>
                  <Text style={dbStyles.sectionTitle}>
                    {hasOrg ? orgRow?.org?.name || 'Organization' : 'Personal'} Timeline
                  </Text>
                  <PersonTimelineRow
                    person={{
                      name,
                      role: email || userId,
                      timeline: steps.map((step: TimelineStepRecord) => ({
                        label: step.title,
                        status: toSampleStatus(step.status),
                        detail: step.description ?? undefined,
                      })),
                      userId,
                    }}
                    accentColor={hasOrg ? '#2563EB' : '#8B5CF6'}
                    realStepIds={steps.map((step: TimelineStepRecord) => step.id)}
                    interestId={interestId !== '__none__' ? interestId : undefined}
                  />
                </View>
              );
            });
          })()}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const dbStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 10 },
  stateText: { fontSize: 13, color: '#6B7280' },
  errorText: { fontSize: 13, color: '#B91C1C', textAlign: 'center', paddingHorizontal: 16 },
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});

// ── Sample data public profile ──────────────────────────────────────

function SamplePersonProfile({ result }: { result: PersonSearchResult }) {
  const { person, contexts } = result;
  const orgContexts = contexts.filter((c) => !c.isPersonal);
  const personalContexts = contexts.filter((c) => c.isPersonal);
  const primaryContext = orgContexts[0] || contexts[0];
  const accentColor = primaryContext?.interestColor ?? '#4338CA';

  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: accentColor }]}>
        <View style={styles.heroContent}>
          {/* Breadcrumbs */}
          <View style={styles.breadcrumbs}>
            <TouchableOpacity onPress={() => router.push('/' as any)}>
              <Text style={styles.breadcrumbLink}>BetterAt</Text>
            </TouchableOpacity>
            {primaryContext && !primaryContext.isPersonal && (
              <>
                <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
                <TouchableOpacity onPress={() => router.push(`/${primaryContext.interestSlug}` as any)}>
                  <Text style={styles.breadcrumbLink}>{primaryContext.interestName}</Text>
                </TouchableOpacity>
                {primaryContext.orgSlug && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
                    <TouchableOpacity onPress={() => router.push(`/${primaryContext.interestSlug}/${primaryContext.orgSlug}` as any)}>
                      <Text style={styles.breadcrumbLink}>{primaryContext.orgName}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
            <Text style={styles.breadcrumbCurrent}>{person.name}</Text>
          </View>

          {/* Avatar + name */}
          <View style={styles.heroRow}>
            <View style={[styles.heroAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.heroInitials}>{initials}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{person.name}</Text>
              <Text style={styles.heroRole}>{person.role}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Interests & Progress */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Interests & Progress</Text>
        <Text style={styles.sectionSubtitle}>
          {person.name.split(' ')[0]}'s learning journey across {contexts.length} interest{contexts.length !== 1 ? 's' : ''}
        </Text>

        <View style={styles.interestCards}>
          {/* Org-linked interests — use the person's main timeline */}
          {orgContexts.map((ctx) => (
            <InterestTimelineCard
              key={`${ctx.interestSlug}-${ctx.orgSlug}`}
              interestName={ctx.interestName}
              interestSlug={ctx.interestSlug}
              accentColor={ctx.interestColor}
              orgName={ctx.orgName}
              orgSlug={ctx.orgSlug}
              role={ctx.role || person.role}
              person={person}
            />
          ))}

          {/* Personal interests — each has its own timeline */}
          {personalContexts.map((ctx) => (
            <InterestTimelineCard
              key={`personal-${ctx.interestSlug}`}
              interestName={ctx.interestName}
              interestSlug={ctx.interestSlug}
              accentColor={ctx.interestColor}
              role={ctx.role}
              person={{
                name: person.name,
                role: ctx.role || 'Personal',
                timeline: ctx.timeline || [],
                userId: person.userId,
              }}
              isPersonal
            />
          ))}
        </View>
      </View>

      <Footer />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollFix />
        <SimpleLandingNav currentInterestSlug={primaryContext?.interestSlug} />
        {content}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SimpleLandingNav currentInterestSlug={primaryContext?.interestSlug} />
      {content}
    </ScrollView>
  );
}

// ── Route handler ───────────────────────────────────────────────────

export default function PersonProfilePage() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const paramValue = typeof params.userId === 'string' ? params.userId.trim() : '';

  // If it looks like a UUID, show the DB profile
  if (UUID_RE.test(paramValue)) {
    return <DbUserProfile userId={paramValue} />;
  }

  // Otherwise treat it as a sample data person slug
  const result = findPersonBySlug(paramValue);

  if (!result) {
    return (
      <View style={styles.container}>
        {Platform.OS === 'web' && <ScrollFix />}
        <SimpleLandingNav />
        <View style={styles.notFound}>
          <Ionicons name="person-outline" size={48} color="#D1D5DB" />
          <Text style={styles.notFoundTitle}>Person Not Found</Text>
          <Text style={styles.notFoundText}>
            We couldn't find a profile for this person.
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <SamplePersonProfile result={result} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Hero
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
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroRole: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },

  // Body sections
  body: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    padding: 24,
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

  // Interest timeline cards
  interestCards: {
    gap: 20,
    marginTop: 12,
  },

  // Not found
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 24,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  notFoundText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
