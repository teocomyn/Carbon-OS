-- Deletion and upload share one lock/transaction, so a stale device cannot undo deletion.
create table public.user_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  deleted_at timestamptz not null
);
alter table public.user_sync_state enable row level security;
revoke all on public.user_sync_state from public, anon, authenticated;
grant select on public.user_sync_state to authenticated;
create policy "Users read their sync generation" on public.user_sync_state
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.delete_carbon_data() returns void
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  insert into public.user_sync_state (user_id, deleted_at) values (v_user, clock_timestamp())
    on conflict (user_id) do update set deleted_at = excluded.deleted_at;
  delete from public.assessments where user_id = v_user;
  delete from public.user_preferences where user_id = v_user;
end; $$;
revoke all on function public.delete_carbon_data() from public, anon;
grant execute on function public.delete_carbon_data() to authenticated;

create or replace function public.commit_carbon_sync(
  p_assessments jsonb, p_goal_kg integer, p_action_plan jsonb, p_expected_deleted_at timestamptz
) returns void language plpgsql security invoker set search_path = '' as $$
declare v_user uuid := auth.uid(); v_deleted_at timestamptz;
begin
  if v_user is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_assessments is null or jsonb_typeof(p_assessments) <> 'array' or jsonb_array_length(p_assessments) > 50
    then raise exception 'invalid assessments'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  select deleted_at into v_deleted_at from public.user_sync_state where user_id = v_user;
  if v_deleted_at is distinct from p_expected_deleted_at then
    raise exception 'stale sync generation' using errcode = '40001';
  end if;
  if exists (select 1 from jsonb_populate_recordset(null::public.assessments, p_assessments) r
    where r.user_id is distinct from v_user or (v_deleted_at is not null and r.created_at <= v_deleted_at))
    or (v_deleted_at is not null and exists (select 1 from jsonb_array_elements(p_action_plan) item
      where (item->>'updatedAt')::timestamptz <= v_deleted_at)) then
    raise exception 'stale sync payload' using errcode = '40001';
  end if;
  insert into public.assessments
    select * from jsonb_populate_recordset(null::public.assessments, p_assessments)
    on conflict (id) do update set
      answers = excluded.answers, result = excluded.result,
      total_kg = excluded.total_kg, low_kg = excluded.low_kg, high_kg = excluded.high_kg,
      confidence_score = excluded.confidence_score, factor_version = excluded.factor_version,
      goal_kg = excluded.goal_kg, synced_at = excluded.synced_at;
  perform public.merge_carbon_preferences(p_goal_kg, p_action_plan);
end; $$;
revoke all on function public.commit_carbon_sync(jsonb,integer,jsonb,timestamptz) from public, anon;
grant execute on function public.commit_carbon_sync(jsonb,integer,jsonb,timestamptz) to authenticated;
