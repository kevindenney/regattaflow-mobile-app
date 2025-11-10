# Race Suggestions Debugging Checklist

## What We Fixed So Far
✅ Applied race suggestions migration (tables created)
✅ Added INSERT policies for race_suggestions_cache, race_patterns, race_templates
✅ Added comprehensive console logging to track the entire suggestion flow

## What We're Validating Now

### 1. Authentication State
**What to check**: Is the user properly logged in?
- Look for: `🔍 [useRaceSuggestions] user.id: <uuid>`
- If you see: `⚠️ No user ID, skipping` → User not authenticated

### 2. Service Initialization
**What to check**: Does the suggestion service start?
- Look for: `🎯 [RaceSuggestionService] getSuggestionsForUser called for: <uuid>`
- This confirms the service is being called

### 3. Cache Check
**What to check**: Is the cache query working?
- Look for: `📦 [getCachedSuggestions] Querying cache for user:`
- Look for: `📦 [getCachedSuggestions] Query result:`
- Check if error or empty data

### 4. Fresh Suggestion Generation
**What to check**: If no cache, are suggestions being generated?
- Look for: `🔨 [generateFreshSuggestions] Starting parallel fetch`
- Look for: `🔨 [generateFreshSuggestions] Results:` with counts
- Check clubRaces, fleetRaces, patterns, templates counts

### 5. Cache Storage
**What to check**: Are suggestions being saved to cache?
- Look for: `💾 [RaceSuggestionService] Caching suggestions...`
- Look for: `✅ [RaceSuggestionService] Suggestions cached successfully`
- If error here → INSERT policy issue

### 6. Component Rendering
**What to check**: Is the drawer component receiving data?
- Look for: `[RaceSuggestionsDrawer] Rendering with:`
- Check the `suggestions` object has data
- Look for: `[RaceSuggestionsDrawer] Showing suggestions drawer`

## Expected Console Log Flow (Success)

```
🔍 [useRaceSuggestions] loadSuggestions called
🔍 [useRaceSuggestions] user.id: 66ca1c3e-9ae1-4619-b8f0-d3992363084d
🚀 [useRaceSuggestions] Starting suggestion fetch for user: 66ca1c3e-...
🎯 [RaceSuggestionService] getSuggestionsForUser called for: 66ca1c3e-...
💾 [RaceSuggestionService] Checking cache...
📦 [getCachedSuggestions] Querying cache for user: 66ca1c3e-...
📦 [getCachedSuggestions] No cached data found
🔨 [RaceSuggestionService] No valid cache, generating fresh suggestions
🔨 [generateFreshSuggestions] Starting parallel fetch for user: 66ca1c3e-...
🔨 [generateFreshSuggestions] Results: { clubRaces: 6, fleetRaces: 0, patterns: 1, templates: 0 }
💾 [RaceSuggestionService] Caching suggestions...
✅ [RaceSuggestionService] Suggestions cached successfully
✅ [useRaceSuggestions] Successfully received suggestions: { total: 7, ... }
[RaceSuggestionsDrawer] Rendering with: { total: 7, clubRaces: 6, ... }
[RaceSuggestionsDrawer] Showing suggestions drawer
```

## Error Scenarios to Watch For

### Error A: No User ID
```
⚠️ [useRaceSuggestions] No user ID, skipping suggestion load
```
**Fix**: Make sure you're logged in as Sarah Chen

### Error B: RLS Policy Error
```
❌ [getCachedSuggestions] Error fetching cached suggestions: new row violates row-level security policy
```
**Fix**: INSERT policy missing (but we just added it!)

### Error C: Empty Data
```
📦 [getCachedSuggestions] No cached data found
🔨 [generateFreshSuggestions] Results: { clubRaces: 0, fleetRaces: 0, patterns: 0, templates: 0 }
```
**Fix**: Sarah Chen needs club memberships and historical races (we verified she has these)

### Error D: Component Not Rendering
```
[RaceSuggestionsDrawer] Showing empty state
```
**Fix**: Check if suggestions object is null or has total: 0

## Next Steps

1. **Navigate to Add Race page**: Go to `localhost:8081/race/add`
2. **Make sure you're logged in as Sarah Chen**
3. **Open Browser Console** (Cmd+Option+J)
4. **Refresh the page**
5. **Look for the log flow above**
6. **Take screenshot if you see errors**

## Key Files Modified

- `/hooks/useRaceSuggestions.ts` - Added console.log debugging
- `/services/RaceSuggestionService.ts` - Added console.log debugging
- `/components/races/RaceSuggestionsDrawer.tsx` - Already has debug logs
- `fix-suggestions-insert-policy.sql` - Applied INSERT policies
