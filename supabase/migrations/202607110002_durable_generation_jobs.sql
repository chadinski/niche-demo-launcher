-- Durable Premium generation queue additions.
-- Apply after 202607110001_public_beta_foundation.sql.
alter table public.generation_jobs
  add column if not exists payload jsonb,
  add column if not exists result jsonb,
  add column if not exists cancel_requested boolean not null default false,
  add column if not exists attempts integer not null default 0 check (attempts >= 0),
  add column if not exists worker_id text not null default '',
  add column if not exists lease_expires_at timestamptz,
  add column if not exists next_attempt_at timestamptz not null default now();

create index if not exists generation_jobs_queue_idx
  on public.generation_jobs(status, next_attempt_at, created_at)
  where status in ('queued', 'running');

-- The worker claims one job atomically. It must use the service role and never
-- be exposed to customer browsers.
create or replace function public.claim_generation_job(p_worker_id text, p_lease_seconds integer default 300)
returns setof public.generation_jobs
language plpgsql security definer set search_path = public
as $$
declare
  claimed public.generation_jobs;
begin
  if coalesce(auth.jwt() ->> 'role','') <> 'service_role' then
    raise exception 'service role required';
  end if;

  update public.generation_jobs
  set status = 'queued', stage = 'queued', worker_id = '', lease_expires_at = null,
      next_attempt_at = now()
  where status = 'running'
    and lease_expires_at is not null
    and lease_expires_at < now()
    and cancel_requested = false;

  select * into claimed
  from public.generation_jobs
  where status = 'queued'
    and cancel_requested = false
    and next_attempt_at <= now()
  order by created_at
  for update skip locked
  limit 1;

  if claimed.id is null then return; end if;

  update public.generation_jobs
  set status = 'running', stage = 'claimed', worker_id = left(p_worker_id, 120),
      attempts = attempts + 1, started_at = coalesce(started_at, now()),
      lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 900)))
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

revoke all on function public.claim_generation_job(text, integer) from public, anon, authenticated;
grant execute on function public.claim_generation_job(text, integer) to service_role;

-- Worker-only variant of quota reservation. The worker is authenticated by the
-- server secret before it can call this function; browsers cannot execute it.
create or replace function public.consume_usage_for_user(
  p_user_id uuid,
  p_operation text,
  p_idempotency_key text,
  p_request_id text default ''
)
returns table(allowed boolean, event_id uuid, used integer, limit_value integer, reason text)
language plpgsql security definer set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_used integer;
  v_event uuid;
  v_existing_status text;
begin
  if coalesce(auth.jwt() ->> 'role','') <> 'service_role' then raise exception 'service role required'; end if;
  if p_user_id is null then raise exception 'user required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 160 then raise exception 'invalid idempotency key'; end if;
  insert into public.user_entitlements(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select plan_code into v_plan from public.user_entitlements where user_id = p_user_id and status = 'active' for update;
  if v_plan is null then return query select false, null::uuid, 0, 0, 'entitlement_inactive'; return; end if;
  select monthly_limit into v_limit from public.plan_limits where plan_code = v_plan and operation = p_operation;
  if v_limit is null then return query select false, null::uuid, 0, 0, 'operation_not_entitled'; return; end if;
  update public.usage_events set status='failed',error_code='STALE_RESERVATION',completed_at=now()
    where user_id=p_user_id and status='reserved' and created_at < now() - interval '30 minutes';
  select id,status into v_event,v_existing_status from public.usage_events where user_id=p_user_id and operation=p_operation and idempotency_key=p_idempotency_key;
  select coalesce(sum(units),0)::integer into v_used from public.usage_events where user_id=p_user_id and operation=p_operation and status in ('reserved','succeeded') and created_at >= date_trunc('month', now());
  if v_event is not null and v_existing_status in ('reserved','succeeded') then return query select true,v_event,v_used,v_limit,'idempotent_replay'; return; end if;
  if v_used >= v_limit then return query select false, null::uuid, v_used, v_limit, 'quota_exceeded'; return; end if;
  if v_event is not null then
    update public.usage_events set status='reserved',request_id=left(coalesce(p_request_id,''),120),provider='',model='',estimated_cost_usd=0,error_code='',completed_at=null,created_at=now() where id=v_event;
    return query select true,v_event,v_used+1,v_limit,'reserved_retry'; return;
  end if;
  insert into public.usage_events(user_id,operation,idempotency_key,request_id) values(p_user_id,p_operation,p_idempotency_key,left(coalesce(p_request_id,''),120)) returning id into v_event;
  return query select true,v_event,v_used+1,v_limit,'reserved';
end;
$$;

revoke all on function public.consume_usage_for_user(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.consume_usage_for_user(uuid, text, text, text) to service_role;
