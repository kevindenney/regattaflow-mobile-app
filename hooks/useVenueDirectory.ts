/**
 * useVenueDirectory
 *
 * Fetches all sailing venues for the venue directory landing page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';

export interface VenueDirectoryItem {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
}

export function useVenueDirectory() {
  const [allVenues, setAllVenues] = useState<VenueDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  const fetchVenues = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const canCommit = () => isMountedRef.current && runId === fetchRunIdRef.current;

    if (!canCommit()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type')
        .order('name');

      if (dbError) throw dbError;
      if (!canCommit()) return;
      setAllVenues(data || []);
    } catch (err: any) {
      if (!canCommit()) return;
      setError(err.message || 'Failed to fetch venues');
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVenues();
  }, [fetchVenues]);

  return { allVenues, isLoading, error, refetch: fetchVenues };
}
