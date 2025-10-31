import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { supabase } from '@/services/supabase';
import { ArrowLeft, CreditCard, FileText, Users } from 'lucide-react-native';
import {
  ClubEntryStatus,
  ClubPaymentStatus,
  CLUB_ENTRY_STATUS_LABELS,
  CLUB_ENTRY_PAYMENT_LABELS,
} from '@/types/entries';
import { clubEntryAdminService } from '@/services/ClubEntryAdminService';

interface EntryDetail {
  id: string;
  regatta_id: string;
  sailor_id: string;
  boat_id: string;
  entry_class: string;
  division?: string | null;
  sail_number?: string | null;
  entry_number?: string | null;
  status: ClubEntryStatus;
  payment_status: ClubPaymentStatus;
  entry_fee_amount: number;
  entry_fee_currency: string;
  special_requests?: string | null;
  dietary_requirements?: string | null;
  equipment_notes?: string | null;
  documents_required?: Array<{
    type: string;
    display_name: string;
    required: boolean;
    deadline?: string;
  }>;
  documents_submitted?: Array<{
    type: string;
    filename: string;
    url: string;
    submitted_at: string;
  }>;
  documents_complete?: boolean;
  created_at: string;
  updated_at: string;
  regatta?: {
    id: string;
    name: string;
    start_date?: string | null;
    status?: string | null;
  };
  sailor?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  };
  boat?: {
    id: string;
    name?: string | null;
    class?: string | null;
    sail_number?: string | null;
    owner_name?: string | null;
  };
}

const mapEntryDetail = (data: any): EntryDetail => ({
  id: data.id,
  regatta_id: data.regatta_id,
  sailor_id: data.sailor_id,
  boat_id: data.boat_id,
  entry_class: data.entry_class,
  division: data.division,
  sail_number: data.sail_number,
  entry_number: data.entry_number,
  status: data.status,
  payment_status: data.payment_status,
  entry_fee_amount: data.entry_fee_amount || 0,
  entry_fee_currency: data.entry_fee_currency || 'USD',
  special_requests: data.special_requests,
  dietary_requirements: data.dietary_requirements,
  equipment_notes: data.equipment_notes,
  documents_required: data.documents_required || [],
  documents_submitted: data.documents_submitted || [],
  documents_complete: data.documents_complete ?? false,
  created_at: data.created_at,
  updated_at: data.updated_at,
  regatta: data.regatta
    ? {
        id: data.regatta.id,
        name: data.regatta.event_name || 'Regatta',
        start_date: data.regatta.start_date,
        status: data.regatta.status,
      }
    : undefined,
  sailor: data.sailor
    ? {
        id: data.sailor.id,
        full_name: data.sailor.full_name,
        email: data.sailor.email,
      }
    : undefined,
  boat: data.boat
    ? {
        id: data.boat.id,
        name: data.boat.name,
        class: data.boat.class,
        sail_number: data.boat.sail_number,
        owner_name: data.boat.owner_name,
      }
    : undefined,
});

const EntryDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ entryId?: string; clubId?: string }>();

  const entryId = typeof params.entryId === 'string' ? params.entryId : '';
  const clubId = typeof params.clubId === 'string' ? params.clubId : undefined;

  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'paid' | 'refund' | null>(null);

  const fetchEntry = useCallback(async () => {
    if (!entryId) {
      setError('Entry not specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('race_entries')
        .select(
          `
            *,
            regatta:club_race_calendar!race_entries_regatta_id_fkey ( id, event_name, start_date, status ),
            sailor:users!race_entries_sailor_id_fkey ( id, full_name, email ),
            boat:boats!race_entries_boat_id_fkey ( id, name, class, sail_number, owner_name )
          `
        )
        .eq('id', entryId)
        .maybeSingle();

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        setError('Entry not found');
        setEntry(null);
        return;
      }

      setEntry(mapEntryDetail(data));
    } catch (err: any) {
      console.warn('[EntryDetail] Failed to load entry', err);
      setError(err?.message || 'Failed to load entry');
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const documentSummary = useMemo(() => {
    if (!entry) return { required: 0, submitted: 0 };
    const required = entry.documents_required?.filter((doc) => doc.required).length ?? 0;
    const submitted = entry.documents_submitted?.length ?? 0;
    return { required, submitted };
  }, [entry]);

  const feeDisplay = entry
    ? formatCurrency(entry.entry_fee_amount, entry.entry_fee_currency)
    : '—';

  const runAction = useCallback(
    async (
      type: 'approve' | 'paid' | 'refund',
      action: () => Promise<unknown>,
      successMessage: string
    ) => {
      if (!entry) return;
      setActionLoading(type);
      try {
        await action();
        await fetchEntry();
        Alert.alert('Entry updated', successMessage);
      } catch (err: any) {
        Alert.alert('Update failed', err?.message || 'Please try again in a moment.');
      } finally {
        setActionLoading(null);
      }
    },
    [entry, fetchEntry]
  );

  const handleApproveEntry = useCallback(() => {
    if (!entry) return;
    runAction(
      'approve',
      () => clubEntryAdminService.approveEntry(entry.id),
      'The entry has been marked as confirmed.'
    );
  }, [entry, runAction]);

  const handleMarkPaid = useCallback(() => {
    if (!entry) return;
    runAction(
      'paid',
      () => clubEntryAdminService.markEntryPaid(entry.id),
      'Payment status updated to paid.'
    );
  }, [entry, runAction]);

  const handleMarkRefunded = useCallback(() => {
    if (!entry) return;
    runAction(
      'refund',
      () => clubEntryAdminService.markEntryRefunded(entry.id),
      'Entry has been moved to withdrawn and marked as refunded.'
    );
  }, [entry, runAction]);

  const handleStubAction = (message: string) => {
    Alert.alert('Coming soon', message);
  };

  if (!entryId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Entry not specified</Text>
        <Text style={styles.errorCopy}>Return to the club dashboard and choose an entry.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F1728" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Entry #{entry?.entry_number || entry?.id.slice(0, 8) || '—'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {entry?.regatta?.name || 'Regatta entry'}
          </Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#0B63F6" />
          <Text style={styles.loadingText}>Loading entry details…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>We could not load this entry</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={fetchEntry}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && entry && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, badgeColor(entry.status)]}>
              <Text style={styles.badgeLabel}>{CLUB_ENTRY_STATUS_LABELS[entry.status]}</Text>
            </View>
            <View style={[styles.badge, badgeColor(entry.payment_status)]}>
              <Text style={styles.badgeLabel}>{CLUB_ENTRY_PAYMENT_LABELS[entry.payment_status]}</Text>
            </View>
            <View style={[styles.badge, styles.badgeNeutral]}>
              <Text style={styles.badgeLabel}>Fee {feeDisplay}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registration details</Text>
            <DetailRow label="Regatta" value={entry.regatta?.name ?? '—'} />
            <DetailRow label="Class" value={entry.entry_class} />
            <DetailRow label="Division" value={entry.division || '—'} />
            <DetailRow label="Sail number" value={entry.sail_number || entry.boat?.sail_number || '—'} />
            <DetailRow label="Entry number" value={entry.entry_number || 'Pending assignment'} />
            <DetailRow label="Created" value={formatDateTime(entry.created_at)} />
            <DetailRow label="Updated" value={formatDateTime(entry.updated_at)} />
          </View>

          <View style={styles.section}>
            <SectionHeader icon={Users} title="Sailor & crew" />
            <DetailRow label="Skipper" value={entry.sailor?.full_name || '—'} />
            <DetailRow label="Email" value={entry.sailor?.email || '—'} />
            <DetailRow label="Boat" value={entry.boat?.name || '—'} />
            <DetailRow label="Boat class" value={entry.boat?.class || '—'} />
            <DetailRow label="Owner" value={entry.boat?.owner_name || '—'} />
            <DetailRow label="Crew manifest" value="Crew assignments syncing in next release." />
          </View>

          <View style={styles.section}>
            <SectionHeader icon={CreditCard} title="Payment & status" />
            <DetailRow label="Entry fee" value={feeDisplay} />
            <DetailRow label="Status" value={CLUB_ENTRY_STATUS_LABELS[entry.status]} />
            <DetailRow label="Payment status" value={CLUB_ENTRY_PAYMENT_LABELS[entry.payment_status]} />
            <DetailRow label="Special requests" value={entry.special_requests || '—'} />
            <DetailRow label="Dietary requirements" value={entry.dietary_requirements || '—'} />
            <DetailRow label="Equipment notes" value={entry.equipment_notes || '—'} />
          </View>

          <View style={styles.section}>
            <SectionHeader icon={FileText} title="Documents" />
            <DetailRow
              label="Documents required"
              value={`${documentSummary.submitted}/${documentSummary.required} submitted`}
            />
            <DetailRow
              label="Status"
              value={
                entry.documents_complete
                  ? 'Complete'
                  : documentSummary.required === 0
                  ? 'No documents required'
                  : 'Awaiting submissions'
              }
            />
            <Text style={styles.sectionHint}>
              Full document review, upload requests, and waivers will be available in the upcoming document workflow release.
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionPrimary,
                actionLoading !== null && styles.actionButtonDisabled,
              ]}
              onPress={handleApproveEntry}
              disabled={actionLoading !== null}
            >
              <Text style={styles.actionButtonText}>
                {actionLoading === 'approve' ? 'Approving…' : 'Approve entry'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionSecondary,
                actionLoading !== null && styles.actionButtonDisabled,
              ]}
              onPress={handleMarkPaid}
              disabled={actionLoading !== null}
            >
              <Text style={[styles.actionButtonText, { color: '#0B63F6' }]}
              >
                {actionLoading === 'paid' ? 'Updating…' : 'Mark as paid'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionTertiary,
              actionLoading !== null && styles.actionButtonDisabled,
            ]}
            onPress={handleMarkRefunded}
            disabled={actionLoading !== null}
          >
            <Text style={[styles.actionButtonText, { color: '#F04438' }]}>
              {actionLoading === 'refund' ? 'Processing…' : 'Mark as refunded'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push({ pathname: '/club-dashboard', params: { clubId, view: 'entries' } })}
          >
            <Text style={styles.linkButtonText}>Back to entries overview →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '—'}</Text>
  </View>
);

const SectionHeader = ({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
}) => (
  <View style={styles.sectionHeader}>
    <Icon size={18} color="#0B63F6" />
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
  </View>
);

const badgeColor = (status: ClubEntryStatus | ClubPaymentStatus) => {
  switch (status) {
    case 'confirmed':
    case 'paid':
      return styles.badgeSuccess;
    case 'pending_payment':
    case 'pending':
    case 'pending_sync':
      return styles.badgeWarning;
    case 'waitlist':
    case 'withdrawn':
    case 'rejected':
    case 'refunded':
      return styles.badgeDanger;
    default:
      return styles.badgeNeutral;
  }
};

const formatCurrency = (amount?: number, currency?: string) => {
  const safeCurrency = currency || 'USD';
  const numeric = Number.isFinite(amount) ? (amount as number) : 0;
  return `${safeCurrency} ${numeric.toFixed(2)}`;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E8EF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1728',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#475467',
    marginTop: 2,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#475467',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1728',
    textAlign: 'center',
  },
  errorCopy: {
    fontSize: 14,
    color: '#475467',
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#0B63F6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  badgeSuccess: {
    backgroundColor: '#12B76A',
  },
  badgeWarning: {
    backgroundColor: '#F79009',
  },
  badgeDanger: {
    backgroundColor: '#F04438',
  },
  badgeNeutral: {
    backgroundColor: '#3E4C63',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1728',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F1728',
  },
  sectionHint: {
    fontSize: 12,
    color: '#475467',
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E8EF',
    paddingVertical: 10,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#475467',
    flex: 0.5,
  },
  detailValue: {
    fontSize: 13,
    color: '#0F1728',
    flex: 0.5,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionPrimary: {
    backgroundColor: '#0B63F6',
  },
  actionSecondary: {
    backgroundColor: '#E9F2FF',
    borderColor: '#0B63F6',
  },
  actionTertiary: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F04438',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#0B63F6',
    fontWeight: '600',
  },
});

export default EntryDetailScreen;
