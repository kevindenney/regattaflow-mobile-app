/**
 * Generate SQL to import OSM marinas to Supabase
 * Creates batched INSERT statements for the 30,340 downloaded marinas
 */

import * as fs from 'fs';
import * as path from 'path';

interface OSMMarina {
  id: string | number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'addr:country'?: string;
    'addr:state'?: string;
    'addr:region'?: string;
    [key: string]: any;
  };
}

const jsonPath = path.join(process.cwd(), 'data', 'global-marinas.json');
const marinas: OSMMarina[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// Filter to marinas with names (better quality)
const namedMarinas = marinas.filter(m => m.lat && m.lon && m.tags.name);

console.log(`-- OSM Marina Import SQL`);
console.log(`-- Total marinas: ${marinas.length.toLocaleString()}`);
console.log(`-- Named marinas: ${namedMarinas.length.toLocaleString()}`);
console.log(`-- Importing named marinas only for better quality\n`);

// Generate SQL for first 5000 named marinas
const LIMIT = 5000;
const batch = namedMarinas.slice(0, LIMIT);

console.log(`-- Importing ${batch.length} marinas (batch 1)\n`);

batch.forEach((m, i) => {
  const id = `osm-${m.type}-${m.id}`;
  const name = (m.tags.name || `Marina ${m.id}`).replace(/'/g, "''");
  const country = (m.tags['addr:country'] || 'Unknown').replace(/'/g, "''");
  const region = (m.tags['addr:state'] || m.tags['addr:region'] || 'Unknown').replace(/'/g, "''");

  console.log(`INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, country, region, venue_type, time_zone, data_quality, osm_id, osm_type, data_source, verified)`);
  console.log(`VALUES ('${id}', '${name}', ${m.lat}, ${m.lon}, '${country}', '${region}', 'regional', 'UTC', 'osm', '${m.id}', '${m.type}', 'osm', false)`);
  console.log(`ON CONFLICT (id) DO UPDATE SET coordinates_lat = EXCLUDED.coordinates_lat, coordinates_lng = EXCLUDED.coordinates_lng;`);

  if (i < batch.length - 1) console.log('');
});

console.log(`\n-- Import complete: ${batch.length} marinas`);
console.log(`-- Remaining: ${namedMarinas.length - batch.length} marinas`);
