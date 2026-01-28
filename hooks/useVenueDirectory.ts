/**
 * useVenueDirectory
 *
 * Fetches all sailing venues for the venue directory landing page.
 */

import { useState, useEffect, useCallback } from 'react';
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

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type')
        .order('name');

      if (dbError) throw dbError;
      setAllVenues(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch venues');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  return { allVenues, isLoading, error, refetch: fetchVenues };
}
