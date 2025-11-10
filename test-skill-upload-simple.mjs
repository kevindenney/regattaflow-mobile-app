#!/usr/bin/env node

/**
 * Simple skill upload test (Node.js only, no React Native dependencies)
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/anthropic-skills-proxy`;

// Built-in skill definitions
const SKILLS = {
  'race-strategy-analyst': {
    description: 'Expert sailing race strategist combining RegattaFlow Playbook and RegattaFlow Coach frameworks with championship execution techniques',
    content: `# Race Strategy Analyst

Elite sailing race strategist trained on championship playbooks from RegattaFlow Playbook, RegattaFlow Coach, Hans Fogh, and Olympic-level coaches. Your role is to transform course data, venue intelligence, and live conditions into a decisive plan that blends theory (why) with execution (how).

## Core Expertise
- Oscillating vs persistent shift logic, header/lift math, and line bias detection
- Time-on-distance acceleration drills, start box geometry, and line holding under traffic
- Layline discipline with current correction, minimizing maneuver cost, and VMG preservation
- Downwind apparent-wind sailing, pressure lane management, and mark approach shaping
- Fleet management: tight/loose cover, leverage control, comeback routing, and risk envelopes
- Series strategy: top-third scoring, discard math, weather windows, and opponent psychology

## Strategic Operating Principles
1. **Boat Speed First** – never sacrifice baseline speed unless the fleet position demands it.
2. **Clean Air is Currency** – worth 5–10 boat lengths; plan to own lanes at key moments.
3. **Immediate Header Response** – tack on ≥5° headers unless leverage dictates otherwise.
4. **Maneuver Discipline** – each extra tack/gybe costs 2–3 boat lengths in medium breeze.
5. **Laylines are Defensive** – approach from the inside, keep both options open.
6. **Current > Wind in Heavy Tide** – tide gates, eddies, and slack windows trump small shifts.
7. **Consistency Wins Series** – bias toward top-third finishes unless situation demands a punch.`
  },
  'tidal-opportunism-analyst': {
    description: 'Identifies current-driven opportunities, eddies, and anchoring decisions using bathymetry and WorldTides intel',
    content: `# Tidal Opportunism Analyst

You are the tactician that extracts every advantage from moving water. Blend bathymetry, tidal intelligence, and on-course geometry to recommend opportunistic plays rooted in proven big-fleet racing practice.

## Doctrine & Heuristics
1. **Tide Height ≠ Current Set** – current reversals can lag tide turns by 60–120 minutes.
2. **Slack is Local** – compare stations and consider shoreline geography; publish offsets.
3. **Use Eddies & Relief** – bight-side back eddies, point acceleration, channel shear boundaries.
4. **Depth Controls Speed** – shallows slow flow; narrows or shoals accelerate it.
5. **Anchor When VMG Collapses** – be ready to anchor immediately when sternway starts.
6. **Wind Interaction Matters** – opposing wind/current builds sea state and reduces VMG; aligned flow flattens it.
7. **Plan Gates** – identify when crossing "the Race" or tidal necks is high/low percentage.`
  },
  'slack-window-planner': {
    description: 'Builds maneuver timelines around upcoming slack, high, and low water windows',
    content: `# Slack Window Planner

Specialist at sequencing race tasks around slack, high, and low water transitions. Use tide intel, race schedule, and leg geometry to craft a minute-by-minute plan.

## Planning Rules
1. **Neutralize Crossings in Slack** – schedule channel crosses or risky tacks within slack ±30 min.
2. **Back-Off During Peak Flow** – avoid low-probability moves when current > crew's VMG margin.
3. **Buffer Setup Time** – include prep/cleanup minutes before and after each maneuver.
4. **Highlight Conflicts** – flag when planned maneuvers overlap known foul-tide windows.
5. **Coordinate Fleet Windows** – note if opponents up/down course will see different slack timing.`
  },
  'current-counterplay-advisor': {
    description: 'Advises on current-based tactics against opponents (lee bow, cover, split timing)',
    content: `# Current Counterplay Advisor

You design move-by-move current tactics against specific opponents. Blend race strategy with opportunistic current leverage to disrupt rivals or defend a lead.

## Tactical Playbook
1. **Lee-Bow Current** – tack under opponent when flood favors your leeward lane; quantify expected lift.
2. **Force into Foul Tide** – herd a rival into adverse current or delay their access to relief.
3. **Split Protection** – use tidal gates to control when opponents can cross; cover from shore-based relief.
4. **Anchoring Asymmetric** – if you must anchor, plan a relaunch that puts opponents in stronger foul current.
5. **Gate Timing** – arrive at channel pinch points during favorable set while opponents face ebb.
6. **Sea State Leverage** – opposing wind/current punishes slower boats; choose battles accordingly.`
  }
};

async function callSkillsProxy(action, params = {}) {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

async function uploadSkill(name, description, content) {
  console.log(`📤 Uploading '${name}'...`);

  try {
    const result = await callSkillsProxy('create_skill', {
      name,
      description,
      content
    });

    if (result.id) {
      console.log(`✅ Success! ID: ${result.id}\n`);
      return result.id;
    } else {
      console.log(`⚠️  No ID returned\n`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  Skill already exists, fetching ID...\n`);
      return null;
    }
    return null;
  }
}

async function listSkills() {
  console.log('📋 Listing all skills...\n');

  try {
    const result = await callSkillsProxy('list_skills');
    const skills = result.data || [];

    console.log(`Found ${skills.length} skills:\n`);
    skills.forEach(skill => {
      console.log(`  • ${skill.name || 'unnamed'}`);
      console.log(`    ID: ${skill.id}`);
      console.log(`    Type: ${skill.type || 'custom'}`);
      console.log(`    Description: ${skill.description?.substring(0, 60) || 'none'}...`);
      console.log('');
    });

    return skills;
  } catch (error) {
    console.error('❌ Error listing skills:', error.message);
    return [];
  }
}

async function main() {
  console.log('🚀 RegattaFlow Skill Upload Test\n');
  console.log(`Using Supabase URL: ${SUPABASE_URL}\n`);

  if (!SUPABASE_URL) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL not set!');
    console.error('Run: export EXPO_PUBLIC_SUPABASE_URL=your-url');
    process.exit(1);
  }

  if (!SUPABASE_ANON_KEY) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not set!');
    console.error('Run: export EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key');
    process.exit(1);
  }

  // Upload all skills
  for (const [name, { description, content }] of Object.entries(SKILLS)) {
    await uploadSkill(name, description, content);
  }

  // List all skills
  const skills = await listSkills();

  // Show RegattaFlow skills
  const regattaFlowSkills = skills.filter(s =>
    ['race-strategy-analyst', 'tidal-opportunism-analyst', 'slack-window-planner', 'current-counterplay-advisor'].includes(s.name)
  );

  console.log('✅ RegattaFlow Skills Ready:', regattaFlowSkills.length, '/', Object.keys(SKILLS).length);
  console.log('\nYou can now use these skills with Claude! 🎉\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
