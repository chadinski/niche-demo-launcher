-- Public-beta SaaS foundation. Apply after the original supabase/schema.sql.
-- Additive tables preserve all existing prospect, website, message, settings, and lead data.

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  agency_name text not null default '',
  main_website text not null default '',
  primary_market text not null default '',
  primary_goal text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_completed boolean not null default false,
  lead_added boolean not null default false,
  facts_verified boolean not null default false,
  first_demo_generated boolean not null default false,
  first_demo_reviewed boolean not null default false,
  first_outreach_prepared boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null default 'trial' check (plan_code in ('trial', 'starter', 'pro', 'admin')),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_limits (
  plan_code text not null check (plan_code in ('trial', 'starter', 'pro', 'admin')),
  operation text not null check (operation in ('screenshot_extraction','lead_search','fast_generation','premium_generation','regeneration','outreach_generation','deployment')),
  monthly_limit integer not null check (monthly_limit >= 0),
  primary key (plan_code, operation)
);

insert into public.plan_limits (plan_code, operation, monthly_limit) values
  ('trial','screenshot_extraction',5),('trial','lead_search',5),('trial','fast_generation',3),('trial','premium_generation',1),('trial','regeneration',3),('trial','outreach_generation',10),('trial','deployment',0),
  ('starter','screenshot_extraction',30),('starter','lead_search',30),('starter','fast_generation',20),('starter','premium_generation',5),('starter','regeneration',25),('starter','outreach_generation',100),('starter','deployment',5),
  ('pro','screenshot_extraction',100),('pro','lead_search',150),('pro','fast_generation',100),('pro','premium_generation',30),('pro','regeneration',150),('pro','outreach_generation',500),('pro','deployment',50),
  ('admin','screenshot_extraction',100000),('admin','lead_search',100000),('admin','fast_generation',100000),('admin','premium_generation',100000),('admin','regeneration',100000),('admin','outreach_generation',100000),('admin','deployment',100000)
on conflict (plan_code, operation) do update set monthly_limit = excluded.monthly_limit;

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('screenshot_extraction','lead_search','fast_generation','premium_generation','regeneration','outreach_generation','deployment')),
  units integer not null default 1 check (units > 0),
  status text not null default 'reserved' check (status in ('reserved','succeeded','failed','refunded')),
  idempotency_key text not null,
  request_id text not null default '',
  provider text not null default '',
  model text not null default '',
  estimated_cost_usd numeric(12,6) not null default 0,
  error_code text not null default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, operation, idempotency_key)
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id text not null,
  prospect_id uuid references public.prospects(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  stage text not null default 'queued',
  progress integer not null default 0 check (progress between 0 and 100),
  request_id text not null default '',
  error_code text not null default '',
  error_message text not null default '',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, generation_id)
);

create index if not exists usage_events_user_period_idx on public.usage_events(user_id, operation, created_at desc);
create index if not exists generation_jobs_user_created_idx on public.generation_jobs(user_id, created_at desc);

create trigger user_profiles_set_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger onboarding_progress_set_updated_at before update on public.onboarding_progress for each row execute function public.set_updated_at();
create trigger user_entitlements_set_updated_at before update on public.user_entitlements for each row execute function public.set_updated_at();
create trigger generation_jobs_set_updated_at before update on public.generation_jobs for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.plan_limits enable row level security;
alter table public.usage_events enable row level security;
alter table public.generation_jobs enable row level security;

create policy "Users read their own profile" on public.user_profiles for select using ((select auth.uid()) = user_id);
create policy "Users create their own member profile" on public.user_profiles for insert with check ((select auth.uid()) = user_id and role = 'member');
create policy "Users update their own profile" on public.user_profiles for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage their own onboarding" on public.onboarding_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read their own entitlement" on public.user_entitlements for select using ((select auth.uid()) = user_id);
create policy "Authenticated users read plan limits" on public.plan_limits for select to authenticated using (true);
create policy "Users read their own usage" on public.usage_events for select using ((select auth.uid()) = user_id);
create policy "Users manage their own generation jobs" on public.generation_jobs for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.prevent_profile_role_escalation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and coalesce(auth.jwt() ->> 'role','') <> 'service_role' then
    raise exception 'profile role cannot be changed by the account user';
  end if;
  return new;
end;
$$;
create trigger user_profiles_prevent_role_escalation before update of role on public.user_profiles for each row execute function public.prevent_profile_role_escalation();

create or replace function public.consume_usage(p_operation text, p_idempotency_key text, p_request_id text default '')
returns table(allowed boolean, event_id uuid, used integer, limit_value integer, reason text)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_limit integer;
  v_used integer;
  v_event uuid;
  v_existing_status text;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 160 then raise exception 'invalid idempotency key'; end if;

  insert into public.user_entitlements(user_id) values (v_user) on conflict (user_id) do nothing;
  select plan_code into v_plan from public.user_entitlements where user_id = v_user and status = 'active' for update;
  if v_plan is null then return query select false, null::uuid, 0, 0, 'entitlement_inactive'; return; end if;
  select monthly_limit into v_limit from public.plan_limits where plan_code = v_plan and operation = p_operation;
  if v_limit is null then return query select false, null::uuid, 0, 0, 'operation_not_entitled'; return; end if;

  update public.usage_events set status='failed',error_code='STALE_RESERVATION',completed_at=now()
    where user_id=v_user and status='reserved' and created_at < now() - interval '30 minutes';
  select id,status into v_event,v_existing_status from public.usage_events where user_id = v_user and operation = p_operation and idempotency_key = p_idempotency_key;
  select coalesce(sum(units),0)::integer into v_used from public.usage_events
    where user_id = v_user and operation = p_operation and status in ('reserved','succeeded')
      and created_at >= date_trunc('month', now());
  if v_event is not null and v_existing_status in ('reserved','succeeded') then return query select true, v_event, v_used, v_limit, 'idempotent_replay'; return; end if;
  if v_used >= v_limit then return query select false, null::uuid, v_used, v_limit, 'quota_exceeded'; return; end if;

  if v_event is not null then
    update public.usage_events set status='reserved',request_id=left(coalesce(p_request_id,''),120),provider='',model='',estimated_cost_usd=0,error_code='',completed_at=null,created_at=now() where id=v_event;
    return query select true,v_event,v_used+1,v_limit,'reserved_retry'; return;
  end if;

  insert into public.usage_events(user_id,operation,idempotency_key,request_id)
    values(v_user,p_operation,p_idempotency_key,left(coalesce(p_request_id,''),120)) returning id into v_event;
  return query select true, v_event, v_used + 1, v_limit, 'reserved';
end;
$$;

grant execute on function public.consume_usage(text,text,text) to authenticated;

-- Child records must reference a prospect owned by the same authenticated tenant.
drop policy if exists "Users manage their own generated websites" on public.generated_websites;
create policy "Users manage their own generated websites" on public.generated_websites for all
using ((select auth.uid()) = user_id and exists(select 1 from public.prospects p where p.id=prospect_id and p.user_id=(select auth.uid())))
with check ((select auth.uid()) = user_id and exists(select 1 from public.prospects p where p.id=prospect_id and p.user_id=(select auth.uid())));
drop policy if exists "Users manage their own outreach messages" on public.outreach_messages;
create policy "Users manage their own outreach messages" on public.outreach_messages for all
using ((select auth.uid()) = user_id and exists(select 1 from public.prospects p where p.id=prospect_id and p.user_id=(select auth.uid())))
with check ((select auth.uid()) = user_id and exists(select 1 from public.prospects p where p.id=prospect_id and p.user_id=(select auth.uid())));
drop policy if exists "Users manage their own activity logs" on public.activity_logs;
create policy "Users manage their own activity logs" on public.activity_logs for all
using ((select auth.uid()) = user_id and (prospect_id is null or exists(select 1 from public.prospects p where p.id=prospect_id and p.user_id=(select auth.uid()))))
with check ((select auth.uid()) = user_id and (prospect_id is null or exists(select 1 from public.prospects p where p.id=prospect_id and p.user_id=(select auth.uid()))));
drop policy if exists "Users manage their own lead candidates" on public.lead_candidates;
create policy "Users manage their own lead candidates" on public.lead_candidates for all
using ((select auth.uid()) = user_id and (search_run_id is null or exists(select 1 from public.lead_search_runs r where r.id=search_run_id and r.user_id=(select auth.uid()))))
with check ((select auth.uid()) = user_id and (search_run_id is null or exists(select 1 from public.lead_search_runs r where r.id=search_run_id and r.user_id=(select auth.uid()))));

insert into public.user_profiles(user_id) select id from auth.users on conflict (user_id) do nothing;
insert into public.onboarding_progress(user_id) select id from auth.users on conflict (user_id) do nothing;
insert into public.user_entitlements(user_id) select id from auth.users on conflict (user_id) do nothing;
