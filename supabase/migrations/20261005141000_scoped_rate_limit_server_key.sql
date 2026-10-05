create table if not exists public.rate_limit_server_keys (key_hash text primary key);
alter table public.rate_limit_server_keys enable row level security;
revoke all on public.rate_limit_server_keys from public, anon, authenticated;
create or replace function public.consume_server_request_limit(
 p_server_key text, p_scope text, p_identifier_hash text, p_limit integer, p_window_ms integer
) returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if p_server_key is null or length(p_server_key) <> 64 or not exists (
   select 1 from public.rate_limit_server_keys
   where key_hash = encode(extensions.digest(p_server_key, 'sha256'), 'hex')
 ) then raise exception 'invalid server key' using errcode = '42501'; end if;
 return public.consume_request_limit(p_scope, p_identifier_hash, p_limit, p_window_ms);
end; $$;
revoke all on function public.consume_server_request_limit(text,text,text,integer,integer) from public;
grant execute on function public.consume_server_request_limit(text,text,text,integer,integer) to anon, authenticated;
