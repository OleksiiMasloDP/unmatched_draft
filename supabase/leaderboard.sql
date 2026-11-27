-- Таблиця лідерів. Виконати один раз: Supabase -> SQL Editor -> New query -> Run.

create table if not exists public.leaderboard (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  nick       text        not null check (char_length(nick) between 1 and 40),
  avatar     text        not null default 'sinbad',
  title      text        not null default 'newcomer',
  level      integer     not null default 1,
  ach        integer     not null default 0,
  stats      jsonb       not null default '{}'::jsonb,
  heroes     jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_level_idx on public.leaderboard (level desc);

alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard_read_all" on public.leaderboard;
drop policy if exists "leaderboard_insert_own" on public.leaderboard;
drop policy if exists "leaderboard_update_own" on public.leaderboard;
drop policy if exists "leaderboard_delete_own" on public.leaderboard;

create policy "leaderboard_read_all" on public.leaderboard
  for select using (true);
create policy "leaderboard_insert_own" on public.leaderboard
  for insert with check (auth.uid() = user_id);
create policy "leaderboard_update_own" on public.leaderboard
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "leaderboard_delete_own" on public.leaderboard
  for delete using (auth.uid() = user_id);

alter table public.leaderboard add column if not exists card jsonb;
