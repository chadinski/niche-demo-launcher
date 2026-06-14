create extension if not exists "pgcrypto";

create type public.outreach_status as enum (
  'not_sent',
  'sent',
  'replied',
  'follow_up',
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
  pasted_raw_info text not null default '',
  extracted_summary text not null default '',
  package_price text not null default '',
  generated_website_html text not null default '',
  demo_url text not null default '',
  whatsapp_message text not null default '',
  email_subject text not null default '',
  email_message text not null default '',
  dm_message text not null default '',
  outreach_status public.outreach_status not null default 'not_sent',
  notes text not null default '',
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

create index prospects_user_updated_idx on public.prospects(user_id, updated_at desc);
create index prospects_user_status_idx on public.prospects(user_id, outreach_status);
create index prospects_follow_up_idx on public.prospects(user_id, next_follow_up_at)
  where next_follow_up_at is not null;
create index generated_websites_prospect_idx on public.generated_websites(prospect_id, created_at desc);
create index outreach_messages_prospect_idx on public.outreach_messages(prospect_id, created_at desc);
create index activity_logs_prospect_idx on public.activity_logs(prospect_id, created_at desc);

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

alter table public.prospects enable row level security;
alter table public.generated_websites enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_templates enable row level security;
alter table public.app_settings enable row level security;
alter table public.activity_logs enable row level security;

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
