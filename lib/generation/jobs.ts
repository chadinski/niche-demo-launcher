import type { ServerUserAccess } from "@/lib/auth/server-guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

function clientForUser(user: ServerUserAccess) {
  if (user.mode === "worker") return createAdminClient();
  return createClient();
}

export async function startGenerationJob(user: ServerUserAccess, generationId: string, requestId: string) {
  if (user.mode === "local-demo") return;
  const supabase = await clientForUser(user);
  if (!supabase) return;
  await supabase.from("generation_jobs").upsert(
    {
      user_id: user.userId,
      generation_id: generationId,
      status: "running",
      stage: "starting",
      progress: 2,
      request_id: requestId,
      started_at: new Date().toISOString(),
      completed_at: null,
      error_code: "",
      error_message: "",
      cancel_requested: false,
      lease_expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    },
    { onConflict: "user_id,generation_id" },
  );
}

export async function finishGenerationJob(
  user: ServerUserAccess,
  generationId: string,
  status: Exclude<JobStatus, "queued" | "running">,
  errorCode = "",
  result?: unknown,
) {
  if (user.mode === "local-demo") return;
  const supabase = await clientForUser(user);
  if (!supabase) return;
  await supabase
    .from("generation_jobs")
    .update({
      status,
      stage: status,
      progress: status === "succeeded" ? 100 : 0,
      error_code: errorCode,
      error_message: errorCode ? "Generation stopped. Use the safe error code for support." : "",
      completed_at: new Date().toISOString(),
      lease_expires_at: null,
      result: result === undefined ? undefined : result,
    })
    .eq("user_id", user.userId)
    .eq("generation_id", generationId);
}

export async function requestGenerationCancellation(user: ServerUserAccess, generationId: string) {
  if (user.mode === "local-demo") return false;
  const supabase = await clientForUser(user);
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("generation_jobs")
    .update({ cancel_requested: true, stage: "cancellation_requested" })
    .eq("user_id", user.userId)
    .eq("generation_id", generationId)
    .in("status", ["queued", "running"])
    .select("id")
    .maybeSingle();
  return !error && Boolean(data?.id);
}

export async function getGenerationJob(user: ServerUserAccess, generationId: string) {
  if (user.mode === "local-demo") return null;
  const supabase = await clientForUser(user);
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("id,generation_id,status,stage,progress,error_code,error_message,started_at,completed_at,created_at,updated_at,cancel_requested,attempts,result")
    .eq("user_id", user.userId)
    .eq("generation_id", generationId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function isGenerationCancelled(user: ServerUserAccess, generationId: string) {
  if (user.mode === "local-demo") return false;
  const supabase = await clientForUser(user);
  if (!supabase) return false;
  const { data } = await supabase
    .from("generation_jobs")
    .select("cancel_requested")
    .eq("user_id", user.userId)
    .eq("generation_id", generationId)
    .maybeSingle();
  return data?.cancel_requested === true;
}
