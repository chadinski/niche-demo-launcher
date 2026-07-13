import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function onboardingRedirectPath(input: {
  pathname: string;
  isPublic: boolean;
  isAuthPage: boolean;
  profileCompleted: boolean;
}) {
  const isOnboardingPage = input.pathname === "/onboarding";
  const isProtectedPage = !input.isPublic && !input.pathname.startsWith("/api/");

  if (!input.profileCompleted && (input.isAuthPage || (isProtectedPage && !isOnboardingPage))) {
    return "/onboarding";
  }

  if (input.profileCompleted && (input.isAuthPage || isOnboardingPage)) {
    return "/dashboard";
  }

  return null;
}

function redirectPreservingCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  target.search = "";
  const redirect = NextResponse.redirect(target);
  response.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirect.cookies.set(name, value, options);
  });
  return redirect;
}

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
    "/api/internal/generation-worker",
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
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sign in to continue.", code: "AUTH_REQUIRED" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const shouldResolveOnboarding = Boolean(
    user && (isAuthPage || pathname === "/onboarding" || (!isPublic && !pathname.startsWith("/api/"))),
  );

  if (user && shouldResolveOnboarding) {
    const { data: progress, error } = await supabase
      .from("onboarding_progress")
      .select("profile_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error) {
      const destination = onboardingRedirectPath({
        pathname,
        isPublic,
        isAuthPage,
        profileCompleted: Boolean(progress?.profile_completed),
      });
      if (destination) return redirectPreservingCookies(request, response, destination);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
