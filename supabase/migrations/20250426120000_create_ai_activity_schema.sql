-- AI activity & content tables

create table if not exists public.ai_activity_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid,
  user_id uuid,
  skill text not null,
  status text not null,
  tokens_in integer,
  tokens_out integer,
  duration_ms integer,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists ai_activity_logs_club_idx on public.ai_activity_logs (club_id, created_at desc);
create index if not exists ai_activity_logs_user_idx on public.ai_activity_logs (user_id, created_at desc);

create table if not exists public.ai_generated_documents (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  created_by uuid not null,
  event_id uuid,
  document_type text not null,
  status text not null default 'draft',
  draft_text text not null,
  metadata jsonb,
  confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_generated_documents_club_idx on public.ai_generated_documents (club_id, created_at desc);

create table if not exists public.ai_notifications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  created_by uuid not null,
  race_id uuid,
  topic text not null,
  audience text,
  channels text[] default array[]::text[],
  message text not null,
  metadata jsonb,
  suggested_send_at timestamptz,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_notifications_club_idx on public.ai_notifications (club_id, created_at desc);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  user_id uuid,
  role text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_club_idx on public.ai_conversations (club_id, created_at);

create table if not exists public.ai_usage_monthly (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  usage_month date not null,
  tokens_in bigint default 0,
  tokens_out bigint default 0,
  request_count bigint default 0,
  cost_estimate numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, usage_month)
);

comment on table public.ai_activity_logs is 'Raw log of Claude Skills activity including payloads and metrics.';
comment on table public.ai_generated_documents is 'Draft documents (NOR/SI/etc) created by Claude for club review.';
comment on table public.ai_notifications is 'AI drafted race-day communications awaiting approval.';
comment on table public.ai_conversations is 'Stored chat transcripts between members/admins and Claude assistant.';
comment on table public.ai_usage_monthly is 'Aggregated monthly AI usage for billing/visibility.';

