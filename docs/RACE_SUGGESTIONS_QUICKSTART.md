# Race Suggestions - Quick Start Guide

## What is Race Suggestions?

The intelligent race suggestion system automatically recommends races you might want to add based on:

- **Your Club Memberships** - See upcoming events from clubs you belong to
- **Your Fleet Connections** - Discover races your fleet mates are entering
- **Your Racing History** - Get suggestions based on patterns in your past races
- **Common Templates** - Quick-add races you enter frequently

## For End Users

### How to See Suggestions

1. Navigate to **Add Race** screen
2. Suggestions appear automatically at the top
3. Browse categories:
   - 📘 **From Your Clubs** - Official club events
   - ⛵ **From Your Fleets** - Races with your boat class
   - 📊 **Based on Your History** - Pattern-matched races
   - 📄 **Your Common Races** - Frequently used templates

### How to Use a Suggestion

1. Find a race you want to add
2. Review the confidence badge:
   - 🟢 **High Match** - Very confident this is relevant (90%+)
   - 🟡 **Good Match** - Likely relevant (60-90%)
   - ⚫ **Possible Match** - Might be relevant (<60%)
3. Click **"Add to Calendar"**
4. Form fields auto-populate with race details
5. Review and adjust if needed
6. Save the race

### Understanding Suggestions

**Why am I seeing this race?**
- Each suggestion has a reason displayed (e.g., "Upcoming event at RHKYC")
- Hover/tap the info icon to see full explanation

**What if I don't want a suggestion?**
- Click the ❌ button to dismiss
- System learns and won't show it again
- Helps improve future suggestions

**How often do suggestions update?**
- Automatically refresh every 24 hours
- Click the refresh icon to force update
- New suggestions appear when you join clubs/fleets

## For Developers

### Basic Usage

```typescript
import { useRaceSuggestions } from '@/hooks/useRaceSuggestions';
import { RaceSuggestionsDrawer } from '@/components/races/RaceSuggestionsDrawer';

function MyComponent() {
  const {
    suggestions,
    loading,
    refresh,
    acceptSuggestion,
    dismissSuggestion,
  } = useRaceSuggestions();

  const handleSelect = (suggestion: RaceSuggestion) => {
    // Populate your form fields
    console.log('Selected:', suggestion.raceData);
    acceptSuggestion(suggestion.id);
  };

  return (
    <RaceSuggestionsDrawer
      suggestions={suggestions}
      loading={loading}
      onSelectSuggestion={handleSelect}
      onDismissSuggestion={dismissSuggestion}
      onRefresh={refresh}
    />
  );
}
```

### Triggering Cache Refresh

When user joins new club or fleet:
```typescript
const { invalidateCache } = useRaceSuggestions();

async function handleJoinClub(clubId: string) {
  await clubService.join(clubId);
  await invalidateCache(); // Force refresh suggestions
}
```

### Accessing Service Directly

```typescript
import { raceSuggestionService } from '@/services/RaceSuggestionService';

// Get suggestions
const suggestions = await raceSuggestionService.getSuggestionsForUser(userId);

// Record feedback
await raceSuggestionService.recordFeedback(
  userId,
  suggestionId,
  'accepted',
  ['raceName', 'venue'] // modified fields
);

// Invalidate cache
await raceSuggestionService.invalidateCache(userId);
```

## For Administrators

### Initial Setup

1. **Apply database migration:**
   ```bash
   npx supabase db push
   ```

2. **Deploy edge function:**
   ```bash
   npx supabase functions deploy refresh-race-suggestions
   ```

3. **Set up daily refresh (optional):**
   - Go to Supabase Dashboard → Database → Extensions
   - Enable `pg_cron` if not already enabled
   - Add cron job (see full docs)

4. **Test the system:**
   - Add a test user to a club
   - Create an upcoming club event
   - Navigate to Add Race screen
   - Verify suggestion appears

### Manual Refresh

Trigger background refresh manually:
```bash
curl -X POST \
  https://[project-ref].supabase.co/functions/v1/refresh-race-suggestions \
  -H "Authorization: Bearer [service-role-key]"
```

### Monitor Performance

```sql
-- Check suggestion counts by type
SELECT suggestion_type, COUNT(*)
FROM race_suggestions_cache
WHERE expires_at > NOW()
GROUP BY suggestion_type;

-- Check acceptance rates
SELECT
  suggestion_type,
  COUNT(*) FILTER (WHERE action = 'accepted') * 100.0 / NULLIF(COUNT(*), 0) AS acceptance_rate
FROM suggestion_feedback
GROUP BY suggestion_type;

-- Find users with most suggestions
SELECT user_id, COUNT(*) AS suggestion_count
FROM race_suggestions_cache
WHERE expires_at > NOW()
GROUP BY user_id
ORDER BY suggestion_count DESC
LIMIT 10;
```

### Troubleshooting

**Problem:** No suggestions appearing for a user

**Solutions:**
1. Check if user has club/fleet memberships
2. Verify user has at least 3 races in history (for patterns)
3. Check if suggestions cache is expired
4. Manually refresh: `invalidateCache(userId)`

**Problem:** Suggestions not refreshing

**Solutions:**
1. Check edge function logs in Supabase dashboard
2. Verify cron job is running (if configured)
3. Run manual refresh command
4. Check for errors in service logs

**Problem:** Low confidence scores

**Solutions:**
1. Ensure user has sufficient race history
2. Check pattern detection thresholds
3. Review confidence scoring algorithm
4. May be expected for new users

## Best Practices

### For Users
- ✅ Join relevant clubs and fleets to get better suggestions
- ✅ Add races regularly to improve pattern detection
- ✅ Dismiss irrelevant suggestions to train the system
- ✅ Review auto-filled fields before saving
- ❌ Don't ignore all suggestions - give them a try!

### For Developers
- ✅ Call `invalidateCache()` after membership changes
- ✅ Handle loading and error states gracefully
- ✅ Record feedback for all user interactions
- ✅ Test with users who have different data profiles
- ❌ Don't bypass the caching mechanism
- ❌ Don't modify suggestion data directly in cache

### For Administrators
- ✅ Monitor suggestion acceptance rates
- ✅ Review pattern effectiveness periodically
- ✅ Ensure background job runs successfully
- ✅ Clean up old feedback data periodically
- ❌ Don't disable RLS policies
- ❌ Don't skip migration testing

## Common Workflows

### New User Flow
1. User signs up
2. User joins a club during onboarding
3. Club has upcoming events
4. User sees club event suggestions immediately
5. User adds first race from suggestion
6. System starts building user profile

### Returning User Flow
1. User opens Add Race screen
2. Sees suggestions from cache (instant load)
3. Background refresh happens if cache is >24h old
4. User gets new suggestions based on recent activity
5. Pattern detection improves over time

### Fleet Coordination Flow
1. Fleet captain adds a regatta
2. System suggests this race to all fleet members
3. Members see suggestion in "From Your Fleets"
4. Multiple sailors add the same race
5. Fleet attends together

## FAQ

**Q: How many suggestions will I see?**
A: Up to 50 suggestions total, distributed across categories. Most relevant appear first.

**Q: Can I customize which suggestions I see?**
A: Not directly, but dismissing suggestions helps the system learn your preferences.

**Q: Do suggestions work offline?**
A: Cached suggestions work offline, but refresh requires internet connection.

**Q: How accurate are the patterns?**
A: Pattern confidence increases with more race history. 3+ races minimum required.

**Q: Can I see dismissed suggestions again?**
A: No, but you can refresh to get new suggestions. Dismissals are permanent.

**Q: What happens to old suggestions?**
A: They expire after 24 hours and are automatically cleaned up.

**Q: How does this affect performance?**
A: Minimal impact - suggestions are pre-computed and cached.

**Q: Is my racing data private?**
A: Yes, all suggestions and patterns are private to your account.

## Support

For issues or questions:
- Check the troubleshooting section above
- Review full documentation: `RACE_SUGGESTIONS_IMPLEMENTATION.md`
- Submit issue on GitHub
- Contact support team

---

**Last Updated:** November 6, 2025
**Version:** 1.0.0
