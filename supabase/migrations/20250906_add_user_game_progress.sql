-- Create user_game_progress table to persist per-game progress for each user
create table if not exists public.user_game_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  history jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint user_game_progress_pkey primary key (user_id, game_id)
);

-- Helpful index for querying a user's games
create index if not exists idx_user_game_progress_user on public.user_game_progress(user_id);

-- Row Level Security
alter table public.user_game_progress enable row level security;

-- Policies: users can manage their own rows, read their own rows
create policy if not exists "Allow user read own progress"
  on public.user_game_progress
  for select
  using (auth.uid() = user_id);

create policy if not exists "Allow user upsert own progress"
  on public.user_game_progress
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Allow user update own progress"
  on public.user_game_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);