/**
 * useVenueFleetInfo Hook
 * Fetches fleet/class information for a venue
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface VenueFleet {
  id: string;
  venueId: string;
  boatClass: string;
  classAssociation?: string;
  typicalFleetSize?: number;
  racingFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'seasonal' | 'annual';
  activeSeasons?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

export interface UseVenueFleetInfoResult {
  fleets: VenueFleet[];
  totalFleetSize: number;
  activeFleetCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get human-readable frequency label
 */
export function getFrequencyLabel(frequency?: string): string {
  switch (frequency) {
    case 'weekly': return 'Weekly racing';
    case 'biweekly': return 'Every 2 weeks';
    case 'monthly': return 'Monthly';
    case 'seasonal': return 'Seasonal';
    case 'annual': return 'Annual events';
    default: return 'Active';
  }
}

/**
 * Hook to fetch fleet information for a venue
 */
export function useVenueFleetInfo(venueId?: string): UseVenueFleetInfoResult {
  const [fleets, setFleets] = useState<VenueFleet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFleets = useCallback(async () => {
    if (!venueId) {
      setFleets([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('venue_fleet_info')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('typical_fleet_size', { ascending: false, nullsFirst: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const transformedFleets: VenueFleet[] = (data || []).map((row: any) => ({
        id: row.id,
        venueId: row.venue_id,
        boatClass: row.boat_class,
        classAssociation: row.class_association,
        typicalFleetSize: row.typical_fleet_size,
        racingFrequency: row.racing_frequency,
        activeSeasons: row.active_seasons,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        website: row.website,
      }));

      setFleets(transformedFleets);
    } catch (err: any) {
      console.error('[useVenueFleetInfo] Error loading fleets:', err);
      setError(err.message || 'Failed to load fleet info');
    } finally {
      setIsLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadFleets();
  }, [loadFleets]);

  // Calculate totals
  const totalFleetSize = fleets.reduce((sum, f) => sum + (f.typicalFleetSize || 0), 0);
  const activeFleetCount = fleets.length;

  return {
    fleets,
    totalFleetSize,
    activeFleetCount,
    isLoading,
    error,
    refresh: loadFleets,
  };
}

export default useVenueFleetInfo;

