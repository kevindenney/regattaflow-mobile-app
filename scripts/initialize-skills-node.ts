/**
 * Verify Claude Skills Registration
 *
 * This script verifies that all built-in skills are registered with Anthropic.
 *
 * NOTE: Due to Anthropic Skills API file path requirements, skills should be uploaded
 * using the Anthropic CLI tool. See docs/SKILLS_SETUP.md for upload instructions.
 *
 * This script:
 * - Lists all registered skills
 * - Checks which built-in skills are missing
 * - Provides CLI commands to upload missing skills
 *
 * Usage:
 *   npx tsx scripts/initialize-skills-node.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Read skill definitions from markdown files
const SKILLS_DIR = path.join(__dirname, '../skills');

const SKILL_DEFINITIONS = [
  {
    name: 'race-strategy-analyst',
    description: 'Expert sailing race strategist combining RegattaFlow Playbook and RegattaFlow Coach frameworks with championship execution techniques',
    filePath: null // This one is embedded in the service
  },
  {
    name: 'tidal-opportunism-analyst',
    description: 'Identifies current-driven opportunities, eddies, and anchoring decisions using bathymetry and WorldTides intel',
    filePath: path.join(SKILLS_DIR, 'tidal-opportunism-analyst/SKILL.md')
  },
  {
    name: 'slack-window-planner',
    description: 'Builds maneuver timelines around upcoming slack, high, and low water windows',
    filePath: path.join(SKILLS_DIR, 'slack-window-planner/SKILL.md')
  },
  {
    name: 'current-counterplay-advisor',
    description: 'Advises on current-based tactics against opponents (lee bow, cover, split timing)',
    filePath: path.join(SKILLS_DIR, 'current-counterplay-advisor/SKILL.md')
  }
];

// Embedded race-strategy-analyst skill
const RACE_STRATEGY_CONTENT = `# Race Strategy Analyst

Elite sailing race strategist trained on championship playbooks from RegattaFlow Playbook, RegattaFlow Coach, Hans Fogh, and Olympic-level coaches. Your role is to transform course data, venue intelligence, and live conditions into a decisive plan that blends theory (why) with execution (how).

## Core Expertise
- Oscillating vs persistent shift logic, header/lift math, and line bias detection
- Time-on-distance acceleration drills, start box geometry, and line holding under traffic
- Layline discipline with current correction, minimizing maneuver cost, and VMG preservation
- Downwind apparent-wind sailing, pressure lane management, and mark approach shaping
- Fleet management: tight/loose cover, leverage control, comeback routing, and risk envelopes
- Series strategy: top-third scoring, discard math, weather windows, and opponent psychology

## Inputs You May Receive
- Parsed race documents (course type, marks, distances, restrictions)
- Venue intelligence (typical wind, current patterns, topography, hazards)
- Environmental data (wind forecast, tidal intel, bathymetry, slack windows)
- Sailor profile (strengths, weaknesses, comfort level)
- Competition tier (club → international)

## Strategic Operating Principles
1. **Boat Speed First** – never sacrifice baseline speed unless the fleet position demands it.
2. **Clean Air is Currency** – worth 5–10 boat lengths; plan to own lanes at key moments.
3. **Immediate Header Response** – tack on ≥5° headers unless leverage dictates otherwise.
4. **Maneuver Discipline** – each extra tack/gybe costs 2–3 boat lengths in medium breeze.
5. **Laylines are Defensive** – approach from the inside, keep both options open.
6. **Current > Wind in Heavy Tide** – tide gates, eddies, and slack windows trump small shifts.
7. **Consistency Wins Series** – bias toward top-third finishes unless situation demands a punch.

## Output Contract
Return JSON with the following structure:

\`\`\`json
{
  "analysis": "Narrative covering strategy, tactics, and risk posture.",
  "recommendations": {
    "startStrategy": "Detailed start plan (favored end, timing, lane protection).",
    "upwindStrategy": "Which side to play and why, shift rules, current integration.",
    "downwindStrategy": "VMG plan, pressure lines, mode changes, traffic notes.",
    "markRoundings": "Approach angles, exit priorities, congestion avoidance.",
    "timing": "Is the race window optimal? If not, suggest better timing."
  },
  "contingencies": [
    {
      "trigger": "What condition changes?",
      "response": "How to adapt?",
      "confidence": 0.0 - 1.0
    }
  ],
  "confidence": "high | moderate | low",
  "caveats": ["List of unknowns or data quality issues"]
}
\`\`\`

- Always cite theory (framework or empirical reference).
- Pair every recommendation with execution detail (time, angle, positioning).
- Flag risk levels and note what you need to monitor on the water.`;

async function callEdgeFunction(action: string, params: Record<string, any> = {}): Promise<any> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL not set');
  }
  if (!supabaseAnonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY not set');
  }

  const url = `${supabaseUrl}/functions/v1/anthropic-skills-proxy`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function uploadSkill(name: string, description: string, content: string): Promise<string | null> {
  try {
    console.log(`📤 Uploading skill: ${name}`);

    const response = await callEdgeFunction('create_skill', {
      name,
      description,
      content
    });

    const skillId = response.id;
    if (skillId) {
      console.log(`✅ Successfully uploaded: ${skillId}`);
      return skillId;
    } else {
      console.warn(`⚠️ No skill ID returned`);
      return null;
    }
  } catch (error: any) {
    // Check if skill already exists
    if (error.message?.includes('already exists')) {
      console.log(`ℹ️ Skill already exists, fetching existing ID...`);
      try {
        const skills = await callEdgeFunction('list_skills');
        const existing = skills.data?.find((s: any) => s.name === name);
        if (existing) {
          console.log(`✅ Found existing skill: ${existing.id}`);
          return existing.id;
        }
      } catch (listError) {
        console.error(`❌ Failed to list skills:`, listError);
      }
    }

    console.error(`❌ Failed to upload skill:`, error.message);
    return null;
  }
}

async function initializeAllSkills() {
  console.log('🔍 Verifying Claude Skills Registration\n');
  console.log('Note: Skills should be uploaded via Anthropic CLI.');
  console.log('See docs/SKILLS_SETUP.md for instructions.\n');

  const results: Record<string, string | null> = {};

  // List all registered skills
  console.log('='.repeat(60));
  console.log('📋 Registered Skills in Anthropic');
  console.log('='.repeat(60));

  let registeredSkills: any[] = [];
  try {
    const response = await callEdgeFunction('list_skills');
    registeredSkills = response.data || [];
    console.log(`\nFound ${registeredSkills.length} registered skills:`);
    registeredSkills.forEach((skill: any) => {
      const name = skill.display_title || skill.name || 'Unknown';
      const source = skill.source === 'custom' ? '🔧 custom' : '📦 anthropic';
      console.log(`  ${source} ${name}`);
      console.log(`      ID: ${skill.id}`);
      console.log(`      Created: ${skill.created_at}`);
    });
  } catch (error: any) {
    console.error('❌ Failed to list skills:', error.message);
  }

  // Check which built-in skills are registered
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Built-in Skills Status');
  console.log('='.repeat(60));

  const registeredNames = registeredSkills.map(s => s.display_title || s.name);

  for (const skill of SKILL_DEFINITIONS) {
    const isRegistered = registeredNames.includes(skill.name);
    results[skill.name] = isRegistered ? 'REGISTERED' : null;

    if (isRegistered) {
      const registered = registeredSkills.find(s =>
        (s.display_title || s.name) === skill.name
      );
      console.log(`✅ ${skill.name}`);
      console.log(`   ID: ${registered.id}`);
    } else {
      console.log(`❌ ${skill.name} - NOT REGISTERED`);
    }
  }

  // Provide CLI commands for missing skills
  const missing = SKILL_DEFINITIONS.filter(s => !results[s.name]);
  if (missing.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('📝 Upload Missing Skills');
    console.log('='.repeat(60));
    console.log('\nTo upload missing skills, run these commands:\n');

    for (const skill of missing) {
      if (skill.name === 'race-strategy-analyst') {
        console.log(`# ${skill.name}`);
        console.log(`# (embedded in code - copy from SkillManagementService.ts)`);
      } else if (skill.filePath) {
        console.log(`anthropic skills create \\`);
        console.log(`  --name "${skill.name}" \\`);
        console.log(`  --description "${skill.description}" \\`);
        console.log(`  ${path.relative(process.cwd(), path.dirname(skill.filePath))}`);
      }
      console.log('');
    }

    console.log('See docs/SKILLS_SETUP.md for detailed instructions.\n');
  } else {
    console.log('\n✅ All built-in skills are registered!\n');
  }

  // Summary
  const registered = Object.values(results).filter(id => id).length;
  const notRegistered = SKILL_DEFINITIONS.length - registered;

  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`✅ Registered: ${registered}`);
  console.log(`❌ Not Registered: ${notRegistered}`);
  console.log(`📝 Total Built-in Skills: ${SKILL_DEFINITIONS.length}`);
  console.log('');

  process.exit(notRegistered === 0 ? 0 : 1);
}

// Run the initialization
initializeAllSkills().catch((error) => {
  console.error('❌ Fatal error during skill initialization:', error);
  process.exit(1);
});
