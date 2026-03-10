import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { getTemplatesByOrg } from '@/services/activityCatalog';
import type { ActivityTemplate } from '@/types/activities';
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';

type OrgRow = {
  id: string;
  name: string;
  slug: string | null;
  join_mode: string | null;
  interest_slug: string | null;
};

type MembershipRow = {
  user_id: string;
  role: string | null;
  status: string | null;
  membership_status: string | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveMembership(row: MembershipRow): boolean {
  const membershipStatus = normalize(row.membership_status);
  const status = normalize(row.status);
  return membershipStatus === 'active' || status === 'active';
}

function isCoachRole(role: string | null): boolean {
  const normalized = normalize(role);
  return normalized.includes('coach')
    || normalized === 'admin'
    || normalized === 'preceptor'
    || normalized === 'instructor'
    || normalized === 'clinical_instructor'
    || normalized === 'evaluator'
    || normalized === 'assessor';
}

export default function PublicOrganizationPage() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug.trim() : '';
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [people, setPeople] = useState<Array<{ id: string; name: string; email: string | null; role: string | null; isCoach: boolean }>>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorText(null);
      try {
        let orgQuery = await supabase
          .from('organizations')
          .select('id,name,slug,join_mode,interest_slug')
          .eq('slug', slug)
          .maybeSingle();
        if (!orgQuery.data) {
          orgQuery = await supabase
            .from('organizations')
            .select('id,name,slug,join_mode,interest_slug')
            .eq('id', slug)
            .maybeSingle();
        }
        if (orgQuery.error || !orgQuery.data) {
          throw orgQuery.error || new Error('Organization not found');
        }

        const orgRow: OrgRow = {
          id: String((orgQuery.data as any).id),
          name: String((orgQuery.data as any).name || ''),
          slug: (orgQuery.data as any).slug ? String((orgQuery.data as any).slug) : null,
          join_mode: (orgQuery.data as any).join_mode ? String((orgQuery.data as any).join_mode) : null,
          interest_slug: (orgQuery.data as any).interest_slug ? String((orgQuery.data as any).interest_slug) : null,
        };

        let membershipResult = await supabase
          .from('organization_memberships')
          .select('user_id,role,status,membership_status')
          .eq('organization_id', orgRow.id)
          .limit(3000);
        if (membershipResult.error && isMissingSupabaseColumn(membershipResult.error, 'organization_memberships.membership_status')) {
          membershipResult = await supabase
            .from('organization_memberships')
            .select('user_id,role,status')
            .eq('organization_id', orgRow.id)
            .limit(3000);
        }
        if (membershipResult.error) throw membershipResult.error;

        const memberRows: MembershipRow[] = (membershipResult.data || []).map((row: any) => ({
          user_id: String(row.user_id || ''),
          role: row.role ? String(row.role) : null,
          status: row.status ? String(row.status) : null,
          membership_status: row.membership_status ? String(row.membership_status) : null,
        }));
        const activeMembers = memberRows.filter(isActiveMembership);
        const userIds = Array.from(new Set(activeMembers.map((row) => row.user_id).filter(Boolean)));
        let usersById = new Map<string, UserRow>();
        if (userIds.length > 0) {
          const usersResult = await supabase
            .from('users')
            .select('id,full_name,email')
            .in('id', userIds)
            .limit(4000);
          if (usersResult.error) throw usersResult.error;
          usersById = new Map(
            (usersResult.data || []).map((row: any) => [
              String(row.id),
              { id: String(row.id), full_name: row.full_name ? String(row.full_name) : null, email: row.email ? String(row.email) : null },
            ]),
          );
        }
        const nextPeople = activeMembers.map((row) => {
          const user = usersById.get(row.user_id);
          return {
            id: row.user_id,
            name: user?.full_name || user?.email || row.user_id,
            email: user?.email || null,
            role: row.role || null,
            isCoach: isCoachRole(row.role),
          };
        });

        const templateRows = await getTemplatesByOrg(orgRow.id);

        if (!cancelled) {
          setOrg(orgRow);
          setTemplates(templateRows);
          setPeople(nextPeople);
        }
      } catch (error: any) {
        if (!cancelled) {
          setErrorText(String(error?.message || 'Failed to load organization'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (slug) void load();
    else {
      setLoading(false);
      setErrorText('Missing organization slug');
    }
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const coaches = useMemo(() => people.filter((p) => p.isCoach), [people]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Organization</Text>
        <View style={styles.iconBtn} />
      </View>
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.stateText}>Loading organization…</Text>
        </View>
      ) : null}
      {!loading && errorText ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}
      {!loading && !errorText && org ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{org.name}</Text>
            <Text style={styles.cardMeta}>{org.interest_slug || 'no-interest-tag'} · {org.join_mode || 'invite_only'}</Text>
            <Text style={styles.cardMeta}>{people.length} people · {coaches.length} coaches · {templates.length} templates</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Published Content</Text>
            {templates.length === 0 ? <Text style={styles.cardMeta}>No published templates yet.</Text> : null}
            {templates.map((template) => (
              <View key={template.id} style={styles.row}>
                <Text style={styles.rowTitle}>{template.title}</Text>
                <Text style={styles.rowMeta}>{template.eventSubtype || template.eventType}</Text>
              </View>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Coaches</Text>
            {coaches.length === 0 ? <Text style={styles.cardMeta}>No coaches found.</Text> : null}
            {coaches.map((person) => (
              <Pressable key={person.id} style={styles.row} onPress={() => router.push(`/person/${person.id}`)}>
                <Text style={styles.rowTitle}>{person.name}</Text>
                <Text style={styles.rowMeta}>{person.role || 'coach'}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>People</Text>
            {people.length === 0 ? <Text style={styles.cardMeta}>No active members found.</Text> : null}
            {people.map((person) => (
              <Pressable key={person.id} style={styles.row} onPress={() => router.push(`/person/${person.id}`)}>
                <Text style={styles.rowTitle}>{person.name}</Text>
                <Text style={styles.rowMeta}>{person.email || person.role || 'member'}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  cardMeta: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});

