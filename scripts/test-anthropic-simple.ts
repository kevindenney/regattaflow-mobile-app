/**
 * Simple Anthropic SDK Test
 * Tests API key without requiring database connection
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local file (preferred) or .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testAnthropicAPI() {
  console.log('🧪 Testing Anthropic API Connection...\n');

  // Check environment variable
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your-api-key-here') {
    console.error('❌ ANTHROPIC API KEY NOT SET');
    console.error('\nPlease update .env file with your API key');
    process.exit(1);
  }

  console.log('✅ API Key found:', apiKey.substring(0, 25) + '...');

  try {
    console.log('\n🤖 Initializing Anthropic client...');
    const client = new Anthropic({
      apiKey: apiKey,
    });

    console.log('✅ Client initialized');

    console.log('\n📡 Testing API connection with simple message...');
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with a brief introduction to RegattaFlow, a sailing race strategy platform.',
        },
      ],
    });

    console.log('✅ API call successful!\n');
    console.log('📝 Claude Response:');
    console.log('─'.repeat(60));

    const textContent = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (textContent) {
      console.log(textContent.text);
    }

    console.log('─'.repeat(60));
    console.log('\n📊 Usage Stats:');
    console.log(`   Input tokens: ${message.usage.input_tokens}`);
    console.log(`   Output tokens: ${message.usage.output_tokens}`);
    console.log(`   Model: ${message.model}`);
    console.log(`   Stop reason: ${message.stop_reason}`);

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n🎉 Your Anthropic API is configured correctly!');
    console.log('\nNext steps:');
    console.log('  1. Add Supabase credentials to .env');
    console.log('  2. Run full agent test: npm run test:agent');
    console.log('  3. Start using agents in your app!');

  } catch (error: any) {
    console.error('\n❌ API test failed:');
    console.error('Error:', error.message);

    if (error.status === 401) {
      console.error('\n🔑 Authentication failed - check your API key');
    } else if (error.status === 429) {
      console.error('\n⏱️  Rate limit reached - wait a moment and try again');
    } else {
      console.error('\nFull error:', error);
    }

    process.exit(1);
  }
}

// Run test
testAnthropicAPI().catch(console.error);
