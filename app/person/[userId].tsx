import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';

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

export default function PersonProfilePage() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = typeof params.userId === 'string' ? params.userId.trim() : '';
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [name, setName] = useState('Unknown');
  const [email, setEmail] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [organizations, setOrganizations] = useState<Map<string, OrganizationRow>>(new Map());
  const [activities, setActivities] = useState<Array<{ id: string; name: string; date: string | null; venue: string | null }>>([]);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.stateText}>Loading profile…</Text>
        </View>
      ) : null}

      {!loading && errorText ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}

      {!loading && !errorText ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>{email || userId}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Organizations</Text>
            {orgRows.length === 0 ? <Text style={styles.meta}>No active organization memberships.</Text> : null}
            {orgRows.map((row, idx) => (
              <View key={`${row.organization_id}-${idx}`} style={styles.row}>
                <Text style={styles.rowTitle}>{row.org?.name || row.organization_id}</Text>
                <Text style={styles.rowMeta}>{row.org?.interest_slug || 'interest-agnostic'} · {row.role || 'member'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            {activities.length === 0 ? <Text style={styles.meta}>No activities yet.</Text> : null}
            {activities.map((activity) => (
              <View key={activity.id} style={styles.row}>
                <Text style={styles.rowTitle}>{activity.name}</Text>
                <Text style={styles.rowMeta}>
                  {activity.date ? new Date(activity.date).toLocaleDateString() : 'Date TBD'}
                  {activity.venue ? ` · ${activity.venue}` : ''}
                </Text>
              </View>
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
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 2 },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});

