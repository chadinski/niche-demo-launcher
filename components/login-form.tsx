"use client";

import { BriefcaseBusiness, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      toast.info("Supabase is not configured. The app is running in local demo mode.");
      window.location.href = "/";
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.location.href = "/";
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f6fa] p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_30px_100px_rgba(21,26,45,.16)] lg:grid-cols-[.95fr_1.05fr]">
        <div className="relative hidden min-h-[640px] overflow-hidden bg-brand-700 p-10 text-white lg:block">
          <div className="absolute -top-24 -right-24 size-80 rounded-full border border-white/10 shadow-[0_0_0_50px_rgba(255,255,255,.035),0_0_0_100px_rgba(255,255,255,.02)]" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <BriefcaseBusiness className="size-5" />
            </span>
            <h1 className="mt-24 max-w-sm text-5xl leading-[1.02] font-extrabold tracking-[-0.06em]">
              Your private website and outreach command center.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">
              Turn copied business information into a polished website, a personalized message, and a tracked prospect.
            </p>
          </div>
          <div className="absolute right-10 bottom-10 left-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="size-4 text-emerald-300" />
              Manual approval by design
            </div>
            <p className="mt-2 text-xs leading-5 text-white/48">
              Seraphim prepares drafts and deep links. It never bulk-sends outreach.
            </p>
          </div>
        </div>
        <div className="flex min-h-[560px] items-center p-6 sm:p-12">
          <form className="mx-auto w-full max-w-sm" onSubmit={submit}>
            <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 lg:hidden">
              <BriefcaseBusiness className="size-5" />
            </div>
            <p className="mt-8 text-[0.68rem] font-bold tracking-[0.16em] text-brand-600 uppercase">Niche Technologies</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">Sign in to your workspace</h2>
            <p className="mt-3 text-sm leading-6 text-[#747b8f]">
              Use your Supabase email and password. Without Supabase credentials, local demo mode remains available.
            </p>
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
              {supabase ? <><LogIn className="size-4" /> Sign In</> : <><LockKeyhole className="size-4" /> Enter Local Demo</>}
            </Button>
            <p className="mt-5 text-center text-xs leading-5 text-[#959aaa]">
              This app is intended for private internal use only.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
