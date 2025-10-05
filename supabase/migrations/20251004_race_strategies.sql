-- Create race_strategies table for AI-generated race strategies
-- Stores comprehensive strategies with Monte Carlo simulation results

create table if not exists race_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Race identification
  race_name text not null,
  venue_id text,
  venue_name text,
  regatta_id uuid references regattas(id) on delete set null,

  -- Race conditions
  wind_speed numeric,
  wind_direction numeric,
  current_speed numeric,
  current_direction numeric,
  wave_height numeric,

  -- Strategy components (JSONB for flexibility)
  overall_approach text,
  start_strategy jsonb,
  beat_strategy jsonb,
  run_strategy jsonb,
  finish_strategy jsonb,
  mark_roundings jsonb,

  -- Contingency plans
  contingencies jsonb,

  -- AI insights and recommendations
  insights jsonb,
  confidence numeric default 0.5 check (confidence >= 0 and confidence <= 1),

  -- Course data
  course_extraction jsonb,
  course_marks jsonb,

  -- Monte Carlo simulation results
  simulation_results jsonb,

  -- Metadata
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists race_strategies_user_id_idx on race_strategies(user_id);
create index if not exists race_strategies_venue_id_idx on race_strategies(venue_id);
create index if not exists race_strategies_regatta_id_idx on race_strategies(regatta_id);
create index if not exists race_strategies_created_at_idx on race_strategies(created_at desc);

-- RLS policies
alter table race_strategies enable row level security;

-- Users can view their own strategies
create policy "Users can view own race strategies"
  on race_strategies for select
  using (auth.uid() = user_id);

-- Users can create their own strategies
create policy "Users can create own race strategies"
  on race_strategies for insert
  with check (auth.uid() = user_id);

-- Users can update their own strategies
create policy "Users can update own race strategies"
  on race_strategies for update
  using (auth.uid() = user_id);

-- Users can delete their own strategies
create policy "Users can delete own race strategies"
  on race_strategies for delete
  using (auth.uid() = user_id);

-- Add updated_at trigger
create trigger race_strategies_updated_at
  before update on race_strategies
  for each row
  execute function update_updated_at_column();
