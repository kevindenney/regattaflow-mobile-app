import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

console.log('🔍 Checking Anthropic SDK configuration...\n');
console.log('🔑 API Key present:', apiKey ? 'Yes (' + apiKey.substring(0, 20) + '...)' : 'No');

if (!apiKey) {
  console.error('❌ EXPO_PUBLIC_ANTHROPIC_API_KEY not found in environment');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function testConnection() {
  try {
    console.log('\n📡 Testing connection to Anthropic API...');
    console.log('🎯 Model: claude-3-5-haiku-20241022\n');
    
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Reply with "API connection successful" and nothing else.' }
      ],
    });

    console.log('✅ Connection SUCCESSFUL!\n');
    console.log('Response Details:');
    console.log('  Model:', message.model);
    console.log('  Content:', message.content[0].text);
    console.log('  Stop Reason:', message.stop_reason);
    console.log('  Token Usage:');
    console.log('    Input:', message.usage.input_tokens);
    console.log('    Output:', message.usage.output_tokens);
    console.log('    Total:', message.usage.input_tokens + message.usage.output_tokens);
    
  } catch (error: any) {
    console.error('\n❌ Connection FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
      
      if (error.status === 401) {
        console.error('\n🔴 Authentication Error - Invalid API key');
      } else if (error.status === 429) {
        console.error('\n🔴 Rate Limit Exceeded - Too many requests or out of credits');
      } else if (error.status === 529) {
        console.error('\n🔴 Service Overloaded - Try again later');
      }
    }
    
    if (error.error?.type) {
      console.error('Error Type:', error.error.type);
      console.error('Error Details:', error.error);
    }
  }
}

testConnection();
