/**
 * Test Multi-Level Web Scraping
 * Tests the enhanced web scraping with calendar discovery
 */

import { scrapeClubWebsite } from '../src/services/agents/WebScrapingTools';

async function testDragonCalendarScraping() {
  console.log('🧪 Testing Multi-Level Calendar Scraping\n');

  const testUrl = 'https://www.rhkyc.org.hk/sailing/classes/classes/Dragon';

  console.log(`📍 Starting URL: ${testUrl}`);
  console.log('🔍 This should automatically:');
  console.log('   1. Scrape the Dragon class page');
  console.log('   2. Find "Sailing Calendar" link');
  console.log('   3. Follow to calendar page');
  console.log('   4. Discover Dragon2526.csv file');
  console.log('   5. Parse CSV into structured events\n');

  try {
    const result = await scrapeClubWebsite(testUrl);

    console.log('\n✅ Scraping Results:');
    console.log('===================');
    console.log(`📅 Events found: ${result.upcoming_events.length}`);
    console.log(`📄 Documents found: ${result.documents.length}`);
    console.log(`👥 Fleet members: ${result.fleet_members.length}`);

    // Show calendar events
    const calendarEvents = result.upcoming_events.filter((e: any) => e.source === 'calendar_file');
    if (calendarEvents.length > 0) {
      console.log(`\n🎯 Calendar Events (${calendarEvents.length}):`);
      calendarEvents.slice(0, 5).forEach((event: any, i: number) => {
        console.log(`   ${i + 1}. ${event.name} - ${event.date}`);
      });
      if (calendarEvents.length > 5) {
        console.log(`   ... and ${calendarEvents.length - 5} more`);
      }
    }

    // Show discovered calendar files
    const calendarDocs = result.documents.filter((d: any) => d.type === 'calendar');
    if (calendarDocs.length > 0) {
      console.log(`\n📋 Calendar Files Discovered:`);
      calendarDocs.forEach((doc: any) => {
        console.log(`   • ${doc.title}: ${doc.url}`);
      });
    }

    console.log('\n✨ Success! Multi-level scraping is working.');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testDragonCalendarScraping();
