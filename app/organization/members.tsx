import { coachRoleLabel } from '@/lib/organizations/roleLabels';
import { getActiveMembership, isActiveMembership, isOrgAdminRole, resolveActiveOrgId } from '@/lib/organizations/adminGate';
import { useOrganization } from '@/providers/OrganizationProvider';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  membership_status: string | null;
  status: string | null;
  created_at: string | null;
  user_name: string;
  user_email: string | null;
};

type SaveState = {
  type: 'saved' | 'error';
  message: string;
};

const NURSING_ROLES = ['member', 'preceptor', 'clinical_instructor', 'instructor', 'evaluator', 'admin', 'manager'];
const SAILING_ROLES = ['member', 'coach', 'coordinator', 'staff', 'admin', 'manager'];

function normalizeStatus(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

export default function OrganizationMembersScreen() {
  const {
    activeOrganization,
    activeOrganizationId,
    activeInterestSlug,
    memberships,
    loading: orgLoading,
    ready: orgReady,
  } = useOrganization();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [busyMembershipId, setBusyMembershipId] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState | undefined>>({});

  const resolvedActiveOrgId = useMemo(
    () => resolveActiveOrgId({ activeOrganizationId, memberships: memberships as any }),
    [activeOrganizationId, memberships]
  );
  const activeOrgMembership = useMemo(
    () => getActiveMembership({ memberships: memberships as any, activeOrgId: resolvedActiveOrgId }),
    [memberships, resolvedActiveOrgId]
  );

  const membershipStatus = activeOrgMembership?.membershipStatus || null;
  const membershipRole = activeOrgMembership?.role || null;
  const hasActiveMembership = isActiveMembership(membershipStatus);
  const hasAdminRole = isOrgAdminRole(membershipRole);
  const hasValidActiveOrgId = !!resolvedActiveOrgId && isUuid(resolvedActiveOrgId);
  const canManage = hasValidActiveOrgId && hasActiveMembership && hasAdminRole;

  const roleOptions = useMemo(() => {
    const interest = String(activeInterestSlug || '').toLowerCase();
    if (interest === 'nursing') return NURSING_ROLES;
    if (interest === 'sail-racing' || interest.includes('sail')) return SAILING_ROLES;
    return Array.from(new Set([...NURSING_ROLES, ...SAILING_ROLES]));
  }, [activeInterestSlug]);

  const loadMembers = useCallback(async () => {
    if (!canManage || !resolvedActiveOrgId) {
      setRows([]);
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const { data: membershipRows, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('id,user_id,role,membership_status,status,created_at')
        .eq('organization_id', resolvedActiveOrgId)
        .order('created_at', { ascending: false });

      if (membershipError) throw membershipError;

      const activeMembershipRows = (membershipRows || []).filter((row: any) => {
        const rowStatus = normalizeStatus(row.membership_status || row.status);
        return rowStatus === 'active';
      });

      const userIds = Array.from(
        new Set(
          activeMembershipRows
            .map((row: any) => row.user_id)
            .filter((id: unknown): id is string => typeof id === 'string' && isUuid(id))
        )
      );

      let usersById = new Map<string, { full_name?: string | null; email?: string | null }>();
      if (userIds.length > 0) {
        const usersQuery = await supabase
          .from('users')
          .select('id,full_name,email')
          .in('id', userIds);

        if (usersQuery.error) throw usersQuery.error;

        usersById = new Map(
          (usersQuery.data || []).map((row: any) => [
            String(row.id),
            {
              full_name: row.full_name ?? null,
              email: row.email ?? null,
            },
          ])
        );
      }

      const normalized: MemberRow[] = activeMembershipRows.map((row: any) => {
        const user = usersById.get(String(row.user_id));
        const email = typeof user?.email === 'string' ? user.email : null;
        const fullName = typeof user?.full_name === 'string' ? user.full_name.trim() : '';

        return {
          id: String(row.id),
          user_id: String(row.user_id),
          role: String(row.role || 'member'),
          membership_status: row.membership_status || null,
          status: row.status || null,
          created_at: row.created_at ? String(row.created_at) : null,
          user_name: fullName || email || 'Unknown user',
          user_email: email,
        };
      });

      setRows(normalized);
    } catch (error: any) {
      setErrorText(error?.message || 'Could not load members.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canManage, resolvedActiveOrgId]);

  useEffect(() => {
    if (!orgReady || orgLoading || !canManage) {
      setLoading(false);
      setRows([]);
      return;
    }

    void loadMembers();
  }, [canManage, loadMembers, orgLoading, orgReady]);

  const handleChangeRole = useCallback(
    async (row: MemberRow, nextRole: string) => {
      if (!canManage || !resolvedActiveOrgId) return;
      const normalizedNext = normalizeStatus(nextRole);
      const normalizedCurrent = normalizeStatus(row.role);
      if (!normalizedNext || normalizedNext === normalizedCurrent) return;

      setBusyMembershipId(row.id);
      setSaveStates((prev) => ({ ...prev, [row.id]: undefined }));

      try {
        const { error } = await supabase
          .from('organization_memberships')
          .update({ role: normalizedNext })
          .eq('id', row.id)
          .eq('organization_id', resolvedActiveOrgId);

        if (error) throw error;

        setRows((prev) =>
          prev.map((member) =>
            member.id === row.id
              ? {
                  ...member,
                  role: normalizedNext,
                }
              : member
          )
        );

        setSaveStates((prev) => ({
          ...prev,
          [row.id]: { type: 'saved', message: 'Saved' },
        }));
      } catch (error: any) {
        setSaveStates((prev) => ({
          ...prev,
          [row.id]: {
            type: 'error',
            message: error?.message || 'Could not update role.',
          },
        }));
      } finally {
        setBusyMembershipId(null);
      }
    },
    [canManage, resolvedActiveOrgId]
  );

  const title = useMemo(
    () => `Members${activeOrganization?.name ? ` · ${activeOrganization.name}` : ''}`,
    [activeOrganization?.name]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Manage active organization members and roles.</Text>
          {__DEV__ ? (
            <Text style={styles.devDiagnosticText}>
              activeOrgId={resolvedActiveOrgId || 'none'} role={membershipRole || 'none'} status={membershipStatus || 'none'} active={String(hasActiveMembership)} admin={String(hasAdminRole)}
            </Text>
          ) : null}
          <View style={styles.headerLinksRow}>
            <TouchableOpacity onPress={() => router.push('/organization/access-requests')}>
              <Text style={styles.headerLinkText}>Access requests</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/organization/cohorts')}>
              <Text style={styles.headerLinkText}>Cohorts</Text>
            </TouchableOpacity>
          </View>
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
      ) : !hasAdminRole ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            {normalizeStatus(membershipRole) === 'member'
              ? 'Your role in this org is Member. Ask an admin to promote you.'
              : 'Admin access required.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Active members</Text>
              <TouchableOpacity onPress={() => void loadMembers()}>
                <Ionicons name="refresh-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            {loading ? (
              <View style={styles.centerStateCompact}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : rows.length === 0 ? (
              <Text style={styles.stateText}>No active members.</Text>
            ) : (
              rows.map((row) => {
                const saveState = saveStates[row.id];
                return (
                  <View key={row.id} style={styles.memberRow}>
                    <View style={styles.memberHeader}>
                      <View style={styles.memberTextWrap}>
                        <Text style={styles.memberName}>{row.user_name}</Text>
                        {row.user_email ? <Text style={styles.memberEmail}>{row.user_email}</Text> : null}
                      </View>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {coachRoleLabel({ interestSlug: activeInterestSlug || '', role: row.role })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.roleOptionsWrap}>
                      {roleOptions.map((optionRole) => {
                        const selected = normalizeStatus(optionRole) === normalizeStatus(row.role);
                        return (
                          <TouchableOpacity
                            key={`${row.id}:${optionRole}`}
                            style={[styles.roleOption, selected && styles.roleOptionSelected]}
                            onPress={() => void handleChangeRole(row, optionRole)}
                            disabled={busyMembershipId === row.id || selected}
                          >
                            <Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>
                              {coachRoleLabel({ interestSlug: activeInterestSlug || '', role: optionRole })}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {saveState ? (
                      <Text style={saveState.type === 'error' ? styles.errorText : styles.savedText}>
                        {saveState.message}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  devDiagnosticText: {
    marginTop: 4,
    fontSize: 11,
    color: '#94A3B8',
  },
  headerLinksRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLinkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  memberTextWrap: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  roleOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  roleOptionSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  roleOptionText: {
    fontSize: 11,
    color: '#334155',
  },
  roleOptionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  centerStateCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  stateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    color: '#B42318',
  },
  savedText: {
    fontSize: 12,
    color: '#067647',
    fontWeight: '600',
  },
});
