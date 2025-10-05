-- Create monte_carlo_simulations table for race outcome simulations
-- Stores detailed simulation results for strategy analysis

create table if not exists monte_carlo_simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  race_strategy_id uuid not null references race_strategies(id) on delete cascade,

  -- Simulation results (comprehensive JSONB structure)
  results jsonb not null,

  -- Metadata
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists monte_carlo_simulations_user_id_idx on monte_carlo_simulations(user_id);
create index if not exists monte_carlo_simulations_race_strategy_id_idx on monte_carlo_simulations(race_strategy_id);
create index if not exists monte_carlo_simulations_created_at_idx on monte_carlo_simulations(created_at desc);

-- RLS policies
alter table monte_carlo_simulations enable row level security;

-- Users can view their own simulations
create policy "Users can view own monte carlo simulations"
  on monte_carlo_simulations for select
  using (auth.uid() = user_id);

-- Users can create their own simulations
create policy "Users can create own monte carlo simulations"
  on monte_carlo_simulations for insert
  with check (auth.uid() = user_id);

-- Users can delete their own simulations
create policy "Users can delete own monte carlo simulations"
  on monte_carlo_simulations for delete
  using (auth.uid() = user_id);

-- Comments for documentation
comment on table monte_carlo_simulations is 'Stores Monte Carlo race simulation results with position distributions, success factors, and alternative strategies';
comment on column monte_carlo_simulations.results is 'JSONB containing: totalIterations, positionDistribution, expectedFinish, podiumProbability, winProbability, successFactors, alternativeStrategies, confidenceInterval, iterations';
