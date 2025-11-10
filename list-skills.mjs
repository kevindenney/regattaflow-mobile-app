#!/usr/bin/env node

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Removed line:

async function listSkills() {
  try {
    const response = await fetch('https://api.anthropic.com/v1/skills', {
      headers: {
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'skills-2025-10-02',
        'x-api-key': ANTHROPIC_API_KEY
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error);
      return;
    }

    const data = await response.json();
    const skills = data.data || [];

    console.log('\n📚 Your Anthropic Skills\n');
    console.log('='.repeat(80));

    // Separate built-in and custom skills
    const builtIn = skills.filter(s => s.type === 'skill');
    const custom = skills.filter(s => s.type !== 'skill' || s.name);

    if (builtIn.length > 0) {
      console.log('\n🏗️  BUILT-IN SKILLS (from Anthropic)\n');
      builtIn.forEach(skill => {
        console.log(`  • ${skill.id}`);
        if (skill.name) console.log(`    Name: ${skill.name}`);
        if (skill.description) console.log(`    Description: ${skill.description}`);
        console.log('');
      });
    }

    console.log('\n⛵ YOUR CUSTOM SAILING SKILLS\n');
    const sailingSkills = skills.filter(s =>
      s.name && (
        s.name.includes('race') ||
        s.name.includes('tidal') ||
        s.name.includes('slack') ||
        s.name.includes('current')
      )
    );

    if (sailingSkills.length > 0) {
      sailingSkills.forEach(skill => {
        console.log(`  • ${skill.name}`);
        console.log(`    ID: ${skill.id}`);
        if (skill.description) {
          console.log(`    Description: ${skill.description}`);
        }
        console.log(`    Created: ${new Date(skill.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('  (No custom sailing skills found)\n');
    }

    console.log('='.repeat(80));
    console.log(`\nTotal Skills: ${skills.length}`);
    console.log(`  Built-in: ${builtIn.length}`);
    console.log(`  Custom: ${sailingSkills.length}`);
    console.log('');

  } catch (error) {
    console.error('Error listing skills:', error.message);
  }
}

listSkills();
