#!/usr/bin/env node
/**
 * Test script for the inspiration-extract edge function.
 *
 * Tests three modes:
 *   1. description — free-form text about what the user wants to learn
 *   2. text — pasted article content
 *   3. url — a real URL (requires the extract-url-metadata function to be deployed)
 *
 * Usage:
 *   node scripts/test-inspiration-extract.mjs                  # runs description test
 *   node scripts/test-inspiration-extract.mjs --mode text      # runs pasted text test
 *   node scripts/test-inspiration-extract.mjs --mode url       # runs URL test
 *   node scripts/test-inspiration-extract.mjs --mode all       # runs all three
 *
 * Requires:
 *   - .env with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   - A valid Supabase access token (signs in with DEMO_PASSWORD or uses anon key)
 *   - The inspiration-extract edge function deployed
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '..', '.env');
const env = {};
try {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.+)/);
    if (match) env[match[1]] = match[2].trim();
  }
} catch {
  console.error('Could not read .env file');
  process.exit(1);
}

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Auth — get an access token
// ---------------------------------------------------------------------------

async function getAccessToken() {
  // Try signing in with a test account
  const testEmail = env.DEMO_EMAIL || 'test@example.com';
  const testPassword = env.DEMO_PASSWORD;

  if (testPassword) {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log(`Signed in as ${testEmail}\n`);
      return data.access_token;
    }
    console.warn('Sign-in failed, falling back to anon key');
  }

  // Fall back to anon key (will fail if RLS requires auth)
  return ANON_KEY;
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

const TEST_CASES = {
  description: {
    label: 'Free-form description',
    body: {
      content_type: 'description',
      content: `I want to compete in an outdoor adventure and offroad driving competition like the Land Rover Defender Trophy.
Skills needed: compass navigation and orienteering, map reading, tying knots (bowlines, clove hitches),
using a winch, using a Hi-Lift farm jack safely, offroad driving with terrain response modes and air suspension,
swimming in cold water, running 2-3 miles, carrying heavy objects like tires and logs,
and general outdoor fitness. The competition involves team problem-solving,
navigating remote wilderness, and building log bridges.`,
      user_existing_interest_slugs: ['fitness', 'sail-racing'],
    },
  },

  text: {
    label: 'Pasted article excerpt',
    body: {
      content_type: 'text',
      content: `In terms of skills, there was a list of competencies to bone up on: compass navigation, map reading,
tying knots, as well as offroad vehicle skills such as using a winch and employing a farm ("Hi-Lift") jack
to either raise a vehicle or use as an impromptu winch. The orienteering and knot tying I once knew well
from adventure racing, but those skills have gotten rusty. So I've been tying clove hitches and bowlines
over and over, checking my pace count, and taking compass bearings in my neighborhood.

There's also a fitness element involved. Competitors must be able to swim, and be comfortable running 2-3 miles,
as well as lift and carry heavy things, presumably vehicle tires and logs to build bridges or remove obstacles.

The variable is familiarity with the vehicle itself: the latest Land Rover Defender.
The prep sheet said to be familiar with all the driving aids, terrain response modes,
how to raise and lower the air suspension, and engage low range.

The competition will be carried out among teams that change during the days, but scored individually.
There are three waves of selection rounds, from Canada and the US.
The top two from each country move on to finals in Africa.`,
      user_existing_interest_slugs: ['fitness'],
    },
  },

  url: {
    label: 'URL fetch (requires extract-url-metadata deployed)',
    body: {
      content_type: 'url',
      content: 'https://en.wikipedia.org/wiki/Camel_Trophy',
      user_existing_interest_slugs: [],
    },
  },
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function runTest(name, testCase, token) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testCase.label}`);
  console.log(`${'='.repeat(60)}\n`);

  const start = Date.now();

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/inspiration-extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(testCase.body),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`FAILED (${resp.status}) in ${elapsed}s:\n${text}`);
      return false;
    }

    const data = await resp.json();
    console.log(`Completed in ${elapsed}s\n`);

    // Validate structure
    const checks = [
      ['proposed_interest', !!data.proposed_interest],
      ['proposed_interest.name', !!data.proposed_interest?.name],
      ['proposed_interest.slug', !!data.proposed_interest?.slug],
      ['proposed_interest.description', !!data.proposed_interest?.description],
      ['proposed_interest.accent_color', !!data.proposed_interest?.accent_color],
      ['proposed_interest.icon_name', !!data.proposed_interest?.icon_name],
      ['blueprint', !!data.blueprint],
      ['blueprint.title', !!data.blueprint?.title],
      ['blueprint.steps (array)', Array.isArray(data.blueprint?.steps)],
      ['blueprint.steps (8-15)', data.blueprint?.steps?.length >= 5 && data.blueprint?.steps?.length <= 20],
      ['source_summary', !!data.source_summary],
      ['confidence (0-1)', typeof data.confidence === 'number' && data.confidence >= 0 && data.confidence <= 1],
    ];

    console.log('Structure validation:');
    let allPassed = true;
    for (const [label, passed] of checks) {
      console.log(`  ${passed ? '✅' : '❌'} ${label}`);
      if (!passed) allPassed = false;
    }

    // Print proposed interest
    console.log('\nProposed Interest:');
    console.log(`  Name: ${data.proposed_interest?.name}`);
    console.log(`  Slug: ${data.proposed_interest?.slug}`);
    console.log(`  Description: ${data.proposed_interest?.description}`);
    console.log(`  Domain: ${data.proposed_interest?.suggested_domain_slug}`);
    console.log(`  Color: ${data.proposed_interest?.accent_color}`);
    console.log(`  Icon: ${data.proposed_interest?.icon_name}`);

    // Print blueprint summary
    const steps = data.blueprint?.steps ?? [];
    console.log(`\nBlueprint: "${data.blueprint?.title}" (${steps.length} steps)`);
    console.log(`  ${data.blueprint?.description}`);

    for (const step of steps) {
      const crossNote = step.cross_interest_slugs?.length
        ? ` [overlaps: ${step.cross_interest_slugs.join(', ')}]`
        : '';
      console.log(`\n  ${step.order}. ${step.title} (${step.category}, ~${step.estimated_duration_days}d)${crossNote}`);
      console.log(`     ${step.description}`);
      if (step.sub_steps?.length) {
        for (const sub of step.sub_steps) {
          console.log(`     - ${sub}`);
        }
      }
      if (step.reasoning) {
        console.log(`     Why: ${step.reasoning}`);
      }
    }

    // Print overlaps
    if (data.existing_interest_overlaps?.length) {
      console.log('\nExisting interest overlaps:');
      for (const o of data.existing_interest_overlaps) {
        console.log(`  ${o.slug}: ${o.relevance}`);
      }
    }

    console.log(`\nConfidence: ${data.confidence}`);
    console.log(`Source summary: ${data.source_summary}`);

    return allPassed;
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`ERROR in ${elapsed}s:`, err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const modeArg = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'description';

const token = await getAccessToken();

const testNames = modeArg === 'all'
  ? Object.keys(TEST_CASES)
  : [modeArg];

let passed = 0;
let failed = 0;

for (const name of testNames) {
  const testCase = TEST_CASES[name];
  if (!testCase) {
    console.error(`Unknown test mode: ${name}. Options: ${Object.keys(TEST_CASES).join(', ')}, all`);
    process.exit(1);
  }

  const ok = await runTest(name, testCase, token);
  if (ok) passed++;
  else failed++;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(60)}`);

process.exit(failed > 0 ? 1 : 0);
