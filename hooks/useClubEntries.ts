import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';
import {
  ClubEntryRow,
  ClubEntryStatus,
  ClubPaymentStatus,
} from '@/types/entries';

export interface ClubEntryCurrencySummary {
  currency: string;
  collected: number;
  outstanding: number;
  refunded: number;
}

export interface ClubEntrySummary {
  totalEntries: number;
  confirmed: number;
  pendingPayment: number;
  waitlist: number;
  withdrawn: number;
  revenueCollected: number;
  revenueOutstanding: number;
  revenueRefunded: number;
  currencyBreakdown: ClubEntryCurrencySummary[];
}

interface UseClubEntriesOptions {
  enabled?: boolean;
}

interface UseClubEntriesResult {
  entries: ClubEntryRow[];
  summary: ClubEntrySummary;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const createEmptySummary = (): ClubEntrySummary => ({
  totalEntries: 0,
  confirmed: 0,
  pendingPayment: 0,
  waitlist: 0,
  withdrawn: 0,
  revenueCollected: 0,
  revenueOutstanding: 0,
  revenueRefunded: 0,
  currencyBreakdown: [],
});

export function useClubEntries(
  clubId?: string,
  options: UseClubEntriesOptions = {}
): UseClubEntriesResult {
  const { enabled = true } = options;

  const [entries, setEntries] = useState<ClubEntryRow[]>([]);
  const [summary, setSummary] = useState<ClubEntrySummary>(createEmptySummary);
  const [loading, setLoading] = useState<boolean>(Boolean(enabled && clubId));
  const [error, setError] = useState<Error | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!clubId || !enabled) {
      setEntries([]);
      setSummary(createEmptySummary());
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: regattas, error: regattasError } = await supabase
        .from('club_race_calendar')
        .select('id, event_name, start_date, status')
        .eq('club_id', clubId);

      if (regattasError) {
        throw regattasError;
      }

      const regattaMap = new Map<string, { id: string; name: string; start_date?: string | null; status?: string | null }>();
      const regattaIds: string[] = [];

      (regattas || []).forEach((regatta) => {
        const row = {
          id: regatta.id,
          name: regatta.event_name || 'Regatta',
          start_date: regatta.start_date,
          status: regatta.status,
        };
        regattaMap.set(regatta.id, row);
        regattaIds.push(regatta.id);
      });

      if (regattaIds.length === 0) {
        setEntries([]);
        setSummary(createEmptySummary());
        setLoading(false);
        return;
      }

      const { data: entryRows, error: entriesError } = await supabase
        .from('race_entries')
        .select(
          `
            id,
            regatta_id,
            status,
            payment_status,
            entry_fee_amount,
            entry_fee_currency,
            entry_class,
            division,
            sail_number,
            entry_number,
            created_at,
            updated_at
          `
        )
        .in('regatta_id', regattaIds)
        .order('created_at', { ascending: false });

      if (entriesError) {
        throw entriesError;
      }

      const normalizedEntries: ClubEntryRow[] = (entryRows || []).map((row: any) => {
        const regatta = regattaMap.get(row.regatta_id);
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
          regatta: regatta
            ? {
                id: regatta.id,
                name: regatta.name,
                start_date: regatta.start_date,
                status: regatta.status,
              }
            : undefined,
          sailor_name: null,
          sailor_email: null,
          boat_name: null,
        };
      });

      const totals = createEmptySummary();
      const currencyMap = new Map<
        string,
        { collected: number; outstanding: number; refunded: number }
      >();

      normalizedEntries.forEach((entry) => {
        totals.totalEntries += 1;

        if (entry.status === 'confirmed') totals.confirmed += 1;
        if (entry.status === 'waitlist') totals.waitlist += 1;
        if (entry.status === 'withdrawn' || entry.status === 'rejected') totals.withdrawn += 1;
        if (entry.status === 'pending_payment' || entry.payment_status === 'pending' || entry.payment_status === 'unpaid') {
          totals.pendingPayment += 1;
        }

        const currency = entry.entry_fee_currency || 'USD';
        if (!currencyMap.has(currency)) {
          currencyMap.set(currency, { collected: 0, outstanding: 0, refunded: 0 });
        }
        const bucket = currencyMap.get(currency)!;
        const fee = entry.entry_fee_amount || 0;

        switch (entry.payment_status) {
          case 'paid':
            totals.revenueCollected += fee;
            bucket.collected += fee;
            break;
          case 'refunded':
            totals.revenueRefunded += fee;
            bucket.refunded += fee;
            break;
          case 'waived':
            // treated as neither collected nor outstanding
            break;
          default:
            totals.revenueOutstanding += fee;
            bucket.outstanding += fee;
            break;
        }
      });

      totals.currencyBreakdown = Array.from(currencyMap.entries()).map(
        ([currency, values]) => ({
          currency,
          collected: values.collected,
          outstanding: values.outstanding,
          refunded: values.refunded,
        })
      );

      setEntries(normalizedEntries);
      setSummary(totals);
    } catch (err) {
      setError(err as Error);
      setEntries([]);
      setSummary(createEmptySummary());
    } finally {
      setLoading(false);
    }
  }, [clubId, enabled]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    summary,
    loading,
    error,
    refetch: fetchEntries,
  };
}
