import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getRedirectOrigin(request: Request, fallbackOrigin: string) {
  if (process.env.NODE_ENV === "development") return fallbackOrigin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return fallbackOrigin;

  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${forwardedProto}://${host}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next") ?? "/";

  if (!next.startsWith("/")) {
    next = "/";
  }

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
