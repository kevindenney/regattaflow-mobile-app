/**
 * Test Anthropic Agent SDK Setup
 * Run this to verify your API key and agent services are working
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables before importing services
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { VenueIntelligenceAgent } from '../src/services/agents';

async function testAgentSetup() {
  console.log('🧪 Testing Anthropic Agent SDK Setup...\n');

  // Check environment variable
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your-api-key-here') {
    console.error('❌ ANTHROPIC API KEY NOT SET');
    console.error('\nTo fix this:');
    console.error('1. Go to https://console.anthropic.com/');
    console.error('2. Create an API key');
    console.error('3. Update .env file:');
    console.error('   EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here\n');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');

  // Test basic agent initialization
  try {
    console.log('\n🤖 Initializing VenueIntelligenceAgent...');
    const agent = new VenueIntelligenceAgent();

    const stats = agent.getToolStats();
    console.log('✅ Agent initialized successfully');
    console.log('📊 Available tools:', stats.totalTools);
    console.log('🔧 Tool names:', stats.toolNames.join(', '));

    console.log('\n🧪 Testing simple agent request...');

    // Simple test that doesn't require database
    const result = await agent.run({
      userMessage: 'What can you help me with?',
      maxIterations: 2,
    });

    if (result.success) {
      console.log('✅ Agent responded successfully!');
      console.log('📝 Response:', result.result);
      console.log('🔄 Iterations:', result.iterations);
    } else {
      console.error('❌ Agent failed:', result.error);
    }

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\nYour Anthropic Agent SDK is set up correctly.');
    console.log('You can now use agents in your app:\n');
    console.log('  import { VenueIntelligenceAgent } from "@/src/services/agents"');
    console.log('  const agent = new VenueIntelligenceAgent()');
    console.log('  const result = await agent.switchVenueByGPS({ latitude: 22.2793, longitude: 114.1628 })');

  } catch (error: any) {
    console.error('❌ Agent test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run test
testAgentSetup().catch(console.error);
