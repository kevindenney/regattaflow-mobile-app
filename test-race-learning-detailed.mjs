#!/usr/bin/env node

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SKILL_ID = 'skill_01NsZX8FL8JfeNhqQ7qFQLLW';

async function testSkill() {
  console.log('🧪 Testing race-learning-analyst skill (detailed output)\n');

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
    
    console.log('✅ Success!\n');
    console.log('Full Response Structure:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSkill();
