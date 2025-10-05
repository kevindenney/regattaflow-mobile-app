import { overpassService } from '../src/services/location/OverpassService';

async function testSailingServices() {
  console.log('🔍 Querying sailing services in Hong Kong...\n');

  // Hong Kong bounding box
  const hkBounds: [number, number, number, number] = [22.1, 113.8, 22.6, 114.5];

  const services = await overpassService.querySailingServices(hkBounds);

  console.log(`✅ Found ${services.length} sailing services in Hong Kong\n`);

  // Group by type
  const byType: Record<string, any[]> = {};

  services.forEach(s => {
    const tags = s.tags;
    let type = 'unknown';

    if (tags.shop === 'boat' || tags.shop === 'marine') type = 'chandlery';
    else if (tags.craft === 'sailmaker') type = 'sailmaker';
    else if (tags.craft === 'rigger') type = 'rigger';
    else if (tags.craft === 'boatbuilder') type = 'repair';
    else if (tags.sport === 'sailing' && tags.amenity === 'school') type = 'coach';

    if (!byType[type]) byType[type] = [];
    byType[type].push(s);
  });

  console.log('📊 By Type:');
  Object.entries(byType).forEach(([type, items]) => {
    console.log(`   ${type}: ${items.length}`);
    items.slice(0, 3).forEach(item => {
      console.log(`      - ${item.tags.name || 'Unnamed'} (${item.lat}, ${item.lon})`);
    });
  });
}

testSailingServices().catch(console.error);
