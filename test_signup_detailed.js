// Detailed signup test to see form validation issues
const { chromium } = require('playwright');

async function testSignupDetailed() {
  console.log('🔍 Running detailed signup test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('SIGNUP') || msg.text().includes('error') || msg.text().includes('Error')) {
      console.log(`📝 ${msg.type()}: ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:8081/signup', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check what form fields are actually present
    console.log('🔍 Checking form fields...');

    const nameField = await page.locator('input[placeholder*="name"]').first();
    const emailField = await page.locator('input[placeholder*="email"]');
    const passwordFields = await page.locator('input[type="password"]');

    console.log('📊 Form fields found:');
    console.log('- Name field:', await nameField.isVisible());
    console.log('- Email field:', await emailField.isVisible());
    console.log('- Password fields count:', await passwordFields.count());

    if (await nameField.isVisible()) {
      console.log('✏️ Filling name field...');
      await nameField.fill('Test User');
      const nameValue = await nameField.inputValue();
      console.log('📝 Name value after fill:', nameValue);
    }

    if (await emailField.isVisible()) {
      console.log('✏️ Filling email field...');
      await emailField.fill('test@example.com');
      const emailValue = await emailField.inputValue();
      console.log('📝 Email value after fill:', emailValue);
    }

    const passwordCount = await passwordFields.count();
    if (passwordCount >= 1) {
      console.log('✏️ Filling first password field...');
      await passwordFields.nth(0).fill('testpassword123');
      const pass1Value = await passwordFields.nth(0).inputValue();
      console.log('📝 Password 1 value length:', pass1Value.length);
    }

    if (passwordCount >= 2) {
      console.log('✏️ Filling second password field...');
      await passwordFields.nth(1).fill('testpassword123');
      const pass2Value = await passwordFields.nth(1).inputValue();
      console.log('📝 Password 2 value length:', pass2Value.length);
    }

    console.log('🖱️ Clicking Create Account button...');
    await page.click('text=Create Account');

    // Wait a bit and see what happens
    await page.waitForTimeout(3000);

    // Check if error message appears
    const errorMessage = await page.locator('text*=error').textContent().catch(() => null);
    if (errorMessage) {
      console.log('🚨 Error message found:', errorMessage);
    }

    // Check for validation error styling
    const hasErrorStyling = await page.locator('.inputError').count() > 0;
    console.log('🎨 Has error styling:', hasErrorStyling);

    console.log('✅ Detailed test completed');

  } catch (error) {
    console.error('💥 Test error:', error.message);
  }

  await browser.close();
}

testSignupDetailed().catch(console.error);