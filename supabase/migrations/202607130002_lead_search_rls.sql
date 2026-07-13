-- Restore the tenant policies required by the authenticated Lead Finder workflow.
-- The original schema defined these policies, but the public-beta migration only
-- recreated the child-candidate policy. Existing projects created from migrations
-- therefore rejected authenticated lead search runs and blacklist writes.

alter table public.lead_search_runs enable row level security;
alter table public.lead_candidates enable row level security;
alter table public.lead_blacklist enable row level security;

drop policy if exists "Users manage their own lead search runs" on public.lead_search_runs;
create policy "Users manage their own lead search runs"
on public.lead_search_runs for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own lead candidates" on public.lead_candidates;
create policy "Users manage their own lead candidates"
on public.lead_candidates for all
using (
  (select auth.uid()) = user_id
  and (
    search_run_id is null
    or exists (
      select 1
      from public.lead_search_runs run
      where run.id = search_run_id
        and run.user_id = (select auth.uid())
    )
  )
)
with check (
  (select auth.uid()) = user_id
  and (
    search_run_id is null
    or exists (
      select 1
      from public.lead_search_runs run
      where run.id = search_run_id
        and run.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Users manage their own lead blacklist" on public.lead_blacklist;
create policy "Users manage their own lead blacklist"
on public.lead_blacklist for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
