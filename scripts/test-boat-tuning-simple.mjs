#!/usr/bin/env node
/**
 * Simple test script for the Boat Tuning AI Engine
 * Uses direct API calls without React Native dependencies
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file if not already set
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

let ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
  process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const match = envContent.match(/EXPO_PUBLIC_ANTHROPIC_API_KEY=(.+)/);
    if (match) {
      ANTHROPIC_API_KEY = match[1].trim();
      console.log('✅ Loaded API key from .env file\n');
    }
  } catch (error) {
    // .env file not found or can't be read
  }
}

const SKILL_ID = 'skill_01LwivxRwARQY3ga2LwUJNCj'; // boat-tuning-analyst

const className = process.argv[2] || 'J/70';
const windSpeed = parseFloat(process.argv[3] || '12');

console.log('🔧 Boat Tuning AI Test (Simple)');
console.log('='.repeat(60));
console.log(`Class: ${className}`);
console.log(`Wind Speed: ${windSpeed} kts`);
console.log('='.repeat(60));
console.log('');

// Sample candidate data (from the skill's library)
const mockCandidates = [
  {
    guide: {
      id: 'guide-j70-world-circuit',
      title: 'J/70 World Circuit Playbook',
      source: 'One Design Speed Lab',
      year: 2023,
      tags: ['rig', 'mast', 'sail'],
      rig: 'Southern Spars Carbon'
    },
    section: {
      title: 'Base Rig Tune (8-12 kts)',
      content: 'Baseline that most pro teams lock in before small adjustments for venue.',
      conditions: {
        windSpeed: '8-12 kts',
        points: 'upwind'
      },
      settings: {
        'upper shrouds': 'Loos PT-1M 26',
        'lower shrouds': 'Loos PT-1M 23',
        'mast rake': '21\' 7 3/4" (masthead to transom corner)',
        'forestay length': '3122 mm (turnbuckle exposed 7 threads)',
        'backstay': 'Two-block in 14 kts, ease 200 mm in 8 kts',
        'vang': 'Snug reaching, firm downwind in breeze',
        'jib halyard': 'Mark 0 at just smooth, pull +3 marks in waves',
        'main outhaul': 'Hand width off band under 10 kts, on band above 12'
      }
    },
    score: 0.92
  },
  {
    guide: {
      id: 'guide-j70-world-circuit',
      title: 'J/70 World Circuit Playbook',
      source: 'One Design Speed Lab',
      year: 2023,
      tags: ['rig', 'mast', 'sail'],
      rig: 'Southern Spars Carbon'
    },
    section: {
      title: 'Light Air Mode (4-7 kts)',
      content: 'Target heel 6-8°, keep groove with eased rig and flow over foils.',
      conditions: {
        windSpeed: '4-7 kts',
        seaState: 'Flat water',
        points: 'upwind'
      },
      settings: {
        'upper shrouds': 'Loos PT-1M 23',
        'lower shrouds': 'Loos PT-1M 18',
        'backstay tension': 'Completely eased',
        'mast butt': 'Forward to light-air mark',
        'vang': 'Slack, only remove leech flutter downwind',
        'main outhaul': 'Two fists off band',
        'jib lead': 'Two holes forward of base'
      }
    },
    score: 0.75
  }
];

async function testAI() {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'placeholder') {
    console.log('❌ No Anthropic API key found!');
    console.log('   Set EXPO_PUBLIC_ANTHROPIC_API_KEY or ANTHROPIC_API_KEY in your environment');
    process.exit(1);
  }

  console.log('✅ API Key found:', ANTHROPIC_API_KEY.substring(0, 20) + '...');
  console.log('');

  const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY
  });

  const payload = {
    request: {
      className,
      averageWindSpeed: windSpeed,
      pointsOfSail: 'upwind',
      limit: 1
    },
    candidates: mockCandidates
  };

  const instruction = `You are the Boat Tuning Analyst skill. Use the provided candidate tuning sections to build championship-ready rig settings.

Return a JSON array where each element matches:
{
  "guideId": "string (use provided candidate guide id)",
  "guideTitle": "string",
  "guideSource": "string",
  "sectionTitle": "string",
  "conditionSummary": "string",
  "notes": ["optional array of strings"],
  "settings": [
    {
      "key": "snake_case identifier",
      "rawKey": "original setting name",
      "label": "human readable label",
      "value": "exact trim value"
    }
  ],
  "tags": ["optional tags"],
  "confidence": 0-1 (optional),
  "matchScore": 0-1 (optional),
  "caveats": ["optional strings"]
}

Rules:
- Only recommend from the provided candidate sections or clearly state if no match fits.
- Preserve the units and precision from the source.
- If no suitable candidate exists, return an empty array.
- Respond with raw JSON only (no markdown, no prose).

Context:
${JSON.stringify(payload, null, 2)}`;

  console.log('📡 Calling Claude API with boat-tuning-analyst skill...');
  console.log('');

  try {
    const startTime = Date.now();

    const response = await anthropic.beta.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.5,
      betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],
      container: {
        skills: [{
          type: 'custom',
          skill_id: SKILL_ID,
          version: 'latest'
        }]
      },
      tools: [{
        type: 'code_execution_20250825',
        name: 'code_execution'
      }],
      messages: [{
        role: 'user',
        content: instruction
      }]
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ API call successful (${elapsed}ms)`);
    console.log('');

    // Extract text blocks
    const textBlocks = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text.trim())
      .filter(Boolean);

    const combinedText = textBlocks.join('\n').trim();

    console.log('📄 Raw Response:');
    console.log('='.repeat(60));
    console.log(combinedText);
    console.log('='.repeat(60));
    console.log('');

    // Try to parse JSON
    const jsonMatch = combinedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('⚠️ No JSON array found in response');
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      console.log('⚠️ Response is not an array');
      return;
    }

    console.log('✅ Parsed Recommendations:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(parsed, null, 2));
    console.log('='.repeat(60));
    console.log('');

    console.log('✅ Test Complete!');

  } catch (error) {
    console.error('');
    console.error('❌ Test Failed!');
    console.error('='.repeat(60));
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

testAI().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
