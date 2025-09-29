// Debug test to capture exact error message
const { chromium } = require('playwright');

async function debugSignup() {
  console.log('🐛 Debug test to capture exact error...');

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

    await page.waitForTimeout(3000);

    // Check for any error message on the page
    const errorElements = await page.locator('text*=error, text*=Error, text*=failed, text*=Failed, text*=invalid, text*=Invalid').all();

    console.log(`🔍 Found ${errorElements.length} potential error elements`);

    for (let i = 0; i < errorElements.length; i++) {
      const text = await errorElements[i].textContent();
      if (text && text.length > 0) {
        console.log(`📝 Error ${i + 1}: "${text}"`);
      }
    }

    // Check for any red/error styled elements
    const redElements = await page.locator('[style*="color: red"], [style*="color: #"], .error, .errorText').all();
    console.log(`🔴 Found ${redElements.length} red/error styled elements`);

    for (let i = 0; i < redElements.length; i++) {
      const text = await redElements[i].textContent();
      if (text && text.length > 0) {
        console.log(`🔴 Red element ${i + 1}: "${text}"`);
      }
    }

    // Get all text content to see what's on the page
    const allText = await page.textContent('body');
    const lines = allText.split('\n').filter(line => line.trim().length > 0 && line.toLowerCase().includes('error'));

    if (lines.length > 0) {
      console.log('📄 Lines containing "error":');
      lines.forEach((line, i) => {
        console.log(`  ${i + 1}. ${line.trim()}`);
      });
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }

  await browser.close();
}

debugSignup().catch(console.error);