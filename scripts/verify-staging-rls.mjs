import { createClient } from "@supabase/supabase-js";

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const url = required("STAGING_SUPABASE_URL");
const anonKey = required("STAGING_SUPABASE_ANON_KEY");
const serviceRoleKey = required("STAGING_SUPABASE_SERVICE_ROLE_KEY");
const password = process.env.STAGING_RLS_TEST_PASSWORD || `Rls-${crypto.randomUUID()}-Aa1!`;
const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
const emailA = `rls-a-${suffix}@example.invalid`;
const emailB = `rls-b-${suffix}@example.invalid`;

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const signIn = async (email) => {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw error || new Error(`Unable to sign in ${email}`);
  return { client, user: data.user };
};

let userA;
let userB;
let prospectId;

try {
  const createdA = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
  if (createdA.error || !createdA.data.user) throw createdA.error || new Error("Unable to create test user A");
  userA = createdA.data.user;

  const createdB = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
  if (createdB.error || !createdB.data.user) throw createdB.error || new Error("Unable to create test user B");
  userB = createdB.data.user;

  const a = await signIn(emailA);
  const b = await signIn(emailB);

  const inserted = await a.client
    .from("prospects")
    .insert({ user_id: a.user.id, business_name: `Staging RLS ${suffix}`, category: "Test", location: "Test" })
    .select("id")
    .single();
  if (inserted.error || !inserted.data) throw inserted.error || new Error("User A could not create a prospect");
  prospectId = inserted.data.id;

  const hidden = await b.client.from("prospects").select("id").eq("id", prospectId).maybeSingle();
  if (hidden.error) throw hidden.error;
  if (hidden.data !== null) throw new Error("RLS failure: User B can read User A's prospect");

  const childAttempt = await b.client.from("generated_websites").insert({
    user_id: b.user.id,
    prospect_id: prospectId,
    style_name: "RLS test",
    html: "<!doctype html><title>RLS test</title>",
  });
  if (!childAttempt.error) throw new Error("RLS failure: User B inserted a child row for User A's prospect");

  console.log(JSON.stringify({
    ok: true,
    checks: {
      userBCannotReadUserAProspect: true,
      userBCannotInsertChildForUserAProspect: true,
    },
    errorFromBlockedChildInsert: childAttempt.error.message,
  }, null, 2));
} finally {
  if (prospectId) await admin.from("prospects").delete().eq("id", prospectId);
  if (userA) await admin.auth.admin.deleteUser(userA.id);
  if (userB) await admin.auth.admin.deleteUser(userB.id);
}
