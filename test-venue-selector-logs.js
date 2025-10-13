/**
 * Test script to capture VenueSelector console logs
 */

const { chromium } = require('playwright');

async function testVenueSelector() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const venueLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🏁 VenueSelector') || text.includes('VENUE') || text.includes('sailing_venues')) {
      venueLogs.push(text);
      console.log(text);
    }
  });

  console.log('🧪 Navigating to http://localhost:8081...');
  await page.goto('http://localhost:8081');

  console.log('🧪 Waiting for app to load...');
  await page.waitForTimeout(5000);

  console.log('🧪 Looking for Venue tab...');
  try {
    await page.click('text=Venue', { timeout: 5000 });
    console.log('✅ Clicked Venue tab');
  } catch (e) {
    console.log('⚠️ Could not find Venue tab, trying alternative selectors...');
    await page.click('[href="/venue"]', { timeout: 5000 });
  }

  console.log('🧪 Waiting for venue page to load...');
  await page.waitForTimeout(3000);

  console.log('🧪 Looking for venue selector button...');
  try {
    const venueButton = await page.locator('text=/Select venue|Venue/i').first();
    await venueButton.click();
    console.log('✅ Clicked venue selector button');
  } catch (e) {
    console.log('⚠️ Could not find venue selector button:', e.message);
  }

  console.log('🧪 Waiting for modal to open and data to load...');
  await page.waitForTimeout(5000);

  console.log('\n📊 VENUE SELECTOR LOGS SUMMARY:');
  console.log('='.repeat(80));
  venueLogs.forEach(log => console.log(log));
  console.log('='.repeat(80));

  console.log('\n✅ Test complete. Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
}

testVenueSelector().catch(console.error);
