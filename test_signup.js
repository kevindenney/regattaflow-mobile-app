// Test script to identify signup issues
const { execSync } = require('child_process');

console.log('🧪 Testing signup functionality...');

try {
  // Test if we can reach the signup endpoint
  const result = execSync('curl -s "http://localhost:8081/signup"', { encoding: 'utf8' });

  if (result.includes('🧭 [SIGNUP] mounted')) {
    console.log('✅ Signup component is rendering');
  } else if (result.includes('🏠 [LANDING]')) {
    console.log('❌ Landing page rendering instead of signup');
  } else {
    console.log('❓ Unknown state - checking for keywords...');

    // Check for key indicators
    if (result.includes('RegattaFlow')) {
      console.log('📄 Page loads but signup component not found');
    }

    if (result.includes('error') || result.includes('Error')) {
      console.log('🚨 Possible error in page');
    }
  }

  console.log('\n📋 Summary:');
  console.log('- URL: http://localhost:8081/signup');
  console.log('- Page loads:', result.length > 0 ? '✅' : '❌');
  console.log('- Contains signup component:', result.includes('signup') ? '✅' : '❌');

} catch (error) {
  console.error('❌ Test failed:', error.message);
}