/**
 * Quick test script to verify Anthropic API key is accessible
 * Run this with: npx ts-node test-anthropic-key.ts
 */

require('dotenv').config();

console.log('='.repeat(50));
console.log('ANTHROPIC API KEY TEST');
console.log('='.repeat(50));

const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

console.log('API Key found:', !!key);
console.log('API Key length:', key?.length || 0);
console.log('API Key prefix:', key ? `${key.substring(0, 15)}...` : 'NOT FOUND');
console.log('API Key is valid format:', key?.startsWith('sk-ant-') || false);

if (key && key.startsWith('sk-ant-')) {
  console.log('✅ API key is properly configured');
  console.log('');
  console.log('The key should work in your app. Check browser/app console for:');
  console.log('  🤖 RaceStrategyEngine Initialization');
  console.log('  ✅ Anthropic API configured - Real AI strategies enabled');
} else {
  console.log('❌ API key is NOT properly configured');
  console.log('');
  console.log('Fix:');
  console.log('1. Ensure .env file has: EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...');
  console.log('2. Restart your dev server');
}

console.log('='.repeat(50));
