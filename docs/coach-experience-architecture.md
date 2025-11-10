# Coach Experience Architecture & Wiring

This document captures how the coach persona is implemented across the Supabase backend, Edge Functions, Claude Skills integration, and the Expo/Vercel clients after the October 2025 refresh.

## Data Layer (Supabase)

| Component | Purpose |
|-----------|---------|
| Tables | `coach_profiles`, `coaching_clients`, `coaching_sessions`, `session_feedback`, `coach_program_templates`, `coach_resources`, `ai_skills`, `ai_requests` |
| Views | `coach_sailor_sessions_view`, `coach_metrics_view`, `coach_feedback_view` (power hub metrics, session cards, and feedback ribbons) |
| RPC | `get_coach_sessions`, `get_coach_metrics`, `discover_coaches`, `upsert_coaching_client`, `record_session_feedback` |
| Indexes | Compound indexes on `coaching_sessions (coach_id, status, scheduled_at)`, `session_feedback (session_id)`, `coaching_clients (coach_id, status)` |
| RLS | Row-Level Security scopes data by persona (`coach`, `sailor`, `club`). Edge Functions execute with the service role for privileged aggregates. |

### Edge Functions

| Function | Path | Description |
|----------|------|-------------|
| `anthropic-skills-proxy` | `/functions/v1/anthropic-skills-proxy` | Read-only proxy for listing Anthropic skills (used by the race strategy engine). |
| `coach-matching` | `/functions/v1/coach-matching` | Invokes Claude Skills for learning-style analysis, compatibility scoring, and session planning. |

Set `ANTHROPIC_API_KEY` in the Supabase Edge Function environment so both functions can call Anthropic safely.

## Claude Skills

The front-end prefers Claude Skills when available. Configure the following Expo public env vars (they default to plain prompts when unset):

```env
EXPO_PUBLIC_CLAUDE_SKILL_COACH_MATCH=<skill-id>
EXPO_PUBLIC_CLAUDE_SKILL_COACH_PLAN=<optional-skill-id>
EXPO_PUBLIC_CLAUDE_SKILL_COACH_LEARNING=<optional-skill-id>
```

All skill calls are routed through the new `coach-matching` Edge Function so the Anthropic key never ships to clients.

## Application Layer (Expo & Vercel)

### Providers & Hooks

* `CoachWorkspaceProvider` (React Query) hydrates coach profile, stats, and exposes a `refetchAll` helper.
* Hooks under `hooks/useCoachData.ts`:
  * `useUpcomingCoachSessions`, `useRecentCoachSessions`
  * `useCoachMetrics`, `useCoachSpotlights`, `useCoachResources`
  * Mutations for create/update/complete session flows.
* `hooks/useCoachWorkspace` now delegates to the provider and surfaces `coachId`, `stats`, `loading`, `refresh`.

### Screens & Flows

| Screen | Route | Data Sources | Highlights |
|--------|-------|--------------|------------|
| Coaching Hub | `/(tabs)/coaching` | `useUpcomingCoachSessions`, `useRecentCoachSessions`, `useCoachMetrics`, `useCoachSpotlights`, `useCoachResources` | Gradient hero, metrics, quick actions, horizontal scrollers for sessions, programs, resources, and AI feedback. |
| Clients | `/(tabs)/clients` | `CoachingService.getClients`, `getCoachStats` | Roster cards with session counts, pull-to-refresh wired to `refetchAll`. |
| Schedule | `/(tabs)/schedule` | `useCoachSessions('scheduled')` | Calendar/agenda view using cached sessions. |
| Earnings | `/(tabs)/earnings` | `CoachingService.getCoachPayments()` (to be expanded) | Revenue summary and payouts. |
| Discover Marketplace | `/coach/discover-enhanced` | `CoachMarketplaceService`, `AICoachMatchingService` | Claude skill scoring (compatibility badges, skill gaps, recommendations). |
| Session Detail | `/coach/session/[id]` | `CoachingService.getSessionDetails`, `AICoachMatchingService.generateSessionRecommendations` | Timeline, AI-generated plan, homework capture table. |

Navigation: `app/coach/_layout.tsx` wraps all coach routes with `CoachWorkspaceProvider`. The tab bar in `app/(tabs)/_layout.tsx` was restyled as a floating pill and now relies on React Query data.

## AI Workflow Updates

`services/AICoachMatchingService.ts` now:

1. Calls the `coach-matching` Edge Function (when `EXPO_PUBLIC_SUPABASE_URL` is configured).
2. Supplies the relevant Claude Skill ID for the scenario (`match`, `plan`, `learning`).
3. Falls back to direct Claude Haiku prompts only if the Edge Function (or skill) is unavailable.
4. Logs warnings when fallbacks trigger, making it easy to monitor skill coverage.

## Environment & Deployment Steps

1. **Supabase**: run migrations, deploy Edge Functions (`anthropic-skills-proxy`, `coach-matching`), set `ANTHROPIC_API_KEY`.
2. **Expo / Vercel**:
   * Add the new `EXPO_PUBLIC_CLAUDE_SKILL_*` vars to `.env` and EAS secrets.
   * Rebuild web via Vercel after Edge Functions deploy.
3. **Verification**:
   * Visit `/(tabs)/coaching` to confirm metrics + AI content.
   * Run `CoachMarketplace` flow (`/coach/discover-enhanced`) and ensure compatibility scores render.
   * Trigger session completion to see `session_feedback` records populate via RPC.

## Testing & Observability

* React Query caches include 5–10 minute stale windows with fast pull-to-refresh.
* msw mocks cover the coach hub while offline.
* AI requests log to `ai_requests` (tokens, skill used). Add dashboards in Supabase or Mixpanel to monitor latency and fallback usage.

With these pieces in place, the coach persona now shares a single data pipeline, benefits from Claude Skills, and keeps the UX consistent across web and native builds.
