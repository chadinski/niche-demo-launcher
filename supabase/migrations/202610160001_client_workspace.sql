begin;
alter table public.prospects
  add column if not exists sales_stage text not null default 'new' check (sales_stage in ('new','qualified','contacted','replied','proposal','won','lost','opt_out')),
  add column if not exists demo_status text not null default 'not_started' check (demo_status in ('not_started','draft','reviewed','shared')),
  add column if not exists revision integer not null default 0;
update public.prospects set
  sales_stage = case when outreach_status::text in ('contacted','replied','won','lost','opt_out') then outreach_status::text when outreach_status::text = 'follow_up_due' then 'contacted' when business_intelligence->>'extractionReviewed' = 'true' then 'qualified' else 'new' end,
  demo_status = case when generated_website_html <> '' then 'draft' else 'not_started' end
where revision = 0;

create or replace function public.workspace_before_save() returns trigger
language plpgsql set search_path = public as $$
begin
  new.revision := old.revision + 1;
  if new.sales_stage = old.sales_stage and new.outreach_status is distinct from old.outreach_status and new.outreach_status::text in ('contacted','replied','won','lost','opt_out','follow_up_due') then
    new.sales_stage := case when new.outreach_status::text = 'follow_up_due' then 'contacted' else new.outreach_status::text end;
  end if;
  if new.generated_website_html is distinct from old.generated_website_html then
    new.demo_status := case when new.generated_website_html = '' then 'not_started' else 'draft' end;
  end if;
  return new;
end $$;
drop trigger if exists workspace_before_save on public.prospects;
create trigger workspace_before_save before update on public.prospects for each row execute function public.workspace_before_save();

create or replace function public.workspace_record_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs(user_id,prospect_id,action,detail) values(new.user_id,new.id,'business_added','Business added to the workspace.');
  else
    if new.sales_stage is distinct from old.sales_stage then
      insert into public.activity_logs(user_id,prospect_id,action,detail) values(new.user_id,new.id,'sales_stage_changed','Sales stage changed from '||old.sales_stage||' to '||new.sales_stage||'.');
    end if;
    if new.generated_website_html is distinct from old.generated_website_html and old.generated_website_html <> '' and not exists(select 1 from public.generated_websites where prospect_id=old.id and html=old.generated_website_html) then
      insert into public.generated_websites(user_id,prospect_id,html,style_name) values(old.user_id,old.id,old.generated_website_html,'Previous version');
    end if;
    if new.demo_status is distinct from old.demo_status and new.demo_status in ('reviewed','shared') then
      insert into public.activity_logs(user_id,prospect_id,action,detail) values(new.user_id,new.id,'demo_'||new.demo_status,'Demo marked '||new.demo_status||'.');
    end if;
    if new.business_intelligence->>'extractionReviewed' = 'true' and coalesce(old.business_intelligence->>'extractionReviewed','false') <> 'true' then
      insert into public.activity_logs(user_id,prospect_id,action,detail) values(new.user_id,new.id,'facts_verified','Business details reviewed and approved.');
    end if;
  end if;
  if new.generated_website_html <> '' then
    if tg_op = 'INSERT' then
      insert into public.generated_websites(user_id,prospect_id,html,style_name) values(new.user_id,new.id,new.generated_website_html,'First version');
    elsif new.generated_website_html is distinct from old.generated_website_html then
      insert into public.generated_websites(user_id,prospect_id,html,style_name) values(new.user_id,new.id,new.generated_website_html,coalesce(new.business_intelligence->>'generationDepth','Website version'));
      insert into public.activity_logs(user_id,prospect_id,action,detail) values(new.user_id,new.id,'demo_saved','A new website version was saved.');
    end if;
  end if;
  return new;
end $$;
revoke all on function public.workspace_record_activity() from public, anon, authenticated;
drop trigger if exists workspace_record_activity on public.prospects;
create trigger workspace_record_activity after insert or update on public.prospects for each row execute function public.workspace_record_activity();

create table if not exists public.demo_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  business_name text not null,
  introduction text not null default '' check (length(introduction)<=2000),
  html text not null check (length(html)<=2500000),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '30 days'),
  revoked_at timestamptz
);
create index if not exists demo_shares_owner_idx on public.demo_shares(user_id,prospect_id,created_at desc);
alter table public.demo_shares enable row level security;
create policy "Owners read demo shares" on public.demo_shares for select to authenticated using ((select auth.uid())=user_id);
-- Creation/revocation is server-controlled after ownership and review checks.
create table if not exists public.demo_feedback (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.demo_shares(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  email text not null default '' check (length(email)<=320),
  message text not null check (length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists demo_feedback_owner_idx on public.demo_feedback(user_id,prospect_id,created_at desc);
alter table public.demo_feedback enable row level security;
create policy "Owners read demo feedback" on public.demo_feedback for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.demo_shares, public.demo_feedback from anon;
revoke insert,update,delete on public.demo_shares,public.demo_feedback from authenticated;
grant select on public.demo_shares,public.demo_feedback to authenticated;
grant all on public.demo_shares,public.demo_feedback to service_role;
commit;
