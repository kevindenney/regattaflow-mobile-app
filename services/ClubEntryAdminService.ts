import { supabase } from './supabase';
import {
  ClubEntryStatus,
  ClubPaymentStatus,
  ClubEntryRow,
  CLUB_ENTRY_STATUS_LABELS,
  CLUB_ENTRY_PAYMENT_LABELS,
} from '@/types/entries';

const ENTRY_SELECT = `
  *,
  regatta:club_race_calendar!race_entries_regatta_id_fkey ( id, event_name, start_date, status ),
  sailor:users!race_entries_sailor_id_fkey ( id, full_name, email ),
  boat:boats!race_entries_boat_id_fkey ( id, name, class, sail_number, owner_name )
`;

const formatCurrency = (amount?: number, currency?: string) => {
  const numeric = Number.isFinite(amount) ? (amount as number) : 0;
  const safeCurrency = currency || 'USD';
  return `${safeCurrency} ${numeric.toFixed(2)}`;
};

export class ClubEntryAdminService {
  private normalizeRow(row: any): ClubEntryRow {
    return {
      id: row.id,
      regatta_id: row.regatta_id,
      status: row.status,
      payment_status: row.payment_status,
      entry_fee_amount: row.entry_fee_amount || 0,
      entry_fee_currency: row.entry_fee_currency || 'USD',
      entry_class: row.entry_class,
      division: row.division,
      sail_number: row.sail_number,
      entry_number: row.entry_number,
      created_at: row.created_at,
      updated_at: row.updated_at,
      regatta: row.regatta
        ? {
            id: row.regatta.id,
            name: row.regatta.event_name || 'Regatta',
            start_date: row.regatta.start_date,
            status: row.regatta.status,
          }
        : undefined,
      sailor_name: row.sailor?.full_name || null,
      sailor_email: row.sailor?.email || null,
      boat_name: row.boat?.name || null,
    };
  }

  private async updateEntry(
    entryId: string,
    payload: Partial<{
      status: ClubEntryStatus;
      payment_status: ClubPaymentStatus;
      documents_complete: boolean;
      entry_fee_amount: number;
      entry_fee_currency: string;
    }>
  ): Promise<ClubEntryRow> {
    const { data, error } = await supabase
      .from('race_entries')
      .update(payload)
      .eq('id', entryId)
      .select(ENTRY_SELECT)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Entry not found');
    }

    return this.normalizeRow(data);
  }

  async approveEntry(entryId: string): Promise<ClubEntryRow> {
    return this.updateEntry(entryId, { status: 'confirmed' });
  }

  async markEntryPaid(entryId: string): Promise<ClubEntryRow> {
    return this.updateEntry(entryId, { payment_status: 'paid' });
  }

  async markEntryRefunded(entryId: string): Promise<ClubEntryRow> {
    return this.updateEntry(entryId, { payment_status: 'refunded', status: 'withdrawn' });
  }

  async setPaymentStatus(entryId: string, payment_status: ClubPaymentStatus): Promise<ClubEntryRow> {
    return this.updateEntry(entryId, { payment_status });
  }

  async setStatus(entryId: string, status: ClubEntryStatus): Promise<ClubEntryRow> {
    return this.updateEntry(entryId, { status });
  }

  getStatusLabel(status: ClubEntryStatus): string {
    return CLUB_ENTRY_STATUS_LABELS[status];
  }

  getPaymentStatusLabel(status: ClubPaymentStatus): string {
    return CLUB_ENTRY_PAYMENT_LABELS[status];
  }

  describePayment(entry: ClubEntryRow): string {
    const label = this.getPaymentStatusLabel(entry.payment_status);
    return `${label} – ${formatCurrency(entry.entry_fee_amount, entry.entry_fee_currency)}`;
  }
}

export const clubEntryAdminService = new ClubEntryAdminService();
