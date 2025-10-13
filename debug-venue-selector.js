const { chromium } = require('playwright');

(async () => {
  console.log('🎭 Starting Playwright debug session...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-web-security'] // Allow localhost
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });

    // Print venue-related logs immediately
    if (text.includes('🏁') || text.includes('🎯') || text.includes('VenueSelector')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('sailing_venues') || request.url().includes('venue')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('sailing_venues') || response.url().includes('venue')) {
      const status = response.status();
      console.log(`📊 RESPONSE: ${status} ${response.url()}`);

      if (status === 200 && response.url().includes('sailing_venues')) {
        try {
          const data = await response.json();
          console.log(`✅ Supabase returned ${data.length} venues`);
        } catch (e) {
          console.log('⚠️  Could not parse response as JSON');
        }
      }
    }
  });

  // Navigate to venue page
  console.log('\n🌐 Navigating to http://localhost:8081/venue\n');

  try {
    await page.goto('http://localhost:8081/venue', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  } catch (error) {
    console.error('❌ Failed to load page:', error.message);
    await browser.close();
    return;
  }

  console.log('\n⏳ Waiting 3 seconds for initial load...\n');
  await page.waitForTimeout(3000);

  // Check if venue is showing
  console.log('\n🔍 Checking current venue state...\n');

  const venueText = await page.locator('text=/Victoria Harbour|Select venue/').first().textContent().catch(() => 'Not found');
  console.log('📍 Current venue text:', venueText);

  // Try to find and click the venue selector button
  console.log('\n🎯 Attempting to open venue selector...\n');

  try {
    // Look for venue selector button - it might have different text
    const selectorButton = page.locator('text=/Victoria Harbour|Select.*venue/i').first();
    await selectorButton.waitFor({ timeout: 5000 });

    console.log('✅ Found venue selector button');
    await selectorButton.click();

    console.log('🎯 Clicked venue selector, waiting for modal...\n');
    await page.waitForTimeout(2000);

    // Check if modal appeared
    const modalTitle = await page.locator('text=Select Sailing Venue').isVisible();
    console.log('📋 Modal visible:', modalTitle);

    if (modalTitle) {
      // Check loading state
      const loadingSpinner = await page.locator('[role="progressbar"], .loading').isVisible().catch(() => false);
      console.log('⏳ Loading spinner visible:', loadingSpinner);

      // Wait a bit more for venues to load
      await page.waitForTimeout(2000);

      // Check for venue cards
      const venueCards = await page.locator('[class*="venueCard"]').count();
      console.log('🏁 Venue cards found:', venueCards);

      // Check footer text for venue count
      const footerText = await page.locator('text=/\\d+ venues/').textContent().catch(() => 'No footer');
      console.log('📊 Footer text:', footerText);

      // Get first few visible venue names
      if (venueCards > 0) {
        console.log('\n✅ SUCCESS! Venues are visible:\n');
        const venueNames = await page.locator('[class*="venueName"]').allTextContents();
        venueNames.slice(0, 5).forEach((name, i) => {
          console.log(`  ${i + 1}. ${name}`);
        });
      } else {
        console.log('\n❌ PROBLEM: Modal opened but no venue cards found');
        console.log('Checking if empty state is showing...');
        const emptyText = await page.locator('text=/No venues|0 venues/').textContent().catch(() => 'No empty state');
        console.log('Empty state text:', emptyText);
      }

      // Take screenshot
      await page.screenshot({ path: 'venue-selector-debug.png', fullPage: true });
      console.log('\n📸 Screenshot saved to venue-selector-debug.png');
    } else {
      console.log('❌ Modal did not appear after clicking');
    }

  } catch (error) {
    console.error('❌ Error opening venue selector:', error.message);
  }

  // Print summary of console logs
  console.log('\n' + '='.repeat(60));
  console.log('📋 CONSOLE LOG SUMMARY');
  console.log('='.repeat(60) + '\n');

  const venueRelatedLogs = consoleLogs.filter(log =>
    log.text.includes('🏁') ||
    log.text.includes('🎯') ||
    log.text.includes('VenueSelector') ||
    log.text.includes('fetchVenues')
  );

  console.log(`Total venue-related logs: ${venueRelatedLogs.length}\n`);

  venueRelatedLogs.forEach(log => {
    console.log(`[${log.type.toUpperCase()}] ${log.text}`);
  });

  // Print network summary
  console.log('\n' + '='.repeat(60));
  console.log('📡 NETWORK SUMMARY');
  console.log('='.repeat(60) + '\n');

  console.log(`Total venue-related requests: ${networkRequests.length}\n`);
  networkRequests.forEach(req => {
    console.log(`${req.method} ${req.url}`);
  });

  console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('\n✅ Debug session complete!');
})();
