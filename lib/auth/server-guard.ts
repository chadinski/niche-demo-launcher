import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "node:crypto";

export type ServerUserAccess =
  | {
      mode: "remote";
      userId: string;
      email: string | null;
    }
  | {
      mode: "local-demo";
      userId: "local-demo";
      email: null;
    }
  | {
      mode: "worker";
      userId: string;
      email: string | null;
    };

export class ServerAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "ServerAuthError";
    this.status = status;
  }
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function requireConfiguredSupabaseInProduction() {
  if (isProduction() && !isSupabaseConfigured()) {
    throw new ServerAuthError(
      "Supabase is required in production. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using Seraphim.",
      503,
    );
  }
}

export async function requireServerUser(): Promise<ServerUserAccess> {
  requireConfiguredSupabaseInProduction();

  const supabase = await createClient();
  if (!supabase) {
    return {
      mode: "local-demo",
      userId: "local-demo",
      email: null,
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ServerAuthError("Authentication required.", 401);
  }

  return {
    mode: "remote",
    userId: user.id,
    email: user.email ?? null,
  };
}

export async function requireGenerationWorkerUser(request: Request): Promise<ServerUserAccess> {
  const expected = process.env.GENERATION_WORKER_SECRET;
  const supplied = request.headers.get("x-seraphim-worker-secret") || "";
  const sameSecret = expected && supplied && expected.length === supplied.length
    ? timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
    : false;
  if (!sameSecret) throw new ServerAuthError("Generation worker authentication failed.", 401);
  const userId = request.headers.get("x-seraphim-worker-user-id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new ServerAuthError("Generation worker identity is invalid.", 401);
  const admin = createAdminClient();
  if (!admin) throw new ServerAuthError("Generation worker is not configured.", 503);
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new ServerAuthError("Generation worker identity is invalid.", 401);
  return { mode: "worker", userId: data.user.id, email: data.user.email ?? null };
}

export async function assertInternalAccess() {
  return requireServerUser();
}

export function authErrorResponse(error: unknown) {
  if (error instanceof ServerAuthError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        authRequired: error.status === 401,
        configurationRequired: error.status === 503,
      },
    };
  }

  return null;
}
