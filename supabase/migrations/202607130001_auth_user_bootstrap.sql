-- Ensure every new Supabase Auth account receives an explicit trial entitlement
-- and first-run records. Apply after 202607110002_durable_generation_jobs.sql.

create or replace function public.bootstrap_seraphim_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.onboarding_progress(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_entitlements(user_id, plan_code, status)
  values (new.id, 'trial', 'active')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.bootstrap_seraphim_user() from public, anon, authenticated;

drop trigger if exists seraphim_auth_user_bootstrap on auth.users;
create trigger seraphim_auth_user_bootstrap
after insert on auth.users
for each row execute function public.bootstrap_seraphim_user();

-- Preserve existing accounts and deliberately place any unassigned account on Trial.
insert into public.user_profiles(user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.onboarding_progress(user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.user_entitlements(user_id, plan_code, status)
select id, 'trial', 'active' from auth.users
on conflict (user_id) do nothing;
