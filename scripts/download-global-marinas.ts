/**
 * Download Global Marina Data from OpenStreetMap
 * Uses Overpass API to get ALL marinas worldwide - FREE
 *
 * This will download ~10,000+ marina locations globally
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { OverpassService } from '../src/services/location/OverpassService';

const overpass = new OverpassService();

interface MarinaStats {
  totalMarinas: number;
  byCountry: Record<string, number>;
  byRegion: Record<string, number>;
  withNames: number;
  withWebsites: number;
  withPhone: number;
}

async function downloadGlobalMarinas() {
  console.log('🌍 GLOBAL MARINA DOWNLOAD');
  console.log('='.repeat(70));
  console.log('Downloading ALL sailing venues from OpenStreetMap');
  console.log('This is FREE and will get ~10,000+ locations\n');

  const startTime = Date.now();

  try {
    // Download all marinas worldwide
    const marinas = await overpass.downloadAllMarinasWorldwide();

    // Generate statistics
    const stats: MarinaStats = {
      totalMarinas: marinas.length,
      byCountry: {},
      byRegion: {},
      withNames: marinas.filter(m => m.tags.name).length,
      withWebsites: marinas.filter(m => m.tags.website).length,
      withPhone: marinas.filter(m => m.tags.phone).length,
    };

    // Count by tags
    marinas.forEach(marina => {
      // Try to extract country from tags
      const country = marina.tags['addr:country'] ||
                     marina.tags['ISO3166-1'] ||
                     'Unknown';
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
    });

    // Save to JSON file
    const outputPath = resolve(__dirname, '../data/global-marinas.json');
    writeFileSync(outputPath, JSON.stringify(marinas, null, 2));

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 DOWNLOAD COMPLETE');
    console.log('='.repeat(70));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📍 Total marinas: ${stats.totalMarinas.toLocaleString()}`);
    console.log(`📝 With names: ${stats.withNames.toLocaleString()} (${((stats.withNames/stats.totalMarinas)*100).toFixed(1)}%)`);
    console.log(`🌐 With websites: ${stats.withWebsites.toLocaleString()}`);
    console.log(`📞 With phone: ${stats.withPhone.toLocaleString()}`);
    console.log(`\n💾 Saved to: ${outputPath}`);

    // Print top countries
    const topCountries = Object.entries(stats.byCountry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    console.log('\n🌍 Top 10 Countries:');
    topCountries.forEach(([country, count], idx) => {
      console.log(`   ${idx + 1}. ${country}: ${count.toLocaleString()}`);
    });

    // Generate SQL insert statements (sample)
    console.log('\n📋 Generating SQL import script...');

    const sqlInserts: string[] = [];

    marinas.slice(0, 100).forEach(marina => {
      const venue = OverpassService.toVenueFormat(marina);

      // Generate unique ID from OSM ID
      const venueId = `osm-${marina.type}-${marina.id}`;

      const sql = `
INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, osm_id, osm_type, website, data_quality, venue_type)
VALUES (
  '${venueId}',
  '${venue.name.replace(/'/g, "''")}',
  ${venue.coordinates_lat},
  ${venue.coordinates_lng},
  '${venue.osm_id}',
  '${venue.osm_type}',
  ${venue.website ? `'${venue.website}'` : 'NULL'},
  'osm',
  'regional'
)
ON CONFLICT (id) DO UPDATE SET
  coordinates_lat = EXCLUDED.coordinates_lat,
  coordinates_lng = EXCLUDED.coordinates_lng,
  updated_at = NOW();
      `.trim();

      sqlInserts.push(sql);
    });

    const sqlPath = resolve(__dirname, '../data/import-marinas-sample.sql');
    writeFileSync(sqlPath, sqlInserts.join('\n\n'));
    console.log(`   ✅ Sample SQL (first 100): ${sqlPath}`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Review the data in data/global-marinas.json');
    console.log('   2. Run the import script to add to database');
    console.log('   3. Optionally enhance premier venues with Google Places');

    console.log('\n💰 Cost: $0 (OpenStreetMap is free!)');

  } catch (error: any) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run
downloadGlobalMarinas().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
