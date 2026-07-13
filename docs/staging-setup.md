# Staging Supabase setup

The repository currently has one configured Supabase project: production. Create a separate staging project before inviting beta users or testing destructive account flows.

## One-time action required from the owner

1. In Supabase, create a project named `niche-demo-launcher-staging` in the same organization, using a separate strong database password and a region close to production.
2. In the staging SQL editor, run these files in order:
   - `supabase/schema.sql`
   - `supabase/migrations/202607110001_public_beta_foundation.sql`
   - `supabase/migrations/202607110002_durable_generation_jobs.sql`
3. From the staging project API settings, create a local ignored file at the repository root named `.env.staging.local`:

```dotenv
STAGING_SUPABASE_URL=https://<staging-project-ref>.supabase.co
STAGING_SUPABASE_ANON_KEY=<staging-anon-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
# Optional; a random password is generated when omitted.
STAGING_RLS_TEST_PASSWORD=<temporary-test-password>
```

Do not commit this file or paste the keys into chat. `.env*` is already ignored by Git.

## Run the isolation proof

From the repository root:

```powershell
npm run test:staging:rls
```

The script creates two confirmed disposable users through the staging service key, signs in as each user with the public anon key, verifies that User B cannot read User A's prospect, verifies that User B cannot insert a generated website referencing User A's prospect, and deletes the test data and users in a `finally` cleanup.

## Configure local staging testing

For authenticated app/E2E testing, temporarily point the local app at the staging URL and anon key in a separate ignored env file or shell session. Never put the service-role key in a `NEXT_PUBLIC_*` variable or browser-exposed configuration. Restore `.env.local` to production values after testing.

## What I can complete after the project exists

Once the staging project is created and `.env.staging.local` exists, I can run the script, inspect the result, run the application CI against staging, and document the completed staging migration/RLS evidence. No production data needs to be copied into staging.
