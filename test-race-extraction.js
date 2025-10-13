/**
 * Test script for RaceExtractionAgent
 * Demonstrates AI-powered race detail extraction
 */

// Mock the environment for Node.js testing
if (typeof process !== 'undefined' && !process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) {
  require('dotenv').config();
  process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
}

const { RaceExtractionAgent } = require('./src/services/agents/RaceExtractionAgent.ts');

async function testRaceExtraction() {
  console.log('🧪 Testing Race Extraction Agent\n');

  const testCases = [
    {
      name: 'Full Sailing Instructions',
      text: `Hong Kong Dragon Championship 2025
Royal Hong Kong Yacht Club
October 15-17, 2025

1. RACING RULES
2. ELIGIBILITY
3. REGISTRATION
4. SCHEDULE
   Race 1: October 15, 2025 - First start 14:00
   Race 2: October 16, 2025 - First start 14:00
   Race 3: October 17, 2025 - First start 13:00

5. COURSES
   Races will be held in Victoria Harbour

6. RADIO COMMUNICATION
   VHF Channel 72

7. SIGNALS
   Warning signal: 5 minutes before start

8. INSURANCE
   All boats taking part in the events shall be insured with valid third-party liability insurance of at least the minimum cover required by HKSAR law.

9. PRIZES
   Trophies will be presented to the champion of each series at the Annual Prizegiving Dinner.

Ken Wong: Dragon Class Secretary`
    },
    {
      name: 'Minimal Race Info',
      text: `Croucher Series Race 3
RHKYC
March 15, 2025
Start time: 10:00
Victoria Harbour`
    },
    {
      name: 'Calendar Style',
      text: `2025-04-20, Dragon Spring Regatta, ABC Yacht Club, 09:30, Stanley Bay`
    }
  ];

  const agent = new RaceExtractionAgent();

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`${'='.repeat(60)}\n`);
    console.log('Input text:');
    console.log(testCase.text);
    console.log('\n⏳ Extracting...\n');

    const result = await agent.extractRaceData(testCase.text);

    if (result.success && result.data) {
      console.log('✅ SUCCESS - Extracted Data:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ FAILED');
      console.log('Error:', result.error);
      if (result.missingFields) {
        console.log('Missing fields:', result.missingFields);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 Test Complete');
  console.log(`${'='.repeat(60)}\n`);
}

// Run tests
testRaceExtraction().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
