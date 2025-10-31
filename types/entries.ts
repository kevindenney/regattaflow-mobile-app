export type ClubEntryStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'waitlist'
  | 'withdrawn'
  | 'rejected'
  | 'pending_sync';

export type ClubPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded' | 'waived';

export interface ClubEntryRegattaSummary {
  id: string;
  name: string;
  start_date?: string | null;
  status?: string | null;
}

export interface ClubEntryRow {
  id: string;
  regatta_id: string;
  status: ClubEntryStatus;
  payment_status: ClubPaymentStatus;
  entry_fee_amount: number;
  entry_fee_currency: string;
  entry_class: string;
  division?: string | null;
  sail_number?: string | null;
  entry_number?: string | null;
  created_at: string;
  updated_at: string;
  regatta?: ClubEntryRegattaSummary;
  sailor_name?: string | null;
  sailor_email?: string | null;
  boat_name?: string | null;
}

export const CLUB_ENTRY_STATUS_LABELS: Record<ClubEntryStatus, string> = {
  draft: 'Draft',
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  waitlist: 'Waitlist',
  withdrawn: 'Withdrawn',
  rejected: 'Rejected',
  pending_sync: 'Syncing',
};

export const CLUB_ENTRY_PAYMENT_LABELS: Record<ClubPaymentStatus, string> = {
  unpaid: 'Unpaid',
  pending: 'Pending',
  paid: 'Paid',
  refunded: 'Refunded',
  waived: 'Waived',
};
