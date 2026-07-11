import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";

function getRedirectOrigin(request: Request, fallbackOrigin: string) {
  if (process.env.NODE_ENV === "development") return fallbackOrigin;
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return fallbackOrigin;
  try { return new URL(configured).origin; } catch { return fallbackOrigin; }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeRedirectPath(requestUrl.searchParams.get("next"));

  const redirectOrigin = getRedirectOrigin(request, requestUrl.origin);

  if (code) {
    const supabase = await createClient();

    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${redirectOrigin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${redirectOrigin}/login?message=oauth-error`);
}
