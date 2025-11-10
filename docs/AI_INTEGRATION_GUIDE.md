# Claude Skills AI Integration Guide

This document explains how the Claude Skills integration for the RegattaFlow club experience is structured, deployed, and extended.

---

## Architecture Overview

- **Hosting**: Vercel serverless functions (`/api/ai/**`) handle inbound requests, orchestrate context collection, call Claude Skills, and persist the results.
- **Data Layer**: Supabase stores events, races, members—and now all AI artefacts (activity logs, generated documents, notifications, chat history, and aggregated usage).
- **AI Runtime**: Claude Skills (Anthropic) is invoked via the `ClaudeClient` helper. The integration uses Sonnet for rich documents and Haiku for fast responses.
- **Shared Modules** (`services/ai/`):
  - `ClaudeClient.ts` – typed wrapper around the Claude Skills Messages API.
  - `AIActivityLogger.ts` – centralised logging + persistence helpers.
  - `ContextResolvers.ts` – fetches event/race/club context from Supabase.
  - `PromptBuilder.ts` – creates prompts for docs, comms, support, and summaries.
  - `OutputValidator.ts` – validates Claude output using Zod.

```
Expo App ──HTTP──▶ Vercel API ──▶ ClaudeClient ──▶ Claude Skills
           │                │
           │                └─▶ Supabase (context) + AI tables
           └─◀──────────────┘
```

---

## Database Schema

The migration `supabase/migrations/20250426120000_create_ai_activity_schema.sql` adds:

| Table | Purpose |
| --- | --- |
| `ai_activity_logs` | Raw log of every Claude interaction (metrics, payload, errors). |
| `ai_generated_documents` | Stores generated NOR/SI/amendment drafts. |
| `ai_notifications` | Race-day communication drafts awaiting approval. |
| `ai_conversations` | Chat history for the club support assistant. |
| `ai_usage_monthly` | Aggregated monthly usage and cost estimation. |

Each table is indexed by `club_id` for fast lookups.

---

## API Surface (Vercel)

| Route | Description |
| --- | --- |
| `POST /api/ai/events/:id/documents/draft` | Draft NOR/SI/amendment markdown for an event. |
| `POST /api/ai/races/:id/comms/draft` | Draft race-day updates (SMS/email/notice board). |
| `POST /api/ai/club/support` | Member-facing chat assistant response. |
| `POST /api/ai/cron/daily-summary` | Nightly job: summarises club activity (triggered by Vercel Cron). |

All endpoints use `api/middleware/auth.ts` which:
- Validates the Supabase JWT (via service role key).
- Loads `users.user_type` and `users.club_id`.
- Rejects requests when the caller is not a club admin.

---

## Environment Variables

Add the following in Vercel (and locally in `.env.local` for testing):

```
ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=random-secret
```

The cron secret is forwarded via `vercel.json` to secure scheduled calls.

---

## Deployment Steps

1. **Apply the migration**
   ```bash
   npx supabase db push
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Smoke test**
   ```bash
   curl -X POST https://<domain>/api/ai/events/<eventId>/documents/draft \
     -H "Authorization: Bearer <JWT>" \
     -H "Content-Type: application/json" \
     -d '{"document_type":"nor"}'
   ```

4. Check `ai_activity_logs` in Supabase for the new entry.

---

## Frontend Integration Checklist

1. **Hooks**
   - `hooks/ai/useClaudeDraft.ts` – wraps `fetch` to document endpoints.
   - `hooks/ai/useAIChatSession.ts` – persistent support chat state.

2. **Components**
   - `components/ai/AiDraftModal.tsx`
   - `components/ai/AiDraftActions.tsx` (regenerate/approve)
   - `components/ai/ClubAiAssistant.tsx`

3. **Entry Points**
   - Event creation: “Generate NOR/SI draft” button.
   - Race management: “Draft update” button in active race cards.
   - Club dashboard: daily summary card (consume `ai_generated_documents`).
   - Settings: embed chat widget.

---

## Cost Model (per club, per month)

- Event documents (~10 requests) ≈ $0.30
- Race updates (~50 requests) ≈ $0.05
- Support chats (~200 messages) ≈ $0.40
- Daily summaries (30) ≈ $0.15

**Total** ≈ **$0.90 / club / month** (assuming Sonnet for docs, Haiku for the rest).

---

## Extending the Integration

- Add new skills by:
  1. Creating a prompt helper in `PromptBuilder`.
  2. Adding a validator in `OutputValidator`.
  3. Building a Vercel API route or reusing an existing one.
  4. Logging via `AIActivityLogger`.

- For long-running tasks (e.g., regatta reports), push a job into an `ai_jobs` table and handle via Vercel Cron or Supabase Functions.

---

## Troubleshooting

- **401 Unauthorized**: Ensure JWT is valid and user has `user_type = 'club'`.
- **403 Club required**: The account needs a `club_profiles` row (complete onboarding).
- **500 Claude errors**: Check `ai_activity_logs.error_message`. Often caused by missing context or invalid JSON output.
- **Rate limits**: Anthropic default is generous; log spikes show in `ai_usage_monthly`.
- **CORS**: Vercel functions allow same-origin calls. For dev, use the Expo dev server proxy or add explicit headers.

---

Need help wiring the React hooks or adjusting prompts? Reach out—this foundation is ready for the UI layer. 🚀

