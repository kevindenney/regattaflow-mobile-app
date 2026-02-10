#!/usr/bin/env node

/**
 * Upload all RegattaFlow skills to Anthropic via Edge Function
 * Usage: node upload-all-skills.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const EDGE_FUNCTION_URL = 'https://qavekrwdbsobecwrfxwu.supabase.co/functions/v1/anthropic-skills-proxy';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: EXPO_PUBLIC_SUPABASE_ANON_KEY not found in environment');
  console.error('   Please ensure .env file exists with EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Skills to upload (in order of importance)
const SKILLS_TO_UPLOAD = [
  'race-strategy-analyst',
  'tidal-opportunism-analyst',
  'slack-window-planner',
  'current-counterplay-advisor',
  'boat-tuning-analyst',
  'race-learning-analyst',
  'starting-line-mastery',
  'upwind-strategic-positioning',
  'upwind-tactical-combat',
  'mark-rounding-execution',
  'downwind-speed-and-position',
  'long-distance-racing-analyst',
  'team-racing-analyst',
  // 'finishing-line-tactics', // Skip if problematic
];

// Parse YAML frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('No YAML frontmatter found');
  }

  const [, frontmatter, body] = match;
  const metadata = {};

  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { metadata, body };
}

// Upload a single skill
async function uploadSkill(skillName) {
  const skillPath = path.join(__dirname, 'skills', skillName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    console.log(`⚠️  Skipping ${skillName} - SKILL.md not found`);
    return { success: false, reason: 'not_found' };
  }

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    const { metadata, body } = parseFrontmatter(content);

    const name = metadata.name || skillName;
    const description = metadata.description || `${skillName} skill`;

    console.log(`\n📤 Uploading: ${name}`);
    console.log(`   Description: ${description}`);
    console.log(`   Size: ${content.length} bytes`);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create_skill',
        name,
        description,
        content: body.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check if skill already exists
      if (errorText.includes('cannot reuse an existing display_title') ||
          errorText.includes('already exists')) {
        console.log(`   ℹ️  Skill already exists (skipping)`);
        return { success: true, skipped: true, reason: 'already_exists' };
      }

      console.error(`   ❌ Failed: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}`);
      return { success: false, reason: 'api_error', error: errorText };
    }

    const result = await response.json();

    if (result.id) {
      console.log(`   ✅ Success! Skill ID: ${result.id}`);
      return { success: true, skillId: result.id };
    } else {
      console.log(`   ⚠️  Upload completed but no skill ID returned`);
      return { success: false, reason: 'no_id', result };
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, reason: 'exception', error: error.message };
  }
}

// Main execution
async function main() {
  console.log('🚀 RegattaFlow Skills Upload');
  console.log('=' .repeat(60));
  console.log(`\nUploading ${SKILLS_TO_UPLOAD.length} skills to Anthropic...\n`);

  const results = {
    successful: [],
    failed: [],
    skipped: [],
    alreadyExists: [],
  };

  for (const skillName of SKILLS_TO_UPLOAD) {
    const result = await uploadSkill(skillName);

    if (result.success) {
      if (result.skipped) {
        results.alreadyExists.push({ name: skillName, ...result });
      } else {
        results.successful.push({ name: skillName, ...result });
      }
    } else if (result.reason === 'not_found') {
      results.skipped.push({ name: skillName, ...result });
    } else {
      results.failed.push({ name: skillName, ...result });
    }

    // Rate limiting: wait 1 second between uploads
    if (SKILLS_TO_UPLOAD.indexOf(skillName) < SKILLS_TO_UPLOAD.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Upload Summary\n');
  console.log(`✅ Successfully uploaded: ${results.successful.length}`);
  console.log(`ℹ️  Already exists: ${results.alreadyExists.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Skipped (not found): ${results.skipped.length}`);

  if (results.successful.length > 0) {
    console.log('\n✅ Successfully uploaded:');
    results.successful.forEach(r => {
      console.log(`   • ${r.name} (${r.skillId})`);
    });
  }

  if (results.alreadyExists.length > 0) {
    console.log('\nℹ️  Already exists (skipped):');
    results.alreadyExists.forEach(r => {
      console.log(`   • ${r.name}`);
    });
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed to upload:');
    results.failed.forEach(r => {
      console.log(`   • ${r.name} - ${r.reason}`);
    });
  }

  if (results.skipped.length > 0) {
    console.log('\n⚠️  Skipped (not found):');
    results.skipped.forEach(r => {
      console.log(`   • ${r.name}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with error code if any failed
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
