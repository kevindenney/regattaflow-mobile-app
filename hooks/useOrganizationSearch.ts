import { useEffect, useMemo, useRef, useState } from 'react';
import {
  organizationDiscoveryService,
  type DiscoverableOrganization,
} from '@/services/OrganizationDiscoveryService';

type UseOrganizationSearchInput = {
  query: string;
  enabled?: boolean;
  limit?: number;
};

type UseOrganizationSearchResult = {
  results: DiscoverableOrganization[];
  loading: boolean;
  errorText: string | null;
  refresh: () => Promise<void>;
};

const SEARCH_DEBOUNCE_MS = 350;

function dedupeOrganizationsById(rows: DiscoverableOrganization[]): DiscoverableOrganization[] {
  const deduped = new Map<string, DiscoverableOrganization>();
  for (const row of rows) {
    if (!row?.id || deduped.has(row.id)) continue;
    deduped.set(row.id, row);
  }
  return Array.from(deduped.values());
}

export function useOrganizationSearch(input: UseOrganizationSearchInput): UseOrganizationSearchResult {
  const { query, enabled = true, limit } = input;
  const [results, setResults] = useState<DiscoverableOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const normalizedQuery = useMemo(() => String(query || '').trim(), [query]);

  const runSearch = async () => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      setErrorText(null);
      return;
    }

    if (normalizedQuery.length === 0) {
      setResults([]);
      setLoading(false);
      setErrorText(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setErrorText(null);

    try {
      const rows = await organizationDiscoveryService.searchOrganizations({
        query: normalizedQuery,
        limit,
      });
      if (requestIdRef.current !== requestId) return;
      setResults(dedupeOrganizationsById(rows));
    } catch (error: any) {
      if (requestIdRef.current !== requestId) return;
      setResults([]);
      setErrorText(String(error?.message || 'Could not search organizations.'));
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      setErrorText(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      void runSearch();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, normalizedQuery, limit]);

  return {
    results,
    loading,
    errorText,
    refresh: runSearch,
  };
}
