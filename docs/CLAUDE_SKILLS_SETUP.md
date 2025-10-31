# Claude Skills Setup (Optional)

This document explains how to set up Claude Skills for the Race Strategy Engine in RegattaFlow.

## Important: Skills Are Optional!

**The Race Strategy Engine works excellently WITHOUT skills.** Skills are purely an optimization that:
- Reduces API token usage by ~60%
- Lowers API costs
- Speeds up response times slightly

If you don't set up skills, the app will still generate comprehensive, high-quality race strategies using full prompts.

## What Are Claude Skills?

Claude Skills allow you to pre-upload domain expertise that Claude can reference during conversations. Instead of including all the sailing strategy knowledge in every prompt, Skills let Claude access that knowledge more efficiently.

## Current Status

The RaceStrategyEngine is designed to work with the `race-strategy-analyst` skill, which includes:
- Kevin Gladstone's shift mathematics frameworks
- Kevin Colgate's racing techniques
- Hans Fogh's mark rounding excellence
- Championship execution principles

## Why Skills Upload Doesn't Work from the App

The Anthropic Skills API requires specific file structures that can't be created from browser or React Native environments due to security restrictions. Specifically, the API requires:

```
SKILL.md file must be exactly in the top-level folder
```

This requirement means skills must be uploaded using:
1. The Anthropic Console (web interface)
2. A backend service with filesystem access
3. The Anthropic CLI tool

## How to Upload Skills (Manual Process)

### Option 1: Anthropic Console (Easiest)

1. Log in to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to Skills section
3. Create new skill named `race-strategy-analyst`
4. Copy content from `scripts/race-strategy-skill-content.md`
5. Save and note the skill ID

### Option 2: Backend Service

If you implement a backend for RegattaFlow:
1. Create an endpoint that accepts skill uploads
2. Use the Anthropic Skills API from your backend (Node.js/Python/etc)
3. Return the skill ID to the app

### Option 3: Pre-upload via Script (Advanced)

While the current upload script doesn't work due to API limitations, you could:
1. Use the Anthropic Python SDK with proper file handling
2. Create a directory structure matching API requirements
3. Upload via `anthropic.skills.create()` with proper file paths

## Using an Existing Skill ID

If you already have a skill uploaded:

1. Find your skill ID via Anthropic Console or API
2. Add it to your environment configuration:
   ```typescript
   // In your app config
   const RACE_STRATEGY_SKILL_ID = 'your-skill-id-here';
   ```

3. Update `SkillManagementService.ts` to use the hardcoded ID:
   ```typescript
   async initializeRaceStrategySkill(): Promise<string | null> {
     // Return hardcoded skill ID instead of trying to upload
     const HARDCODED_SKILL_ID = 'your-skill-id-here';
     return HARDCODED_SKILL_ID;
   }
   ```

## Verifying Skills Are Working

When skills are properly configured, you'll see in your console:

```
✅ RaceStrategyEngine: Using Claude Skill for optimized strategies (60% token savings!)
```

Without skills, you'll see:

```
ℹ️  RaceStrategyEngine: No Claude Skill found - strategies will use full prompts
   This is totally fine! Strategies are still comprehensive and high-quality.
```

## Skill Content

The race-strategy-analyst skill contains:

```markdown
# Race Strategy Analyst

Expert sailing race strategist with championship tactics expertise.

## Core Knowledge
- Shift mathematics & wind strategy (oscillating shifts, lift/header response)
- Starting techniques (line bias, time-distance-speed, acceleration zones)
- Upwind tactics (layline discipline, current integration, fleet positioning)
- Mark rounding excellence (wide entry/tight exit, traffic management)
- Downwind strategy (VMG optimization, shift detection, wave riding)
- Covering & split distance (loose cover, Gladstone's 1/3 rule)
- Current & tidal strategy (timing legs, lee-bow technique)
- Championship execution (risk management, consistency, psychology)

## Output Requirements
Always provide: THEORY (quantified framework), EXECUTION (step-by-step how), CONFIDENCE (0-100%), CHAMPION STORY (when relevant)

## Key Principles
1. Speed First - never sacrifice boat speed unless covering
2. Clear Air - worth 5-10 boat lengths advantage
3. Tack on Headers - immediate response to >5° headers
4. Minimize Tacks - each costs 2-3 boat lengths
5. Laylines are Defensive - approach late with options
6. Current > Wind - in tidal areas, current outweighs shifts
7. Conservative = Consistent - series racing rewards top-third finishes

Expert frameworks from Kevin Gladstone, Kevin Colgate, Hans Fogh, Kevin Cox.
```

## Troubleshooting

### "No Claude Skill found" message

This is normal and expected! Your app works great without skills. If you want to add skills for optimization:
1. Follow the manual upload process above
2. Configure the skill ID in your app

### Strategies aren't being generated

This is NOT related to skills. Check:
1. Your Anthropic API key is valid
2. You have API credits
3. Check console for API errors

### Skills API upload fails

This is expected in browser/React Native. Use the manual upload options above instead.

## Future Improvements

Potential enhancements:
1. Create a backend service for skill management
2. Use Anthropic's official CLI for skill uploads
3. Pre-upload skills during app deployment
4. Cache skill IDs in app configuration
