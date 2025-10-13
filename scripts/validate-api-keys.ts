/**
 * API Key Validation Script
 * Run this to validate all API keys are properly configured
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REQUIRED_KEYS = {
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  EXPO_PUBLIC_ANTHROPIC_API_KEY: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

async function validateAnthropicKey() {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('❌ Anthropic API key not found');
    return false;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    console.log('❌ Anthropic API key has invalid format (should start with sk-ant-)');
    return false;
  }

  try {
    const client = new Anthropic({ apiKey });

    // Test with a minimal request
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: 'Say "hello"'
      }]
    });

    if (response.content && response.content.length > 0) {
      console.log('✅ Anthropic API key is valid');
      console.log(`   Model: ${response.model}`);
      console.log(`   Response: ${(response.content[0] as any).text}`);
      return true;
    }

    console.log('⚠️ Anthropic API responded but with unexpected format');
    return false;
  } catch (error: any) {
    if (error.status === 401) {
      console.log('❌ Anthropic API key is invalid (401 Unauthorized)');
    } else if (error.status === 429) {
      console.log('⚠️ Anthropic API rate limit exceeded (but key is valid)');
      return true; // Key is valid, just rate limited
    } else {
      console.log(`❌ Anthropic API error: ${error.message}`);
    }
    return false;
  }
}

async function validateSupabaseKey() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.log('❌ Supabase credentials not found');
    return false;
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });

    if (response.ok || response.status === 404) { // 404 is fine, means we connected
      console.log('✅ Supabase connection successful');
      return true;
    }

    console.log(`❌ Supabase connection failed: ${response.status}`);
    return false;
  } catch (error: any) {
    console.log(`❌ Supabase connection error: ${error.message}`);
    return false;
  }
}

async function validateGoogleMapsKey() {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.log('❌ Google Maps API key not found');
    return false;
  }

  try {
    // Test with Places API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=22.2793,114.1628&radius=1000&type=point_of_interest&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      console.log('✅ Google Maps API key is valid');
      return true;
    }

    if (data.status === 'REQUEST_DENIED') {
      console.log('❌ Google Maps API key is invalid or restricted');
      return false;
    }

    console.log(`⚠️ Google Maps API returned: ${data.status}`);
    return false;
  } catch (error: any) {
    console.log(`❌ Google Maps API error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔑 API Key Validation\n');
  console.log('Checking required environment variables...\n');

  // Check if keys exist
  let allKeysPresent = true;
  Object.entries(REQUIRED_KEYS).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: Present (${value.slice(0, 20)}...)`);
    } else {
      console.log(`❌ ${key}: Missing`);
      allKeysPresent = false;
    }
  });

  if (!allKeysPresent) {
    console.log('\n❌ Some required keys are missing. Please check your .env file.');
    process.exit(1);
  }

  console.log('\n📡 Testing API connections...\n');

  const results = await Promise.all([
    validateAnthropicKey(),
    validateSupabaseKey(),
    validateGoogleMapsKey(),
  ]);

  const [anthropicValid, supabaseValid, googleMapsValid] = results;

  console.log('\n📊 Summary:');
  console.log(`   Anthropic AI: ${anthropicValid ? '✅' : '❌'}`);
  console.log(`   Supabase: ${supabaseValid ? '✅' : '❌'}`);
  console.log(`   Google Maps: ${googleMapsValid ? '✅' : '❌'}`);

  if (anthropicValid && supabaseValid && googleMapsValid) {
    console.log('\n✅ All API keys are valid and working!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some API keys are invalid. Please check your configuration.\n');
    process.exit(1);
  }
}

main();
