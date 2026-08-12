create table if not exists public.assessments (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null,
  source text not null check (source in ('questionnaire', 'manual', 'imported')),
  total_kg numeric not null check (total_kg >= 0),
  low_kg numeric not null check (low_kg >= 0),
  high_kg numeric not null check (high_kg >= 0),
  confidence_score integer not null check (confidence_score between 0 and 100),
  factor_version text not null,
  answers jsonb not null,
  result jsonb not null,
  goal_kg integer not null check (goal_kg between 500 and 100000),
  synced_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists assessments_user_created_idx
  on public.assessments (user_id, created_at desc);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal_kg integer not null default 5000 check (goal_kg between 500 and 100000),
  updated_at timestamptz not null default now()
);

alter table public.assessments enable row level security;
alter table public.user_preferences enable row level security;

create policy "Users read their assessments"
  on public.assessments for select
  using ((select auth.uid()) = user_id);

create policy "Users insert their assessments"
  on public.assessments for insert
  with check ((select auth.uid()) = user_id);

create policy "Users update their assessments"
  on public.assessments for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their assessments"
  on public.assessments for delete
  using ((select auth.uid()) = user_id);

create policy "Users read their preferences"
  on public.user_preferences for select
  using ((select auth.uid()) = user_id);

create policy "Users insert their preferences"
  on public.user_preferences for insert
  with check ((select auth.uid()) = user_id);

create policy "Users update their preferences"
  on public.user_preferences for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their preferences"
  on public.user_preferences for delete
  using ((select auth.uid()) = user_id);

revoke all on table public.assessments from anon;
revoke all on table public.user_preferences from anon;
grant select, insert, update, delete on table public.assessments to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
