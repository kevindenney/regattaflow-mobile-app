#!/usr/bin/env node

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SKILL_ID = 'skill_01NsZX8FL8JfeNhqQ7qFQLLW';

async function testSkill() {
  console.log('🧪 Testing race-learning-analyst skill\n');

  const testInput = {
    meta: {
      raceCount: 5,
      cadence: 'weekly',
      mostRecentRace: '2025-11-02T14:00:00Z'
    },
    strengthPatterns: [
      {
        metric: 'Start Rating',
        average: 4.3,
        trend: 'improving',
        evidence: 'Consistently hitting favored end with clear air'
      }
    ],
    focusPatterns: [
      {
        metric: 'Mark Rounding',
        average: 2.8,
        trend: 'declining',
        evidence: 'Overstanding laylines, losing 2-3 boat lengths per mark'
      }
    ],
    frameworkTrends: [
      {
        framework: 'Puff Response Framework',
        score: 78,
        trend: 'improving'
      }
    ],
    recurringWins: ['Clean starts with good line bias assessment'],
    recurringChallenges: ['Late tacks to layline, coming in too high'],
    recentRaces: [
      {
        date: '2025-11-02',
        place: 3,
        notes: 'Great start, poor mark rounding'
      }
    ]
  };

  const testMessage = {
    role: 'user',
    content: `Analyze this sailor's race history and provide personalized learning insights:\n\n${JSON.stringify(testInput, null, 2)}`
  };

  try {
    console.log('📡 Calling Supabase proxy...\n');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/anthropic-skills-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'messages',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [testMessage],
        skills: [{ 
          type: 'custom',
          skill_id: SKILL_ID,
          version: 'latest'
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      process.exit(1);
    }

    const result = await response.json();
    
    console.log('✅ Success! Response from Claude:\n');
    
    // Parse the response content
    if (result.content && result.content[0]) {
      const responseText = result.content[0].text;
      console.log('Raw response:', responseText);
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(responseText);
        console.log('\n📋 Parsed Learning Insights:');
        console.log('Headline:', parsed.headline);
        console.log('\nKeep Doing:');
        parsed.keepDoing?.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        console.log('\nFocus Next:');
        parsed.focusNext?.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        console.log('\nPractice Ideas:');
        parsed.practiceIdeas?.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
        console.log('\nPre-Race Reminder:', parsed.preRaceReminder);
        console.log('\nTone:', parsed.tone);
      } catch (e) {
        console.log('(Could not parse as JSON - showing raw text above)');
      }
    }
    
    console.log('\n📊 Usage:', JSON.stringify(result.usage, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSkill();
