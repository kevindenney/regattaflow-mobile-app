import { useOrganization } from '@/providers/OrganizationProvider';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PendingRequestRow = {
  id: string;
  user_id: string;
  role: string | null;
  membership_status: string | null;
  status: string | null;
  created_at: string;
  user_name: string;
  user_email: string | null;
};

function formatRequestedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString();
}

export default function OrganizationAccessRequestsScreen() {
  const { activeOrganization, canManageActiveOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<PendingRequestRow[]>([]);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadPendingRequests = useCallback(async () => {
    if (!activeOrganization?.id || !isUuid(activeOrganization.id)) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      let rows: any[] = [];
      const { data, error } = await supabase
        .from('organization_memberships')
        .select('id,user_id,role,membership_status,status,created_at,users(full_name,email)')
        .eq('organization_id', activeOrganization.id)
        .eq('membership_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        const fallback = await supabase
          .from('organization_memberships')
          .select('id,user_id,role,membership_status,status,created_at')
          .eq('organization_id', activeOrganization.id)
          .eq('membership_status', 'pending')
          .order('created_at', { ascending: false });

        if (fallback.error) {
          throw fallback.error;
        }

        const fallbackRows = fallback.data || [];
        const userIds = Array.from(
          new Set(
            fallbackRows
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
          if (usersQuery.error) {
            throw usersQuery.error;
          }
          usersById = new Map(
            (usersQuery.data || []).map((row: any) => [
              String(row.id),
              { full_name: row.full_name ?? null, email: row.email ?? null },
            ])
          );
        }

        rows = fallbackRows.map((row: any) => ({ ...row, users: usersById.get(String(row.user_id)) || null }));
      } else {
        rows = data || [];
      }

      const normalized: PendingRequestRow[] = rows.map((row: any) => {
        const user = Array.isArray(row.users) ? row.users[0] : row.users;
        const email = typeof user?.email === 'string' ? user.email : null;
        const fullName = typeof user?.full_name === 'string' ? user.full_name.trim() : '';
        return {
          id: String(row.id),
          user_id: String(row.user_id),
          role: row.role || null,
          membership_status: row.membership_status || null,
          status: row.status || null,
          created_at: String(row.created_at || ''),
          user_name: fullName || email || 'Unknown user',
          user_email: email,
        };
      });

      setRequests(normalized);
    } catch (error: any) {
      setErrorText(error?.message || 'Could not load access requests.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    void loadPendingRequests();
  }, [loadPendingRequests]);

  const handleUpdateRequest = useCallback(
    async (requestId: string, nextMembershipStatus: 'active' | 'rejected') => {
      if (!activeOrganization?.id) return;
      setActionBusyId(requestId);
      setErrorText(null);
      try {
        const { error } = await supabase
          .from('organization_memberships')
          .update({ membership_status: nextMembershipStatus })
          .eq('id', requestId)
          .eq('organization_id', activeOrganization.id);

        if (error) throw error;
        await loadPendingRequests();
      } catch (error: any) {
        setErrorText(error?.message || 'Could not update membership request.');
      } finally {
        setActionBusyId(null);
      }
    },
    [activeOrganization?.id, loadPendingRequests]
  );

  const title = useMemo(
    () => `Access Requests${activeOrganization?.name ? ` · ${activeOrganization.name}` : ''}`,
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
          <Text style={styles.subtitle}>Approve or reject pending organization membership requests.</Text>
        </View>
      </View>

      {!activeOrganization?.id ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Select an active organization first.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/settings/organization-access')}>
            <Text style={styles.primaryButtonText}>Open Organization Access</Text>
          </TouchableOpacity>
        </View>
      ) : !canManageActiveOrganization ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Admin access required.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Pending requests</Text>
              <TouchableOpacity onPress={() => void loadPendingRequests()}>
                <Ionicons name="refresh-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            {loading ? (
              <View style={styles.centerStateCompact}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : requests.length === 0 ? (
              <Text style={styles.stateText}>No pending requests.</Text>
            ) : (
              requests.map((request) => {
                const busy = actionBusyId === request.id;
                return (
                  <View key={request.id} style={styles.requestRow}>
                    <View style={styles.requestTextWrap}>
                      <Text style={styles.requestTitle}>{request.user_name}</Text>
                      {request.user_email ? <Text style={styles.requestSub}>{request.user_email}</Text> : null}
                      <Text style={styles.requestMeta}>
                        Requested {formatRequestedAt(request.created_at)}
                        {request.role ? ` · ${request.role}` : ''}
                      </Text>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonApprove, busy && styles.actionButtonDisabled]}
                        onPress={() => void handleUpdateRequest(request.id, 'active')}
                        disabled={busy}
                      >
                        <Text style={styles.actionButtonApproveText}>{busy ? 'Saving...' : 'Approve'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonReject, busy && styles.actionButtonDisabled]}
                        onPress={() => void handleUpdateRequest(request.id, 'rejected')}
                        disabled={busy}
                      >
                        <Text style={styles.actionButtonRejectText}>{busy ? 'Saving...' : 'Reject'}</Text>
                      </TouchableOpacity>
                    </View>
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
  requestRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  requestTextWrap: {
    gap: 3,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestSub: {
    fontSize: 12,
    color: '#475569',
  },
  requestMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonApprove: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  actionButtonReject: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  actionButtonApproveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  actionButtonRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
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
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

