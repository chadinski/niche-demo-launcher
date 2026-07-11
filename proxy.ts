import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const publicPaths = new Set([
    "/",
    "/features",
    "/how-it-works",
    "/pricing",
    "/privacy",
    "/terms",
    "/acceptable-use",
    "/support",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/api/health",
    "/service-unavailable",
    "/robots.txt",
    "/sitemap.xml",
  ]);
  const isPublic = publicPaths.has(pathname);
  const isAuthPage = ["/login", "/signup", "/forgot-password"].includes(pathname);
  if (!url || !key) {
    if (process.env.NODE_ENV !== "production" || isPublic) return NextResponse.next({ request });
    if (pathname.startsWith("/api/")) return NextResponse.json({error:"Authentication is not configured.",code:"AUTH_CONFIGURATION_REQUIRED"},{status:503});
    const unavailable=request.nextUrl.clone();unavailable.pathname="/service-unavailable";unavailable.search="";return NextResponse.redirect(unavailable);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/dashboard";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
