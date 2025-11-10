#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedClubsDirectory() {
  console.log('\n🌊 Seeding Yacht Clubs Directory...\n');

  try {
    // Load yacht clubs data
    const yachtClubsPath = resolve(__dirname, '../data/yacht-clubs.json');
    const yachtClubsRaw = readFileSync(yachtClubsPath, 'utf-8');
    const yachtClubsData = JSON.parse(yachtClubsRaw);

    if (!yachtClubsData.clubs) {
      console.error('❌ No clubs found in yacht-clubs.json');
      return;
    }

    const clubsArray = Object.values(yachtClubsData.clubs);
    console.log(`📚 Found ${clubsArray.length} clubs in yacht-clubs.json\n`);

    // Transform the data to match the clubs table schema
    const clubsToInsert = clubsArray.map((club) => {
      // Extract first venue coordinates or use headquarters
      let latitude = null;
      let longitude = null;

      if (club.headquarters?.coordinates) {
        [longitude, latitude] = club.headquarters.coordinates;
      } else if (club.venues && club.venues.length > 0 && club.venues[0].coordinates) {
        [longitude, latitude] = club.venues[0].coordinates;
      }

      // Build address
      let address = club.headquarters?.address || '';
      if (club.headquarters?.name && !address.includes(club.headquarters.name)) {
        address = `${club.headquarters.name}, ${address}`;
      }

      // Match the actual clubs table schema
      const clubData = {
        name: club.name,
        short_name: club.shortName || club.name.split(' ').map(w => w[0]).join(''),
        description: club.overview?.summary || `${club.name} - ${club.country || 'International Yacht Club'}`,
        address: address || null,
        phone: null,
        email: null,
        website: club.website || null,
        contact_person: club.headquarters?.contactPerson || null,
        membership_type: club.membership?.reciprocal ? 'reciprocal' : 'private',
        club_type: 'yacht_club',
        timezone: club.timezone || 'UTC',
        is_active: true,
      };

      return clubData;
    });

    // Insert clubs into the database
    console.log('💾 Inserting clubs into database...\n');

    const { data, error } = await supabase
      .from('clubs')
      .insert(clubsToInsert)
      .select();

    if (error) {
      console.error('❌ Error inserting clubs:', error.message);
      console.error('   Details:', error);
      return;
    }

    console.log(`✅ Successfully seeded ${data?.length || clubsToInsert.length} clubs!\n`);

    // Show sample of inserted clubs
    console.log('📝 Sample clubs:');
    const sampleClubs = data?.slice(0, 5) || clubsToInsert.slice(0, 5);
    sampleClubs.forEach((club, idx) => {
      console.log(`  ${idx + 1}. ${club.name} (${club.short_name})`);
    });

    console.log('\n✨ Clubs directory seeded successfully!\n');

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

seedClubsDirectory();
