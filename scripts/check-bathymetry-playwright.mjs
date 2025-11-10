#!/usr/bin/env node

/**
 * Check bathymetry console logs using Playwright
 */

import { chromium } from 'playwright';

async function checkBathymetry() {
  console.log('🔍 Launching Chrome to check bathymetry logs...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1080']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text, timestamp: new Date().toISOString() });

    // Highlight bathymetry-related logs
    if (text.includes('bathymetry') ||
        text.includes('GEBCO') ||
        text.includes('synthetic') ||
        text.includes('depth')) {
      const icon = msg.type() === 'error' ? '❌' : msg.type() === 'warning' ? '⚠️' : '🎯';
      console.log(`${icon} [${msg.type()}]`, text);
    }
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('gebco.net') || request.url().includes('bathymetry')) {
      console.log('🌐 Network:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('gebco.net') || response.url().includes('bathymetry')) {
      console.log('📥 Response:', response.status(), response.url());
    }
  });

  try {
    console.log('📍 Navigating to http://localhost:8081/races\n');
    await page.goto('http://localhost:8081/races', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('✅ Page loaded. Waiting 5 seconds for React to render...\n');
    await page.waitForTimeout(5000);

    // Try to find and click on a race
    console.log('🔍 Looking for race cards...\n');
    const raceCards = await page.locator('[data-testid="race-card"], .race-card, a[href*="/race/"]').all();

    if (raceCards.length > 0) {
      console.log(`✅ Found ${raceCards.length} race cards. Clicking the first one...\n`);
      await raceCards[0].click();
      await page.waitForTimeout(3000);

      // Look for depth/bathymetry toggle
      console.log('🔍 Looking for Depth layer toggle...\n');
      const toggles = await page.locator('button, input[type="checkbox"], [role="switch"]').all();

      for (const toggle of toggles) {
        const text = await toggle.textContent().catch(() => '');
        if (text && (text.toLowerCase().includes('depth') || text.toLowerCase().includes('bathymetry'))) {
          console.log(`✅ Found toggle: "${text}". Clicking...\n`);
          await toggle.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    } else {
      console.log('⚠️ No race cards found on the page.\n');
    }

    // Wait a bit more for async data loading
    console.log('⏳ Waiting 10 seconds for bathymetry data to load...\n');
    await page.waitForTimeout(10000);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY OF BATHYMETRY LOGS');
    console.log('='.repeat(60) + '\n');

    const bathymetryLogs = logs.filter(log =>
      log.text.includes('bathymetry') ||
      log.text.includes('GEBCO') ||
      log.text.includes('synthetic')
    );

    if (bathymetryLogs.length > 0) {
      console.log(`✅ Found ${bathymetryLogs.length} bathymetry-related logs:\n`);
      bathymetryLogs.forEach((log, i) => {
        console.log(`${i + 1}. [${log.type}] ${log.text}`);
      });

      // Check for the key log
      const addingLog = bathymetryLogs.find(log => log.text.includes('Adding bathymetry deck layers'));
      if (addingLog) {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 KEY LOG FOUND:');
        console.log('='.repeat(60));
        console.log(addingLog.text);

        if (addingLog.text.includes('synthetic: false') || addingLog.text.includes('synthetic\":false')) {
          console.log('\n✅ SUCCESS! Real GEBCO data is being used!');
        } else if (addingLog.text.includes('synthetic: true') || addingLog.text.includes('synthetic\":true')) {
          console.log('\n⚠️ FALLBACK: Still using synthetic data.');
          console.log('Check the logs above for GEBCO-related errors.');
        }
      }
    } else {
      console.log('⚠️ No bathymetry-related logs found.');
      console.log('The depth layer might not have been toggled or the map didn\'t load.');
    }

    console.log('\n💡 Keeping browser open for 30 seconds for manual inspection...');
    console.log('   Check the Console tab in DevTools (press F12)\n');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Done!');
  }
}

checkBathymetry().catch(console.error);
