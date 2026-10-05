-- Only the server's service role can use these short-lived, pseudonymous counters.
create table if not exists public.request_rate_limits (
  scope text not null,
  identifier_hash text not null,
  request_count integer not null,
  reset_at timestamptz not null,
  primary key (scope, identifier_hash)
);
alter table public.request_rate_limits enable row level security;
revoke all on public.request_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.request_rate_limits to service_role;
create index if not exists request_rate_limits_expiry
  on public.request_rate_limits (reset_at);

create or replace function public.consume_request_limit(
  p_scope text, p_identifier_hash text, p_limit integer, p_window_ms integer
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_limit < 1 or p_limit > 1000 or p_window_ms < 1000
     or p_window_ms > 3600000 or length(p_scope) > 64
     or p_identifier_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid rate limit parameters';
  end if;
  delete from public.request_rate_limits where reset_at <= v_now;
  insert into public.request_rate_limits (scope, identifier_hash, request_count, reset_at)
  values (p_scope, p_identifier_hash, 1, v_now + p_window_ms * interval '1 millisecond')
  on conflict (scope, identifier_hash) do update
    set request_count = case
      when request_rate_limits.reset_at <= v_now then 1
      else least(request_rate_limits.request_count + 1, p_limit + 1) end,
    reset_at = case when request_rate_limits.reset_at <= v_now
      then v_now + p_window_ms * interval '1 millisecond'
      else request_rate_limits.reset_at end
  returning request_count into v_count;
  return v_count > p_limit;
end;
$$;
revoke all on function public.consume_request_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_request_limit(text, text, integer, integer)
  to service_role;
