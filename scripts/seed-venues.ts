/**
 * Venue Database Seeding Script
 * Seeds Supabase with the global sailing venue schema and sample data
 */

import { supabase } from '@/services/supabase';

interface VenueData {
  id: string;
  name: string;
  coordinates: { longitude: number; latitude: number };
  country: string;
  region: string;
  venue_type: 'championship' | 'premier' | 'regional' | 'local' | 'club';
  time_zone: string;
  established_year?: number;
  data_quality: 'verified' | 'community' | 'estimated';
}

interface YachtClubData {
  id: string;
  venue_id: string;
  name: string;
  short_name?: string;
  prestige_level: 'international' | 'national' | 'regional' | 'local';
  membership_type: 'private' | 'public' | 'reciprocal';
  founded?: number;
}

// Sample venue data (from GlobalVenueDatabase)
const SAMPLE_VENUES: VenueData[] = [
  {
    id: 'hong-kong-victoria-harbor',
    name: 'Hong Kong - Victoria Harbor',
    coordinates: { longitude: 114.1694, latitude: 22.3193 },
    country: 'Hong Kong SAR',
    region: 'asia-pacific',
    venue_type: 'premier',
    time_zone: 'Asia/Hong_Kong',
    established_year: 1849,
    data_quality: 'verified'
  },
  {
    id: 'cowes-solent',
    name: 'Cowes - The Solent',
    coordinates: { longitude: -1.2982, latitude: 50.7612 },
    country: 'United Kingdom',
    region: 'europe',
    venue_type: 'premier',
    time_zone: 'Europe/London',
    established_year: 1815,
    data_quality: 'verified'
  },
  {
    id: 'americas-cup-san-francisco',
    name: 'America\'s Cup San Francisco Bay',
    coordinates: { longitude: -122.4194, latitude: 37.7749 },
    country: 'United States',
    region: 'north-america',
    venue_type: 'championship',
    time_zone: 'America/Los_Angeles',
    established_year: 2013,
    data_quality: 'verified'
  },
  {
    id: 'americas-cup-auckland',
    name: 'America\'s Cup Auckland',
    coordinates: { longitude: 174.7633, latitude: -36.8485 },
    country: 'New Zealand',
    region: 'oceania',
    venue_type: 'championship',
    time_zone: 'Pacific/Auckland',
    established_year: 2000,
    data_quality: 'verified'
  },
  {
    id: 'olympic-tokyo-enoshima',
    name: 'Olympic Sailing Venue - Enoshima',
    coordinates: { longitude: 139.4757, latitude: 35.3037 },
    country: 'Japan',
    region: 'asia-pacific',
    venue_type: 'championship',
    time_zone: 'Asia/Tokyo',
    established_year: 1964,
    data_quality: 'verified'
  },
  {
    id: 'newport-rhode-island',
    name: 'Newport, Rhode Island',
    coordinates: { longitude: -71.3128, latitude: 41.4901 },
    country: 'United States',
    region: 'north-america',
    venue_type: 'premier',
    time_zone: 'America/New_York',
    established_year: 1844,
    data_quality: 'verified'
  },
  {
    id: 'sydney-harbour',
    name: 'Sydney Harbour',
    coordinates: { longitude: 151.2093, latitude: -33.8688 },
    country: 'Australia',
    region: 'oceania',
    venue_type: 'premier',
    time_zone: 'Australia/Sydney',
    established_year: 1862,
    data_quality: 'verified'
  },
  {
    id: 'chicago-great-lakes',
    name: 'Chicago - Great Lakes',
    coordinates: { longitude: -87.6298, latitude: 41.8781 },
    country: 'United States',
    region: 'north-america',
    venue_type: 'regional',
    time_zone: 'America/Chicago',
    data_quality: 'community'
  },
  {
    id: 'palma-mallorca',
    name: 'Palma de Mallorca',
    coordinates: { longitude: 2.6502, latitude: 39.5696 },
    country: 'Spain',
    region: 'europe',
    venue_type: 'regional',
    time_zone: 'Europe/Madrid',
    data_quality: 'community'
  },
  {
    id: 'singapore-marina-bay',
    name: 'Singapore - Marina Bay',
    coordinates: { longitude: 103.8198, latitude: 1.3521 },
    country: 'Singapore',
    region: 'asia-pacific',
    venue_type: 'regional',
    time_zone: 'Asia/Singapore',
    data_quality: 'community'
  },
  {
    id: 'st-thomas-usvi',
    name: 'St. Thomas, US Virgin Islands',
    coordinates: { longitude: -64.9631, latitude: 18.3381 },
    country: 'US Virgin Islands',
    region: 'caribbean',
    venue_type: 'regional',
    time_zone: 'America/Puerto_Rico',
    established_year: 1960,
    data_quality: 'verified'
  },
  {
    id: 'bvi-tortola',
    name: 'British Virgin Islands - Tortola',
    coordinates: { longitude: -64.6208, latitude: 18.4207 },
    country: 'British Virgin Islands',
    region: 'caribbean',
    venue_type: 'regional',
    time_zone: 'America/Puerto_Rico',
    established_year: 1970,
    data_quality: 'verified'
  }
];

const SAMPLE_CLUBS: YachtClubData[] = [
  {
    id: 'rhkyc',
    venue_id: 'hong-kong-victoria-harbor',
    name: 'Royal Hong Kong Yacht Club',
    short_name: 'RHKYC',
    prestige_level: 'international',
    membership_type: 'private',
    founded: 1849
  },
  {
    id: 'royal-yacht-squadron',
    venue_id: 'cowes-solent',
    name: 'Royal Yacht Squadron',
    short_name: 'RYS',
    prestige_level: 'international',
    membership_type: 'private',
    founded: 1815
  },
  {
    id: 'st-francis-yacht-club',
    venue_id: 'americas-cup-san-francisco',
    name: 'St. Francis Yacht Club',
    short_name: 'StFYC',
    prestige_level: 'international',
    membership_type: 'private'
  },
  {
    id: 'royal-new-zealand-yacht-squadron',
    venue_id: 'americas-cup-auckland',
    name: 'Royal New Zealand Yacht Squadron',
    short_name: 'RNZYS',
    prestige_level: 'international',
    membership_type: 'private'
  },
  {
    id: 'enoshima-yacht-club',
    venue_id: 'olympic-tokyo-enoshima',
    name: 'Enoshima Yacht Club',
    prestige_level: 'national',
    membership_type: 'public'
  },
  {
    id: 'new-york-yacht-club',
    venue_id: 'newport-rhode-island',
    name: 'New York Yacht Club',
    short_name: 'NYYC',
    prestige_level: 'international',
    membership_type: 'private',
    founded: 1844
  },
  {
    id: 'cruising-yacht-club-australia',
    venue_id: 'sydney-harbour',
    name: 'Cruising Yacht Club of Australia',
    short_name: 'CYCA',
    prestige_level: 'international',
    membership_type: 'private',
    founded: 1862
  },
  {
    id: 'st-thomas-yacht-club',
    venue_id: 'st-thomas-usvi',
    name: 'St. Thomas Yacht Club',
    short_name: 'STYC',
    prestige_level: 'regional',
    membership_type: 'private',
    founded: 1963
  }
];

export async function seedVenueDatabase(): Promise<void> {

  try {
    // Check if venues already exist
    const { count, error: countError } = await supabase
      .from('sailing_venues')
      .select('*', { count: 'exact', head: true });

    if (countError) {
    } else {
      if (count && count > 0) {
        // Continue with upsert instead of returning early
      }
    }

    // Create the basic tables first (simplified version for immediate use)

    // First, try to create table using Supabase's SQL editor approach

    // Instead of trying to CREATE TABLE, we'll let Supabase auto-create the table
    // by doing an INSERT with proper data types. If the table doesn't exist,
    // Supabase will create it with inferred schema.

    // Insert venues

    const venuesForInsert = SAMPLE_VENUES.map(venue => ({
      id: venue.id,
      name: venue.name,
      coordinates_lng: venue.coordinates.longitude,
      coordinates_lat: venue.coordinates.latitude,
      country: venue.country,
      region: venue.region,
      venue_type: venue.venue_type,
      established_year: venue.established_year,
      time_zone: venue.time_zone,
      data_quality: venue.data_quality
    }));

    const { data: venuesData, error: venuesError } = await supabase
      .from('sailing_venues')
      .insert(venuesForInsert)
      .select();

    if (venuesError) {

      throw venuesError;
    }

    // Create yacht_clubs table

    const createClubsTable = `
      CREATE TABLE IF NOT EXISTS yacht_clubs (
        id TEXT PRIMARY KEY,
        venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        short_name TEXT,
        prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
        membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',
        founded INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await supabase.rpc('exec_sql', { sql: createClubsTable });

    // Insert yacht clubs

    const { data: clubsData, error: clubsError } = await supabase
      .from('yacht_clubs')
      .insert(SAMPLE_CLUBS)
      .select();

    if (clubsError) {

      throw clubsError;
    }

    // Verify the data
    const { count: finalCount } = await supabase
      .from('sailing_venues')
      .select('*', { count: 'exact', head: true });

  } catch (error: any) {

    throw new Error(`Seeding failed: ${error.message}`);
  }
}

// Export for use in other modules
export { SAMPLE_VENUES, SAMPLE_CLUBS };