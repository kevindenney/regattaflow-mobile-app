# Skill Duplicate Upload Fix

## Problem

The `race-learning-analyst` skill was repeatedly attempting to upload on every request, causing Anthropic API errors:

```
Skill cannot reuse an existing display_title: "Race Learning Analyst"
```

## Root Cause Analysis

### 1. Display Title vs Slug Mismatch

**Edge Function Behavior** (`supabase/functions/anthropic-skills-proxy/index.ts:118-176`):
- Receives skill with slug name: `race-learning-analyst`
- Generates display_title: `Race Learning Analyst` (titlecased)
- Sends to Anthropic with this display_title

**API Response Behavior**:
- Anthropic's `/skills` endpoint returns skills with `display_title` field
- May not include the original slug `name` field
- Example response: `{ id: 'skill_xxx', display_title: 'Race Learning Analyst', ... }`

### 2. Cache Key Mismatch

**Previous Caching Logic** (`services/ai/SkillManagementService.ts:700-711`):
```typescript
skills.forEach((skill: any) => {
  const metadata: SkillMetadata = { id: skill.id, name: skill.name, ... };
  this.skillCache.set(skill.name, metadata);  // ❌ skill.name may be undefined!
});
```

**Lookup Logic** (`services/ai/SkillManagementService.ts:735-747`):
```typescript
async getSkillId(name: string): Promise<string | null> {
  const cached = this.skillCache.get(name);  // Looking up by 'race-learning-analyst'
  // ❌ Never finds it because cache key is undefined or different
}
```

### 3. Insufficient Error Detection

**Previous Error Handling** (`services/ai/SkillManagementService.ts:675-683`):
```typescript
catch (error) {
  if ((error as any)?.message?.includes('already exists')) {
    return await this.getSkillId(name);
  }
  return null;  // ❌ Didn't handle "cannot reuse an existing display_title"
}
```

### 4. Impact Flow

```
PostRaceLearningService.generateLearningProfile()
  → initializeRaceLearningSkill()
    → getSkillId('race-learning-analyst')  ❌ Cache miss
      → uploadSkill()  ❌ Anthropic rejects: "display_title already exists"
        → Error not recognized as duplicate
          → Returns null
            → Next request repeats the cycle
```

## Solution

### 1. Dual-Key Caching

Added `slugifyDisplayTitle()` helper and cache by both name AND slugified display_title:

```typescript
// services/ai/SkillManagementService.ts:687-695
private slugifyDisplayTitle(displayTitle: string): string {
  return displayTitle
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// services/ai/SkillManagementService.ts:710-733
skills.forEach((skill: any) => {
  const metadata: SkillMetadata = { ... };

  // Cache by skill.name if available
  if (skill.name) {
    this.skillCache.set(skill.name, metadata);
  }

  // ALSO cache by slugified display_title
  if (skill.display_title) {
    const slug = this.slugifyDisplayTitle(skill.display_title);
    this.skillCache.set(slug, metadata);
    console.log(`📌 Cached by display_title slug: ${slug} -> ${skill.id}`);
  }
});
```

**Result**: `getSkillId('race-learning-analyst')` now finds the skill because:
- API returns: `{ display_title: 'Race Learning Analyst', ... }`
- We cache it as: `cache.set('race-learning-analyst', metadata)`
- Lookup succeeds: `cache.get('race-learning-analyst')` ✅

### 2. Enhanced Error Detection

Updated error handling to recognize multiple duplicate error patterns:

```typescript
// services/ai/SkillManagementService.ts:678-697
catch (error) {
  const errorMessage = (error as any)?.message?.toLowerCase() || '';
  const isDuplicateError =
    errorMessage.includes('already exists') ||
    errorMessage.includes('cannot reuse an existing display_title') ||
    errorMessage.includes('display_title');

  if (isDuplicateError) {
    console.log(`🔄 Skill '${name}' appears to exist, fetching from API...`);

    // Refresh the skill list to update cache
    await this.listSkills();

    // Try to get the skill ID from refreshed cache
    const existingId = await this.getSkillId(name);
    if (existingId) {
      console.log(`✅ Found existing skill '${name}' after refresh: ${existingId}`);
      return existingId;
    }
  }
}
```

**Benefits**:
- Catches the "cannot reuse an existing display_title" error
- Automatically refreshes cache from API
- Returns existing skill ID instead of failing

## Testing

Created `test-skill-cache-fix.mjs` to verify the fix:

```bash
node test-skill-cache-fix.mjs
```

**Test Results**:
```
✅ Found 'race-learning-analyst': skill_01NsZX8FL8JfeNhqQ7qFQLLW
✅ Found 'boat-tuning-analyst': skill_01LwivxRwARQY3ga2LwUJNCj
```

## Expected Behavior After Fix

1. **First Request** (cold start):
   - `listSkills()` populates cache with both name and slug keys
   - `getSkillId('race-learning-analyst')` finds cached entry
   - No upload attempt needed ✅

2. **Subsequent Requests**:
   - `getSkillId('race-learning-analyst')` hits cache immediately
   - Zero API calls to Anthropic ✅

3. **If Upload Somehow Triggered**:
   - Error caught: "cannot reuse an existing display_title"
   - Automatically refreshes cache via `listSkills()`
   - Returns existing skill ID
   - No error propagates to user ✅

## Files Changed

- `services/ai/SkillManagementService.ts`: Added dual-key caching and enhanced error handling
- `test-skill-cache-fix.mjs`: Verification test script

## Verification Steps

1. Clear skill cache (optional):
   - Delete AsyncStorage cache or wait for next app restart

2. Trigger race learning analysis:
   - Navigate to a race with analysis data
   - Check logs for skill initialization

3. Expected logs:
   ```
   📋 SkillManagementService: Listing all skills via proxy
   📌 SkillManagementService: Cached skill by display_title slug: race-learning-analyst -> skill_01NsZX8FL8JfeNhqQ7qFQLLW
   ✅ SkillManagementService: Found existing skill 'race-learning-analyst' with ID: skill_01NsZX8FL8JfeNhqQ7qFQLLW
   ```

4. No more Anthropic errors about duplicate display_title ✅

## Future Improvements

Consider:
- Adding cache TTL to force periodic refresh
- Logging cache hit/miss metrics
- Adding unit tests for edge cases
- Documenting Anthropic API response schema
