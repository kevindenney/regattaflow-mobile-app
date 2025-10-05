/**
 * Import OSM Marinas to Supabase
 * Processes the downloaded global-marinas.json and imports to sailing_venues table
 * Uses batching to avoid timeout and provides progress updates
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface OSMMarina {
  id: string | number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  tags: {
    name?: string;
    website?: string;
    phone?: string;
    [key: string]: any;
  };
}

async function importMarinas() {
  console.log('🚀 IMPORTING OSM MARINAS TO SUPABASE');
  console.log('======================================================================\n');

  // Load JSON data
  const jsonPath = path.join(process.cwd(), 'data', 'global-marinas.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    console.log('💡 Run: npm run download:marinas first');
    process.exit(1);
  }

  const marinas: OSMMarina[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`📊 Loaded ${marinas.length.toLocaleString()} marinas from JSON\n`);

  // Convert to database format
  const venues = marinas
    .filter(m => m.lat && m.lon) // Only those with coordinates
    .map(m => ({
      id: `osm-${m.type}-${m.id}`,
      name: m.tags.name || `Marina ${m.id}`,
      coordinates_lat: m.lat,
      coordinates_lng: m.lon,
      osm_id: String(m.id),
      osm_type: m.type,
      website: m.tags.website || null,
      phone_number: m.tags.phone || null,
      data_source: 'osm' as const,
      data_quality: 'osm' as const,
      venue_type: 'regional' as const,
      verified: false,
    }));

  console.log(`✅ Converted ${venues.length.toLocaleString()} venues for import\n`);

  // Batch import (1000 at a time to avoid timeout)
  const BATCH_SIZE = 1000;
  const totalBatches = Math.ceil(venues.length / BATCH_SIZE);
  let imported = 0;
  let errors = 0;

  console.log(`📦 Importing in ${totalBatches} batches of ${BATCH_SIZE}...\n`);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, venues.length);
    const batch = venues.slice(start, end);

    console.log(`   Batch ${i + 1}/${totalBatches}: Importing ${batch.length} venues...`);

    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .upsert(batch, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`   ❌ Error in batch ${i + 1}:`, error.message);
        errors++;
      } else {
        imported += batch.length;
        console.log(`   ✅ Batch ${i + 1} complete (${imported.toLocaleString()}/${venues.length.toLocaleString()})`);
      }
    } catch (err: any) {
      console.error(`   ❌ Batch ${i + 1} failed:`, err.message);
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n======================================================================');
  console.log('📊 IMPORT SUMMARY');
  console.log('======================================================================');
  console.log(`✅ Successfully imported: ${imported.toLocaleString()} venues`);
  console.log(`❌ Failed batches: ${errors}`);
  console.log(`📍 Total in database: ${imported.toLocaleString()}`);
  console.log('\n💡 Next steps:');
  console.log('   1. View venues in Supabase dashboard');
  console.log('   2. Update map to display OSM venues');
  console.log('   3. Optionally enhance premium venues with Google Places');
  console.log('\n💰 Total cost: $0 (OpenStreetMap is free!)');
}

importMarinas().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
