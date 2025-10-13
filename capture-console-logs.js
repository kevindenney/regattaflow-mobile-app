const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Navigate to the venue page
  console.log('Navigating to http://localhost:8081/venue');
  await page.goto('http://localhost:8081/venue', { waitUntil: 'networkidle' });

  // Wait a bit for the page to load
  await page.waitForTimeout(3000);

  console.log('\n=== CONSOLE LOGS CAPTURED ===\n');
  logs.forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  console.log('\n=== Click venue selector button ===');

  // Try to click the venue selector button
  try {
    await page.click('text=Select venue', { timeout: 5000 });
    await page.waitForTimeout(2000);

    console.log('\n=== Venue selector opened, checking for venues ===');

    // Check if venues are visible
    const venueCards = await page.$$('.venueCard, [class*="venueCard"]');
    console.log(`Found ${venueCards.length} venue cards`);

    // Take a screenshot
    await page.screenshot({ path: 'venue-selector-screenshot.png', fullPage: true });
    console.log('Screenshot saved to venue-selector-screenshot.png');

  } catch (error) {
    console.log('Could not click venue selector:', error.message);
  }

  console.log('\n=== Final console logs ===\n');
  logs.slice(-20).forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  // Don't close immediately - wait for user to see
  console.log('\n=== Browser will stay open for 30 seconds ===');
  await page.waitForTimeout(30000);

  await browser.close();
})();
