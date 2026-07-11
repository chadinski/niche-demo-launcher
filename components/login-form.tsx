"use client";

import Link from "next/link";
import { LockKeyhole, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { AuthFrame } from "@/components/auth-frame";
import { friendlyAuthError } from "@/lib/auth/errors";

export function LoginForm() {
  const supabase = createClient();
  const localDemoAvailable = !supabase && process.env.NODE_ENV !== "production";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      if (localDemoAvailable) {
        toast.info("Supabase is not configured. The app is running in local development demo mode.");
        window.location.href = "/dashboard";
        return;
      }
      toast.error("Supabase must be configured before Seraphim can run in production.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    const next = safeRedirectPath(new URLSearchParams(window.location.search).get("next"));
    window.location.href = next;
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      if (localDemoAvailable) {
        toast.info("Supabase is not configured. The app is running in local development demo mode.");
        window.location.href = "/dashboard";
        return;
      }
      toast.error("Supabase must be configured before Seraphim can run in production.");
      return;
    }

    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirectPath(new URLSearchParams(window.location.search).get("next")))}`,
      },
    });

    if (error) {
      setGoogleLoading(false);
      toast.error(friendlyAuthError(error.message));
    }
  };

  return (
    <AuthFrame title="Sign in to your workspace" description="Continue with email and password or a configured Google account.">
          <form className="mt-8" onSubmit={submit}>
            <div className="mt-8 space-y-4">
              <label>
                <span className="field-label">Email address</span>
                <input className="field-input" type="email" autoComplete="email" required={Boolean(supabase)} value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                <span className="field-label">Password</span>
                <input className="field-input" type="password" autoComplete="current-password" required={Boolean(supabase)} value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>
            </div>
            <Button className="mt-6 w-full min-h-11" type="submit" loading={loading}>
              {supabase || !localDemoAvailable ? <><LogIn className="size-4" /> Sign In</> : <><LockKeyhole className="size-4" /> Enter Local Demo</>}
            </Button>
            <div className="mt-3 text-right"><Link href="/forgot-password" className="text-xs font-bold text-brand-700">Forgot password?</Link></div>
            {googleEnabled ? <><div className="my-5 flex items-center gap-3 text-xs font-semibold text-[#959aaa]">
              <span className="h-px flex-1 bg-[#e7e8ef]" />
              or
              <span className="h-px flex-1 bg-[#e7e8ef]" />
            </div>
            <Button
              className="w-full min-h-11"
              disabled={loading}
              loading={googleLoading}
              onClick={signInWithGoogle}
              variant="outline"
            >
              <span className="grid size-5 place-items-center rounded-full border border-[#dfe1ea] text-xs font-black text-ink-950" aria-hidden="true">
                G
              </span>
              Continue with Google
            </Button>
            </> : null}
            <p className="mt-5 text-center text-xs leading-5 text-[#747b8f]">New to Seraphim? <Link href="/signup" className="font-bold text-brand-700">Create an account</Link></p>
          </form>
    </AuthFrame>
  );
}
