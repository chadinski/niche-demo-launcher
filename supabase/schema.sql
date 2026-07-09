create extension if not exists "pgcrypto";

create type public.outreach_status as enum (
  'new',
  'profile_extracted',
  'demo_generated',
  'demo_deployed',
  'message_ready',
  'contacted',
  'follow_up_due',
  'replied',
  'won',
  'lost',
  'opt_out'
);

create type public.message_channel as enum (
  'whatsapp',
  'email',
  'dm',
  'follow_up',
  'final_follow_up'
);

create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text not null default '',
  location text not null default '',
  phone text not null default '',
  email text not null default '',
  website_url text not null default '',
  social_url text not null default '',
  source text not null default '',
  pasted_raw_info text not null default '',
  extracted_summary text not null default '',
  package_price text not null default '',
  deal_value text not null default '',
  lead_score integer not null default 0,
  lead_temperature text not null default 'Cold',
  lead_score_explanation text not null default '',
  recommended_sales_angle text not null default '',
  business_intelligence jsonb,
  website_quality_audit jsonb,
  generated_website_html text not null default '',
  demo_url text not null default '',
  whatsapp_message text not null default '',
  email_subject text not null default '',
  email_message text not null default '',
  dm_message text not null default '',
  facebook_message text not null default '',
  follow_up_1_message text not null default '',
  follow_up_2_message text not null default '',
  final_check_in_message text not null default '',
  outreach_status public.outreach_status not null default 'new',
  notes text not null default '',
  follow_up_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz
);

create table public.generated_websites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  style_name text not null default 'Editorial premium',
  html text not null,
  demo_url text not null default '',
  file_name text not null default 'index.html',
  project_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  channel public.message_channel not null,
  tone text not null default 'Friendly',
  subject text not null default '',
  body text not null,
  is_sent boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outreach_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  template_type text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null default 'Niche Technologies',
  sender_name text not null default '',
  sender_email text not null default '',
  whatsapp_number text not null default '',
  website text not null default '',
  default_package_price text not null default '$1,000',
  default_currency text not null default 'USD',
  default_message_tone text not null default 'Friendly',
  default_website_style text not null default 'Editorial premium',
  default_follow_up_cadence text not null default '0,2,5,10',
  deployment_mode text not null default 'manual',
  mailing_address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete cascade,
  action text not null,
  detail text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.lead_search_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_industry_id text not null default '',
  industry text not null default '',
  country text not null default '',
  region text not null default '',
  city text not null default '',
  query text not null default '',
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.lead_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_run_id uuid references public.lead_search_runs(id) on delete set null,
  business_name text not null default '',
  category text not null default '',
  location text not null default '',
  phone text not null default '',
  email text not null default '',
  website_url text not null default '',
  social_url text not null default '',
  source_url text not null default '',
  source_title text not null default '',
  source_summary text not null default '',
  lead_score integer not null default 0,
  score_reasons jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new', 'saved', 'rejected', 'contacted', 'blacklisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_url)
);

create table public.lead_blacklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null default '',
  source_url text not null default '',
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, source_url)
);

create index prospects_user_updated_idx on public.prospects(user_id, updated_at desc);
create index prospects_user_status_idx on public.prospects(user_id, outreach_status);
create index prospects_follow_up_idx on public.prospects(user_id, next_follow_up_at)
  where next_follow_up_at is not null;
create index generated_websites_prospect_idx on public.generated_websites(prospect_id, created_at desc);
create index outreach_messages_prospect_idx on public.outreach_messages(prospect_id, created_at desc);
create index activity_logs_prospect_idx on public.activity_logs(prospect_id, created_at desc);
create index lead_search_runs_user_created_idx on public.lead_search_runs(user_id, created_at desc);
create index lead_candidates_user_status_idx on public.lead_candidates(user_id, status, updated_at desc);
create index lead_candidates_search_run_idx on public.lead_candidates(search_run_id);
create index lead_blacklist_user_source_idx on public.lead_blacklist(user_id, source_url);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger prospects_set_updated_at
before update on public.prospects
for each row execute function public.set_updated_at();

create trigger generated_websites_set_updated_at
before update on public.generated_websites
for each row execute function public.set_updated_at();

create trigger outreach_messages_set_updated_at
before update on public.outreach_messages
for each row execute function public.set_updated_at();

create trigger outreach_templates_set_updated_at
before update on public.outreach_templates
for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create trigger lead_candidates_set_updated_at
before update on public.lead_candidates
for each row execute function public.set_updated_at();

alter table public.prospects enable row level security;
alter table public.generated_websites enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_templates enable row level security;
alter table public.app_settings enable row level security;
alter table public.activity_logs enable row level security;
alter table public.lead_search_runs enable row level security;
alter table public.lead_candidates enable row level security;
alter table public.lead_blacklist enable row level security;

create policy "Users manage their own prospects"
on public.prospects for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own generated websites"
on public.generated_websites for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own outreach messages"
on public.outreach_messages for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own templates"
on public.outreach_templates for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own settings"
on public.app_settings for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own activity logs"
on public.activity_logs for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own lead search runs"
on public.lead_search_runs for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own lead candidates"
on public.lead_candidates for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own lead blacklist"
on public.lead_blacklist for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
