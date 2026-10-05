-- Serialize preference merges across devices, under the existing user RLS policies.
create or replace function public.merge_carbon_preferences(
  p_goal_kg integer, p_action_plan jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_existing jsonb;
  v_merged jsonb;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_goal_kg is null or p_goal_kg < 500 or p_goal_kg > 100000
     or p_action_plan is null or jsonb_typeof(p_action_plan) <> 'array'
     or jsonb_array_length(p_action_plan) > 43 then
    raise exception 'invalid preferences';
  end if;
  insert into public.user_preferences (user_id, goal_kg, action_plan)
    values (v_user, p_goal_kg, '[]'::jsonb)
    on conflict (user_id) do nothing;
  select action_plan into v_existing from public.user_preferences
    where user_id = v_user for update;

  with candidates as (
    select value as item from jsonb_array_elements(v_existing || p_action_plan)
  ), latest as (
    select distinct on (item->>'scenarioId') item
    from candidates
    order by item->>'scenarioId', (item->>'updatedAt')::timestamptz desc,
      (item->>'removed') desc nulls last
  ), classified as (
    select item, case when item->>'removed' = 'true' then 'removed'
      when item->>'status' = 'completed' then 'completed' else 'active' end as kind
    from latest
  ), ranked as (
    select item, kind, row_number() over (partition by kind order by
      case when kind = 'active' then (item->>'addedAt')::timestamptz end asc,
      case when kind <> 'active' then (item->>'updatedAt')::timestamptz end desc,
      item->>'scenarioId') as position
    from classified
  )
  select coalesce(jsonb_agg(item order by (item->>'addedAt')::timestamptz), '[]'::jsonb)
    into v_merged from ranked where position <= case when kind = 'active' then 3 else 20 end;

  update public.user_preferences
    set goal_kg = p_goal_kg, action_plan = v_merged, updated_at = clock_timestamp()
    where user_id = v_user;
end;
$$;
revoke all on function public.merge_carbon_preferences(integer,jsonb) from public, anon;
grant execute on function public.merge_carbon_preferences(integer,jsonb) to authenticated;
