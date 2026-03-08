import { useOrganization } from '@/providers/OrganizationProvider';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type CohortRow = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  interest_slug: string | null;
  created_at: string;
};

const ADMIN_ROLES = new Set(['owner', 'admin', 'manager']);

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function isActiveMembershipStatus(value: unknown): boolean {
  const normalized = normalize(value);
  return normalized === 'active' || normalized === 'verified';
}

export default function OrganizationCohortsScreen() {
  const {
    activeOrganization,
    activeOrganizationId,
    activeInterestSlug,
    memberships,
    loading: orgLoading,
    ready: orgReady,
  } = useOrganization();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [countsByCohortId, setCountsByCohortId] = useState<Record<string, number>>({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [interestSlugInput, setInterestSlugInput] = useState('');

  const resolvedActiveOrgId = useMemo(() => {
    const providerId = String(activeOrganizationId || '').trim();
    if (providerId) return providerId;
    const activeMembership = memberships.find((membership: any) =>
      isActiveMembershipStatus(membership?.membership_status || membership?.status)
    );
    if (!activeMembership) return null;
    return (
      String((activeMembership as any).organization_id ?? (activeMembership as any).organizationId ?? '').trim() || null
    );
  }, [activeOrganizationId, memberships]);

  const activeOrgMembership = useMemo(() => {
    if (!resolvedActiveOrgId) return null;
    return (
      memberships.find((membership: any) => {
        const membershipOrgId = String(membership?.organization_id ?? membership?.organizationId ?? '').trim();
        return membershipOrgId === resolvedActiveOrgId;
      }) ?? null
    );
  }, [memberships, resolvedActiveOrgId]);

  const hasValidActiveOrgId = Boolean(resolvedActiveOrgId && isUuid(resolvedActiveOrgId));
  const hasActiveMembership = isActiveMembershipStatus(
    activeOrgMembership?.membership_status || activeOrgMembership?.status
  );
  const hasAdminRole = ADMIN_ROLES.has(normalize(activeOrgMembership?.role));
  const canEdit = hasValidActiveOrgId && hasActiveMembership && hasAdminRole;
  const canView = hasValidActiveOrgId && hasActiveMembership;

  const loadCohorts = useCallback(async () => {
    if (!canView || !resolvedActiveOrgId) {
      setRows([]);
      setCountsByCohortId({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const { data: cohortsData, error: cohortsError } = await supabase
        .from('betterat_org_cohorts')
        .select('id,org_id,name,description,interest_slug,created_at')
        .eq('org_id', resolvedActiveOrgId)
        .order('created_at', { ascending: false });

      if (cohortsError) throw cohortsError;

      const nextRows = (cohortsData || []) as CohortRow[];
      setRows(nextRows);

      if (nextRows.length === 0) {
        setCountsByCohortId({});
        return;
      }

      const cohortIds = nextRows.map((row) => row.id);
      const { data: memberRows, error: membersError } = await supabase
        .from('betterat_org_cohort_members')
        .select('cohort_id')
        .in('cohort_id', cohortIds);

      if (membersError) throw membersError;

      const counts: Record<string, number> = {};
      for (const row of memberRows || []) {
        const cohortId = String((row as any).cohort_id || '');
        if (!cohortId) continue;
        counts[cohortId] = (counts[cohortId] || 0) + 1;
      }
      setCountsByCohortId(counts);
    } catch (error: any) {
      setRows([]);
      setCountsByCohortId({});
      setErrorText(error?.message || 'Could not load cohorts.');
    } finally {
      setLoading(false);
    }
  }, [canView, resolvedActiveOrgId]);

  useEffect(() => {
    if (!orgReady || orgLoading || !canView) {
      setRows([]);
      setCountsByCohortId({});
      setLoading(false);
      return;
    }
    void loadCohorts();
  }, [canView, loadCohorts, orgLoading, orgReady]);

  useEffect(() => {
    if (!interestSlugInput && activeInterestSlug) {
      setInterestSlugInput(activeInterestSlug);
    }
  }, [activeInterestSlug, interestSlugInput]);

  const handleCreateCohort = useCallback(async () => {
    if (!canEdit || !resolvedActiveOrgId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorText('Cohort name is required.');
      return;
    }

    setSaving(true);
    setErrorText(null);
    try {
      const payload = {
        org_id: resolvedActiveOrgId,
        name: trimmedName,
        description: description.trim() || null,
        interest_slug: interestSlugInput.trim() || null,
      };

      const { error } = await supabase.from('betterat_org_cohorts').insert(payload);
      if (error) throw error;

      setName('');
      setDescription('');
      await loadCohorts();
    } catch (error: any) {
      setErrorText(error?.message || 'Could not create cohort.');
    } finally {
      setSaving(false);
    }
  }, [canEdit, description, interestSlugInput, loadCohorts, name, resolvedActiveOrgId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Cohorts{activeOrganization?.name ? ` · ${activeOrganization.name}` : ''}</Text>
          <Text style={styles.subtitle}>Organize members into cohorts and teams.</Text>
        </View>
      </View>

      {!orgReady || orgLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#2563EB" />
        </View>
      ) : !hasValidActiveOrgId ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Select an active organization first.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/settings/organization-access')}>
            <Text style={styles.primaryButtonText}>Open Organization Access</Text>
          </TouchableOpacity>
        </View>
      ) : !hasActiveMembership ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Active membership required.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {canEdit ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Create cohort</Text>
              <TextInput
                style={styles.input}
                placeholder="Cohort name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Interest slug (optional)"
                placeholderTextColor="#94A3B8"
                value={interestSlugInput}
                onChangeText={setInterestSlugInput}
              />
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                onPress={() => void handleCreateCohort()}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Create cohort'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.stateText}>Admin access required to create or edit cohorts.</Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Cohorts</Text>
              <TouchableOpacity onPress={() => void loadCohorts()}>
                <Ionicons name="refresh-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            {loading ? (
              <View style={styles.centerStateCompact}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : rows.length === 0 ? (
              <Text style={styles.stateText}>No cohorts yet.</Text>
            ) : (
              rows.map((row) => (
                <TouchableOpacity
                  key={row.id}
                  style={styles.row}
                  onPress={() => router.push({ pathname: '/organization/cohort/[cohortId]', params: { cohortId: row.id } })}
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>{row.name}</Text>
                    {row.description ? <Text style={styles.rowDescription}>{row.description}</Text> : null}
                    <Text style={styles.rowMeta}>
                      {countsByCohortId[row.id] || 0} members{row.interest_slug ? ` · ${row.interest_slug}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  subtitle: { marginTop: 2, fontSize: 12, color: '#64748B' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  disabledButton: { opacity: 0.6 },
  row: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTextWrap: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  rowDescription: { fontSize: 12, color: '#475569' },
  rowMeta: { fontSize: 11, color: '#64748B' },
  errorText: { fontSize: 12, color: '#B42318' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  centerStateCompact: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  stateText: { fontSize: 13, color: '#64748B', textAlign: 'center' },
});
