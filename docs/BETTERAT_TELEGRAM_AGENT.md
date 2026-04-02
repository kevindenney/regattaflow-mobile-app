# Telegram AI Agent for BetterAt Customers

## Context

BetterAt is a learning/coaching platform. Users currently interact via the Expo/React Native app. This plan enables customers to interact with their BetterAt system via Telegram AI agents — similar to how the Central Oceans OpenClaw bot handles freight incidents, but built natively on BetterAt's existing stack.

**Key insight: We don't need OpenClaw or a separate EC2 instance.** BetterAt already has Claude AI integration, MCP tools, and Supabase backend. A single Vercel serverless function receiving Telegram webhooks can do it all.

## Why NOT OpenClaw for this

| Factor | OpenClaw | Vercel Webhook |
|--------|----------|----------------|
| Language | Python scripts | TypeScript (matches BetterAt) |
| Multi-tenancy | Single-tenant, flat JSON files | Supabase RLS handles isolation |
| AI service reuse | Would rewrite everything | Reuses existing MCP tools directly |
| Infrastructure | Separate EC2 ($18/mo idle) | Runs on existing Vercel (free tier) |
| Ops complexity | Two systems to maintain | One stack |

OpenClaw is great for Central Oceans (single company, custom Python scripts, dedicated server). For a multi-tenant SaaS product, Vercel + Supabase is the right fit.

## Architecture

```
Telegram User
    ↓ message (webhook)
Vercel Serverless: /api/telegram/webhook.ts
    ↓
    ├── Resolve: telegram_user_id → BetterAt user (telegram_links table)
    ├── Load conversation history (telegram_conversations table)
    ├── Build Claude request with tools from existing MCP definitions
    ├── Call Anthropic Messages API (Haiku 4.5)
    ├── Execute tool calls against Supabase (scoped to user)
    ├── Save conversation turn
    └── POST response back to Telegram sendMessage API
```

## What users could do via Telegram

**Learners:**
- "I just did 30 minutes of yoga" → logs exercise via NutritionExtractionService patterns
- "Mark my morning run as done" → calls update_step_status MCP tool
- "How's my week going?" → calls get_student_timeline MCP tool
- "I want to practice piano tomorrow at 9am" → calls create_step MCP tool
- Send photo of meal → nutrition extraction

**Coaches:**
- "How did Sarah do this week?" → scoped query via coaching relationship
- "Send me the cohort summary" → calls get_cohort_progress_summary
- "Schedule a check-in with Marcus" → creates coaching interaction

**Org admins:**
- "Weekly engagement report" → aggregated analytics

## Phase 1: Foundation (2-3 days)

### 1. Database migration — account linking + conversation state

New file: `supabase/migrations/YYYYMMDDHHMMSS_telegram_integration.sql`

```sql
CREATE TABLE telegram_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. Create Telegram bot via @BotFather
- Get bot token, store as Vercel env var `TELEGRAM_BOT_TOKEN`
- Set webhook: `https://app.betterat.com/api/telegram/webhook`

### 3. Webhook endpoint — `api/telegram/webhook.ts`
- Validate incoming Telegram update
- Look up `telegram_links` → resolve BetterAt user_id
- If not linked → start linking flow (deep link to app settings page)
- Create service-role Supabase client scoped to the resolved user
- Load last N conversation turns from `telegram_conversations`
- Call Anthropic Messages API with tool definitions extracted from MCP tools
- Execute tool calls, send response via Telegram `sendMessage`
- Persist conversation turn

### 4. Account linking flow
- User messages bot for first time → bot responds with link: `https://app.betterat.com/settings/telegram?code=XXXXXX`
- User opens link (already logged into BetterAt) → creates `telegram_links` row
- Bot detects link on next message → "You're connected! Ask me anything about your progress."

### 5. Tool definitions — reuse existing MCP tools
Extract tool schemas from `services/mcp/tools/` (they use Zod → convert to JSON Schema):
- `get_student_timeline` — "How is my week going?"
- `get_step_detail` — "Tell me about my yoga step"
- `create_step` — "Add piano practice for tomorrow"
- `update_step_status` — "Mark my run as done"
- `list_cohort_members` — coach queries
- `get_cohort_progress_summary` — org admin queries

## Phase 2: Enhanced Experience (1-2 weeks)
- Typing indicators (`sendChatAction` while Claude processes)
- Rich responses (Telegram Markdown, inline keyboard buttons for "Mark as done")
- Media: meal photos → nutrition extraction, voice notes → transcription
- Scheduled digests via Vercel cron → morning/evening Telegram summaries

## Phase 3: Scale (future)
- Rate limiting per user to control API costs
- Subscription gating (free = X msgs/day, Pro = unlimited)
- WhatsApp/Signal adapters (same webhook pattern, different API)
- Group chats for org teams

## Cost Estimate

| Scale | Anthropic | Vercel | Supabase | Total/mo |
|-------|-----------|--------|----------|----------|
| 10 users | ~$5 | $0 | $0 (existing) | ~$5 |
| 100 users | ~$50 | $0-20 | $0 (existing) | ~$50-70 |
| 1000 users | ~$500 | $20-50 | $25+ | ~$550-600 |

~$0.001/message with Haiku 4.5.

## Key files to reuse

| Existing file | What to reuse |
|---------------|---------------|
| `services/mcp/tools/step-management.ts` | Tool implementations (create_step, update_step_status) |
| `services/mcp/server.ts` | Tool registry and schema definitions |
| `api/middleware/auth.ts` | Auth pattern + org context resolution |
| `services/ai/NutritionExtractionService.ts` | "I ate a salad" message handling |
| `api/mcp.ts` | Reference for Vercel + AI endpoint pattern |

## Files to create/modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDDHHMMSS_telegram_integration.sql` | CREATE — telegram_links + telegram_conversations tables |
| `api/telegram/webhook.ts` | CREATE — main webhook handler |
| `api/telegram/link.ts` | CREATE — account linking endpoint |
| `app/settings/telegram.tsx` | CREATE — in-app linking page |
| `lib/telegram/tools.ts` | CREATE — extract MCP tool schemas for Claude API |
| `lib/telegram/client.ts` | CREATE — Telegram Bot API helper (sendMessage, sendChatAction) |
| `vercel.json` | MODIFY — add webhook route |

## Verification
1. Create test Telegram bot via @BotFather
2. Deploy webhook to Vercel preview
3. Message bot → get linking prompt → link account via app
4. "How's my week?" → verify tool call to get_student_timeline, response in Telegram
5. "Mark my run as done" → verify step status updated in Supabase
6. Test as coach → verify scoped to coaching relationships only
7. Test unlinked user → verify they can't access other users' data

## Reference: OpenClaw (Central Oceans)

For context on the existing OpenClaw bot that inspired this:
- Setup guide: `~/Developer/OPENCLAW_SETUP.md`
- Server: AWS EC2 `18.207.144.232`, SSH key `~/Downloads/openclaw-key.pem`
- Skills: `~/.openclaw/skills/freight-incidents/` (Python scripts for incident management, analytics, PDFs)
- The BetterAt Telegram agent follows the same UX pattern (conversational AI via messaging) but uses a completely different architecture (Vercel serverless vs EC2 agent framework)
