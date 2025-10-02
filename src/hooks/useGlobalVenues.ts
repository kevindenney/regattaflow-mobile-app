/**
 * Global Venues Hook
 * Fetches and manages all 126+ global sailing venues from Supabase
 * Provides venue data for map display and selection
 */

import { useState, useEffect } from 'react';
import { SupabaseVenueService } from '@/src/services/venue/SupabaseVenueService';

export interface GlobalVenue {
  id: string;
  name: string;
  country: string;
  region: string;
  venueType: 'championship' | 'premier' | 'regional' | 'local' | 'club';
  coordinates: [number, number]; // [lng, lat] for MapLibre
  updatedAt?: string;
}

export interface UseGlobalVenuesState {
  venues: GlobalVenue[];
  isLoading: boolean;
  error: string | null;
  venuesByRegion: Record<string, GlobalVenue[]>;
  championshipVenues: GlobalVenue[];
  premierVenues: GlobalVenue[];
}

export interface UseGlobalVenuesActions {
  refreshVenues: () => Promise<void>;
  getVenuesByCountry: (country: string) => GlobalVenue[];
  getVenuesByRegion: (region: string) => GlobalVenue[];
  getVenueById: (id: string) => GlobalVenue | undefined;
}

const venueService = new SupabaseVenueService();

/**
 * Hook to fetch and manage all global sailing venues
 */
export function useGlobalVenues(): UseGlobalVenuesState & UseGlobalVenuesActions {
  const [state, setState] = useState<UseGlobalVenuesState>({
    venues: [],
    isLoading: true,
    error: null,
    venuesByRegion: {},
    championshipVenues: [],
    premierVenues: [],
  });

  /**
   * Fetch all venues from Supabase
   */
  const fetchVenues = async () => {
    console.log('🌍 useGlobalVenues: Fetching all global venues...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch all venues (no limit to get all 126)
      const allVenues = await venueService.listVenuesForClient(200);

      console.log(`🌍 useGlobalVenues: Fetched ${allVenues.length} venues`);

      // Group venues by region
      const byRegion: Record<string, GlobalVenue[]> = {};
      allVenues.forEach(venue => {
        if (!byRegion[venue.region]) {
          byRegion[venue.region] = [];
        }
        byRegion[venue.region].push(venue as GlobalVenue);
      });

      // Filter championship and premier venues
      const championship = allVenues.filter(v => v.venueType === 'championship');
      const premier = allVenues.filter(v => v.venueType === 'premier');

      setState({
        venues: allVenues as GlobalVenue[],
        isLoading: false,
        error: null,
        venuesByRegion: byRegion,
        championshipVenues: championship as GlobalVenue[],
        premierVenues: premier as GlobalVenue[],
      });

      console.log('🌍 useGlobalVenues: Venue breakdown:', {
        total: allVenues.length,
        championship: championship.length,
        premier: premier.length,
        regions: Object.keys(byRegion),
      });
    } catch (error: any) {
      console.error('❌ useGlobalVenues: Failed to fetch venues:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch venues',
      }));
    }
  };

  /**
   * Refresh venues from database
   */
  const refreshVenues = async () => {
    await fetchVenues();
  };

  /**
   * Get venues for a specific country
   */
  const getVenuesByCountry = (country: string): GlobalVenue[] => {
    return state.venues.filter(v => v.country === country);
  };

  /**
   * Get venues for a specific region
   */
  const getVenuesByRegion = (region: string): GlobalVenue[] => {
    return state.venuesByRegion[region] || [];
  };

  /**
   * Get venue by ID
   */
  const getVenueById = (id: string): GlobalVenue | undefined => {
    return state.venues.find(v => v.id === id);
  };

  // Fetch venues on mount
  useEffect(() => {
    fetchVenues();
  }, []);

  return {
    ...state,
    refreshVenues,
    getVenuesByCountry,
    getVenuesByRegion,
    getVenueById,
  };
}
