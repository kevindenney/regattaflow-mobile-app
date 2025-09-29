// Browser automation test for signup functionality
const { chromium } = require('playwright');

async function testSignup() {
  console.log('🚀 Starting browser test for signup...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs and errors
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`📝 Console: ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.error(`🚨 Page Error: ${err.message}`);
  });

  try {
    console.log('🌐 Navigating to signup page...');
    await page.goto('http://localhost:8081/signup', { waitUntil: 'networkidle' });

    // Wait a bit for React to initialize
    await page.waitForTimeout(3000);

    console.log('📄 Page title:', await page.title());

    // Check if signup component is visible
    const signupExists = await page.locator('text=Create Account').isVisible().catch(() => false);
    console.log('🔍 Signup button visible:', signupExists);

    if (signupExists) {
      console.log('✅ Signup form found! Testing form submission...');

      // Fill out the form
      await page.fill('input[placeholder*="full name"]', 'Test User');
      await page.fill('input[placeholder*="email"]', 'test@example.com');
      await page.fill('input[placeholder*="password"]:first-of-type', 'testpassword123');
      await page.fill('input[placeholder*="password"]:last-of-type', 'testpassword123');

      console.log('📝 Form filled out');

      // Click signup button and wait for response
      console.log('🖱️ Clicking Create Account button...');
      await page.click('text=Create Account');

      // Wait for either success or error
      await page.waitForTimeout(15000); // Wait 15 seconds to see what happens

      console.log('⏱️ Finished waiting for signup response');
    } else {
      console.log('❌ Signup form not found');

      // Check what's actually on the page
      const bodyText = await page.textContent('body');
      console.log('📋 Page contains (first 500 chars):', bodyText.substring(0, 500));
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }

  console.log('\n📊 Summary:');
  console.log('Console logs count:', logs.length);
  console.log('Errors count:', errors.length);

  if (errors.length > 0) {
    console.log('\n🚨 Errors found:');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  // Show recent relevant logs
  const recentLogs = logs.filter(log =>
    log.includes('SIGNUP') ||
    log.includes('auth') ||
    log.includes('error') ||
    log.includes('Error') ||
    log.includes('LANDING')
  ).slice(-10);

  if (recentLogs.length > 0) {
    console.log('\n📝 Relevant console logs:');
    recentLogs.forEach((log, i) => console.log(`${i + 1}. ${log}`));
  }

  await browser.close();
  console.log('✅ Browser test completed');
}

testSignup().catch(console.error);