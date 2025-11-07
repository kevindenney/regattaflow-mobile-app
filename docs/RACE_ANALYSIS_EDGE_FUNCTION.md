# Race Analysis Edge Function

## Overview

Race analysis has been migrated from Vercel API routes to Supabase Edge Functions for better integration with the Supabase ecosystem and improved security.

## Architecture

### Edge Function Location
`supabase/functions/race-analysis/index.ts`

### Client Integration
`services/RaceAnalysisService.ts`

The service calls the Edge Function using Supabase's built-in `functions.invoke()` method:

```typescript
const { data, error } = await supabase.functions.invoke('race-analysis', {
  body: { timerSessionId, force },
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

## How It Works

1. **User triggers analysis** from the UI (e.g., "Generate AI Analysis" button)
2. **RaceAnalysisService** calls the Supabase Edge Function with the user's auth token
3. **Edge Function** validates:
   - User authentication
   - Race session ownership
   - Race completion status
4. **Claude API** is called server-side to analyze the race
5. **Analysis is saved** to `ai_coach_analysis` table
6. **Session is marked** as `auto_analyzed: true`

## Deployment

### Deploy the Edge Function

```bash
npx supabase functions deploy race-analysis
```

### Required Environment Variables

Set these in Supabase Dashboard → Edge Functions → Secrets:

- `ANTHROPIC_API_KEY` - Your Anthropic Claude API key
- `SUPABASE_URL` - Automatically set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically set by Supabase

### Verify Secrets

```bash
npx supabase secrets list
```

## Testing

### Manual Test via Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Find `race-analysis` function
3. Click "Invoke Function"
4. Send test payload:

```json
{
  "timerSessionId": "your-session-id-here",
  "force": false
}
```

### Test via App

1. Complete a race in the app
2. Navigate to the race detail screen
3. Tap "Generate AI Analysis"
4. Verify analysis appears in the UI
5. Check Supabase logs for Edge Function execution

### Test Regeneration

1. From an analyzed race, tap "Regenerate Analysis"
2. Verify old analysis is deleted
3. Verify `auto_analyzed` flag is reset
4. Verify new analysis is generated

## Security

- **Authentication**: All requests require a valid Supabase session token
- **Authorization**: Users can only analyze their own races
- **API Keys**: Anthropic API key is only accessible server-side
- **CORS**: Configured to allow requests from your app domains

## Monitoring

### View Logs

```bash
npx supabase functions logs race-analysis
```

Or view in Supabase Dashboard → Edge Functions → race-analysis → Logs

### Common Errors

- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - User doesn't own the race session
- `404 Not Found` - Race session doesn't exist
- `400 Bad Request` - Race hasn't finished yet
- `500 Internal Server Error` - Claude API or database error

## Migration Notes

### What Changed

- ✅ Moved from Vercel API routes to Supabase Edge Functions
- ✅ Removed dependency on `EXPO_PUBLIC_API_BASE_URL`
- ✅ Simplified authentication (uses Supabase's built-in auth)
- ✅ Better integration with Supabase ecosystem
- ✅ Removed Vercel-specific middleware

### Breaking Changes

**None for end users** - The client-side API remains the same:

```typescript
await RaceAnalysisService.analyzeRaceSession(sessionId, { force: true });
```

### Files Removed

- `api/ai/race-analysis/analyze.ts` (Vercel route)
- `api/middleware/auth.ts` (Vercel auth middleware)

## Future Enhancements

- [ ] Add streaming support for real-time analysis updates
- [ ] Implement caching layer for frequently requested analyses
- [ ] Add webhook support for post-analysis notifications
- [ ] Integrate with Claude Skills API for specialized sailing analysis
