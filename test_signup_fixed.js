// Fixed signup test - properly fill confirm password field
const { chromium } = require('playwright');

async function testSignupFixed() {
  console.log('🔧 Fixed signup test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('SIGNUP') || msg.text().includes('✅') || msg.text().includes('❌')) {
      console.log(`📝 ${msg.type()}: ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:8081/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'testpassword123';

    console.log('📧 Using email:', testEmail);
    console.log('🔑 Using password:', testPassword);

    // Fill each field separately and verify
    console.log('✏️ Filling name field...');
    await page.fill('input[placeholder*="name"]', 'Test User');

    console.log('✏️ Filling email field...');
    await page.fill('input[placeholder*="email"]', testEmail);

    console.log('✏️ Filling password fields...');
    const passwordFields = await page.locator('input[type="password"]');
    const count = await passwordFields.count();
    console.log(`🔍 Found ${count} password fields`);

    if (count >= 1) {
      await passwordFields.nth(0).fill(testPassword);
      console.log('✅ Filled first password field');
    }

    if (count >= 2) {
      await passwordFields.nth(1).fill(testPassword);
      console.log('✅ Filled second password field (confirm)');
    }

    // Verify all fields are filled
    await page.waitForTimeout(500);

    const nameValue = await page.inputValue('input[placeholder*="name"]');
    const emailValue = await page.inputValue('input[placeholder*="email"]');
    const pass1Value = await passwordFields.nth(0).inputValue();
    const pass2Value = await passwordFields.nth(1).inputValue();

    console.log('📊 Field values before submit:');
    console.log(`  Name: "${nameValue}" (${nameValue.length} chars)`);
    console.log(`  Email: "${emailValue}" (${emailValue.length} chars)`);
    console.log(`  Password 1: ${pass1Value.length} chars`);
    console.log(`  Password 2: ${pass2Value.length} chars`);

    console.log('🖱️ Clicking Create Account button...');
    await page.click('text=Create Account');

    // Wait for result
    await page.waitForTimeout(10000);

    const currentUrl = page.url();
    console.log('🌐 Final URL:', currentUrl);

    if (currentUrl.includes('onboarding')) {
      console.log('🎉 SUCCESS! Redirected to onboarding');
    } else {
      console.log('❌ Still on signup page - check for errors');
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }

  await browser.close();
}

testSignupFixed().catch(console.error);