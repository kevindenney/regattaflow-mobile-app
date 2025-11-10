# Boat Tuning AI - Testing & Usage Guide

## Overview

The Boat Tuning AI feature provides championship-level rig tuning recommendations by combining:
- **Structured tuning guide library** (Dragon, J/70, Etchells, ILCA 7, Optimist)
- **Claude AI with custom skills** for intelligent section selection and formatting
- **Automatic fallback** to deterministic recommendations if AI is unavailable

## Architecture

```
User Request → RaceTuningService → [AI Path or Fallback Path] → UI
                     ↓
                tuningGuideService (loads guides)
                     ↓
            Candidate sections scored by conditions
                     ↓
              ┌──────┴──────┐
              ↓             ↓
        AI Engine      Deterministic
      (RaceTuningEngine)  (built-in)
              ↓             ↓
         JSON Response   Settings Array
              └──────┬──────┘
                     ↓
           Normalized Recommendations
```

## Testing

### 1. Quick Test (Standalone)

Test the AI skill in isolation without the full app:

```bash
# Test with J/70 in 12 knots
node scripts/test-boat-tuning-simple.mjs J/70 12

# Test with Dragon in 15 knots
node scripts/test-boat-tuning-simple.mjs Dragon 15

# Test with ILCA 7 in 8 knots
node scripts/test-boat-tuning-simple.mjs ILCA7 8
```

**Expected output:**
- ✅ API Key found
- ✅ API call successful
- ✅ Raw JSON response from Claude
- ✅ Parsed recommendations with settings

### 2. In-App Testing

The boat tuning feature integrates with the race detail screen and uses the `useRaceTuningRecommendation` hook.

**Where to find it:**
- **Race Detail Screen**: `app/(tabs)/race/scrollable/[id].tsx`
- **Hook**: `hooks/useRaceTuningRecommendation.ts`
- **Service**: `services/RaceTuningService.ts`

**To test in-app:**

1. **Start the app:**
   ```bash
   npm start
   ```

2. **Navigate to a race** with a boat class (J/70, Dragon, etc.)

3. **Check the console logs** for tuning recommendation flow:
   ```
   [RaceTuningService] 🔍 getRecommendations called
   [RaceTuningService] 📡 Fetching guides from tuningGuideService
   [RaceTuningService] 📚 Retrieved guides
   [RaceTuningService] 🎯 Candidate sections
   [RaceTuningService] 🤖 Using AI-generated tuning recommendations
   ```

4. **Look for the tuning card** displaying:
   - Guide title and source
   - Condition summary
   - Settings (upper shrouds, lower shrouds, forestay, etc.)
   - Notes from the guide

### 3. Debugging

Enable detailed logging to see the full flow:

**In services/RaceTuningService.ts:**
Already has comprehensive `console.log` statements at each step.

**In services/ai/RaceTuningEngine.ts:**
Uses `logger.debug` - check line 85-88 for initialization logs.

**Check these logs:**
- `✅ Boat tuning skill initialized: skill_...` - Skill loaded successfully
- `⚠️ Boat tuning skill generation failed` - AI call failed, using fallback
- `🤖 Using AI-generated tuning recommendations` - AI path succeeded

## Configuration

### Environment Variables

Set in `.env` (or `.env.local`):

```bash
# Required for AI features
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase (for tuning guide storage)
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Skill Registry

The skill ID is registered in `services/ai/SkillManagementService.ts`:

```typescript
export const SKILL_REGISTRY = {
  // ...
  'boat-tuning-analyst': 'skill_01LwivxRwARQY3ga2LwUJNCj',
  // ...
}
```

**Current skill ID:** `skill_01LwivxRwARQY3ga2LwUJNCj`

To re-upload the skill (if needed):
```bash
node upload-single-skill.mjs boat-tuning-analyst
```

## How It Works

### 1. Request Flow

```typescript
// User requests tuning for J/70 in 12 knots upwind
const { recommendation, settings, loading } = useRaceTuningRecommendation({
  className: 'J/70',
  averageWindSpeed: 12,
  pointsOfSail: 'upwind'
});
```

### 2. Guide Matching

The service:
1. Fetches all tuning guides for the class
2. Extracts sections with settings
3. Scores each section based on wind speed and point of sail
4. Sorts by best match

### 3. AI Enhancement

If API key is configured:
1. Top 3 candidate sections sent to Claude
2. Claude uses the `boat-tuning-analyst` skill
3. Returns structured JSON with:
   - Normalized setting keys (`upper_shrouds`, `mast_rake`, etc.)
   - Human-readable labels
   - Exact values with units preserved
   - Confidence scores

### 4. Fallback Path

If AI unavailable or fails:
1. Uses top-scored candidate section
2. Applies deterministic key mapping
3. Returns settings in same format

## Expected Results

### For J/70 @ 12 knots upwind:

```json
{
  "guideTitle": "J/70 World Circuit Playbook",
  "guideSource": "One Design Speed Lab",
  "sectionTitle": "Base Rig Tune (8-12 kts)",
  "conditionSummary": "Baseline that most pro teams lock in...",
  "settings": [
    {
      "key": "upper_shrouds",
      "label": "Upper Shroud Tension",
      "value": "Loos PT-1M 26"
    },
    {
      "key": "lower_shrouds",
      "label": "Lower Shroud Tension",
      "value": "Loos PT-1M 23"
    },
    // ... more settings
  ]
}
```

### For Dragon @ 15 knots:

Would match "Medium Air Championship Setup (10-14 kts)" or "Heavy Air Breeze Mode (18-24 kts)" depending on scoring.

### For ILCA 7 @ 10 knots:

Would match "Radial Cut MKII - Medium Breeze" with settings for vang, cunningham, outhaul, etc.

## Common Issues

### 1. "No recommendations found"

**Causes:**
- No tuning guides exist for the class in the database
- Class name doesn't match exactly (try "J/70" vs "J70")
- No extracted sections in the guides

**Fix:**
- Check tuning guides exist: look at `data/default-tuning-guides.ts`
- Verify class ID/name matches exactly
- Add tuning guides via `tuningGuideService`

### 2. "AI engine not available"

**Causes:**
- Missing `EXPO_PUBLIC_ANTHROPIC_API_KEY`
- API key is set to "placeholder"

**Fix:**
```bash
# Add to .env
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE
```

### 3. "Skill initialization failed"

**Causes:**
- Skill ID doesn't match uploaded skill
- Anthropic API error
- Network issues

**Fix:**
- Re-upload skill: `node upload-single-skill.mjs boat-tuning-analyst`
- Update skill ID in `SkillManagementService.ts`
- Check Anthropic API status

### 4. Settings are empty or generic

**Causes:**
- Tuning guide sections don't have structured settings
- Settings extraction failed during guide processing

**Fix:**
- Verify guide sections have settings object with key-value pairs
- Check extraction service logs for parsing errors

## Performance

**Typical response times:**
- **AI path:** 5-10 seconds (Claude API call)
- **Fallback path:** <100ms (synchronous)
- **With caching:** <50ms (if recommendation cached)

**Optimization tips:**
- Cache skill ID after first initialization
- Pre-fetch guides for common classes
- Consider caching AI responses per class/conditions

## Next Steps

1. **Add more boat classes:**
   - Edit `skills/tuning-guides/boatTuningSkill.ts`
   - Re-export: `node scripts/export-boat-tuning-skill.js`
   - Re-upload: `node upload-single-skill.mjs boat-tuning-analyst`

2. **Enhance UI:**
   - Show confidence scores
   - Display multiple recommendations
   - Add "Save to my settings" feature
   - Compare against sailor's current setup

3. **Integration points:**
   - Race preparation checklist
   - Pre-race tuning card
   - Coach's tuning recommendations
   - Fleet-wide tuning distribution

4. **Advanced features:**
   - Venue-specific tuning adjustments
   - Historical performance correlation
   - Team tuning comparison
   - Video/photo tuning guides

## Maintenance

### Re-uploading the Skill

If you update the skill content:

```bash
# 1. Update the source
vim skills/tuning-guides/boatTuningSkill.ts

# 2. Export to markdown
node scripts/export-boat-tuning-skill.js

# 3. Upload to Anthropic
node upload-single-skill.mjs boat-tuning-analyst

# 4. Update skill ID in SkillManagementService.ts if needed
```

### Monitoring

Key metrics to track:
- AI path success rate (vs fallback)
- Average response time
- Recommendation acceptance rate
- Settings applied per class

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Run the test script to isolate AI vs service issues
3. Verify environment variables are set correctly
4. Check Anthropic API dashboard for quota/errors

---

**Last Updated:** 2025-11-05
**Skill Version:** v1.0
**Skill ID:** skill_01LwivxRwARQY3ga2LwUJNCj
