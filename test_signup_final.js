// Final signup test with realistic email
const { chromium } = require('playwright');

async function testSignupFinal() {
  console.log('🎯 Final signup test with realistic email...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('SIGNUP') || msg.text().includes('auth') || msg.text().includes('✅')) {
      console.log(`📝 ${msg.type()}: ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:8081/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Use a more realistic email
    const testEmail = `testuser${Date.now()}@gmail.com`;
    console.log(`📧 Using email: ${testEmail}`);

    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[placeholder*="email"]', testEmail);
    await page.fill('input[type="password"]:first-of-type', 'testpassword123');
    await page.fill('input[type="password"]:last-of-type', 'testpassword123');

    console.log('🖱️ Clicking Create Account button...');
    await page.click('text=Create Account');

    // Wait longer to see the result
    await page.waitForTimeout(10000);

    // Check if we got redirected (success) or got an error
    const currentUrl = page.url();
    console.log('🌐 Current URL after signup:', currentUrl);

    if (currentUrl.includes('onboarding')) {
      console.log('🎉 SUCCESS! Redirected to onboarding page');
    } else {
      // Check for error message
      const errorText = await page.textContent('body').catch(() => '');
      if (errorText.toLowerCase().includes('error')) {
        console.log('❌ Still seeing error on page');
      } else {
        console.log('🤔 No clear success or error indication');
      }
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }

  await browser.close();
}

testSignupFinal().catch(console.error);