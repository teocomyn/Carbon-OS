alter table public.user_preferences
  add column if not exists action_plan jsonb not null default '[]'::jsonb;

alter table public.user_preferences
  add constraint user_preferences_action_plan_array
  check (jsonb_typeof(action_plan) = 'array');
