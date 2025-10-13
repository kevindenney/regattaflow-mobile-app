/**
 * Test Conversational Onboarding Agent
 * Simulates sailor onboarding flow with GPS detection
 */

import { ConversationalOnboardingAgent } from '../src/services/agents/ConversationalOnboardingAgent';

async function testConversationalOnboarding() {
  console.log('🤖 Testing Conversational Onboarding Agent\n');

  const agent = new ConversationalOnboardingAgent();

  // Simulate Hong Kong GPS coordinates (Royal Hong Kong Yacht Club area)
  const testContext = {
    sailorId: 'test-sailor-id',
    gpsCoordinates: {
      lat: 22.2793,
      lng: 114.1628,
    },
    conversationHistory: [],
  };

  console.log('📍 Test GPS Location: Hong Kong (22.2793, 114.1628)\n');
  console.log('--- Streaming Conversation ---\n');

  try {
    // Start onboarding
    const stream = agent.streamResponse(
      "I'm ready to set up my RegattaFlow profile! Let's get started.",
      testContext
    );

    let fullResponse = '';

    for await (const chunk of stream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n\n--- Conversation Summary ---');
    const summary = agent.getConversationSummary();
    console.log(`\nTotal Messages: ${summary.messages.length}`);
    console.log(`Tools Used: ${summary.toolsUsed.join(', ')}`);
    console.log('\n--- Test Complete ---');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testConversationalOnboarding();
