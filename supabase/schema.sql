-- Схема для синхронізації даних між пристроями (Supabase / Postgres).
-- Виконати один раз: Supabase -> SQL Editor -> New query -> вставити -> Run.

create table if not exists public.user_docs (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  doc_key    text        not null check (doc_key in ('draft', 'formats', 'decks', 'rogue', 'rogueHistory')),
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_key)
);

-- Кожен бачить і змінює лише власні рядки (Row Level Security).
-- Якщо таблицю вже створено раніше: розширити список документів.
alter table public.user_docs drop constraint if exists user_docs_doc_key_check;
alter table public.user_docs add constraint user_docs_doc_key_check
  check (doc_key in ('draft', 'formats', 'decks', 'rogue', 'rogueHistory'));

alter table public.user_docs enable row level security;

drop policy if exists "user_docs_select_own" on public.user_docs;
drop policy if exists "user_docs_insert_own" on public.user_docs;
drop policy if exists "user_docs_update_own" on public.user_docs;
drop policy if exists "user_docs_delete_own" on public.user_docs;

create policy "user_docs_select_own" on public.user_docs
  for select using (auth.uid() = user_id);
create policy "user_docs_insert_own" on public.user_docs
  for insert with check (auth.uid() = user_id);
create policy "user_docs_update_own" on public.user_docs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_docs_delete_own" on public.user_docs
  for delete using (auth.uid() = user_id);

-- Час зміни завжди ставить сервер (не годинник пристрою).
create or replace function public.user_docs_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_docs_touch on public.user_docs;
create trigger user_docs_touch
  before insert or update on public.user_docs
  for each row execute function public.user_docs_touch();

-- Realtime: інші пристрої отримують зміни миттєво.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_docs'
  ) then
    alter publication supabase_realtime add table public.user_docs;
  end if;
end $$;
