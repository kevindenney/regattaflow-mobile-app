// Simple test to see what error appears
const { chromium } = require('playwright');

async function simpleSignupTest() {
  console.log('🔧 Simple signup test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:8081/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Fill form
    await page.fill('input[placeholder*="name"]', 'Test User');
    await page.fill('input[placeholder*="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]:first-of-type', 'testpassword123');
    await page.fill('input[type="password"]:last-of-type', 'testpassword123');

    console.log('🖱️ Clicking Create Account button...');
    await page.click('text=Create Account');

    await page.waitForTimeout(5000);

    // Get all visible text
    const bodyText = await page.textContent('body');
    console.log('📄 Page contains:');

    // Look for error-related words
    const errorWords = ['error', 'failed', 'invalid', 'required', 'must', 'cannot'];
    const lines = bodyText.split('\n');

    errorWords.forEach(word => {
      const matchingLines = lines.filter(line =>
        line.toLowerCase().includes(word.toLowerCase()) && line.trim().length > 0
      );
      if (matchingLines.length > 0) {
        console.log(`🔍 Lines with "${word}":`);
        matchingLines.forEach(line => console.log(`  - ${line.trim()}`));
      }
    });

    // Also check if create account button is still there or changed
    const buttonText = await page.locator('text=Create Account').textContent().catch(() => null);
    if (buttonText) {
      console.log('🔘 Button still says: "Create Account"');
    } else {
      const buttonAlt = await page.locator('text*=Creat').textContent().catch(() => null);
      console.log('🔘 Button now says:', buttonAlt || 'Button not found');
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }

  await browser.close();
}

simpleSignupTest().catch(console.error);