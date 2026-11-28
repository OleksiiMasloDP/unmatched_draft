create table if not exists public.matchup_votes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  a          text        not null,
  b          text        not null,
  score      smallint    not null check (score between -3 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, a, b),
  check (a < b)
);

alter table public.matchup_votes enable row level security;

drop policy if exists "matchup_votes_select_own" on public.matchup_votes;
drop policy if exists "matchup_votes_insert_own" on public.matchup_votes;
drop policy if exists "matchup_votes_update_own" on public.matchup_votes;

create policy "matchup_votes_select_own" on public.matchup_votes
  for select using (auth.uid() = user_id);
create policy "matchup_votes_insert_own" on public.matchup_votes
  for insert with check (auth.uid() = user_id);
create policy "matchup_votes_update_own" on public.matchup_votes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.matchup_vote_stats as
select
  a,
  b,
  count(*)::int as votes,
  round(avg(score)::numeric, 2) as avg_score,
  round(50 + avg(score) * 25.0 / 3)::int as winrate_a
from public.matchup_votes
group by a, b;

grant select on public.matchup_vote_stats to anon, authenticated;
