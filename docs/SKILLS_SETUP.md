# Claude Skills Setup Guide

This guide explains how to upload and manage Claude Skills for the RegattaFlow tidal strategy system.

## Overview

RegattaFlow uses Claude Skills to provide specialized AI analysis for:
- **race-strategy-analyst** - Championship race strategy recommendations
- **tidal-opportunism-analyst** - Current-driven tactical opportunities
- **slack-window-planner** - Maneuver timing around slack windows
- **current-counterplay-advisor** - Opponent tactics using current leverage

## Skill Definitions

All skill definitions are maintained in:
- **Code**: `services/ai/SkillManagementService.ts` (BUILT_IN_SKILL_DEFINITIONS)
- **Markdown**: `skills/{skill-name}/SKILL.md`

## Upload Methods

### Method 1: Anthropic CLI (Recommended)

The Anthropic Skills API requires proper file system paths, which makes CLI upload the most reliable method.

#### Prerequisites

```bash
# Install the Anthropic CLI
pip install anthropic

# Set your API key
export ANTHROPIC_API_KEY=your-api-key-here
```

#### Upload Each Skill

```bash
# Upload race-strategy-analyst (embedded in code, create temp file)
cat > /tmp/race-strategy-analyst/SKILL.md << 'EOF'
[Copy content from SkillManagementService.ts BUILT_IN_SKILL_DEFINITIONS['race-strategy-analyst'].content]
EOF

anthropic skills create \
  --name "race-strategy-analyst" \
  --description "Expert sailing race strategist combining RegattaFlow Playbook and RegattaFlow Coach frameworks" \
  /tmp/race-strategy-analyst

# Upload tidal-opportunism-analyst
anthropic skills create \
  --name "tidal-opportunism-analyst" \
  --description "Identifies current-driven opportunities using bathymetry and tidal intel" \
  skills/tidal-opportunism-analyst

# Upload slack-window-planner
anthropic skills create \
  --name "slack-window-planner" \
  --description "Builds maneuver timelines around slack water windows" \
  skills/slack-window-planner

# Upload current-counterplay-advisor
anthropic skills create \
  --name "current-counterplay-advisor" \
  --description "Advises on current-based tactics against opponents" \
  skills/current-counterplay-advisor
```

#### Verify Upload

```bash
# List all skills
anthropic skills list

# Get details of a specific skill
anthropic skills get skill_abc123xyz
```

###Method 2: Edge Function (Partial Support)

The `anthropic-skills-proxy` Edge Function supports:
- ✅ Listing skills (`list_skills`)
- ✅ Getting skill details (`get_skill`)
- ⚠️ Creating skills (requires proper file paths - use CLI instead)

```typescript
// List all skills
const skills = await skillManagementService.listSkills();

// Get skill ID by name
const skillId = await skillManagementService.getSkillId('tidal-opportunism-analyst');
```

## Using Skills in the App

Once skills are uploaded, the app automatically uses them:

### 1. Skill IDs are Cached

```typescript
// SkillManagementService caches skill IDs for quick lookup
const tidalSkillId = await skillManagementService.getSkillId('tidal-opportunism-analyst');
```

### 2. BathymetricTidalService Uses Skills

```typescript
// Automatically loads skill if available
const analysis = await bathymetricTidalService.analyzeRacingArea({
  racingArea: polygon,
  venue: venue,
  raceTime: new Date(),
  // ... other params
});
```

### 3. Fallback Behavior

If a skill isn't found:
- The service logs a warning
- Analysis proceeds using the base Claude model
- Functionality is NOT blocked

## Skill Management

### List Registered Skills

```typescript
import { skillManagementService } from '@/services/ai/SkillManagementService';

const skills = await skillManagementService.listSkills();
console.log('Registered skills:', skills.map(s => ({
  name: s.name,
  id: s.id,
  source: s.source
})));
```

### Clear Cache

```typescript
// Clear cache to force refresh from API
await skillManagementService.clearCache();
```

### Get Built-in Definitions

```typescript
import { SkillManagementService } from '@/services/ai/SkillManagementService';

// Get all built-in skill definitions
const allSkills = SkillManagementService.getAllBuiltInSkills();

// Get a specific skill definition
const tidalSkill = SkillManagementService.getBuiltInSkillDefinition('tidal-opportunism-analyst');
console.log(tidalSkill.content); // Markdown skill definition
```

## Updating Skills

When you update a skill definition:

1. **Update the source**:
   - Code: Edit `services/ai/SkillManagementService.ts`
   - Markdown: Edit `skills/{skill-name}/SKILL.md`

2. **Re-upload via CLI**:
   ```bash
   anthropic skills create \
     --name "tidal-opportunism-analyst" \
     --description "Updated description" \
     skills/tidal-opportunism-analyst
   ```

3. **Clear app cache**:
   ```typescript
   await skillManagementService.clearCache();
   ```

4. **Verify new version**:
   ```bash
   anthropic skills get <skill-id>
   ```

## Troubleshooting

### Skill Not Found

```typescript
// Check if skill exists
const skillId = await skillManagementService.getSkillId('my-skill');
if (!skillId) {
  console.log('Skill not uploaded - upload via CLI');
}
```

### API Errors

Check Edge Function logs:
```bash
# Via Supabase dashboard or MCP tool
const logs = await mcp__supabase__get_logs({ service: 'edge-function' });
```

### Skill Not Being Used

Check console logs for:
- `⚠️ BathymetricTidalService: tidal-opportunism-analyst skill not found`
- `🎯 BathymetricTidalService: Using tidal-opportunism-analyst skill (skill_123)`

## Environment Setup

Required environment variables:
```bash
# Anthropic API key (for CLI and Edge Function)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase configuration (for Edge Function)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Skill IDs Reference

After uploading, record your skill IDs here for reference:

| Skill Name | Skill ID | Uploaded Date | Version |
|------------|----------|---------------|---------|
| race-strategy-analyst | skill_01DzAJDZzjx9H6zVaBseYN9a | 2025-10-30 | 1 |
| tidal-opportunism-analyst | _pending_ | - | - |
| slack-window-planner | _pending_ | - | - |
| current-counterplay-advisor | _pending_ | - | - |

## Next Steps

1. Upload all skills via Anthropic CLI
2. Record skill IDs in the table above
3. Test integration with `BathymetricTidalService`
4. Verify skill usage in console logs
5. Monitor performance and adjust skill definitions as needed
