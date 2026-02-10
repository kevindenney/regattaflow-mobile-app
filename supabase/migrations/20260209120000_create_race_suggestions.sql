-- Race Suggestions: followers can suggest tips/strategy on someone's race
-- Suggestions appear as tiles on the race card and can be accepted or dismissed

create table public.race_suggestions (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.regattas(id) on delete cascade,
  race_owner_id uuid not null references auth.users(id),
  suggester_id uuid not null references auth.users(id),
  category text not null check (category in (
    'strategy', 'rig_tuning', 'weather', 'crew', 'tactics', 'equipment'
  )),
  message text not null check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  target_phase text not null check (target_phase in ('days_before', 'on_water', 'after_race')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_race_suggestions_race_id on public.race_suggestions(race_id);
create index idx_race_suggestions_race_owner on public.race_suggestions(race_owner_id);
create index idx_race_suggestions_suggester on public.race_suggestions(suggester_id);
create index idx_race_suggestions_status on public.race_suggestions(status);

-- Enable RLS
alter table public.race_suggestions enable row level security;

-- SELECT: Race owner sees all suggestions on their races; suggester sees their own
create policy "Race owner can view suggestions"
  on public.race_suggestions for select
  using (auth.uid() = race_owner_id);

create policy "Suggester can view own suggestions"
  on public.race_suggestions for select
  using (auth.uid() = suggester_id);

-- INSERT: Authenticated users can insert (follow check enforced in service layer)
create policy "Authenticated users can insert suggestions"
  on public.race_suggestions for insert
  with check (auth.uid() = suggester_id);

-- UPDATE: Only race owner can update status (accept/dismiss)
create policy "Race owner can update suggestion status"
  on public.race_suggestions for update
  using (auth.uid() = race_owner_id);

-- DELETE: Only suggester can delete their own pending suggestions
create policy "Suggester can delete own pending suggestions"
  on public.race_suggestions for delete
  using (auth.uid() = suggester_id and status = 'pending');

-- Updated_at trigger
create or replace function public.handle_race_suggestion_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_race_suggestion_updated_at
  before update on public.race_suggestions
  for each row
  execute function public.handle_race_suggestion_updated_at();
