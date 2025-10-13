/**
 * Test Web Scraping Tools
 */

import { createScrapeClubWebsiteTool, createScrapeClassWebsiteTool } from '../src/services/agents/WebScrapingTools';

async function testScraping() {
  console.log('🧪 Testing Web Scraping Tools\n');

  // Test club scraping
  const clubTool = createScrapeClubWebsiteTool();
  console.log('Testing club scraping with sample URL...');

  const clubResult = await clubTool.execute({
    url: 'https://rhkyc.org.hk',
    club_name: 'Royal Hong Kong Yacht Club',
    sailor_id: 'test-sailor-123',
  });

  console.log('\n✅ Club Scraping Result:');
  console.log(JSON.stringify(clubResult, null, 2));

  // Test class scraping
  const classTool = createScrapeClassWebsiteTool();
  console.log('\n\nTesting class scraping with sample URL...');

  const classResult = await classTool.execute({
    url: 'https://intdragon.net',
    boat_class: 'Dragon',
    sailor_id: 'test-sailor-123',
  });

  console.log('\n✅ Class Scraping Result:');
  console.log(JSON.stringify(classResult, null, 2));
}

testScraping().catch(console.error);
